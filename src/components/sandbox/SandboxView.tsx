import { useCallback, useEffect, useState } from "react";
import { CommandBar } from "./CommandBar";
import { FactsPanel } from "./FactsPanel";
import { SandboxCanvas } from "./SandboxCanvas";
import { StatusLegend } from "./StatusLegend";
import { ToolRail } from "./ToolRail";
import type { SandboxObject, ToolId } from "./types";

const DEFAULT_R = 2.4; // open-set / loop radius in math units
let counter = 0;
const uid = () => `sbx-${++counter}`;

const SUBSCRIPT = "₀₁₂₃₄₅₆₇₈₉";
const subscript = (n: number) =>
  String(n)
    .split("")
    .map((d) => SUBSCRIPT.charAt(Number(d)))
    .join("");

/**
 * Geometric scratchpad surface (the "Sandbox"). A tool rail, coordinate canvas,
 * live facts panel, command bar, and status legend. Construction is live;
 * deeper facts (π₁ recognition) are presentational placeholders keyed off the
 * canvas contents — this is a visual surface, not a topology proof engine.
 */
export function SandboxView() {
  const [tool, setTool] = useState<ToolId>("point");
  const [objects, setObjects] = useState<SandboxObject[]>([]);
  const [redoStack, setRedoStack] = useState<SandboxObject[][]>([]);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);

  // Drop any half-finished two-click construction when switching tools.
  useEffect(() => setPending(null), [tool]);

  const handlePlace = useCallback(
    (x: number, y: number) => {
      // Runs inside the pointer-up handler, so setState side effects are fine.
      const next = placeObject(objects, tool, x, y, pending, setPending);
      if (next === objects) return;
      setObjects(next);
      setRedoStack([]);
    },
    [objects, tool, pending],
  );

  const undo = useCallback(() => {
    setObjects((prev) => {
      if (!prev.length) return prev;
      setRedoStack((r) => [...r, prev]);
      return prev.slice(0, -1);
    });
    setPending(null);
  }, []);

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (!r.length) return r;
      const restored = r[r.length - 1];
      setObjects(restored);
      return r.slice(0, -1);
    });
  }, []);

  const clear = useCallback(() => {
    setObjects((prev) => {
      if (!prev.length) return prev;
      return [];
    });
    setRedoStack([]);
    setPending(null);
  }, []);

  // Sandbox owns its keyboard: tool hotkeys + undo/redo + escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.key === "Escape") {
        setPending(null);
        setTool("select");
        return;
      }
      const hotkeys: Record<string, ToolId> = {
        v: "select",
        p: "point",
        b: "basepoint",
        o: "openset",
        l: "loop",
        m: "measure",
      };
      const next = hotkeys[e.key.toLowerCase()];
      if (next) setTool(next);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return (
    <div className="absolute inset-0 flex flex-col pt-16" style={{ background: "var(--bg)" }}>
      <div className="flex min-h-0 flex-1">
        <ToolRail
          active={tool}
          setActive={setTool}
          onUndo={undo}
          onRedo={redo}
          onClear={clear}
          canUndo={objects.length > 0}
          canRedo={redoStack.length > 0}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <SandboxCanvas
              objects={objects}
              tool={tool}
              pending={pending}
              onPlace={handlePlace}
              showLabels
            />
            <StatusLegend />
          </div>
          <CommandBar />
        </div>
        <FactsPanel objects={objects} />
      </div>
    </div>
  );
}

/** Pure placement reducer. Returns a new objects array (or the same ref to skip). */
function placeObject(
  prev: SandboxObject[],
  tool: ToolId,
  x: number,
  y: number,
  pending: { x: number; y: number } | null,
  setPending: (p: { x: number; y: number } | null) => void,
): SandboxObject[] {
  switch (tool) {
    case "point":
      return [...prev, { id: uid(), kind: "point", x, y }];
    case "basepoint":
      // Only one basepoint; replace any existing.
      return [...prev.filter((o) => o.kind !== "basepoint"), { id: uid(), kind: "basepoint", x, y }];
    case "openset": {
      const n = prev.filter((o) => o.kind === "openset").length + 1;
      return [...prev, { id: uid(), kind: "openset", cx: x, cy: y, r: DEFAULT_R, label: `U${subscript(n)}` }];
    }
    case "loop":
      return [...prev, { id: uid(), kind: "loop", cx: x, cy: y, r: DEFAULT_R }];
    case "cover":
      return [...prev, { id: uid(), kind: "cover", cx: x, cy: y }];
    case "quotient":
      return [...prev, { id: uid(), kind: "quotient", cx: x, cy: y }];
    case "path":
      if (!pending) {
        setPending({ x, y });
        return prev;
      }
      setPending(null);
      return [...prev, { id: uid(), kind: "path", x1: pending.x, y1: pending.y, x2: x, y2: y }];
    case "measure":
      if (!pending) {
        setPending({ x, y });
        return prev;
      }
      setPending(null);
      return [...prev, { id: uid(), kind: "measure", x1: pending.x, y1: pending.y, x2: x, y2: y }];
    default:
      return prev;
  }
}
