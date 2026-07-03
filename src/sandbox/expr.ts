/**
 * Math bridge for the workspace sandbox, built on **mathjs**.
 *
 * Rows are stored as ASCIIMath-ish strings (the format MathLive round-trips
 * through), which are very close to mathjs syntax. This module is the single
 * place that knows mathjs: it parses rows, evaluates them against a scope,
 * extracts symbol dependencies, and converts to/from the LaTeX/ASCIIMath the
 * editor speaks.
 *
 * Points/vectors are plain length-2 arrays `[x, y]`, so mathjs's elementwise
 * array arithmetic gives us `+`, `-`, scalar `*` and `distance`/`dot` for free.
 * We additionally register `midpoint`. Source text uses Desmos-style
 * parentheses for points — `(a, b)` — which `normalizeSource` rewrites to
 * mathjs array syntax `[a, b]` before parsing.
 */

import { create, all, type MathNode, type MathJsInstance } from "mathjs";

export type Vec2 = readonly [number, number];
export type Value = number | number[];

export const isVec = (v: Value): v is number[] => Array.isArray(v);
export const isNum = (v: Value): v is number => typeof v === "number";

// `matrix: "Array"` keeps point literals as plain JS arrays end-to-end, so our
// point helpers and the renderer never see mathjs `DenseMatrix` wrappers.
export const math: MathJsInstance = create(all, { matrix: "Array" });

// Register a couple of point helpers on top of mathjs's built-in `distance`,
// `dot`, `cross`, `norm`, …
math.import(
  {
    midpoint: (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
    // Intersection point of line AB with line CD (NaN point if parallel).
    intersect: (a: number[], b: number[], c: number[], d: number[]) => {
      const den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
      if (den === 0) return [NaN, NaN];
      const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den;
      return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    },
  },
  { override: true },
);

/**
 * GeoGebra-style geometry constructors. These aren't mathjs functions — the
 * engine intercepts calls to them and builds drawable shapes. Listed here so
 * `symbolDeps` doesn't mistake the constructor name for a workspace dependency.
 */
export const GEOMETRY = new Set(["Segment", "Line", "Circle", "Polygon", "Vector"]);

/**
 * Rewrite Desmos-style point literals `(a, b)` into mathjs arrays `[a, b]`.
 * Walks the string with a paren stack so only groups that *directly* contain a
 * top-level comma become arrays; ordinary grouping parentheses are untouched.
 */
export function normalizeSource(src: string): string {
  const chars = src.split("");
  // Find the matching close for each open paren and whether it holds a comma
  // at its own depth.
  const open: number[] = [];
  const hasComma: boolean[] = new Array(chars.length).fill(false);
  const match: Record<number, number> = {};
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "(") open.push(i);
    else if (chars[i] === ")") {
      const o = open.pop();
      if (o !== undefined) match[o] = i;
    } else if (chars[i] === ",") {
      const top = open[open.length - 1];
      if (top !== undefined) hasComma[top] = true;
    }
  }
  const isCallable = (c: string) => /[A-Za-z0-9_)\]]/.test(c);
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] !== "(" || !hasComma[i]) continue;
    // A `(` directly after an identifier/`)`/`]` is a call's argument list, not
    // a point literal — leave it (and its commas) alone.
    let j = i - 1;
    while (j >= 0 && chars[j] === " ") j--;
    if (j >= 0 && isCallable(chars[j])) continue;
    chars[i] = "[";
    chars[match[i]] = "]";
  }
  return chars.join("");
}

/**
 * mathjs reads `a(x)` as a *function call*, never as implicit multiplication.
 * That breaks Desmos-style coefficients like `a(x - h)^2`. Given the set of
 * names that are known to be scalars/points (not functions), rewrite
 * `name(` → `name*(` so those become multiplications, while genuine calls
 * (`f(a)`, `sin(x)`) are untouched.
 */
export function insertImplicitMul(src: string, names: Set<string>): string {
  if (names.size === 0) return src;
  const alt = [...names]
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return src.replace(new RegExp(`\\b(${alt})\\s*\\(`, "g"), "$1*(");
}

/** Parse a source string into a mathjs AST (throws on syntax error). */
export function parseSource(src: string, multNames?: Set<string>): MathNode {
  const normalized = normalizeSource(src);
  return math.parse(multNames ? insertImplicitMul(normalized, multNames) : normalized);
}

/**
 * Collect the free symbol names a node depends on, excluding bound names
 * (function params), known constants, and registered functions/builtins.
 */
export function symbolDeps(node: MathNode, bound: Set<string> = new Set()): string[] {
  const out = new Set<string>();
  node
    .filter((n) => (n as MathNode).type === "SymbolNode")
    .forEach((n) => {
      const name = (n as unknown as { name: string }).name;
      if (bound.has(name)) return;
      if (name in CONSTANT_NAMES) return;
      if (GEOMETRY.has(name)) return;
      // A name that resolves to a mathjs function/constant isn't a workspace dep.
      if (isBuiltin(name)) return;
      out.add(name);
    });
  return [...out];
}

const CONSTANT_NAMES: Record<string, true> = {
  pi: true,
  tau: true,
  e: true,
  phi: true,
};

function isBuiltin(name: string): boolean {
  const v = (math as unknown as Record<string, unknown>)[name];
  return typeof v === "function" || typeof v === "number";
}

export type Scope = Record<string, unknown>;

/** Evaluate a node against a scope, coercing the result to a workspace Value. */
export function evalNode(node: MathNode, scope: Scope): Value {
  const v = node.compile().evaluate(scope);
  return coerce(v);
}

function coerce(v: unknown): Value {
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.map((x) => Number(x));
  // mathjs Matrix / fraction / unit → number where possible
  if (v && typeof (v as { toArray?: () => unknown[] }).toArray === "function") {
    return ((v as { toArray: () => unknown[] }).toArray() as number[]).map(Number);
  }
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  throw new Error("non-numeric result");
}

// ----------------------------------------------------------------------------
// Editor format conversions (MathLive speaks LaTeX / ASCIIMath)
// ----------------------------------------------------------------------------

/** Best-effort LaTeX for display, falling back to the raw source. */
export function toLatex(src: string): string {
  try {
    return math.parse(normalizeSource(src)).toTex({ parenthesis: "auto" });
  } catch {
    return src;
  }
}
