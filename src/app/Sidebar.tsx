import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Circle, Compass, MapPin, PanelLeft, Route } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useStore } from "./store";
import { getDomainTone } from "@/atlas/colors";
import { getDomainGlyphId } from "@/atlas/domainGlyphs";
import { DomainGlyph } from "@/atlas/DomainGlyph";
import { MathText } from "@/math/MathText";
import { cn } from "@/ui/cn";
import { Button } from "@/ui/button";
import { spring, Surface } from "@/design";
import { useMediaQuery } from "./useMediaQuery";

const sidebarRowInteraction =
  "outline-none transition-[background-color,color,box-shadow] duration-[var(--duration-fast)] hover:bg-accent active:bg-accent/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none";

/**
 * The docked liquid-glass sidebar — the shell's single navigation + search
 * surface. Built on the shared shell geometry, a `thin` glass Surface, shadcn
 * Button, lucide icons, and the canonical interaction tokens.
 */

function AtlasModes({ onNavigate }: { onNavigate: () => void }) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const modes = [
    { id: "explore" as const, label: "Explore", description: "Browse the concept map", Icon: Compass },
    { id: "paths" as const, label: "Paths", description: "Plan a guided study route", Icon: Route },
  ];

  return (
    <ul className="flex flex-col gap-0.5">
      {modes.map(({ id, label, description, Icon }) => {
        const active = mode === id;
        return (
          <li key={id}>
            <button
              type="button"
              aria-current={active ? "page" : undefined}
              title={description}
              onClick={() => {
                setMode(id);
                onNavigate();
              }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left",
                sidebarRowInteraction,
                active ? "bg-primary/10 text-primary-text hover:bg-primary/15 active:bg-primary/20" : "text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4.75 shrink-0 transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
                  active ? "text-primary-text" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className={cn("text-footnote", active && "font-medium")}>{label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** A collapsible sidebar group with a disclosure header. */
function Section({
  title,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="mt-0.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="group flex w-full items-center gap-1.5 rounded-md px-2 pt-3.5 pb-1 text-left outline-none transition-[background-color,color,box-shadow] duration-[var(--duration-fast)] hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
      >
        <span className="text-caption font-semibold text-muted-foreground transition-colors duration-[var(--duration-fast)] group-hover:text-foreground motion-reduce:transition-none">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "size-3 text-muted-foreground opacity-0 transition-[transform,opacity,color] duration-[var(--duration-fast)] group-hover:text-foreground group-hover:opacity-70 motion-reduce:transition-none",
            collapsed && "-rotate-90 opacity-70",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : spring.smooth}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A domain-toned circular glyph badge for a concept (Maps place-pin idiom). */
function ConceptGlyph({ mapId, domainId }: { mapId: string; domainId: string }) {
  const tone = getDomainTone(domainId);
  const glyphId = getDomainGlyphId({ mapId, domainId });
  return (
    <span
      className="flex size-7.5 shrink-0 items-center justify-center rounded-full"
      style={{ color: tone.text, background: tone.tint, boxShadow: `inset 0 0 0 1px ${tone.border}` }}
    >
      {glyphId ? <DomainGlyph id={glyphId} size={16} /> : <MapPin className="size-4" />}
    </span>
  );
}

/** Recents — two-line place cells over the active map's selection history. */
function RecentsSection({ onNavigate }: { onNavigate: () => void }) {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const recents = useStore((s) => s.recents);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const clearRecents = useStore((s) => s.clearRecents);

  const items = useMemo(
    () =>
      recents
        .map((id) => map?.nodeById.get(id))
        .filter((n): n is NonNullable<typeof n> => Boolean(n))
        .slice(0, 8),
    [recents, map],
  );

  if (items.length === 0) return null;

  return (
    <div className="mt-0.5">
      <div className="flex items-center justify-between gap-2 px-2 pt-3.5 pb-1">
        <span className="text-caption font-semibold text-muted-foreground">Recents</span>
        <button
          type="button"
          className="rounded-sm text-caption font-medium text-primary-text outline-none transition-[color,box-shadow] duration-[var(--duration-fast)] hover:text-primary-text/80 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
          onClick={clearRecents}
        >
          Clear
        </button>
      </div>
      <ul className="[&>li+li>button]:border-t [&>li+li>button]:border-border">
        {items.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => {
                select(node.id);
                onNavigate();
              }}
              title={node.label}
              aria-current={node.id === selectedId ? "true" : undefined}
              className={cn(
                "group flex min-h-13 w-full items-center gap-3 rounded-sm px-2.5 py-1.75 text-left",
                sidebarRowInteraction,
                node.id === selectedId && "bg-primary/10 hover:bg-primary/15 active:bg-primary/20",
              )}
            >
              <ConceptGlyph mapId={mapId} domainId={node.domain} />
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span
                  className={cn(
                    "truncate text-footnote font-medium transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
                    node.id === selectedId ? "text-primary-text" : "text-foreground",
                  )}
                >
                  <MathText text={node.label} />
                </span>
                <span className="truncate text-caption-2 text-muted-foreground">
                  {map?.domainById.get(node.domain)?.label ?? node.topicCluster}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar() {
  const domains = useStore((s) => s.loadedMaps[s.mapId]?.data.domains ?? []);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);
  const reduceMotion = useReducedMotion();
  const mobile = useMediaQuery("(max-width: 820px)");

  const [collapsed, setCollapsed] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 820px)").matches,
  );
  const [closedSecs, setClosedSecs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setCollapsed(mobile);
  }, [mobile]);

  useEffect(() => {
    document.documentElement.classList.toggle("atlas-sidebar-open", mobile && !collapsed);
    return () => document.documentElement.classList.remove("atlas-sidebar-open");
  }, [collapsed, mobile]);

  const toggleSec = (id: string) =>
    setClosedSecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const dismissMobile = () => {
    if (mobile) setCollapsed(true);
  };

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {collapsed ? (
        <motion.div
          key="sidebar-reveal"
          className="shell-sidebar-reveal absolute z-(--z-shell-raised)"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9, x: -6 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, x: -6 }}
          transition={reduceMotion ? { duration: 0 } : spring.snappy}
        >
          <Surface material="thin" className="flex size-10 items-center justify-center rounded-full">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:outline-none"
              aria-label="Show sidebar"
              title="Show sidebar"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeft className="size-4" />
            </Button>
          </Surface>
        </motion.div>
      ) : (
        <motion.aside
          key="sidebar"
          data-shell-sidebar=""
          className="shell-atlas-sidebar absolute z-(--z-shell)"
          aria-label="Atlas navigation"
          initial={reduceMotion ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
          transition={reduceMotion ? { duration: 0 } : spring.smooth}
        >
          <Surface material="thin" className="flex h-full flex-col overflow-hidden">
            <header className="flex min-h-12 items-center gap-2 border-b border-border/60 px-3">
              <div className="min-w-0 flex-1 truncate text-headline font-semibold text-foreground">Atlas</div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:outline-none"
                aria-label="Hide sidebar"
                title="Hide sidebar"
                onClick={() => setCollapsed(true)}
              >
                <PanelLeft className="size-4" />
              </Button>
            </header>

            <nav className="min-h-0 flex-1 overflow-y-auto px-2 pt-1 pb-2" aria-label="Atlas">
              <Section title="View" collapsed={closedSecs.has("view")} onToggle={() => toggleSec("view")}>
                <AtlasModes onNavigate={dismissMobile} />
              </Section>

              {domains.length > 0 && (
                <Section title="Domains" collapsed={closedSecs.has("domains")} onToggle={() => toggleSec("domains")}>
                  <ul className="flex flex-col gap-0.5">
                    <li>
                      <button
                        type="button"
                        aria-pressed={topics.size === 0}
                        onClick={resetTopics}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left text-foreground",
                          sidebarRowInteraction,
                          topics.size === 0 &&
                            "bg-primary/10 text-primary-text hover:bg-primary/15 active:bg-primary/20",
                        )}
                      >
                        <Circle className="mx-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="text-footnote">All domains</span>
                      </button>
                    </li>
                    {domains.map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          aria-pressed={topics.has(d.id)}
                          onClick={() => toggleTopic(d.id)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left text-foreground",
                            sidebarRowInteraction,
                            topics.has(d.id) &&
                              "bg-primary/10 text-primary-text hover:bg-primary/15 active:bg-primary/20",
                          )}
                        >
                          <span
                            className="mx-1.25 size-2.75 shrink-0 rounded-full"
                            style={{ background: getDomainTone(d.id).color }}
                          />
                          <span className="text-footnote transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none">
                            {d.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <RecentsSection onNavigate={dismissMobile} />
            </nav>
          </Surface>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
