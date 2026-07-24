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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Focus,
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
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/ui/button";
import { spring, Surface } from "@/design";
import { cn } from "@/ui/cn";
import { useSandbox, isUserWorkspaceId } from "./store";
import { WORKSPACES, WORKSPACE_IDS } from "./library";
import type { ViewRect } from "./types";
import { ExpressionPanel } from "./ExpressionPanel";
import { PlaneView } from "./PlaneView";
import { FloatingControlButton, FloatingControlDivider, FloatingControlDock } from "@/ui/floating-controls";
import { useRegisterShellActions, type ShellAction } from "@/app/ShellActions";
import { usePopoverDismiss } from "@/app/usePopover";
import { useMediaQuery } from "@/app/useMediaQuery";

import "mafs/core.css";

const DEFAULT_RECT: ViewRect = { xmin: -10, xmax: 10, ymin: -7, ymax: 7 };

function zoomRect(r: ViewRect, factor: number): ViewRect {
  const cx = (r.xmin + r.xmax) / 2;
  const cy = (r.ymin + r.ymax) / 2;
  const hw = ((r.xmax - r.xmin) / 2) * factor;
  const hh = ((r.ymax - r.ymin) / 2) * factor;
  return { xmin: cx - hw, xmax: cx + hw, ymin: cy - hh, ymax: cy + hh };
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
  const saveAs = useSandbox((s) => s.saveAs);
  const saveView = useSandbox((s) => s.saveView);
  const applyView = useSandbox((s) => s.applyView);
  const removeView = useSandbox((s) => s.removeView);
  const undo = useSandbox((s) => s.undo);
  const redo = useSandbox((s) => s.redo);
  const canUndo = useSandbox((s) => s.history.length > 0);
  const canRedo = useSandbox((s) => s.future.length > 0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [viewsOpen, setViewsOpen] = useState(false);
  const viewsContainerRef = useRef<HTMLDivElement>(null);
  const viewsTriggerRef = useRef<HTMLButtonElement>(null);
  const viewsPanelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mobile = useMediaQuery("(max-width: 820px)");
  const closeViews = useCallback(() => setViewsOpen(false), []);
  const workspaceSaved = isUserWorkspaceId(ws.id);
  const shellActions = useMemo<readonly ShellAction[]>(
    () => [
      {
        id: "save-workspace",
        label: workspaceSaved ? "Saved" : "Save",
        icon: workspaceSaved ? Check : Save,
        onSelect: () => {
          if (!workspaceSaved) saveAs(ws.title);
        },
        disabled: workspaceSaved,
        status: workspaceSaved,
      },
    ],
    [saveAs, workspaceSaved, ws.title],
  );
  useRegisterShellActions("sandbox", shellActions);
  usePopoverDismiss({
    open: viewsOpen,
    onClose: closeViews,
    containerRef: viewsContainerRef,
    triggerRef: viewsTriggerRef,
  });

  useEffect(() => {
    if (!viewsOpen) return;
    const frame = requestAnimationFrame(() => viewsPanelRef.current?.querySelector<HTMLElement>("button")?.focus());
    return () => cancelAnimationFrame(frame);
  }, [viewsOpen]);

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
        <div className="shell-canvas-stage">
          <PlaneView rows={ws.rows} compiled={compiled} viewport={ws.viewport} marks={ws.marks} onMovePoint={setPoint} />
        </div>

        {/* Canvas dock + its single attached saved-views popover. */}
        <div
          ref={viewsContainerRef}
          className="pointer-events-none absolute right-[var(--shell-edge)] bottom-[var(--shell-content-bottom)] z-(--z-shell-raised) flex items-end gap-[var(--shell-panel-gap)]"
        >
          <AnimatePresence initial={false}>
            {viewsOpen && (
              <motion.div
                ref={viewsPanelRef}
                id="sandbox-saved-views"
                role="dialog"
                aria-label="Saved views"
                className="pointer-events-auto origin-bottom-right max-[820px]:fixed max-[820px]:right-[var(--shell-edge)] max-[820px]:bottom-[calc(var(--shell-content-bottom)+56px)] max-[820px]:left-[var(--shell-edge)]"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 8, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6, y: 6, scale: 0.97 }}
                transition={reduceMotion ? { duration: 0.1 } : spring.smooth}
              >
                <Surface
                  material="thick"
                  className="max-h-[min(70dvh,520px)] w-[280px] overflow-y-auto rounded-xl p-2 max-[820px]:w-full"
                >
                  <div className="flex items-center justify-between gap-3 px-2 py-1">
                    <div>
                      <h2 className="text-subhead font-semibold text-foreground">Saved views</h2>
                      <p className="text-caption text-muted-foreground">Return to useful regions of this plane.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 rounded-full text-muted-foreground"
                      onClick={() => {
                        closeViews();
                        requestAnimationFrame(() => viewsTriggerRef.current?.focus());
                      }}
                      aria-label="Close saved views"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  {ws.views.length > 0 ? (
                    <div className="mt-1 space-y-0.5" role="list" aria-label="Saved plane views">
                      {ws.views.map((view) => (
                        <div
                          key={view.id}
                          role="listitem"
                          className="group flex min-h-10 items-center rounded-md transition-colors hover:bg-accent"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              applyView(view.id);
                              closeViews();
                              requestAnimationFrame(() => viewsTriggerRef.current?.focus());
                            }}
                            className="min-w-0 flex-1 px-2.5 py-2 text-left text-footnote font-medium text-foreground"
                          >
                            <span className="block truncate">{view.name}</span>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeView(view.id)}
                            className="mr-1 size-8 shrink-0 rounded-full text-muted-foreground"
                            aria-label={`Remove ${view.name}`}
                            title="Remove saved view"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mx-2 my-3 rounded-md bg-foreground/[0.04] px-3 py-3 text-caption text-muted-foreground">
                      No saved views yet. Save the current viewport to return to it later.
                    </p>
                  )}

                  <Button
                    variant="ghost"
                    className="mt-1 h-10 w-full justify-start gap-2 rounded-md px-2.5 text-footnote font-medium text-primary-text"
                    onClick={() => saveView(`View ${ws.views.length + 1}`)}
                  >
                    <Bookmark className="size-4" />
                    Save current view
                  </Button>
                </Surface>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-auto inline-flex w-12 flex-col items-center">
            <FloatingControlDock aria-label="Canvas controls">
              <FloatingControlButton aria-label="Zoom in" title="Zoom in" onClick={() => setViewport(zoomRect(ws.viewport, 1 / 1.3))}>
                <Plus className="size-[17px]" />
              </FloatingControlButton>
              <button
                type="button"
                className="min-h-6 w-10 rounded-full px-0.5 font-mono text-[10px] font-medium tabular-nums text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55"
                aria-label="Reset zoom to 100 percent"
                title="Reset zoom to 100%"
                onClick={() => setViewport({ ...DEFAULT_RECT })}
              >
                {Math.round((20 / (ws.viewport.xmax - ws.viewport.xmin)) * 100)}%
              </button>
              <FloatingControlButton aria-label="Zoom out" title="Zoom out" onClick={() => setViewport(zoomRect(ws.viewport, 1.3))}>
                <Minus className="size-[17px]" />
              </FloatingControlButton>
              <FloatingControlDivider />
              <FloatingControlButton aria-label="Fit default view" title="Fit default view" onClick={() => setViewport({ ...DEFAULT_RECT })}>
                <Focus className="size-[17px]" />
              </FloatingControlButton>
              <FloatingControlDivider />
              <FloatingControlButton
                ref={viewsTriggerRef}
                active={viewsOpen}
                aria-label="Saved views"
                title="Saved views"
                aria-expanded={viewsOpen}
                aria-haspopup="dialog"
                aria-controls="sandbox-saved-views"
                onClick={() => setViewsOpen((value) => !value)}
              >
                <Bookmark className="size-[17px]" />
              </FloatingControlButton>
            </FloatingControlDock>
          </div>
        </div>
      </main>

      {/* Floating expression panel */}
      <AnimatePresence initial={false}>
        {panelOpen ? (
          <motion.aside
            key="expressions"
            data-shell-context-panel=""
            className="shell-sandbox-panel"
            initial={reduceMotion ? false : mobile ? { opacity: 0, y: 28 } : { opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : mobile ? { opacity: 0, y: 28 } : { opacity: 0, x: -14 }}
            transition={reduceMotion ? { duration: 0 } : spring.smooth}
          >
            <Surface material="regular" className="flex h-full flex-col overflow-hidden rounded-[inherit]">
              <div className="flex items-center gap-1 border-b border-border/60 px-2 py-2">
                <WorkspaceMenu />
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-muted-foreground"
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
                    className="size-8 rounded-full text-muted-foreground"
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
                    className="size-8 rounded-full text-muted-foreground"
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
          </motion.aside>
        ) : (
          <motion.div
            key="expression-reveal"
            className="pointer-events-auto absolute left-[var(--shell-edge)] top-[var(--shell-dock-top)] z-(--z-shell) origin-top-left"
            initial={reduceMotion ? false : { opacity: 0, x: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: 0.96 }}
            transition={reduceMotion ? { duration: 0 } : spring.snappy}
          >
            <FloatingControlDock aria-label="Expression controls">
              <FloatingControlButton
                aria-label="Show expressions"
                title="Show expressions"
                onClick={() => setPanelOpen(true)}
              >
                <PanelLeftOpen className="size-[17px]" />
              </FloatingControlButton>
            </FloatingControlDock>
          </motion.div>
        )}
      </AnimatePresence>
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const issueCount = compiled.computed.filter((c) => c?.error || c?.kind === "invalid").length;
  const savedIds = Object.keys(saved);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    setSaving(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  usePopoverDismiss({ open, onClose: close, containerRef: ref, triggerRef });

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("button, input")?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const commitSave = () => {
    saveAs(saveName.trim() || ws.title);
    close(true);
  };

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-footnote text-muted-foreground transition hover:bg-accent hover:text-foreground [&_svg]:text-muted-foreground/70";

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(true) : setOpen(true))}
        className="flex w-full min-w-0 items-center gap-2.5 rounded-sm px-1.5 py-1 text-left text-foreground transition hover:bg-foreground/[0.06] aria-expanded:bg-primary/10 aria-expanded:shadow-[inset_0_0_0_1px_var(--primary)] [&_svg]:text-muted-foreground aria-expanded:[&_svg]:text-primary-text"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="sandbox-workspace-menu"
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
          ref={panelRef}
          id="sandbox-workspace-menu"
          material="thick"
          role="dialog"
          aria-label="Choose workspace"
          className="shell-popover-present absolute left-0 top-[52px] z-(--z-popover) max-h-[min(58dvh,460px)] w-[280px] overflow-y-auto rounded-xl p-1.5"
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
                        close(true);
                      }}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-footnote text-muted-foreground transition hover:text-foreground [&_svg]:text-muted-foreground/70",
                        active && "text-primary-text hover:text-primary-text [&_svg]:text-primary-text",
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
                      className="mr-1 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
                    >
                      <X className="size-3.5" />
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
                  close(true);
                }}
                className={cn(
                  itemClass,
                  active &&
                    "bg-primary/10 text-primary-text shadow-[inset_0_0_0_1px_var(--primary)] [&_svg]:text-primary-text hover:bg-primary/10 hover:text-primary-text",
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
              close(true);
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
