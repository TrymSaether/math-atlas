/**
 * Zustand store for the workspace sandbox. Kept separate from the atlas store
 * (app/store.ts) so the two surfaces stay decoupled — the only bridge is
 * `loadById`, which atlas-linked mode calls to pull a prepared workspace.
 *
 * The store holds the editable `Workspace`, the user's saved workspaces, an
 * undo/redo history, and transient UI state (selection, compile cache).
 * Compilation is memoized: it re-runs only when rows or free values change,
 * not on selection or viewport pans.
 *
 * Persistence: the current workspace and the saved library go to localStorage
 * (debounced), so work survives reloads. A workspace whose id starts with
 * `user-` is a saved one and auto-syncs its library copy on every edit.
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

  /** User-saved workspaces, keyed by their `user-…` id. */
  saved: Record<string, Workspace>;
  saveAs: (name: string) => void;
  deleteSaved: (id: string) => void;

  /** Undo/redo over workspace snapshots (rows/values/marks; not viewport). */
  history: Workspace[];
  future: Workspace[];
  /** Coalescing marker so keystrokes / drags / animation don't flood history. */
  lastEdit: { key: string; at: number } | null;
  undo: () => void;
  redo: () => void;

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

const HISTORY_LIMIT = 50;
/** Repeated edits to the same target within this window share one undo step. */
const COALESCE_MS = 800;

const SANDBOX_STORAGE_KEY = "math-atlas-sandbox-v1";

interface PersistedSandbox {
  version: 1;
  ws: Workspace;
  saved: Record<string, Workspace>;
}

function readPersistedSandbox(): { ws: Workspace | null; saved: Record<string, Workspace> } {
  const none = { ws: null, saved: {} };
  if (typeof window === "undefined") return none;
  try {
    const raw = window.localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) return none;
    const parsed = JSON.parse(raw) as Partial<PersistedSandbox>;
    if (parsed?.version !== 1 || !Array.isArray(parsed.ws?.rows)) return none;
    return { ws: parsed.ws as Workspace, saved: parsed.saved ?? {} };
  } catch {
    return none;
  }
}

function writePersistedSandbox(ws: Workspace, saved: Record<string, Workspace>): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedSandbox = { version: 1, ws, saved };
    window.localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore private-mode / quota failures */
  }
}

export function isUserWorkspaceId(id: string): boolean {
  return id.startsWith("user-");
}

/**
 * History bookkeeping for a mutation about to replace `s.ws`. Pass a `key`
 * for high-frequency edits (typing, dragging, slider animation) so bursts
 * against the same target collapse into a single undo step.
 */
function record(s: SandboxState, key?: string): Partial<SandboxState> {
  const now = Date.now();
  if (key && s.lastEdit && s.lastEdit.key === key && now - s.lastEdit.at < COALESCE_MS) {
    return { lastEdit: { key, at: now } };
  }
  return {
    history: [...s.history.slice(-(HISTORY_LIMIT - 1)), s.ws],
    future: [],
    lastEdit: key ? { key, at: now } : null,
  };
}

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

const persisted = readPersistedSandbox();

export const useSandbox = create<SandboxState>((set) => {
  const initial = persisted.ws ?? emptyWorkspace();
  return {
    ws: initial,
    compiled: compile(initial),
    selectedRowId: null,

    saved: persisted.saved,

    saveAs: (name) =>
      set((s) => {
        const id = `user-${newId()}`;
        const title = name.trim() || "Untitled workspace";
        const ws: Workspace = { ...structuredClone(s.ws), id, title };
        return { ws, saved: { ...s.saved, [id]: ws } };
      }),

    deleteSaved: (id) =>
      set((s) => {
        const saved = { ...s.saved };
        delete saved[id];
        // Detach the open copy so future edits don't resurrect the deleted entry.
        const ws = s.ws.id === id ? { ...s.ws, id: "scratch" } : s.ws;
        return { saved, ws };
      }),

    history: [],
    future: [],
    lastEdit: null,

    undo: () =>
      set((s) => {
        const prev = s.history[s.history.length - 1];
        if (!prev) return {};
        return {
          ...recompile(prev),
          history: s.history.slice(0, -1),
          future: [s.ws, ...s.future].slice(0, HISTORY_LIMIT),
          lastEdit: null,
        };
      }),

    redo: () =>
      set((s) => {
        const next = s.future[0];
        if (!next) return {};
        return {
          ...recompile(next),
          history: [...s.history.slice(-(HISTORY_LIMIT - 1)), s.ws],
          future: s.future.slice(1),
          lastEdit: null,
        };
      }),

    loadById: (id) =>
      set((s) => {
        const savedWs = s.saved[id];
        const ws = savedWs ? structuredClone(savedWs) : loadWorkspace(id);
        return { ...recompile(ws), selectedRowId: null, history: [], future: [], lastEdit: null };
      }),
    reset: () => {
      const ws = emptyWorkspace();
      set({ ...recompile(ws), selectedRowId: null, history: [], future: [], lastEdit: null });
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
        return { ...record(s), ...recompile(ws), selectedRowId: row.id };
      }),

    updateRow: (id, source) =>
      set((s) => {
        const rows = s.ws.rows.map((r) => (r.id === id ? { ...r, source } : r));
        // Editing a row drops any stale free value (the literal is re-read).
        const values = { ...s.ws.values };
        delete values[id];
        return { ...record(s, `row:${id}`), ...recompile({ ...s.ws, rows, values }) };
      }),

    removeRow: (id) =>
      set((s) => {
        const rows = s.ws.rows.filter((r) => r.id !== id);
        const values = { ...s.ws.values };
        delete values[id];
        return {
          ...record(s),
          ...recompile({ ...s.ws, rows, values }),
          selectedRowId: s.selectedRowId === id ? null : s.selectedRowId,
        };
      }),

    setRowColor: (id, color) =>
      set((s) => ({
        ...record(s),
        ...recompile({
          ...s.ws,
          rows: s.ws.rows.map((r) => (r.id === id ? { ...r, color } : r)),
        }),
      })),

    toggleRowVisible: (id) =>
      set((s) => ({
        ...record(s),
        ...recompile({
          ...s.ws,
          rows: s.ws.rows.map((r) => (r.id === id ? { ...r, visible: !r.visible } : r)),
        }),
      })),

    setRowSlider: (id, slider) =>
      set((s) => ({
        ...record(s, `slider:${id}`),
        ...recompile({
          ...s.ws,
          rows: s.ws.rows.map((r) => (r.id === id ? { ...r, slider } : r)),
        }),
      })),

    selectRow: (id) => set({ selectedRowId: id }),

    setValue: (id, value) =>
      set((s) => ({
        ...record(s, `value:${id}`),
        ...recompile({ ...s.ws, values: { ...s.ws.values, [id]: value } }),
      })),

    setScalarValue: (id, value) =>
      set((s) => {
        const rows = s.ws.rows.map((r) =>
          r.id === id ? { ...r, source: syncScalarAssignmentSource(r.source, value) } : r,
        );
        return {
          ...record(s, `scalar:${id}`),
          ...recompile({ ...s.ws, rows, values: { ...s.ws.values, [id]: value } }),
        };
      }),

    setPoint: (id, p) =>
      set((s) => ({
        ...record(s, `point:${id}`),
        ...recompile({ ...s.ws, values: { ...s.ws.values, [id]: p } }),
      })),

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

    removeView: (id) => set((s) => ({ ws: { ...s.ws, views: s.ws.views.filter((v) => v.id !== id) } })),

    addMark: (mark) =>
      set((s) => ({
        ...record(s),
        ws: { ...s.ws, marks: [...s.ws.marks, { ...mark, id: newId("mark") } as Mark] },
      })),

    removeMark: (id) => set((s) => ({ ...record(s), ws: { ...s.ws, marks: s.ws.marks.filter((m) => m.id !== id) } })),
  };
});

// Persist (debounced — slider animation mutates at frame rate) and keep the
// saved-library copy of an open user workspace in sync with edits.
if (typeof window !== "undefined") {
  let persistTimer: ReturnType<typeof setTimeout> | undefined;
  useSandbox.subscribe((s) => {
    if (isUserWorkspaceId(s.ws.id) && s.saved[s.ws.id] !== s.ws) {
      useSandbox.setState({ saved: { ...s.saved, [s.ws.id]: s.ws } });
      return; // the setState above re-notifies; persist on that pass
    }
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => writePersistedSandbox(s.ws, s.saved), 300);
  });
}

export { DEFAULT_SLIDER };
