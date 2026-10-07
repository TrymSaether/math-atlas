---
name: run-math-atlas
description: Build, run, and drive Math Atlas. Use when asked to start Math Atlas, run the app, take a screenshot of its UI, interact with the graph, or verify a visual change.
---

Math Atlas is a React + Vite app that renders mathematical knowledge graphs. Drive it by starting the Vite dev server, then running `.claude/skills/run-math-atlas/driver.mjs` (Playwright-based) to take screenshots and interact with it programmatically.

All paths below are relative to the repo root (`math-atlas/`).

## Prerequisites

No system packages needed beyond Node. Playwright's bundled Chromium is used:

```bash
npm install
npx playwright install chromium
```

## Run (agent path)

Start the dev server in the background, wait for it to be ready, then run the driver:

```bash
npm run dev &
echo $! > /tmp/math-atlas-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:5173/math-atlas/ >/dev/null; do sleep 0.5; done'
node .claude/skills/run-math-atlas/driver.mjs
```

Screenshots land in `/tmp/math-atlas-shots/`:
- `01-initial.png` — full graph overview at default zoom
- `02-node-selected.png` — side panel open after clicking a concept node

To stop the server:
```bash
kill $(cat /tmp/math-atlas-dev.pid) 2>/dev/null; pkill -f 'vite' 2>/dev/null; true
```

To change the target URL or output dir:
```bash
BASE_URL=http://localhost:5173/math-atlas/ SHOTS_DIR=/tmp/shots node .claude/skills/run-math-atlas/driver.mjs
```

## Run (human path)

```bash
npm run dev   # → http://localhost:5173/math-atlas/ opens in browser. Ctrl-C to stop.
```

## Gotchas

- **Base path is `/math-atlas/`, not `/`** — Vite is configured with a base path. `http://localhost:5173/` returns 404; use `http://localhost:5173/math-atlas/`.
- **First ReactFlow node is a domain cluster background** — `.react-flow__node` includes invisible background `domainRegion` nodes that intercept pointer events. Use `.react-flow__node-topo` to target actual concept nodes, and pass `{ force: true }` to `click()` to bypass overlap.
- **Default view is fully zoomed out** — the graph loads at ~13% zoom showing the entire map. This is by design.

## Troubleshooting

- **Port already in use (`EADDRINUSE`)**: a previous server is still running. `pkill -f vite` then retry.
- **`Cannot find package 'playwright'`**: run from `/tmp` or somewhere without a `package.json` — the driver resolves playwright relative to the project root. Always run as `node .claude/skills/run-math-atlas/driver.mjs` from the project root.
