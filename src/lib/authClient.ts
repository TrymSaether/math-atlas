/**
 * better-auth browser client.
 *
 * The frontend (GitHub Pages) and the API are on different origins in prod, so
 * auth uses **bearer tokens** instead of cross-site cookies: we persist the
 * `set-auth-token` returned on sign-in/up in localStorage and send it as
 * `Authorization: Bearer …` on every request.
 *
 * - Dev: no `VITE_API_URL` → the client uses the current origin and the Vite
 *   proxy forwards `/api` to the local server.
 * - Prod: `VITE_API_URL` points at the deployed API host (set at build time).
 */
import { createAuthClient } from "better-auth/react";

const BEARER_KEY = "math-atlas-bearer";
const apiBaseURL = (import.meta.env.VITE_API_URL as string | undefined) || undefined;

/**
 * Whether to surface auth UI at all. True in dev (Vite proxy serves the API) and
 * in any prod build that has been pointed at a deployed API via `VITE_API_URL`.
 * False for the plain GitHub Pages build with no backend, so we don't ship a
 * dead "Sign in" button before the API exists.
 */
export const authEnabled: boolean = import.meta.env.DEV || Boolean(apiBaseURL);

export const authClient = createAuthClient({
  baseURL: apiBaseURL,
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
  return (apiBaseURL ?? "") + path;
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
