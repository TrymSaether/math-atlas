# Math Atlas

Personal hobby project for browsing math concepts as dependency graphs.

Live version: <https://trymsaether.github.io/math-atlas/>

The app is built with React, TypeScript, React Flow, and a small Hono/Postgres
backend. The main content lives in `src/data/maps/*.source.json`.

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

Edit `src/data/maps/*.source.json`, then run:

```sh
npm run check:maps
npm run seed:maps
```

`seed:maps` writes to the configured `DATABASE_URL`. `npm run build` validates
the repo, but does not publish map data.

## Repo Shape

```text
src/       frontend, graph UI, map schemas, map content
server/    API, auth, database schema, map/progress routes
scripts/   map validation and diagnostics
docs/      Schemas & Repo Cheat Sheet
```

## Docs

- [Beginner cheat sheet](docs/beginner-cheat-sheet.md)
- [Data schema](docs/data-schema.md)
