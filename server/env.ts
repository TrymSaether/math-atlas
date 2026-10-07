/**
 * Validated server environment. Loaded once at startup; throws on missing or
 * malformed vars so misconfiguration fails fast rather than at first request.
 */
import "dotenv/config";
import { z } from "zod";

const EnvSchema = z
  .object({
    // Postgres URL. Kept as a non-empty string (postgres:// URLs don't always
    // pass strict URL validation) rather than z.url().
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    BETTER_AUTH_URL: z.string().min(1).default("http://localhost:8787"),
    BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 chars"),
    PORT: z.coerce.number().int().positive().default(8787),
    APP_URL: z.string().min(1).default("http://localhost:5173"),
    // Comma-separated list of allowed browser origins for CORS / CSRF in
    // production (e.g. "https://trymsaether.github.io"). Defaults to APP_URL.
    WEB_ORIGINS: z.string().optional(),
  })
  .refine((env) => Boolean(env.GOOGLE_CLIENT_ID) === Boolean(env.GOOGLE_CLIENT_SECRET), {
    message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together",
    path: ["GOOGLE_CLIENT_SECRET"],
  });

export const env = EnvSchema.parse(process.env);

/** Allowed production web origins (any localhost port is also allowed in code). */
export const webOrigins = (env.WEB_ORIGINS ?? env.APP_URL)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const isLocalhostOrigin = (origin: string): boolean => /^https?:\/\/localhost:\d+$/.test(origin);
