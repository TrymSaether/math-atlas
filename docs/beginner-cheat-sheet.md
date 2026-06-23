# Math Atlas Beginner Cheat Sheet

This is a practical map for getting useful work done in this codebase without
having to understand every file first.

## What This App Is

Math Atlas is a React + TypeScript app for browsing mathematical concepts as
interactive dependency graphs. The authored truth lives in strict
`*.source.json` map files. The app validates those source files, derives a
runtime graph artifact, lays it out, and renders it through several surfaces:
atlas graph, dictionary, flashcards, and sandbox.

There is also a Hono API server for map catalog/loading/saving, auth, and user
progress.

## First Commands

```sh
npm run dev
npm run dev:server
npm run db:push
npm run seed:maps
npm run check:maps
npm run build
npm run check
```

Use these in this order while learning:

- `npm run dev`: starts the Vite frontend.
- `npm run dev:server`: starts the Hono API server.
- `npm run db:push`: applies `server/db/schema.ts` to the configured Postgres database.
- `npm run seed:maps`: upserts built-in `*.source.json` maps as public/system DB maps.
- `npm run check:maps`: validates authored map data. Run this after data edits.
- `npm run build`: runs map validation, TypeScript build, and Vite build.
- `npm run check`: heavier full check: formatting, lint, server typecheck, build.

For most ordinary changes, `npm run check:maps` plus `npm run build` is the
fast useful verification path.

## Directory Map

```text
src/
  App.tsx                    Main surface switcher and app shell.
  store.ts                   Zustand app state, map loading, editing, routing.
  data/
    sourceSchema.ts          Strict authored map schema.
    artifactSchema.ts        Derived runtime artifact schema.
    relations.ts             Edge vocabulary and relation semantics.
    buildArtifact.ts         Source graph -> artifact transform.
    loadMap.ts               Artifact/source -> LoadedMap used by UI.
    mapsApi.ts               Browser client for server map API.
    maps/*.source.json       Authored map content.
  components/
    GraphCanvas.tsx          React Flow graph surface.
    TopoNode.tsx             Concept node card rendering.
    TopoEdge.tsx             Edge rendering.
    NodePanel.tsx            Selected concept side panel.
    TopBar.tsx               Main chrome.
    CanvasControls.tsx       Graph controls/layers/routing UI.
    CommandPalette.tsx       Command/search palette.
    concept/                 Reusable concept body/header/relations display.
    figures/                 Interactive or curated mathematical figures.
    authoring/               Node editor UI.
    sandbox/                 Experimental math sandbox.
  lib/
    atlasLayout.ts           Graph layout constants and algorithms.
    graph.ts                 Graph algorithms and ordering utilities.
    graphMetrics.ts          Depth/impact/reduction metrics.
    route.ts                 Directions/prerequisite route logic.
    conceptView.ts           Render-friendly concept view model.
    nodeContent.ts           Search/render helpers for node content.
    colors.ts                Domain tone resolution.
    themes.ts                Theme persistence/application.
  styles/
    chrome.css               Shared floating chrome and panel styling.
server/
  index.ts                   Hono API entrypoint.
  auth.ts                    better-auth wiring.
  routes/maps.ts             Map catalog/load/save/collaboration routes.
  routes/progress.ts         Learning progress routes.
  db/schema.ts               Drizzle database schema.
scripts/
  build-maps.ts              Map validation/build entrypoint.
  atlas/                     CLI for map diagnostics, formatting, stats, etc.
docs/
  data-schema.md             Detailed source/artifact schema documentation.
```

## Data Flow

The core flow is:

```text
src/data/maps/*.source.json
  -> SourceGraphSchema validation
  -> buildArtifact()
  -> enrichArtifact()
  -> buildLoadedMap()
  -> Zustand store
  -> React components
```

Important files in that path:

- `src/data/sourceSchema.ts`: what authors are allowed to write.
- `src/data/relations.ts`: what each edge relation means.
- `src/data/buildArtifact.ts`: how authored source becomes runtime graph data.
- `src/data/loadMap.ts`: adds indexes, layout, metrics, and fast lookup maps.
- `src/store.ts`: loads maps, stores UI state, and applies authoring changes.

If a concept appears wrong in the UI, first decide whether the problem is in
authored content, the source-to-artifact transform, runtime enrichment, app
state, or rendering.

## Source Maps

Authored maps live in:

```text
src/data/maps/topology.source.json
src/data/maps/functional_analysis.source.json
src/data/maps/fourier_analysis.source.json
```

Generated runtime JSON files live next to them and should be treated as build
outputs. Edit the `*.source.json` files, then validate.

A source graph has:

- `domains`: ordered learning/topic lanes with palette names.
- `concepts`: mathematical objects, definitions, theorems, examples, proofs.
- `edges`: the only authored relationship store.

Do not add ad hoc relationship fields to concepts. Edges are the graph.

## Relation Rules

Relation semantics are centralized in `src/data/relations.ts`.

Authors write only forward relation keys such as:

- `defined_in_terms_of`: A is defined using B.
- `uses`: A uses B.
- `assumes`: A assumes B.
- `constructed_from`: A is built from B.
- `generalizes`: A generalizes B, but this is not a dependency.
- `motivated_by`: A is motivated by B.
- `equivalent_to`: A is equivalent to B, symmetric and not a dependency.
- `related_to`: weak symmetric relationship.
- `satisfies` / `violates`: space-property style relationships.
- `proves`: proof A proves statement B.

Dependency edges are oriented as prerequisite to dependent in the runtime
artifact, even though source edges read as `source -> target`. Check the
relation registry before changing edge direction or relation type.

## UI Flow

`src/App.tsx` chooses the active surface:

- `atlas`: graph canvas plus selected-node panel.
- `dictionary`: reading view.
- `flashcards`: study mode.
- `sandbox`: lazy-loaded math sandbox.

`src/store.ts` owns most user-facing state:

- active map and loaded map cache
- search/filter state
- selected concept
- graph view mode
- route/directions state
- current surface
- authoring/editing state
- signed-in user/catalog/progress state

If a UI action crosses multiple components, look in `store.ts` before adding
new local state.

## Styling

Global tokens and themes live in `src/index.css`.

Shared floating chrome styles live in `src/styles/chrome.css`. This is the
first place to look for top bar, canvas controls, popovers, segmented controls,
chips, icon buttons, and solid panel styling.

Use the existing token vocabulary before inventing a new one:

- surfaces: `--bg`, `--surface`, `--surface-2`, `--surface-3`
- text: `--fg-1`, `--fg-2`, `--fg-3`, `--fg-4`
- borders: `--border`, `--border-strong`, `--hairline`
- accent: `--accent`, `--accent-soft`, `--accent-border`
- chrome: `--chrome-*`
- domains: palette tokens resolved through `src/lib/colors.ts`

## Figures

Interactive mathematical figures live in `src/components/figures/`.

Start with:

- `registry.ts`: maps figure ids/fallbacks to components.
- `FigureFrame.tsx`: shared figure shell.
- `tokens.ts`: figure-specific visual constants.
- `types.ts`: shared figure props/types.

Exact figure ids should win over fallback inference. If a concept needs a
specific visual, prefer registering a specific figure over adding broad special
cases inside one component.

## Server And Auth

The API server starts at `server/index.ts`.

Main responsibilities:

- `/api/health`: simple health check.
- `/api/auth/*`: better-auth routes.
- `/api/maps/*`: catalog, map load/save/fork/delete/collaborators.
- `/api/progress/*`: per-user learning progress.

The frontend API client is `src/data/mapsApi.ts`. Auth headers and API URL
helpers are in `src/lib/authClient.ts`.

When debugging auth or server issues, verify the exact route involved. A
passing `/api/health` check does not prove auth or map routes are wired
correctly.

## Database And Server Updates

Local Postgres is defined in `docker-compose.yml`.

Start it with:

```sh
docker compose up -d
```

Copy `.env.example` to `.env` if needed. The local defaults are:

```sh
DATABASE_URL=postgresql://atlas:atlas@localhost:5432/atlas
BETTER_AUTH_URL=http://localhost:8787
APP_URL=http://localhost:5173
PORT=8787
```

`BETTER_AUTH_SECRET` must be a real long secret. Google OAuth variables are
optional only if you are not testing Google sign-in.

Apply schema changes:

```sh
npm run db:push
```

This uses Drizzle Kit with `drizzle.config.ts` and the schema in
`server/db/schema.ts`. The current workflow is schema push, not checked-in
migration files.

Seed or refresh built-in maps in the database:

```sh
npm run seed:maps
```

`server/seed.ts` reads `src/data/maps/*.source.json`, validates each source
graph, and upserts public maps owned by the fixed `system` user. It is
idempotent, but it does update database content.

Run the local backend:

```sh
npm run dev:server
```

Health check:

```sh
curl http://localhost:8787/api/health
```

For a database schema edit:

1. Edit `server/db/schema.ts`.
2. Run `npm run db:push`.
3. Run `npm run typecheck:server`.
4. Run `npm run build`.

For a server route edit:

1. Edit `server/index.ts`, `server/routes/maps.ts`,
   `server/routes/progress.ts`, `server/auth.ts`, or `server/env.ts`.
2. Run `npm run typecheck:server`.
3. Run `npm run dev:server`.
4. Test the specific endpoint, not only `/api/health`.

Production API deployment is described by `render.yaml`. Production DB/schema
and seed commands must run with the production `DATABASE_URL`; do not aim local
commands at production unless you intentionally mean to update production data.

## Common Tasks

Add or edit a concept:

1. Edit the relevant `src/data/maps/*.source.json`.
2. Add/update concept content.
3. Add/update edges instead of embedding relationship fields.
4. Run `npm run check:maps`.
5. Run `npm run build`.

Fix an edge:

1. Open `src/data/relations.ts`.
2. Confirm the relation's forward reading and dependency behavior.
3. Edit the source edge.
4. Run `npm run check:maps`.

Change graph rendering:

1. Start in `src/components/GraphCanvas.tsx`.
2. Check `src/components/TopoNode.tsx` or `src/components/TopoEdge.tsx`.
3. Check supporting logic in `src/lib/relationStyle.ts`, `src/lib/colors.ts`,
   or `src/lib/atlasLayout.ts`.

Change selected concept display:

1. Start in `src/components/NodePanel.tsx`.
2. Check reusable concept rendering in `src/components/concept/`.
3. Check view-model helpers in `src/lib/conceptView.ts`.

Change app-wide controls:

1. Start in `src/components/TopBar.tsx`, `src/components/CanvasControls.tsx`,
   or `src/components/CommandPalette.tsx`.
2. Check state actions in `src/store.ts`.
3. Check shared classes in `src/styles/chrome.css`.

Change map loading or saving:

1. Frontend: `src/data/mapsApi.ts`, `src/data/loadMap.ts`, `src/store.ts`.
2. Server: `server/routes/maps.ts`, `server/db/schema.ts`, `server/seed.ts`.

Update database/server:

1. Start local Postgres with `docker compose up -d`.
2. Confirm `.env` points at the intended database.
3. For schema changes, edit `server/db/schema.ts` and run `npm run db:push`.
4. For built-in map content changes, run `npm run seed:maps`.
5. For server code changes, run `npm run typecheck:server`.
6. Run `npm run build` before calling the change complete.

## Things To Be Careful With

- The source schema is strict. Unknown keys are build failures, not ignored.
- Edges are the only authored relationship store.
- Reverse relations are derived. Do not author inverse-only relations like
  `defines`, `used_by`, or `constructs`.
- Dependency edges must be acyclic.
- `generalizes`, `equivalent_to`, and `related_to` are not dependency edges.
- Proof-step `uses` become proof overlay edges, not normal graph edges.
- `npm run build` is broader than map validation; passing `check:maps` alone is
  not enough for TypeScript or frontend health.
- `npm run seed:maps` writes built-in source maps into the database; check your
  `DATABASE_URL` first.
- Watch for existing local edits before touching source map files.

## Debugging Checklist

For data errors:

```sh
npm run check:maps
npm run atlas -- validate
npm run atlas -- stats
npm run atlas -- graph
```

For app errors:

```sh
npm run build
npm run lint
```

For server errors:

```sh
npm run typecheck:server
npm run dev:server
```

For formatting:

```sh
npm run format:check
npm run format
```

Prefer narrow verification while iterating, then run `npm run build` before
calling the work done.
