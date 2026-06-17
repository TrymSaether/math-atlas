/** math-atlas API server (Hono on Node). */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { env, isLocalhostOrigin, webOrigins } from "./env";

const app = new Hono();

// The SPA calls cross-origin in prod (GitHub Pages → API host). Allow the
// configured web origins and any localhost port, and expose `set-auth-token`
// so the browser can read the bearer token after sign-in/up.
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return webOrigins[0] ?? null;
      if (isLocalhostOrigin(origin) || webOrigins.includes(origin)) return origin;
      return null;
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["set-auth-token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.get("/api/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// better-auth owns every route under /api/auth/*.
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`math-atlas API listening on http://localhost:${info.port}`);
});
