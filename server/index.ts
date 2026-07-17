/** math-atlas server (Hono on Node): the API plus the built SPA from dist/. */
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { auth } from "./auth.ts";
import { env } from "./env.ts";
import { mapsRoute } from "./routes/maps.ts";
import { progressRoute } from "./routes/progress.ts";

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// better-auth owns every route under /api/auth/*.
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/maps", mapsRoute);
app.route("/api/progress", progressRoute);

// The built SPA; unknown non-API paths fall back to index.html. In dev the
// Vite server serves the app instead and proxies /api/* here.
app.use("*", serveStatic({ root: "./dist" }));
app.get("*", serveStatic({ path: "./dist/index.html" }));

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`math-atlas listening on http://localhost:${info.port}`);
});
