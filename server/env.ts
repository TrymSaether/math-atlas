/**
 * Validated server environment. Loaded once at startup; throws on missing or
 * malformed vars so misconfiguration fails fast rather than at first request.
 * Dev values come from `.env` via `node --env-file-if-exists=.env`.
 */
import { z } from "zod";

const EnvSchema = z
  .object({
    // Postgres URL. Kept as a non-empty string (postgres:// URLs don't always
    // pass strict URL validation) rather than z.url().
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    // Public origin of the app + API. better-auth appends /api/auth internally.
    BETTER_AUTH_URL: z.string().min(1).default("http://localhost:8787"),
    BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 chars"),
    PORT: z.coerce.number().int().positive().default(8787),
  })
  .refine((env) => Boolean(env.GOOGLE_CLIENT_ID) === Boolean(env.GOOGLE_CLIENT_SECRET), {
    message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together",
    path: ["GOOGLE_CLIENT_SECRET"],
  });

export const env = EnvSchema.parse(process.env);

/** Dev-only allowance: the Vite dev server runs on another localhost port. */
export const isLocalhostOrigin = (origin: string): boolean => /^https?:\/\/localhost:\d+$/.test(origin);
