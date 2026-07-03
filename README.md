# Math Atlas

Personal hobby project for browsing math concepts as dependency graphs.

Live version: <https://trymsaether.github.io/math-atlas/>

The app is built with React, TypeScript, React Flow, and a small Hono/Postgres
backend. The main content lives in `src/maps/content/*.source.json`.

## Run Locally

```sh
npm install
cp .env.example .env
docker compose up -d
npm run db:push
npm run seed:maps
```

Then run the app:

```sh
npm run dev:server
npm run dev
```

Frontend: <http://localhost:5173>

API: <http://localhost:8787>

## Common Commands

```sh
npm run dev              # frontend
npm run dev:server       # API server
npm run check:maps       # validate map source files
npm run seed:maps        # write built-in maps to the database
npm run build            # map validation + app build
npm run check            # format check + lint + server typecheck + build
npm run format           # format code and docs
```

## Editing Maps

There are two paths.

Live app:

- Sign in and edit at <https://trymsaether.github.io/math-atlas/>.
- Public maps fork to your own editable copy before saving.

Repo/source maps:

Edit `src/maps/content/*.source.json`, then run:

```sh
npm run check:maps
npm run seed:maps
```

`seed:maps` writes to the configured `DATABASE_URL`. `npm run build` validates
the repo, but does not publish map data.

## Frontend Shape

```text
src/
  app/        startup, shell, global store, navigation, persistence
  atlas/      graph canvas, nodes/edges, layout, routing, viewport
  maps/       map schemas, API/service code, loading, source content
  study/      concept cards, dictionary, flashcards, node visuals
  authoring/  map editing UI and source mutations
  sandbox/    self-contained interactive math workspace
  figures/    reusable mathematical figures and their registry
  auth/       session client and sign-in UI
  ui/         small generic UI components
  design/     visual tokens and surface primitives
  shared/     dependency-light helpers used by several areas
server/       API, auth, database schema, map/progress routes
scripts/      map validation and diagnostics
shared/       API contracts shared with the server
```

Keep code with the product area that owns it. Use relative imports inside an
area and `@/…` imports across areas. Add something to `shared/` only when it is
generic and already used by multiple areas; do not recreate `application`,
`infrastructure`, or `view-model` layers for one-off code. Tests live beside the
module they cover.

## Docs

- [Data schema](docs/data-schema.md)
