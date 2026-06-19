/**
 * better-auth browser client.
 *
 * The frontend (GitHub Pages) and the API are on different origins in prod, so
 * auth uses **bearer tokens** instead of cross-site cookies: we persist the
 * `set-auth-token` returned on sign-in/up in localStorage and send it as
 * `Authorization: Bearer …` on every request.
 *
 * - Dev: no `VITE_API_URL` → app API calls use the Vite proxy, while auth
 *   talks directly to the local Hono server so OAuth popup origins line up.
 * - Prod: `VITE_API_URL` points at the deployed API host (set at build time).
 */
import { createAuthClient } from "better-auth/react";

const BEARER_KEY = "math-atlas-bearer";
const configuredApiBaseURL =
  ((import.meta.env.VITE_API_URL as string | undefined) || "").replace(/\/+$/, "") || undefined;
const devAuthBaseURL = import.meta.env.DEV ? "http://localhost:8787" : undefined;
const authBaseURL = configuredApiBaseURL ?? devAuthBaseURL;

type AuthError = { code?: string; description?: string; message?: string; status?: number };
type AuthActionResult = { error: AuthError | null };

const OAUTH_POPUP_MESSAGE_TYPE = "better-auth:oauth-popup";
const GOOGLE_POPUP_NAME = "math-atlas-google-oauth";
const GOOGLE_POPUP_WIDTH = 500;
const GOOGLE_POPUP_HEIGHT = 620;

/**
 * Whether to surface auth UI at all. True in dev (Vite proxy serves the API) and
 * in any prod build that has been pointed at a deployed API via `VITE_API_URL`.
 * False for the plain GitHub Pages build with no backend, so we don't ship a
 * dead "Sign in" button before the API exists.
 */
export const authEnabled: boolean = import.meta.env.DEV || Boolean(configuredApiBaseURL);

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => localStorage.getItem(BEARER_KEY) ?? "",
    },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) localStorage.setItem(BEARER_KEY, token);
    },
  },
});

export const { signIn, signUp, useSession } = authClient;

function authURL(path: string): URL {
  const base = authBaseURL ?? window.location.origin;
  return new URL(`/api/auth${path}`, base);
}

function popupFeatures(): string {
  const left = window.screenX + Math.max(0, (window.outerWidth - GOOGLE_POPUP_WIDTH) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - GOOGLE_POPUP_HEIGHT) / 2);
  return `width=${GOOGLE_POPUP_WIDTH},height=${GOOGLE_POPUP_HEIGHT},left=${left},top=${top},menubar=no,toolbar=no`;
}

function nonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function waitForGooglePopup(popup: Window, expectedOrigin: string, expectedNonce: string): Promise<AuthActionResult> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (result: AuthActionResult) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      clearInterval(closedPoll);
      clearTimeout(timeout);
      try {
        if (!popup.closed) popup.close();
      } catch {
        // The popup may already be gone.
      }
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== expectedOrigin) return;
      const data = event.data as { type?: string; nonce?: string; token?: string; error?: AuthError };
      if (data?.type !== OAUTH_POPUP_MESSAGE_TYPE || data.nonce !== expectedNonce) return;
      if (data.error) {
        settle({
          error: {
            code: data.error.code,
            message: data.error.message || data.error.description || data.error.code || "Google sign-in failed.",
          },
        });
        return;
      }
      if (!data.token) return;
      localStorage.setItem(BEARER_KEY, data.token);
      settle({ error: null });
    };

    const closedPoll = window.setInterval(() => {
      if (popup.closed) settle({ error: { code: "POPUP_CLOSED", message: "Google sign-in was cancelled." } });
    }, 500);
    const timeout = window.setTimeout(
      () => settle({ error: { code: "POPUP_TIMEOUT", message: "Google sign-in timed out." } }),
      300_000,
    );

    window.addEventListener("message", onMessage);
  });
}

export async function signInWithGoogle(): Promise<AuthActionResult> {
  const startURL = authURL("/oauth-popup/start");
  const popupNonce = nonce();
  startURL.searchParams.set("provider", "google");
  startURL.searchParams.set("popupOrigin", window.location.origin);
  startURL.searchParams.set("popupNonce", popupNonce);
  startURL.searchParams.set("callbackURL", window.location.href);

  const popup = window.open(startURL.toString(), GOOGLE_POPUP_NAME, popupFeatures());
  if (!popup) return { error: { code: "POPUP_BLOCKED", message: "Allow popups to continue with Google." } };

  const result = await waitForGooglePopup(popup, new URL(authBaseURL ?? window.location.origin).origin, popupNonce);
  if (result.error) return result;

  const session = await authClient.$fetch("/get-session");
  if (session.error || !session.data) {
    localStorage.removeItem(BEARER_KEY);
    return { error: { code: "POPUP_SIGN_IN_FAILED", message: "Google sign-in could not create a session." } };
  }

  authClient.$store.notify("$sessionSignal");
  return { error: null };
}

/** Sign out and drop the stored bearer token regardless of the request outcome. */
export async function signOut() {
  try {
    await authClient.signOut();
  } finally {
    localStorage.removeItem(BEARER_KEY);
  }
}

/** Absolute URL for an app API path (same-origin proxy in dev, API host in prod). */
export function apiUrl(path: string): string {
  return (configuredApiBaseURL ?? "") + path;
}

/** Auth + JSON headers for app API calls (the bearer token the auth client stored). */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = localStorage.getItem(BEARER_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}
