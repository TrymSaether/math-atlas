import { useState, type ReactNode } from "react";
import {
  SidebarSimpleIcon,
  MagnifyingGlassIcon,
  CompassIcon,
  PathIcon,
  BookOpenIcon,
  CardsIcon,
  FunctionIcon,
  CaretDownIcon,
  SunIcon,
  MoonIcon,
} from "@phosphor-icons/react";
import { useStore, type Surface, type AtlasMode } from "../../store";
import { schemeFor, siblingOf } from "../../lib/themes";
import { cn } from "../../lib/utils";
import { Glass, ShellIconButton } from "../primitives";

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

type Destination = {
  id: string;
  label: string;
  Icon: typeof CompassIcon;
  active: (s: { surface: Surface; mode: AtlasMode }) => boolean;
  go: (set: { setSurface: (s: Surface) => void; setMode: (m: AtlasMode) => void }) => void;
};

const LIBRARY: Destination[] = [
  {
    id: "atlas",
    label: "Atlas",
    Icon: CompassIcon,
    active: (s) => s.surface === "atlas" && s.mode === "explore",
    go: ({ setSurface, setMode }) => {
      setSurface("atlas");
      setMode("explore");
    },
  },
  {
    id: "paths",
    label: "Paths",
    Icon: PathIcon,
    active: (s) => s.surface === "atlas" && s.mode === "paths",
    go: ({ setSurface, setMode }) => {
      setSurface("atlas");
      setMode("paths");
    },
  },
  {
    id: "dictionary",
    label: "Index",
    Icon: BookOpenIcon,
    active: (s) => s.surface === "dictionary",
    go: ({ setSurface }) => setSurface("dictionary"),
  },
  {
    id: "flashcards",
    label: "Study",
    Icon: CardsIcon,
    active: (s) => s.surface === "flashcards",
    go: ({ setSurface }) => setSurface("flashcards"),
  },
  {
    id: "sandbox",
    label: "Sandbox",
    Icon: FunctionIcon,
    active: (s) => s.surface === "sandbox",
    go: ({ setSurface }) => setSurface("sandbox"),
  },
];

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
  const surface = useStore((s) => s.surface);
  const mode = useStore((s) => s.mode);
  const setSurface = useStore((s) => s.setSurface);
  const setMode = useStore((s) => s.setMode);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const mapId = useStore((s) => s.mapId);
  const mapTitle = useStore((s) => s.catalog.find((e) => e.slug === mapId)?.title ?? mapId);
  const domains = useStore((s) => s.loadedMaps[s.mapId]?.data.domains ?? []);

  const [collapsed, setCollapsed] = useState(false);
  const [closedSecs, setClosedSecs] = useState<Set<string>>(() => new Set());
  const toggleSec = (id: string) =>
    setClosedSecs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
      <Glass material="regular" className="apple-sidebar">
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
            <ul className="apple-row-list">
              {LIBRARY.map(({ id, label, Icon, active, go }) => {
                const isActive = active({ surface, mode });
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={cn("apple-row", isActive && "is-active")}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => go({ setSurface, setMode })}
                    >
                      <Icon className="apple-row-icon" weight={isActive ? "fill" : "regular"} />
                      <span className="apple-row-label">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
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
