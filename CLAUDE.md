# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check + production build (tsc -b && vite build)
npm run preview    # Preview the production build locally

# Data pipeline (Python scripts)
npm run extract    # Extract nodes from raw text + merge → data/topology.raw.json
npm run merge      # Re-merge only (python3 scripts/merge.py)
```

No test suite is configured. Type-check via `tsc --noEmit` or `npm run build`.

## Architecture

Math Atlas is a React + ReactFlow application that renders mathematical knowledge graphs — nodes are theorems, definitions, lemmas, etc.; edges are logical dependencies between them.

### Data flow

1. **Source JSON** — each field (topology, fourier_analysis, functional_analysis) is stored as a JSON file under `src/data/maps/`. These follow the `FieldJson` schema (items + edges with a `graph` wrapper).
2. **Normalization** — `src/data/normalizeFieldGraph.ts` converts `FieldJson → GraphData` (the internal `TopoData` format): flattens item fields, re-orients edges so that `from → to` always means "from depends on to", and derives `tint`/`border` from domain colors.
3. **Layout** — `src/lib/atlasLayout.ts` runs a dagre layout per domain cluster, then shelf-packs clusters into a roughly-square canvas. Positions are stable (deterministic seeded jitter per node id).
4. **Store** — `src/store.ts` (Zustand) holds the active map id, loaded maps (cached), filter state (kinds, topics, relations, search), selected node id, and theme. Maps are loaded lazily on demand and cached for the session.
5. **Rendering** — `GraphCanvas.tsx` builds ReactFlow `Node[]` and `Edge[]` from `LoadedMap`, applying filter logic (kinds/topics/relations/search) in `useMemo`. Domain cluster backgrounds are rendered as a special `cluster` node type at `zIndex: -1`. Concept nodes use the custom `topo` type (`TopoNode.tsx`). Edges use the custom `topo` type (`TopoEdge.tsx`).
6. **Side panel** — `NodePanel.tsx` shows detail for the selected node including KaTeX-rendered math.

### Adding a new map

1. Place a `FieldJson`-shaped JSON file in `src/data/maps/<id>.json`.
2. Register it in `src/data/mapRegistry.ts` — add an entry to `MAPS` and a lazy loader to `MAP_LOADERS`.
3. The store and UI pick it up automatically via the `MapId` union type.

### Key types (`src/types.ts`)

- `FieldJson` / `FieldItem` / `FieldEdge` — raw JSON schema (validated with Zod)
- `GraphData` / `GraphNode` / `GraphEdge` / `GraphDomain` — internal normalized schema
- `LoadedMap` — processed map: data + prebuilt lookup maps + computed layout positions
- `SOURCE_DEPENDS_ON_TARGET` — relation names that mean "source depends on target" (edge direction is flipped during normalization)

### Theming

CSS variables in `src/index.css` define light ("paper") and dark ("chalkboard") themes via `[data-theme]` on `<html>`. Theme is persisted to `localStorage` under the key `math-map-theme`.

Domain hues are resolved by `src/lib/colors.ts` from the 8-color palette (`--blue`, `--green`, …), which is the single source of truth — every tone is a CSS variable, so hues retune automatically across all themes. A domain's hue comes from its authored data, not its array position: `resolveDomainTones(domains)` pins an explicit `palette` key first, then snaps each authored hex `color` to its nearest palette anchor, keeping hues distinct. The result is published to a bare-id registry (`registerDomainTones`, called from `buildLoadedMap` and `App.tsx`) that `getDomainTone(domainId)` reads. `DomainTone` carries `color` / `tint` / `border` plus `text` (a theme-adaptive ink for text on `tint`). The domains' JSON `tint` / `border` fields are legacy/advisory and no longer rendered.

### Data pipeline scripts (`scripts/`)

Python scripts for extracting graph data from PDF lecture notes:
- `extract.py` — parses `content/topology.raw.txt` (produced by `pdftotext -layout`) into `data/topology.raw.json`
- `llm_extract.py` — LLM-assisted extraction
- `merge.py` — merges raw extracted data with manually verified data (`data/topology.verified.json`)
