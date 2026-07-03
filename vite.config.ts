import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/math-atlas/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
    // better-auth/react must share the app's single React instance, otherwise
    // its hooks trigger "Invalid hook call" from a duplicate copy.
    dedupe: ["react", "react-dom"],
  },
  build: {
    // The on-demand sandbox intentionally bundles mathjs, MathLive, and Mafs.
    // Its isolated lazy chunk is larger than Vite's generic application limit.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: !!process.env.PORT,
    // Forward API + auth calls to the Hono server so the SPA talks same-origin.
    proxy: {
      "/api": {
        target: process.env.API_URL ?? "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
