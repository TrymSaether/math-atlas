/**
 * better-auth browser client. The SPA and the API share one origin (the Hono
 * server in prod, the Vite proxy in dev), so sessions are plain same-origin
 * cookies and Google sign-in is a full-page redirect.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;

type AuthActionResult = { error: { message?: string } | null };

/** Start the Google redirect flow; resolves with an error only if it fails to start. */
export async function signInWithGoogle(): Promise<AuthActionResult> {
  const { error } = await authClient.signIn.social({ provider: "google", callbackURL: window.location.href });
  return { error: error ? { message: error.message ?? "Google sign-in failed." } : null };
}
