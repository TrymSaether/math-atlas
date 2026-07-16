/**
 * The geometric sandbox: a Desmos/GeoGebra-like workspace built on the
 * `Workspace` model (typed objects, parameters, draggable free inputs,
 * dependent objects, geometry, views, marks, provenance), evaluated by mathjs
 * and drawn with Mafs.
 *
 * Layout mirrors the rest of the atlas map: a full-bleed plane behind floating
 * chrome, with a compact expression panel and glass view-dock. Atlas-linked
 * mode (`loadById`) is driven programmatically by nodes; the standalone surface
 * exposes prepared workspaces and the user's saved library through the
 * workspace menu.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Maximize,
  Folder,
  FolderHeart,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Redo2,
  Save,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Surface } from "@/design";
import { cn } from "@/ui/cn";
import { useSandbox, isUserWorkspaceId } from "./store";
import { WORKSPACES, WORKSPACE_IDS } from "./library";
import type { ViewRect } from "./types";
import { ExpressionPanel } from "./ExpressionPanel";
import { PlaneView } from "./PlaneView";

import "mafs/core.css";

const DEFAULT_RECT: ViewRect = { xmin: -10, xmax: 10, ymin: -7, ymax: 7 };

function zoomRect(r: ViewRect, factor: number): ViewRect {
  const cx = (r.xmin + r.xmax) / 2;
  const cy = (r.ymin + r.ymax) / 2;
  const hw = ((r.xmax - r.xmin) / 2) * factor;
  const hh = ((r.ymax - r.ymin) / 2) * factor;
  return { xmin: cx - hw, xmax: cx + hw, ymin: cy - hh, ymax: cy + hh };
}

/** Icon button for the sandbox view dock — same shell icon button as atlas canvas controls. */
function DockBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-foreground"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

/** True when the event target is a text-editing element that owns its own undo. */
function inEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.tagName) return false;
  return Boolean(
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable ||
    el.closest?.("math-field, [contenteditable]"),
  );
}

export function SandboxView() {
  const ws = useSandbox((s) => s.ws);
  const compiled = useSandbox((s) => s.compiled);
  const setPoint = useSandbox((s) => s.setPoint);
  const loadById = useSandbox((s) => s.loadById);
  const setViewport = useSandbox((s) => s.setViewport);
  const saveView = useSandbox((s) => s.saveView);
  const applyView = useSandbox((s) => s.applyView);
  const removeView = useSandbox((s) => s.removeView);
  const undo = useSandbox((s) => s.undo);
  const redo = useSandbox((s) => s.redo);
  const canUndo = useSandbox((s) => s.history.length > 0);
  const canRedo = useSandbox((s) => s.future.length > 0);
  const [panelOpen, setPanelOpen] = useState(true);

  // Start on a worked example so the surface is never empty.
  useEffect(() => {
    if (ws.id === "scratch" && ws.rows.length <= 1) loadById("parabola-vertex");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cmd/Ctrl+Z / Shift+Cmd/Ctrl+Z — but editors (math fields, inputs) keep
  // their own text-level undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      if (inEditable(e.target)) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return (
    <div className="absolute inset-0 bg-background text-foreground">
      {/* Plane */}
      <main className="absolute inset-0 min-w-0 bg-background">
        <PlaneView rows={ws.rows} compiled={compiled} viewport={ws.viewport} marks={ws.marks} onMovePoint={setPoint} />

        {/* Saved views + view dock, right rail */}
        <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-end gap-2">
          {ws.views.length > 0 && (
            <Surface material="regular" className="pointer-events-auto flex items-center gap-0.5 rounded-full p-1">
              {ws.views.map((v) => (
                <span key={v.id} className="flex items-center">
                  <button
                    onClick={() => applyView(v.id)}
                    className="rounded-sm px-2 py-1 text-caption-2 text-muted-foreground"
                    title="Apply saved view"
                  >
                    {v.name}
                  </button>
                  <button
                    onClick={() => removeView(v.id)}
                    className="px-0.5 text-muted-foreground/70"
                    title="Remove view"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </Surface>
          )}
          <div className="pointer-events-auto inline-flex w-12 flex-col items-center gap-2.5">
            <Surface material="regular" className="flex w-12 flex-col items-center gap-0.5 rounded-[24px] p-1">
              <DockBtn label="Zoom in" onClick={() => setViewport(zoomRect(ws.viewport, 1 / 1.3))}>
                <Plus className="size-[17px]" />
              </DockBtn>
              <DockBtn label="Zoom out" onClick={() => setViewport(zoomRect(ws.viewport, 1.3))}>
                <Minus className="size-[17px]" />
              </DockBtn>
              <DockBtn label="Reset view" onClick={() => setViewport({ ...DEFAULT_RECT })}>
                <Maximize className="size-[17px]" />
              </DockBtn>
            </Surface>
            <Surface material="regular" className="flex size-12 items-center justify-center rounded-full">
              <DockBtn label="Save view" onClick={() => saveView(`view ${ws.views.length + 1}`)}>
                <Bookmark className="size-[17px]" />
              </DockBtn>
            </Surface>
          </div>
        </div>
      </main>

      {/* Floating expression panel */}
      {panelOpen ? (
        <Surface
          material="regular"
          className="pointer-events-auto absolute bottom-3 left-3 top-[68px] z-(--z-shell) flex w-[min(340px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg sm:left-4 sm:w-[340px]"
        >
          <div className="flex items-center gap-1 border-b border-border/60 px-2 py-2">
            <WorkspaceMenu />
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo"
                title="Undo (⌘Z)"
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo"
                title="Redo (⇧⌘Z)"
              >
                <Redo2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                onClick={() => setPanelOpen(false)}
                aria-label="Hide expressions"
                title="Hide expressions"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ExpressionPanel />
          </div>
        </Surface>
      ) : (
        <Surface
          material="regular"
          className="pointer-events-auto absolute left-3 top-[68px] z-(--z-shell) flex size-11 items-center justify-center rounded-full sm:left-4"
        >
          <DockBtn label="Show expressions" onClick={() => setPanelOpen(true)}>
            <PanelLeftOpen className="size-[17px]" />
          </DockBtn>
        </Surface>
      )}
    </div>
  );
}

/** Brand-style title + dropdown: saved workspaces, prepared examples, save-as. */
function WorkspaceMenu() {
  const ws = useSandbox((s) => s.ws);
  const compiled = useSandbox((s) => s.compiled);
  const saved = useSandbox((s) => s.saved);
  const loadById = useSandbox((s) => s.loadById);
  const saveAs = useSandbox((s) => s.saveAs);
  const deleteSaved = useSandbox((s) => s.deleteSaved);
  const reset = useSandbox((s) => s.reset);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const issueCount = compiled.computed.filter((c) => c?.error || c?.kind === "invalid").length;
  const savedIds = Object.keys(saved);

  const close = () => {
    setOpen(false);
    setSaving(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSaving(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSaving(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const commitSave = () => {
    saveAs(saveName.trim() || ws.title);
    setSaving(false);
    setOpen(false);
  };

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-footnote text-muted-foreground transition hover:bg-accent hover:text-foreground [&_svg]:text-muted-foreground/70";

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className="flex w-full min-w-0 items-center gap-2.5 rounded-sm px-1.5 py-1 text-left text-foreground transition hover:bg-foreground/[0.06] aria-expanded:bg-primary/10 aria-expanded:shadow-[inset_0_0_0_1px_var(--primary)] [&_svg]:text-muted-foreground aria-expanded:[&_svg]:text-primary"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-foreground/[0.06] shadow-[inset_0_0_0_1px_var(--border)]">
          {isUserWorkspaceId(ws.id) ? <FolderHeart className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-footnote font-semibold">{ws.title}</span>
          <span className="block truncate font-mono text-caption-2 uppercase tracking-label-tight text-muted-foreground">
            {ws.rows.length} expressions ·{" "}
            {issueCount > 0 ? `${issueCount} issue${issueCount === 1 ? "" : "s"}` : "ready"}
            {isUserWorkspaceId(ws.id) && " · saved"}
          </span>
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <Surface
          material="thick"
          className="absolute left-0 top-[52px] z-(--z-popover) w-[280px] overflow-hidden rounded-xl p-1.5"
        >
          {savedIds.length > 0 && (
            <>
              <div className="px-2.5 pb-1 pt-1.5 text-caption-2 font-semibold uppercase tracking-label-wide text-muted-foreground">
                My workspaces
              </div>
              {savedIds.map((id) => {
                const active = id === ws.id;
                return (
                  <div
                    key={id}
                    className={cn(
                      "flex items-center rounded-md transition hover:bg-accent",
                      active && "bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)] hover:bg-primary/10",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        loadById(id);
                        close();
                      }}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-footnote text-muted-foreground transition hover:text-foreground [&_svg]:text-muted-foreground/70",
                        active && "text-primary hover:text-primary [&_svg]:text-primary",
                      )}
                    >
                      <FolderHeart className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{saved[id].title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSaved(id)}
                      aria-label={`Delete ${saved[id].title}`}
                      title="Delete workspace"
                      className="mr-1 rounded-sm p-1 text-muted-foreground/60 transition hover:bg-foreground/10 hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              <div className="my-1 h-px bg-border" />
            </>
          )}

          <div className="px-2.5 pb-1 pt-1.5 text-caption-2 font-semibold uppercase tracking-label-wide text-muted-foreground">
            Examples
          </div>
          {WORKSPACE_IDS.map((id) => {
            const active = id === ws.id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  loadById(id);
                  close();
                }}
                className={cn(
                  itemClass,
                  active &&
                    "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_var(--primary)] [&_svg]:text-primary hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Folder className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{WORKSPACES[id].title}</span>
              </button>
            );
          })}
          <div className="my-1 h-px bg-border" />
          {saving ? (
            <form
              className="flex items-center gap-1.5 px-2 py-1"
              onSubmit={(e) => {
                e.preventDefault();
                commitSave();
              }}
            >
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus -- input only mounts on the user's own "Save" click; focusing it is expected, not a page-load autofocus.
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Workspace name"
                aria-label="Workspace name"
                className="min-h-[28px] w-full min-w-0 flex-1 rounded-sm border border-border bg-card px-2 py-1 text-footnote text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring"
              />
              <button
                type="submit"
                aria-label="Save workspace"
                title="Save workspace"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground transition hover:opacity-90"
              >
                <Check size={14} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSaveName(ws.title === "Scratch" ? "" : ws.title);
                setSaving(true);
              }}
              className={itemClass}
            >
              <Save className="h-3.5 w-3.5 shrink-0" />
              <span>Save as…</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              reset();
              close();
            }}
            className={itemClass}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>New blank workspace</span>
          </button>
        </Surface>
      )}
    </div>
  );
}
