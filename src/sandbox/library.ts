/**
 * Prepared workspaces, addressable by id — the backing store for atlas-linked
 * mode. Atlas concept pages can deep-link a worked example simply by id; the
 * sandbox loads it verbatim. Each workspace is a plain `Workspace` document, so
 * the same shape round-trips through the editor.
 */

import type { Value } from "./expr";
import type { DistributiveOmit, Mark, Row, ViewRect, Workspace } from "./types";

let seq = 0;
const uid = (p = "row") => `${p}_${(seq++).toString(36)}`;

/** Stable categorical colors from the shared semantic palette. */
export const PALETTE = [
  "var(--palette-1)",
  "var(--palette-9)",
  "var(--palette-5)",
  "var(--palette-4)",
  "var(--palette-3)",
  "var(--palette-2)",
  "var(--palette-6)",
  "var(--palette-7)",
  "var(--domain-brown)",
  "var(--palette-8)",
  "var(--domain-magenta)",
] as const;

interface RowSpec {
  source: string;
  color?: string;
  visible?: boolean;
  slider?: { min: number; max: number; step: number };
  value?: Value;
  note?: string;
}

function buildRows(
  specs: RowSpec[],
  source: "user" | "atlas" | "example",
  origin?: string,
): { rows: Row[]; values: Record<string, Value> } {
  const rows: Row[] = [];
  const values: Record<string, Value> = {};
  specs.forEach((s, i) => {
    const id = uid();
    rows.push({
      id,
      source: s.source,
      color: s.color ?? PALETTE[i % PALETTE.length],
      visible: s.visible ?? true,
      slider: s.slider,
      provenance: { source, origin, note: s.note, createdAt: Date.now() },
    });
    if (s.value !== undefined) values[id] = s.value;
  });
  return { rows, values };
}

function makeWorkspace(
  id: string,
  title: string,
  specs: RowSpec[],
  viewport: ViewRect,
  opts: {
    source?: "atlas" | "example";
    marks?: DistributiveOmit<Mark, "id">[];
  } = {},
): Workspace {
  const { rows, values } = buildRows(specs, opts.source ?? "atlas", id);
  const marks: Mark[] = (opts.marks ?? []).map((m) => ({ ...m, id: uid("mark") }) as Mark);
  return { id, title, rows, values, viewport, views: [], marks };
}

const SQUARE: ViewRect = { xmin: -10, xmax: 10, ymin: -7, ymax: 7 };

// ---------------------------------------------------------------------------

export const WORKSPACES: Record<string, Workspace> = {
  blank: makeWorkspace("blank", "Blank workspace", [{ source: "f(x) = x^2" }], SQUARE, {
    source: "example",
  }),

  "parabola-vertex": makeWorkspace(
    "parabola-vertex",
    "Parabola & its vertex",
    [
      { source: "a = 1", slider: { min: -3, max: 3, step: 0.1 } },
      { source: "h = 2", slider: { min: -6, max: 6, step: 0.1 } },
      { source: "k = -1", slider: { min: -6, max: 6, step: 0.1 } },
      { source: "f(x) = a (x - h)^2 + k", note: "vertex form" },
      { source: "V = (h, k)", note: "vertex moves with the sliders" },
    ],
    SQUARE,
  ),

  "unit-circle": makeWorkspace(
    "unit-circle",
    "Unit circle & a point",
    [
      { source: "C = Circle((0, 0), 1)", note: "the unit circle" },
      {
        source: "t = 0.9",
        slider: { min: 0, max: 6.283, step: 0.01 },
        note: "angle θ",
      },
      { source: "P = (cos(t), sin(t))", note: "point on the circle" },
      { source: "R = Segment((0, 0), P)", note: "radius to P" },
      { source: "c = cos(t)" },
      { source: "s = sin(t)" },
    ],
    { xmin: -1.9, xmax: 1.9, ymin: -1.35, ymax: 1.35 },
  ),

  "tangent-line": makeWorkspace(
    "tangent-line",
    "Secant approaching a tangent",
    [
      { source: "f(x) = sin(x)" },
      {
        source: "a = 1",
        slider: { min: -3, max: 3, step: 0.05 },
        note: "base point",
      },
      {
        source: "h = 1.2",
        slider: { min: 0.01, max: 3, step: 0.01 },
        note: "→ 0 for the tangent",
      },
      { source: "m = (f(a + h) - f(a)) / h", note: "slope of the secant" },
      { source: "g(x) = f(a) + m (x - a)", note: "the secant line" },
      { source: "A = (a, f(a))" },
      { source: "B = (a + h, f(a + h))" },
      { source: "S = Segment(A, B)", note: "the chord" },
    ],
    { xmin: -6.5, xmax: 6.5, ymin: -2.2, ymax: 2.2 },
  ),

  "triangle-medial": makeWorkspace(
    "triangle-medial",
    "Triangle & medial triangle",
    [
      { source: "A = (-3, -1)", note: "drag me" },
      { source: "B = (3, -1.5)", note: "drag me" },
      { source: "C = (0.5, 3)", note: "drag me" },
      { source: "T = Polygon(A, B, C)" },
      { source: "Ma = midpoint(B, C)" },
      { source: "Mb = midpoint(A, C)" },
      { source: "Mc = midpoint(A, B)" },
      { source: "M = Polygon(Ma, Mb, Mc)", note: "vertices = edge midpoints" },
      { source: "G = (A + B + C) / 3", note: "centroid" },
    ],
    SQUARE,
  ),

  vectors: makeWorkspace(
    "vectors",
    "Vector addition",
    [
      { source: "u = (3, 1)", note: "drag me" },
      { source: "v = (1, 2.5)", note: "drag me" },
      { source: "w = u + v", note: "the sum" },
      { source: "U = Vector(u)" },
      { source: "V = Vector(v)" },
      { source: "W = Vector(w)" },
      { source: "P = Segment(u, w)" },
      { source: "Q = Segment(v, w)" },
    ],
    { xmin: -1, xmax: 6, ymin: -1, ymax: 5 },
  ),
};

export const WORKSPACE_IDS = Object.keys(WORKSPACES);

/** Deep-clone a prepared workspace so edits don't mutate the shared template. */
export function loadWorkspace(id: string): Workspace {
  const tpl = WORKSPACES[id] ?? WORKSPACES["blank"];
  return structuredClone(tpl);
}

/** A fresh, empty user workspace. */
export function emptyWorkspace(): Workspace {
  const { rows, values } = buildRows([{ source: "" }], "user");
  return {
    id: "scratch",
    title: "Scratch",
    rows,
    values,
    viewport: { ...SQUARE },
    views: [],
    marks: [],
  };
}

export { uid as newId };
