/**
 * Core data model for the workspace sandbox.
 *
 * The central abstraction is a **Workspace**: an ordered list of *rows* (the
 * editable source), the *free values* those rows expose for direct manipulation
 * (draggable points, slider parameters), a set of *views* (saved viewports),
 * *marks* (annotations layered on the plane), and per-row *provenance*.
 *
 * Rows are the single source of truth a user edits. The engine compiles rows
 * into typed `WObject`s, resolves their dependency order, and evaluates them
 * against the current free values to produce `Computed` results for rendering.
 */

import type { Value, Vec2 } from "./expr";

/** Where an object came from — surfaced as a small badge per row. */
export interface Provenance {
  source: "user" | "atlas" | "example" | "derived";
  /** Atlas workspace id, parent object, or citation the row originated from. */
  origin?: string;
  /** Free-text note shown on hover. */
  note?: string;
  createdAt: number;
}

/**
 * Confidence/verification state of a row, rendered as a glyph (★ ✓ ≅ ○).
 * Mirrors the `--fact-*` design tokens already defined in index.css.
 */
export type FactStatus = "computed" | "recognized" | "user" | "pending";

/** Slider configuration for a free scalar parameter. */
export interface SliderSpec {
  min: number;
  max: number;
  step: number;
}

/**
 * A row is what the user types and edits. It owns presentation (color,
 * visibility), provenance, and — for free inputs — its slider spec. The
 * *current* free value lives in `Workspace.values`, keyed by row id, so that
 * dragging/sliding never rewrites source text.
 */
export interface Row {
  id: string;
  source: string;
  color: string;
  visible: boolean;
  provenance: Provenance;
  slider?: SliderSpec;
}

/** A saved, named viewport you can jump between. */
export interface ViewBookmark {
  id: string;
  name: string;
  rect: ViewRect;
}

export interface ViewRect {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

/** Distributive `Omit` so unions keep their per-member shape. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An annotation layered on the plane. */
export type Mark =
  | { id: string; kind: "label"; at: Vec2; text: string; color?: string }
  | { id: string; kind: "segment"; a: Vec2; b: Vec2; text?: string; color?: string }
  | { id: string; kind: "vline"; x: number; text?: string; color?: string }
  | { id: string; kind: "hline"; y: number; text?: string; color?: string };

/** A complete workspace document (also the atlas-linked load/save format). */
export interface Workspace {
  id: string;
  title: string;
  rows: Row[];
  /** Current free-input values, keyed by row id (scalars or points). */
  values: Record<string, Value>;
  viewport: ViewRect;
  views: ViewBookmark[];
  marks: Mark[];
}

// ----------------------------------------------------------------------------
// Compiled objects (engine output — not persisted)
// ----------------------------------------------------------------------------

export type ObjKind =
  | "parameter" // free scalar, slider-driven
  | "freePoint" // draggable point
  | "point" // dependent point
  | "value" // named/derived scalar
  | "function" // y = f(x), plotted as a curve
  | "segment" // geometry: Segment(A, B)
  | "line" // geometry: Line(A, B)
  | "circle" // geometry: Circle(C, r) | Circle(C, A)
  | "polygon" // geometry: Polygon(A, B, C, …)
  | "vector" // geometry: Vector(B) | Vector(A, B)
  | "blank"
  | "invalid";

/** A drawable geometric construction (engine output). */
export type GeomShape =
  | { kind: "segment"; a: Vec2; b: Vec2 }
  | { kind: "line"; a: Vec2; b: Vec2 }
  | { kind: "circle"; c: Vec2; r: number }
  | { kind: "polygon"; pts: Vec2[] }
  | { kind: "vector"; tail: Vec2; tip: Vec2 };

/** Result of compiling + evaluating one row. */
export interface Computed {
  id: string;
  kind: ObjKind;
  /** Bound name, if the row defines one (`a`, `f`, `P`). */
  name?: string;
  /** Scalar/point value for parameter | point | value rows. */
  value?: Value;
  /** Ready-to-call `y = f(x)` sampler for function rows. */
  sample?: (x: number) => number;
  /** Resolved geometry for segment/line/circle/polygon/vector rows. */
  geom?: GeomShape;
  /** Names this row depends on (for the provenance/dependency graph). */
  deps: string[];
  /** Human label of what the row is, for the panel readout. */
  label?: string;
  error?: string;
}
