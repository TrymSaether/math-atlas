/**
 * Zustand store for the workspace sandbox. Kept separate from the atlas store
 * (src/store.ts) so the two surfaces stay decoupled — the only bridge is
 * `loadById`, which atlas-linked mode calls to pull a prepared workspace.
 *
 * The store holds the editable `Workspace` plus transient UI state (selection,
 * compile cache). Compilation is memoized: it re-runs only when rows or free
 * values change, not on selection or viewport pans.
 */

import { create } from "zustand";
import type { Value } from "./expr";
import { compile, type CompiledWorkspace } from "./engine";
import { emptyWorkspace, loadWorkspace, newId, PALETTE } from "./library";
import type { DistributiveOmit, Mark, Row, SliderSpec, ViewRect, Workspace } from "./types";

interface SandboxState {
  ws: Workspace;
  /** Cached compile result, recomputed on every workspace mutation. */
  compiled: CompiledWorkspace;
  selectedRowId: string | null;

  // --- atlas-linked mode --------------------------------------------------
  loadById: (id: string) => void;
  reset: () => void;

  // --- rows ---------------------------------------------------------------
  addRow: (source?: string) => void;
  updateRow: (id: string, source: string) => void;
  removeRow: (id: string) => void;
  setRowColor: (id: string, color: string) => void;
  toggleRowVisible: (id: string) => void;
  setRowSlider: (id: string, slider: SliderSpec | undefined) => void;
  selectRow: (id: string | null) => void;

  // --- free inputs --------------------------------------------------------
  setValue: (id: string, value: Value) => void;
  setScalarValue: (id: string, value: number) => void;
  setPoint: (id: string, p: [number, number]) => void;

  // --- views --------------------------------------------------------------
  setViewport: (rect: ViewRect) => void;
  saveView: (name: string) => void;
  applyView: (id: string) => void;
  removeView: (id: string) => void;

  // --- marks --------------------------------------------------------------
  addMark: (mark: DistributiveOmit<Mark, "id">) => void;
  removeMark: (id: string) => void;
}

const recompile = (ws: Workspace) => ({ ws, compiled: compile(ws) });

const DEFAULT_SLIDER: SliderSpec = { min: -10, max: 10, step: 0.1 };

function formatScalarSourceValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 1e6) / 1e6;
  return Object.is(rounded, -0) ? "0" : `${rounded}`;
}

function syncScalarAssignmentSource(source: string, value: number): string {
  const match = source.match(/^(\s*[A-Za-z]\w*\s*=\s*)(.*?)(\s*)$/);
  if (!match) return source;
  return `${match[1]}${formatScalarSourceValue(value)}${match[3]}`;
}

export const useSandbox = create<SandboxState>((set, _get) => {
  const initial = emptyWorkspace();
  return {
    ws: initial,
    compiled: compile(initial),
    selectedRowId: null,

    loadById: (id) => {
      const ws = loadWorkspace(id);
      set({ ...recompile(ws), selectedRowId: null });
    },
    reset: () => {
      const ws = emptyWorkspace();
      set({ ...recompile(ws), selectedRowId: null });
    },

    addRow: (source = "") =>
      set((s) => {
        const used = s.ws.rows.length;
        const row: Row = {
          id: newId(),
          source,
          color: PALETTE[used % PALETTE.length],
          visible: true,
          provenance: { source: "user", createdAt: Date.now() },
        };
        const ws = { ...s.ws, rows: [...s.ws.rows, row] };
        return { ...recompile(ws), selectedRowId: row.id };
      }),

    updateRow: (id, source) =>
      set((s) => {
        const rows = s.ws.rows.map((r) => (r.id === id ? { ...r, source } : r));
        // Editing a row drops any stale free value (the literal is re-read).
        const values = { ...s.ws.values };
        delete values[id];
        return recompile({ ...s.ws, rows, values });
      }),

    removeRow: (id) =>
      set((s) => {
        const rows = s.ws.rows.filter((r) => r.id !== id);
        const values = { ...s.ws.values };
        delete values[id];
        return {
          ...recompile({ ...s.ws, rows, values }),
          selectedRowId: s.selectedRowId === id ? null : s.selectedRowId,
        };
      }),

    setRowColor: (id, color) =>
      set((s) =>
        recompile({
          ...s.ws,
          rows: s.ws.rows.map((r) => (r.id === id ? { ...r, color } : r)),
        }),
      ),

    toggleRowVisible: (id) =>
      set((s) =>
        recompile({
          ...s.ws,
          rows: s.ws.rows.map((r) => (r.id === id ? { ...r, visible: !r.visible } : r)),
        }),
      ),

    setRowSlider: (id, slider) =>
      set((s) =>
        recompile({
          ...s.ws,
          rows: s.ws.rows.map((r) => (r.id === id ? { ...r, slider } : r)),
        }),
      ),

    selectRow: (id) => set({ selectedRowId: id }),

    setValue: (id, value) =>
      set((s) => recompile({ ...s.ws, values: { ...s.ws.values, [id]: value } })),

    setScalarValue: (id, value) =>
      set((s) => {
        const rows = s.ws.rows.map((r) =>
          r.id === id ? { ...r, source: syncScalarAssignmentSource(r.source, value) } : r,
        );
        return recompile({ ...s.ws, rows, values: { ...s.ws.values, [id]: value } });
      }),

    setPoint: (id, p) => set((s) => recompile({ ...s.ws, values: { ...s.ws.values, [id]: p } })),

    setViewport: (rect) => set((s) => ({ ws: { ...s.ws, viewport: rect } })),

    saveView: (name) =>
      set((s) => ({
        ws: {
          ...s.ws,
          views: [...s.ws.views, { id: newId("view"), name, rect: { ...s.ws.viewport } }],
        },
      })),

    applyView: (id) =>
      set((s) => {
        const v = s.ws.views.find((x) => x.id === id);
        return v ? { ws: { ...s.ws, viewport: { ...v.rect } } } : {};
      }),

    removeView: (id) =>
      set((s) => ({ ws: { ...s.ws, views: s.ws.views.filter((v) => v.id !== id) } })),

    addMark: (mark) =>
      set((s) => ({
        ws: { ...s.ws, marks: [...s.ws.marks, { ...mark, id: newId("mark") } as Mark] },
      })),

    removeMark: (id) =>
      set((s) => ({ ws: { ...s.ws, marks: s.ws.marks.filter((m) => m.id !== id) } })),
  };
});

export { DEFAULT_SLIDER };
