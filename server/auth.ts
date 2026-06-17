/**
 * better-auth configuration. Email/password sessions backed by the Drizzle
 * Postgres adapter. The HTTP handler is mounted at /api/auth/* in index.ts.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "./db/client";
import * as schema from "./db/schema";
import { env, isLocalhostOrigin, webOrigins } from "./env";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.APP_URL,
  basePath: "/api/auth",
  // The frontend (GitHub Pages) and API live on different origins in prod, so
  // auth uses bearer tokens rather than cross-site cookies. Trust the configured
  // web origins, plus any localhost port for dev / the preview harness.
  trustedOrigins: (request?: Request) => {
    const origin = request?.headers.get("origin");
    const allowed = [...webOrigins];
    if (origin && isLocalhostOrigin(origin)) allowed.push(origin);
    return allowed;
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  // Emits a `set-auth-token` response header and accepts `Authorization: Bearer`
  // so the cross-origin SPA can authenticate without third-party cookies.
  plugins: [bearer()],
});
