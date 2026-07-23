import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, MapPin, Moon, PanelLeft, Sun } from "lucide-react";
import { useStore } from "./store";
import { schemeFor, siblingOf } from "./themes";
import { getDomainTone } from "@/atlas/colors";
import { getDomainGlyphId } from "@/atlas/domainGlyphs";
import { DomainGlyph } from "@/atlas/DomainGlyph";
import { MathText } from "@/math/MathText";
import { cn } from "@/ui/cn";
import { Button } from "@/ui/button";
import { Surface } from "@/design";

import { LIBRARY_DESTINATIONS, TOOL_DESTINATIONS, type ShellDestination } from "./destinations";

const sidebarRowInteraction =
  "outline-none transition-[background-color,color,box-shadow] duration-[var(--duration-fast)] hover:bg-accent active:bg-accent/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none";

/**
 * The docked liquid-glass sidebar — the shell's single navigation + search
 * surface. Built on the rebuilt design system: a `thin` glass Surface, shadcn
 * Button, lucide icons, and design tokens. Structural dock geometry still reads
 * the legacy shell metrics (--shell-edge / --hig-sidebar-w / --z-shell) until a
 * layout-token layer replaces them.
 */

function DestinationList({ destinations }: { destinations: readonly ShellDestination[] }) {
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const setSurface = useStore((s) => s.setSurface);
  const setMode = useStore((s) => s.setMode);

  return (
    <ul className="flex flex-col gap-0.5">
      {destinations.map((destination) => {
        const Icon = destination.icon;
        const isActive = destination.isActive({ surface, mode });
        return (
          <li key={destination.id}>
            <button
              type="button"
              aria-current={isActive ? "page" : undefined}
              title={destination.description}
              onClick={() => destination.activate({ setSurface, setMode })}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left",
                sidebarRowInteraction,
                isActive ? "bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20" : "text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4.75 shrink-0 transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className={cn("text-subhead", isActive && "font-medium")}>{destination.label}</span>
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
  return (
    <div className="mt-0.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="group flex w-full items-center gap-1.5 rounded-md px-2 pt-3.5 pb-1 text-left outline-none transition-[background-color,color,box-shadow] duration-[var(--duration-fast)] hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
      >
        <span className="text-footnote font-semibold tracking-wide text-muted-foreground transition-colors duration-[var(--duration-fast)] group-hover:text-foreground motion-reduce:transition-none">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "size-3 text-muted-foreground opacity-0 transition-[transform,opacity,color] duration-[var(--duration-fast)] group-hover:text-foreground group-hover:opacity-70 motion-reduce:transition-none",
            collapsed && "-rotate-90 opacity-70",
          )}
        />
      </button>
      {!collapsed && children}
    </div>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const isDark = schemeFor(theme) === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 rounded-full text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:outline-none"
      aria-label={isDark ? "Switch to light appearance" : "Switch to dark appearance"}
      title={isDark ? "Light" : "Dark"}
      onClick={() => setTheme(siblingOf(theme))}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

/** A domain-toned circular glyph badge for a concept (Maps place-pin idiom). */
function ConceptGlyph({ mapId, domainId }: { mapId: string; domainId: string }) {
  const tone = getDomainTone(domainId);
  const glyphId = getDomainGlyphId({ mapId, domainId });
  return (
    <span
      className="flex size-7.5 shrink-0 items-center justify-center rounded-full text-white"
      style={{ background: tone.color, boxShadow: "inset 0 0.5px 0 rgb(255 255 255 / 0.28)" }}
    >
      {glyphId ? <DomainGlyph id={glyphId} size={16} /> : <MapPin className="size-4" />}
    </span>
  );
}

/** Recents — two-line place cells over the active map's selection history. */
function RecentsSection() {
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
        <span className="text-footnote font-semibold tracking-wide text-muted-foreground">Recents</span>
        <button
          type="button"
          className="rounded-sm text-footnote font-medium text-primary outline-none transition-[color,box-shadow] duration-[var(--duration-fast)] hover:text-primary/80 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
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
              onClick={() => select(node.id)}
              title={node.label}
              aria-current={node.id === selectedId ? "true" : undefined}
              className={cn(
                "group flex min-h-13 w-full items-center gap-3 rounded-md px-2.5 py-1.75 text-left",
                sidebarRowInteraction,
                node.id === selectedId && "bg-primary/10 hover:bg-primary/15 active:bg-primary/20",
              )}
            >
              <ConceptGlyph mapId={mapId} domainId={node.domain} />
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span
                  className={cn(
                    "truncate text-subhead font-medium transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
                    node.id === selectedId ? "text-primary" : "text-foreground",
                  )}
                >
                  <MathText text={node.label} />
                </span>
                <span className="truncate text-caption text-muted-foreground">
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
  const mapId = useStore((s) => s.mapId);
  const mapTitle = useStore((s) => s.catalog.find((e) => e.slug === mapId)?.title ?? mapId);
  const domains = useStore((s) => s.loadedMaps[s.mapId]?.data.domains ?? []);

  const [collapsed, setCollapsed] = useState(false);
  const [closedSecs, setClosedSecs] = useState<Set<string>>(() => new Set());

  // Let the left-docked panels reflow to the screen edge when the sidebar is
  // hidden — see .shell-dock-left in shell.css.
  useEffect(() => {
    const root = document.documentElement;
    if (collapsed) root.dataset.sidebarCollapsed = "true";
    else delete root.dataset.sidebarCollapsed;
    return () => {
      delete root.dataset.sidebarCollapsed;
    };
  }, [collapsed]);

  const toggleSec = (id: string) =>
    setClosedSecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (collapsed) {
    return (
      <div className="absolute top-[var(--shell-edge)] left-[calc(50%_-_min(260px,calc((100vw_-_32px)/2))_-_48px)] z-(--z-shell-raised) max-[980px]:left-[calc(var(--hig-sidebar-w)+var(--shell-edge)*2-48px)]">
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
      </div>
    );
  }

  return (
    <aside
      className="absolute inset-(--shell-edge,12px) z-(--z-shell,30) w-(--hig-sidebar-w,290px)"
      aria-label="Atlas navigation"
    >
      <Surface material="thin" className="flex h-full flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-1 px-3 pt-2.5 pb-1">
          <ThemeToggle />
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

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pt-1 pb-2" aria-label="Library">
          <Section title="Library" collapsed={closedSecs.has("library")} onToggle={() => toggleSec("library")}>
            <DestinationList destinations={LIBRARY_DESTINATIONS} />
          </Section>

          <Section title="Tools" collapsed={closedSecs.has("tools")} onToggle={() => toggleSec("tools")}>
            <DestinationList destinations={TOOL_DESTINATIONS} />
          </Section>

          {domains.length > 0 && (
            <Section title={mapTitle} collapsed={closedSecs.has("domains")} onToggle={() => toggleSec("domains")}>
              <ul className="flex flex-col gap-0.5">
                {domains.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-foreground",
                        sidebarRowInteraction,
                      )}
                    >
                      <span
                        className="mx-1.25 size-2.75 shrink-0 rounded-full"
                        style={{ background: getDomainTone(d.id).color }}
                      />
                      <span className="text-subhead transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none">
                        {d.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <RecentsSection />
        </nav>
      </Surface>
    </aside>
  );
}
