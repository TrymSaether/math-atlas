/**
 * The workspace engine: turns editable rows into evaluated, render-ready
 * objects on top of mathjs.
 *
 *   1. parse + classify each row into a typed object (parameter / point /
 *      value / function) using the mathjs AST shape,
 *   2. topologically order rows by their name dependencies (cycles flagged),
 *   3. evaluate in order into a shared scope that later rows reference.
 *
 * The result is a `CompiledWorkspace`: the per-row `Computed` map (with a
 * ready-to-call `sample` for plotted functions) plus the shared scope.
 */

import type { MathNode } from "mathjs";
import {
  evalNode,
  GEOMETRY,
  isNum,
  isVec,
  math,
  parseSource,
  symbolDeps,
  type Scope,
  type Value,
  type Vec2,
} from "./expr";
import type { Computed, GeomShape, ObjKind, Workspace } from "./types";

interface ParsedRow {
  id: string;
  kind: ObjKind;
  name?: string;
  /** RHS expression for value/point/function rows, or the bare expression. */
  expr?: MathNode;
  /** Function parameter names (default `["x"]` for plots). */
  params?: string[];
  /** Geometry constructor name + argument expressions (geometry rows). */
  ctor?: string;
  geomArgs?: MathNode[];
  deps: string[];
  error?: string;
}

const GEOM_KIND: Record<string, ObjKind> = {
  Segment: "segment",
  Line: "line",
  Circle: "circle",
  Polygon: "polygon",
  Vector: "vector",
};

/** If `node` is a geometry constructor call, return its name + argument nodes. */
function geomCall(node: MathNode): { ctor: string; args: MathNode[] } | null {
  if (nodeType(node) !== "FunctionNode") return null;
  const fn = node as unknown as { name: string; args: MathNode[] };
  return GEOMETRY.has(fn.name) ? { ctor: fn.name, args: fn.args } : null;
}

// mathjs node shape guards (its TS types are loose, so we narrow by `.type`).
const nodeType = (n: MathNode) => (n as unknown as { type: string }).type;
/** A numeric literal, including a signed one like `-1` (unary-minus of a const). */
const isNumericLiteral = (n: MathNode): boolean => {
  const t = nodeType(n);
  if (t === "ConstantNode")
    return typeof (n as unknown as { value: unknown }).value === "number";
  if (t === "OperatorNode") {
    const o = n as unknown as { fn: string; args: MathNode[] };
    if (
      (o.fn === "unaryMinus" || o.fn === "unaryPlus") &&
      o.args.length === 1
    ) {
      return isNumericLiteral(o.args[0]);
    }
  }
  return false;
};
const isArray2 = (n: MathNode): n is MathNode & { items: MathNode[] } =>
  nodeType(n) === "ArrayNode" &&
  (n as unknown as { items: MathNode[] }).items.length === 2;

/**
 * Shallow pass: identify which defined names are functions vs scalars/points,
 * so the full parse can disambiguate `a(x)` (multiply) from `f(x)` (call).
 */
function collectNameKinds(sources: string[]): { multNames: Set<string> } {
  const multNames = new Set<string>();
  for (const source of sources) {
    const src = source.trim();
    if (!src) continue;
    try {
      const node = parseSource(src);
      const type = nodeType(node);
      if (type === "AssignmentNode") {
        const name = (node as unknown as { object: { name: string } }).object
          .name;
        if (name !== "y") multNames.add(name);
      }
      // FunctionAssignmentNode names are callable — deliberately excluded.
    } catch {
      /* ignore — reported during the real parse */
    }
  }
  return { multNames };
}

function parseRow(
  source: string,
  id: string,
  multNames: Set<string>,
): ParsedRow {
  const src = source.trim();
  if (!src) return { id, kind: "blank", deps: [] };

  try {
    const node = parseSource(src, multNames);
    const type = nodeType(node);

    // f(x) = … → function definition
    if (type === "FunctionAssignmentNode") {
      const fn = node as unknown as {
        name: string;
        params: string[];
        expr: MathNode;
      };
      return {
        id,
        kind: "function",
        name: fn.name,
        expr: fn.expr,
        params: fn.params,
        deps: symbolDeps(fn.expr, new Set(fn.params)),
      };
    }

    // name = … → assignment
    if (type === "AssignmentNode") {
      const as = node as unknown as {
        object: { name: string };
        value: MathNode;
      };
      const name = as.object.name;
      const value = as.value;

      // name = Segment(A, B) etc. → named geometry
      const geo = geomCall(value);
      if (geo) {
        return {
          id,
          kind: GEOM_KIND[geo.ctor],
          name,
          ctor: geo.ctor,
          geomArgs: geo.args,
          deps: geo.args.flatMap((a) => symbolDeps(a)),
        };
      }

      // y = <expr in x> → explicit-form curve
      if (name === "y") {
        return {
          id,
          kind: "function",
          name: "y",
          expr: value,
          params: ["x"],
          deps: symbolDeps(value, new Set(["x"])),
        };
      }
      // name = (a, b) → point; free (draggable) iff both components literal
      if (isArray2(value)) {
        const literal = value.items.every(isNumericLiteral);
        return {
          id,
          kind: literal ? "freePoint" : "point",
          name,
          expr: value,
          deps: symbolDeps(value),
        };
      }
      // name = <number literal> → free slider parameter
      if (isNumericLiteral(value)) {
        return { id, kind: "parameter", name, expr: value, deps: [] };
      }
      // name = <expression> → derived value
      return { id, kind: "value", name, expr: value, deps: symbolDeps(value) };
    }

    // Bare geometry construction, e.g. Polygon(A, B, C)
    const bareGeo = geomCall(node);
    if (bareGeo) {
      return {
        id,
        kind: GEOM_KIND[bareGeo.ctor],
        ctor: bareGeo.ctor,
        geomArgs: bareGeo.args,
        deps: bareGeo.args.flatMap((a) => symbolDeps(a)),
      };
    }

    // Bare expression
    const deps = symbolDeps(node);
    if (deps.includes("x")) {
      return {
        id,
        kind: "function",
        expr: node,
        params: ["x"],
        deps: deps.filter((d) => d !== "x"),
      };
    }
    return { id, kind: "value", expr: node, deps };
  } catch (e) {
    return { id, kind: "invalid", deps: [], error: cleanError(e) };
  }
}

function cleanError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/\s*\(char \d+\)/, "");
}

function texForName(name: string): string {
  return /^[A-Za-z]+$/.test(name)
    ? name
    : String.raw`\mathrm{${name.replace(/_/g, String.raw`\_`)}}`;
}

function texForValue(v: Value | undefined): string {
  if (v === undefined) return "";
  if (isNum(v)) return formatValue(v).replace(/-/g, "{-}");
  if (isVec(v))
    return String.raw`\left(${v.map((x) => texForValue(x)).join(", ")}\right)`;
  return String(v);
}

function substituteScalars(
  node: MathNode,
  scope: Scope,
  bound: Set<string>,
): MathNode {
  const substituted = node.transform((n) => {
    if (nodeType(n) !== "SymbolNode") return n;
    const name = (n as unknown as { name: string }).name;
    const value = scope[name];
    if (bound.has(name) || typeof value !== "number" || !Number.isFinite(value))
      return n;
    return math.parse(formatValue(value));
  });

  try {
    return math.simplify(substituted);
  } catch {
    return substituted;
  }
}

function texForExpression(
  node: MathNode,
  scope: Scope,
  bound: Set<string> = new Set(),
): string {
  return substituteScalars(node, scope, bound).toTex({ parenthesis: "auto" });
}

function evaluatedTexFor(
  p: ParsedRow,
  computed: Computed,
  scope: Scope,
): string | undefined {
  if (computed.error || computed.kind === "blank" || computed.kind === "invalid")
    return undefined;

  if (p.kind === "function" && p.expr) {
    const params = p.params ?? ["x"];
    const lhs =
      p.name && p.name !== "y"
        ? String.raw`${texForName(p.name)}\left(${params.map(texForName).join(", ")}\right)`
        : "y";
    return `${lhs}=${texForExpression(p.expr, scope, new Set(params))}`;
  }

  if (computed.value !== undefined) {
    const lhs = p.name ? `${texForName(p.name)}=` : "";
    return `${lhs}${texForValue(computed.value)}`;
  }

  return undefined;
}

export interface CompiledWorkspace {
  computed: Computed[];
  byId: Record<string, Computed>;
  scope: Scope;
}

const KIND_LABEL: Record<ObjKind, string> = {
  parameter: "parameter",
  freePoint: "point",
  point: "point",
  value: "value",
  function: "function",
  segment: "segment",
  line: "line",
  circle: "circle",
  polygon: "polygon",
  vector: "vector",
  blank: "",
  invalid: "error",
};

const GEOM_KINDS = new Set<ObjKind>([
  "segment",
  "line",
  "circle",
  "polygon",
  "vector",
]);

/** Build a drawable shape from a geometry constructor and its evaluated args. */
function buildGeom(ctor: string, vals: Value[]): GeomShape {
  const pt = (v: Value | undefined, where: string): Vec2 => {
    const p = asVec2(v);
    if (!p) throw new Error(`${where} expects a point`);
    return p;
  };
  switch (ctor) {
    case "Segment":
      return {
        kind: "segment",
        a: pt(vals[0], "Segment"),
        b: pt(vals[1], "Segment"),
      };
    case "Line":
      return { kind: "line", a: pt(vals[0], "Line"), b: pt(vals[1], "Line") };
    case "Circle": {
      const c = pt(vals[0], "Circle");
      const r = isNum(vals[1])
        ? vals[1]
        : Math.hypot(
            pt(vals[1], "Circle")[0] - c[0],
            pt(vals[1], "Circle")[1] - c[1],
          );
      return { kind: "circle", c, r };
    }
    case "Polygon":
      return {
        kind: "polygon",
        pts: vals.map((v, i) => pt(v, `Polygon vertex ${i + 1}`)),
      };
    case "Vector":
      return vals.length >= 2
        ? {
            kind: "vector",
            tail: pt(vals[0], "Vector"),
            tip: pt(vals[1], "Vector"),
          }
        : { kind: "vector", tail: [0, 0], tip: pt(vals[0], "Vector") };
    default:
      throw new Error(`unknown construction "${ctor}"`);
  }
}

export function compile(ws: Workspace): CompiledWorkspace {
  const { multNames } = collectNameKinds(ws.rows.map((r) => r.source));
  const parsed = ws.rows.map((r) => parseRow(r.source, r.id, multNames));

  const definer: Record<string, string> = {};
  for (const p of parsed) if (p.name) definer[p.name] = p.id;

  const order = topoOrder(parsed, definer);
  const scope: Scope = {};
  const byId: Record<string, Computed> = {};

  const evalRow = (p: ParsedRow): Computed => {
    if (p.kind === "blank") return { id: p.id, kind: "blank", deps: [] };
    if (p.kind === "invalid")
      return { id: p.id, kind: "invalid", deps: [], error: p.error };

    const base: Computed = {
      id: p.id,
      kind: p.kind,
      name: p.name,
      deps: p.deps,
      label: KIND_LABEL[p.kind],
    };

    try {
      if (p.kind === "parameter" || p.kind === "freePoint") {
        const stored = ws.values[p.id];
        const value = stored !== undefined ? stored : evalNode(p.expr!, scope);
        if (p.name) scope[p.name] = value as unknown;
        const computed = { ...base, value };
        return {
          ...computed,
          evaluatedTex: evaluatedTexFor(p, computed, scope),
        };
      }

      if (p.kind === "function") {
        const param = p.params?.[0] ?? "x";
        const expr = p.expr!;
        // Define named functions in scope so later rows can call them.
        if (p.name && p.name !== "y") {
          scope[p.name] = (...args: number[]) => {
            const local: Scope = { ...scope };
            (p.params ?? ["x"]).forEach((pn, i) => (local[pn] = args[i]));
            const v = evalNode(expr, local);
            return v as number;
          };
        }
        const code = expr.compile();
        const sample = (x: number): number => {
          try {
            const v = code.evaluate({ ...scope, [param]: x });
            return typeof v === "number" ? v : NaN;
          } catch {
            return NaN;
          }
        };
        const computed = { ...base, sample };
        return {
          ...computed,
          evaluatedTex: evaluatedTexFor(p, computed, scope),
        };
      }

      if (GEOM_KINDS.has(p.kind)) {
        const vals = (p.geomArgs ?? []).map((a) => evalNode(a, scope));
        const geom = buildGeom(p.ctor!, vals);
        return { ...base, geom };
      }

      // value | dependent point
      const value = evalNode(p.expr!, scope);
      if (p.name) scope[p.name] = value as unknown;
      const computed = { ...base, value };
      return {
        ...computed,
        evaluatedTex: evaluatedTexFor(p, computed, scope),
      };
    } catch (e) {
      return { ...base, error: cleanError(e) };
    }
  };

  for (const id of order) byId[id] = evalRow(parsed.find((x) => x.id === id)!);
  const computed = ws.rows.map((r) => byId[r.id]);
  return { computed, byId, scope };
}

/** Kahn topological sort; rows left in a cycle are appended so they self-report. */
function topoOrder(
  parsed: ParsedRow[],
  definer: Record<string, string>,
): string[] {
  const ids = parsed.map((p) => p.id);
  const indeg: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  for (const id of ids) {
    indeg[id] = 0;
    adj[id] = [];
  }
  for (const p of parsed) {
    for (const dep of p.deps) {
      const from = definer[dep];
      if (from && from !== p.id) {
        adj[from].push(p.id);
        indeg[p.id]++;
      }
    }
  }
  const queue = ids.filter((id) => indeg[id] === 0);
  const out: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    out.push(id);
    for (const next of adj[id]) if (--indeg[next] === 0) queue.push(next);
  }
  for (const id of ids) if (!out.includes(id)) out.push(id);
  return out;
}

/** Format a value compactly for panel readouts. */
export function formatValue(v: Value | undefined): string {
  if (v === undefined) return "";
  if (isNum(v)) {
    if (!Number.isFinite(v)) return v > 0 ? "∞" : "−∞";
    const r = Math.round(v * 1e6) / 1e6;
    return Object.is(r, -0) ? "0" : String(r);
  }
  if (isVec(v)) return `(${formatValue(v[0])}, ${formatValue(v[1])})`;
  return String(v);
}

export const asVec2 = (v: Value | undefined): Vec2 | null => {
  if (!v || !isVec(v) || v.length !== 2) return null;
  const a = v[0];
  const b = v[1];
  if (a === undefined || b === undefined) return null;
  return [a, b];
};
