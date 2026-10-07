/**
 * Workspace object model — the definition graph that every other layer reads.
 *
 * A workspace is an ordered list of typed objects (the definition graph) plus a
 * set of views that render objects as marks. Free objects are the mutable leaves
 * of the graph (sliders, draggable points); expressions, constructors and
 * primitives are dependent (internal) nodes. Dependencies are unidirectional:
 * an object may reference only objects defined before it. There is no backward
 * constraint solving.
 *
 * Honesty is enforced by construction:
 *   - Authors write inputs, expressions, constructors, primitives, and explicit
 *     `authored` claims. They can NEVER write a provenance tag.
 *   - The runtime evaluates exactly what is written (value-honesty is automatic)
 *     and DERIVES each object's provenance from how it was justified
 *     (see `Provenance` and the propagation rule in `provenance.ts`).
 */

/** A reference to another object by its `name` (the identifier used in expressions). */
export type Ref = string;

/** A literal argument to a constructor or primitive. */
export type Literal = number | number[] | string | boolean;

// ---------------------------------------------------------------------------
// Provenance — DERIVED by the runtime, never authored. Lives here because both
// the model docs and the runtime refer to it, but it is not a field on any
// authored object below.
// ---------------------------------------------------------------------------

/**
 * The justification for an evaluated object's value and any claim it carries.
 *
 *   input       — a free leaf: a parameter the user moves, not a claim.
 *   constructed — backed by a transparent geometric construction (e.g. the
 *                 midpoint M = (A+B)/2 *is* the midpoint, by definition).
 *   computed    — backed by honest evaluation or a numerical primitive.
 *   authored    — a human assertion, shown as an assertion and never dressed up
 *                 as computed. `authored` is absorbing: anything depending on an
 *                 authored claim is itself authored (see propagation rule).
 */
export type Provenance =
  | { just: "input" }
  | { just: "constructed" }
  | { just: "computed"; method?: string; tol?: number }
  | { just: "authored"; note?: string };

export type ProvenanceKind = Provenance["just"];

// ---------------------------------------------------------------------------
// Marks & views
// ---------------------------------------------------------------------------

/**
 * Display style for a drawable object. `color` resolves against a theme palette
 * token (see lib/themes), never a raw hex, so workspaces inherit the design
 * system. Absent fields fall back to the engine default for the object's kind.
 */
export interface MarkStyle {
  color?: string;
  width?: number;
  dashed?: boolean;
  fill?: boolean;
  pointSize?: number;
}

/**
 * A rendering surface. The MVP ships `panel` (the definition list) and
 * `plane2d`. 1D is a `plane2d` preset, not its own view. `space3d` is deferred
 * to a later milestone and will be a separate renderer over the same model.
 */
export type ViewSpec = { kind: "panel" } | { kind: "plane2d"; xRange?: [number, number]; yRange?: [number, number] };

// ---------------------------------------------------------------------------
// Objects (the authored definition graph)
// ---------------------------------------------------------------------------

interface ObjectBase {
  /** Stable id, unique within the workspace. */
  id: string;
  /** Identifier usable in other objects' expressions, e.g. "A", "f", "N". */
  name?: string;
  /** Human-facing label or claim, rendered together with derived provenance. */
  label?: string;
  /** How it draws, if drawable. Absent → engine default for the kind. */
  style?: MarkStyle;
  hidden?: boolean;
}

/** Free scalar leaf — manipulated by a slider. Provenance is always `input`. */
export interface FreeScalar extends ObjectBase {
  kind: "freeScalar";
  value: number;
  range?: { min: number; max: number; step?: number };
}

/** Free point leaf — manipulated by dragging on the canvas. Math-space coords. */
export interface FreePoint extends ObjectBase {
  kind: "freePoint";
  value: [number, number];
}

/**
 * A declarative expression evaluated by the expression engine: function
 * definitions, scalars, vectors, finite sums, sequences, lists, piecewise.
 * `params` lists the free variables (e.g. ["x"]); its presence means this object
 * is a function rather than a value.
 */
export interface ExprObject extends ObjectBase {
  kind: "expr";
  source: string;
  params?: string[];
}

/**
 * A transparent geometric constructor (Segment, Circle, …). Honest by
 * construction — no algorithm, no iteration. Both queryable (a circle has a
 * radius) and drawable.
 */
export interface ConstructObject extends ObjectBase {
  kind: "construct";
  ctor: ConstructorOp;
  args: (Ref | Literal)[];
}

/**
 * An opaque / algorithmic operation registered in code: fft, odeSolve,
 * rootFind, numericalIntegrate, fourierCoefficients, sample, … Invoked by name
 * against the primitive registry. This is where genuine computation lives, and
 * the only place new *kinds* of computation enter the engine.
 */
export interface PrimitiveObject extends ObjectBase {
  kind: "primitive";
  op: string;
  args: (Ref | Literal)[];
}

/**
 * A human assertion — a claim, annotation, or known value supplied without
 * derivation. Always evaluated with `authored` provenance and rendered as an
 * assertion. This is the honest home for "this is the Fourier series of f" when
 * the coefficients were supplied rather than computed.
 */
export interface AuthoredObject extends ObjectBase {
  kind: "authored";
  claim: string;
  value?: Literal;
}

export type WorkspaceObject = FreeScalar | FreePoint | ExprObject | ConstructObject | PrimitiveObject | AuthoredObject;

export type ObjectKind = WorkspaceObject["kind"];

/** The transparent geometric constructors available in the MVP. */
export type ConstructorOp = "segment" | "circle" | "line" | "polygon" | "vector";

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export interface Workspace {
  id: string;
  title: string;
  description?: string;
  /** 1D is a `2d` preset; `3d` is a later milestone with a separate renderer. */
  space: "2d" | "3d";
  /** Ordered: an object may reference only names defined before it. */
  objects: WorkspaceObject[];
  views: ViewSpec[];
  /** Set when this workspace was forked from another (provenance lineage). */
  parent?: string;
}

// ---------------------------------------------------------------------------
// Runtime view of an object — the model above, plus what the runtime derives.
// Authors never write these fields; the evaluator produces them.
// ---------------------------------------------------------------------------

/** A value the engine can hold: scalar, point/vector, list, function handle, or geometric object. */
export type Value =
  | { type: "scalar"; n: number }
  | { type: "vector"; v: number[] }
  | { type: "list"; items: Value[] }
  | { type: "function"; params: string[]; eval: (...args: number[]) => number }
  | { type: "geometry"; op: ConstructorOp; data: Record<string, unknown> };

/** An object after evaluation: its source definition plus derived value & provenance. */
export interface Evaluated {
  object: WorkspaceObject;
  value?: Value;
  provenance: Provenance;
  /** Present when evaluation failed; the object renders as errored, never faked. */
  error?: string;
}
