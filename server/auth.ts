/**
 * better-auth configuration. Cookie sessions backed by the Drizzle Postgres
 * adapter. The HTTP handler is mounted at /api/auth/* in index.ts.
 *
 * The SPA and the API share one origin (this server serves both in prod; the
 * Vite proxy makes dev same-origin too), so sessions are plain same-origin
 * cookies and OAuth completes with a full-page redirect — no bearer tokens,
 * no popup.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client.ts";
import * as schema from "./db/schema.ts";
import { env, isLocalhostOrigin } from "./env.ts";

const socialProviders =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  // The base origin is trusted by default. In dev the SPA origin is a different
  // localhost port (the Vite server), so trust any localhost origin as well.
  trustedOrigins: (request?: Request) => {
    const origin = request?.headers.get("origin");
    return origin && isLocalhostOrigin(origin) ? [origin] : [];
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  socialProviders,
});
