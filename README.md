# Math Atlas

Personal hobby project for browsing math concepts as dependency graphs.

Live version: <https://trymsaether.github.io/math-atlas/>

The app is built with React, TypeScript, React Flow, and a small Hono/Postgres
backend. The main content lives in `src/maps/sources/*.source.json`.

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
npm run check            # format + lint + typecheck + tests + build
npm run format           # format code and docs
```

## Editing Maps

There are two paths.

Live app:

- Sign in and edit at <https://trymsaether.github.io/math-atlas/>.
- Public maps fork to your own editable copy before saving.

Repo/source maps:

Edit `src/maps/sources/*.source.json`, then run:

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
  atlas/      runtime graph model, canvas, layout, routing, viewport
  maps/       map API/cache/service code and authored source content
  study/      dictionary, flashcards, and co-located concept presentation
  authoring/  map editing UI and source mutations
  sandbox/    self-contained interactive math workspace
  figures/    core, Fourier, and functional-analysis figures
  auth/       session client and sign-in UI
  ui/         small generic UI components
  math/       shared mathematical text rendering
  design/     visual tokens and surface primitives
server/       API, auth, database schema, map/progress routes
scripts/      map validation and diagnostics
shared/       cross-runtime map schemas, build logic, and API contracts
```

Keep code with the product area that owns it. Use relative imports inside an
area and `@/…` imports across frontend areas. Top-level `shared/` is reserved for
React-free code used by both frontend and server. Do not recreate `application`,
`infrastructure`, or `view-model` layers for one-off code. Tests live beside the
module they cover.

## Docs

- [Data schema](docs/data-schema.md)
