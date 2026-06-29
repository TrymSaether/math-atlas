import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  SidebarSimpleIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  SunIcon,
  MoonIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import { useStore } from "../../store";
import { schemeFor, siblingOf } from "../../lib/themes";
import { getDomainTone } from "../../lib/colors";
import { getDomainGlyphId } from "../domainGlyphRegistry";
import { DomainGlyph } from "../DomainGlyph";
import { MathText } from "../../lib/katex";
import { cn } from "../../lib/utils";
import { Glass, ShellIconButton } from "../primitives";
import { LIBRARY_DESTINATIONS, TOOL_DESTINATIONS, type ShellDestination } from "./destinations";

/**
 * The Apple-Maps-style docked Liquid Glass sidebar — the shell's single
 * navigation+search surface. Per the HIG, Liquid Glass is the functional layer
 * floating above the content (the graph canvas stays plain). Surfaces, search,
 * and (later) the selected-concept detail all live here as one scroll, the way
 * Maps folds Pinned/Guides/Routes/Recents/place-cards into one sidebar.
 *
 * Token grounding lives in styles/apple-hig.css; layout in
 * styles/components/apple-sidebar.css.
 */

function DestinationList({ destinations }: { destinations: readonly ShellDestination[] }) {
  const surface = useStore((state) => state.surface);
  const mode = useStore((state) => state.mode);
  const setSurface = useStore((state) => state.setSurface);
  const setMode = useStore((state) => state.setMode);

  return (
    <ul className="apple-row-list">
      {destinations.map((destination) => {
        const Icon = destination.icon;
        const isActive = destination.isActive({ surface, mode });
        return (
          <li key={destination.id}>
            <button
              type="button"
              className={cn("apple-row", isActive && "is-active")}
              aria-current={isActive ? "page" : undefined}
              title={destination.description}
              onClick={() => destination.activate({ setSurface, setMode })}
            >
              <Icon className="apple-row-icon" weight={isActive ? "fill" : "regular"} />
              <span className="apple-row-label">{destination.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** A collapsible sidebar group with an Apple-style disclosure header. */
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
    <div className="apple-sec">
      <button type="button" className="apple-section" onClick={onToggle} aria-expanded={!collapsed}>
        <span className="apple-section-title">{title}</span>
        <CaretDownIcon className={cn("apple-section-caret", collapsed && "is-collapsed")} weight="bold" />
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
    <ShellIconButton
      className="apple-head-btn"
      aria-label={isDark ? "Switch to light appearance" : "Switch to dark appearance"}
      title={isDark ? "Light" : "Dark"}
      onClick={() => setTheme(siblingOf(theme))}
    >
      {isDark ? (
        <SunIcon className="shell-icon" weight="regular" />
      ) : (
        <MoonIcon className="shell-icon" weight="regular" />
      )}
    </ShellIconButton>
  );
}

/** A domain-toned circular glyph badge for a concept (Maps place-pin idiom). */
function ConceptGlyph({ mapId, domainId }: { mapId: string; domainId: string }) {
  const tone = getDomainTone(domainId);
  const glyphId = getDomainGlyphId({ mapId, domainId });
  return (
    <span className="apple-glyph" style={{ "--apple-glyph-tone": tone.color } as CSSProperties}>
      {glyphId ? <DomainGlyph id={glyphId} size={16} /> : <MapPinIcon weight="fill" />}
    </span>
  );
}

/** Recents — two-line place cells over the active map's selection history. */
function RecentsSection() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const recents = useStore((s) => s.recents);
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
    <div className="apple-sec">
      <div className="apple-section">
        <span className="apple-section-title">Recents</span>
        <button type="button" className="apple-section-action" onClick={clearRecents}>
          Clear
        </button>
      </div>
      <ul className="apple-cell-list">
        {items.map((node) => (
          <li key={node.id}>
            <button type="button" className="apple-cell" onClick={() => select(node.id)} title={node.label}>
              <ConceptGlyph mapId={mapId} domainId={node.domain} />
              <span className="apple-cell-text">
                <span className="apple-cell-title">
                  <MathText text={node.label} />
                </span>
                <span className="apple-cell-sub">{map?.domainById.get(node.domain)?.label ?? node.topicCluster}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const mapId = useStore((s) => s.mapId);
  const mapTitle = useStore((s) => s.catalog.find((e) => e.slug === mapId)?.title ?? mapId);
  const domains = useStore((s) => s.loadedMaps[s.mapId]?.data.domains ?? []);

  const [collapsed, setCollapsed] = useState(false);
  const [closedSecs, setClosedSecs] = useState<Set<string>>(() => new Set());

  // Let the left-docked panels (concept card, paths, inspector) reflow to the
  // screen edge when the sidebar is hidden — see .shell-dock-left in shell.css.
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
      <div className="apple-sidebar-reveal">
        <ShellIconButton
          className="apple-head-btn"
          aria-label="Show sidebar"
          title="Show sidebar"
          onClick={() => setCollapsed(false)}
        >
          <SidebarSimpleIcon className="shell-icon" weight="regular" />
        </ShellIconButton>
      </div>
    );
  }

  return (
    <aside className="apple-sidebar-dock" aria-label="Atlas navigation">
      <Glass variant="regular" className="apple-sidebar">
        <header className="apple-sidebar-head">
          <ThemeToggle />
          <ShellIconButton
            className="apple-head-btn"
            aria-label="Hide sidebar"
            title="Hide sidebar"
            onClick={() => setCollapsed(true)}
          >
            <SidebarSimpleIcon className="shell-icon" weight="regular" />
          </ShellIconButton>
        </header>

        <div className="apple-sidebar-search">
          <button
            type="button"
            className="apple-search"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search concepts and theorems"
          >
            <MagnifyingGlassIcon className="apple-search-icon" weight="regular" />
            <span className="apple-search-label">Search concepts, theorems…</span>
            <kbd className="apple-search-kbd">⌘K</kbd>
          </button>
        </div>

        <nav className="apple-sidebar-scroll" aria-label="Library">
          <Section title="Library" collapsed={closedSecs.has("library")} onToggle={() => toggleSec("library")}>
            <DestinationList destinations={LIBRARY_DESTINATIONS} />
          </Section>

          <Section title="Tools" collapsed={closedSecs.has("tools")} onToggle={() => toggleSec("tools")}>
            <DestinationList destinations={TOOL_DESTINATIONS} />
          </Section>

          {domains.length > 0 && (
            <Section title={mapTitle} collapsed={closedSecs.has("domains")} onToggle={() => toggleSec("domains")}>
              <ul className="apple-row-list">
                {domains.map((d) => (
                  <li key={d.id}>
                    <button type="button" className="apple-row">
                      <span
                        className="apple-row-dot"
                        style={{ background: `var(--domain-${d.palette}, var(--sys-gray))` }}
                      />
                      <span className="apple-row-label">{d.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <RecentsSection />
        </nav>
      </Glass>
    </aside>
  );
}
