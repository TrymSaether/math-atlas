/** Sandbox math-object model. Coordinates are in math space (not pixels). */

export type ToolId =
  | "select"
  | "point"
  | "basepoint"
  | "openset"
  | "path"
  | "loop"
  | "cover"
  | "quotient"
  | "measure";

export interface SandboxPoint {
  id: string;
  kind: "point";
  x: number;
  y: number;
}
export interface SandboxBasepoint {
  id: string;
  kind: "basepoint";
  x: number;
  y: number;
}
export interface SandboxSet {
  id: string;
  kind: "openset";
  cx: number;
  cy: number;
  r: number;
  label: string;
}
export interface SandboxPath {
  id: string;
  kind: "path";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface SandboxLoop {
  id: string;
  kind: "loop";
  cx: number;
  cy: number;
  r: number;
}
export interface SandboxCover {
  id: string;
  kind: "cover";
  cx: number;
  cy: number;
}
export interface SandboxQuotient {
  id: string;
  kind: "quotient";
  cx: number;
  cy: number;
}
export interface SandboxMeasure {
  id: string;
  kind: "measure";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type SandboxObject =
  | SandboxPoint
  | SandboxBasepoint
  | SandboxSet
  | SandboxPath
  | SandboxLoop
  | SandboxCover
  | SandboxQuotient
  | SandboxMeasure;

/** The primitive hues bind to domain tokens per the design spec. */
export const TOOL_META: {
  id: ToolId;
  label: string;
  /** Does placing this primitive need two canvas clicks (start, then end)? */
  twoClick?: boolean;
}[] = [
  { id: "select", label: "Select" },
  { id: "point", label: "Point" },
  { id: "basepoint", label: "Basepoint" },
  { id: "openset", label: "Open Set" },
  { id: "path", label: "Path", twoClick: true },
  { id: "loop", label: "Loop" },
  { id: "cover", label: "Cover" },
  { id: "quotient", label: "Quotient" },
  { id: "measure", label: "Measure", twoClick: true },
];

export const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x2 - x1, y2 - y1);
