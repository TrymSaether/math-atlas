import { useState, type ReactNode } from "react";
import { SidebarSimpleIcon, MagnifyingGlassIcon, CaretDownIcon, SunIcon, MoonIcon } from "@phosphor-icons/react";
import { useStore } from "../../store";
import { schemeFor, siblingOf } from "../../lib/themes";
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

export function Sidebar() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const mapId = useStore((s) => s.mapId);
  const mapTitle = useStore((s) => s.catalog.find((e) => e.slug === mapId)?.title ?? mapId);
  const domains = useStore((s) => s.loadedMaps[s.mapId]?.data.domains ?? []);

  const [collapsed, setCollapsed] = useState(false);
  const [closedSecs, setClosedSecs] = useState<Set<string>>(() => new Set());
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
        <ShellIconButton aria-label="Show sidebar" title="Show sidebar" onClick={() => setCollapsed(false)}>
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
          <ShellIconButton aria-label="Hide sidebar" title="Hide sidebar" onClick={() => setCollapsed(true)}>
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
        </nav>
      </Glass>
    </aside>
  );
}
