import { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  CompassIcon,
  BookOpenIcon,
  CardsIcon,
  FunctionIcon,
  SunIcon,
  MoonIcon,
  CaretDownIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { useStore, type Surface } from "../../store";
import { schemeFor, siblingOf } from "../../lib/themes";
import { authEnabled } from "../../lib/authClient";
import { cn } from "../../lib/utils";
import { Glass } from "./Glass";
import { UserMenu } from "../auth/UserMenu";

const BRAND_SRC = `${import.meta.env.BASE_URL}atlas-assets/logo-mark.svg`;

/** The single most-important affordance: a Maps-style search field → palette. */
function SearchField() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  return (
    <Glass material="regular" className="shell-search rounded-full">
      <button
        type="button"
        className="flex h-full w-full items-center gap-2 outline-none"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search concepts and theorems"
      >
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0" weight="bold" />
        <span className="min-w-0 flex-1 truncate text-left">Search concepts, theorems…</span>
        <kbd className="shell-search-kbd">⌘K</kbd>
      </button>
    </Glass>
  );
}

/** Brand mark + active-map dropdown (switches between catalog maps). */
function MapMenu() {
  const mapId = useStore((s) => s.mapId);
  const setMap = useStore((s) => s.setMap);
  const catalog = useStore((s) => s.catalog);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const title = catalog.find((e) => e.slug === mapId)?.title ?? mapId;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Glass material="regular" className="flex items-center rounded-full p-1">
        <span className="ml-1 flex h-8 w-8 items-center justify-center" aria-hidden>
          <img src={BRAND_SRC} alt="" className="h-7 w-7" />
        </span>
        <button
          type="button"
          className="shell-btn h-9 max-w-[42vw] gap-1.5 rounded-full px-2.5 sm:max-w-[260px]"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate font-semibold text-fg-1">{title}</span>
          <CaretDownIcon className="h-3.5 w-3.5 shrink-0 opacity-70" weight="bold" />
        </button>
      </Glass>
      {open && (
        <Glass
          material="thick"
          className="shell-panel absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] p-1.5"
          role="listbox"
        >
          {catalog.map((entry) => {
            const active = entry.slug === mapId;
            return (
              <button
                key={entry.slug}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-ui-sm",
                  active ? "text-fg-1" : "text-fg-2 hover:bg-surface-hover hover:text-fg-1",
                )}
                onClick={() => {
                  if (!active) setMap(entry.slug);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{entry.title}</span>
                {active && <CheckIcon className="h-4 w-4 shrink-0 text-accent" weight="bold" />}
              </button>
            );
          })}
          {catalog.length === 0 && <p className="px-2.5 py-3 text-ui-xs text-fg-3">Loading maps…</p>}
        </Glass>
      )}
    </div>
  );
}

const SURFACES: { id: Surface; label: string; Icon: typeof CompassIcon }[] = [
  { id: "atlas", label: "Atlas", Icon: CompassIcon },
  { id: "dictionary", label: "Index", Icon: BookOpenIcon },
  { id: "flashcards", label: "Study", Icon: CardsIcon },
  { id: "sandbox", label: "Sandbox", Icon: FunctionIcon },
];

/** Primary surface switch: Atlas (graph) / Index / Study / Sandbox. */
function SurfaceNav() {
  const surface = useStore((s) => s.surface);
  const setSurface = useStore((s) => s.setSurface);
  return (
    <Glass material="regular" className="shell-seg rounded-full" role="tablist" aria-label="View">
      {SURFACES.map(({ id, label, Icon }) => {
        const active = surface === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            title={label}
            className={cn("shell-seg-opt", active && "is-active")}
            onClick={() => setSurface(id)}
          >
            <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
            <span className="hidden lg:inline">{label}</span>
          </button>
        );
      })}
    </Glass>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const isDark = schemeFor(theme) === "dark";
  return (
    <Glass material="regular" className="rounded-full p-1">
      <button
        type="button"
        className="shell-btn shell-btn-icon rounded-full"
        onClick={() => setTheme(siblingOf(theme))}
        aria-label={isDark ? "Switch to light appearance" : "Switch to dark appearance"}
        title={isDark ? "Light" : "Dark"}
      >
        {isDark ? (
          <SunIcon className="h-[18px] w-[18px]" weight="regular" />
        ) : (
          <MoonIcon className="h-[18px] w-[18px]" weight="regular" />
        )}
      </button>
    </Glass>
  );
}

/**
 * The top Liquid Glass bar: the active-map menu and search field on the leading
 * side, the surface switch and appearance/account controls trailing. Floats
 * above the content layer; on narrow widths it wraps gracefully.
 */
export function TopChrome() {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-start gap-2 px-3 py-3 sm:gap-3 sm:px-4">
      <MapMenu />
      <div className="mx-auto hidden min-w-0 max-w-[420px] flex-1 sm:block">
        <SearchField />
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <SurfaceNav />
        <ThemeToggle />
        {authEnabled && (
          <Glass material="regular" className="flex items-center rounded-full p-1">
            <UserMenu />
          </Glass>
        )}
      </div>
    </div>
  );
}
