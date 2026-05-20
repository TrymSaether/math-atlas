import { Compass, HelpCircle, Settings } from "lucide-react";
import { Panel } from "./ui";
import { BrandMark } from "./topbar/BrandMark";
import { TopBarSearch } from "./topbar/TopBarSearch";
import { CurrentMapPill } from "./topbar/CurrentMapPill";
import { useStore } from "../store";
import { MAPS } from "../data";
import { cn } from "../lib/utils";

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-transparent text-[var(--text-soft)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
    >
      {children}
    </button>
  );
}

export function TopBar() {
  const appView = useStore((s) => s.appView);
  const goToAtlas = useStore((s) => s.goToAtlas);
  const mapId = useStore((s) => s.mapId);
  const inAtlas = appView === "atlas";

  return (
    <Panel as="header" className="mb-4 flex h-16 w-full items-center gap-4 px-4">
      <BrandMark />
      <button
        type="button"
        onClick={goToAtlas}
        aria-current={inAtlas ? "page" : undefined}
        className={cn(
          "ml-2 hidden items-center gap-2 rounded-[8px] px-3 py-2 text-[14px] transition lg:inline-flex",
          inAtlas
            ? "bg-[var(--surface-muted)] font-semibold text-[var(--text)]"
            : "font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-soft)]"
        )}
      >
        <Compass className="h-4 w-4" />
        Atlas
      </button>
      <TopBarSearch />
      <div className="ml-auto flex items-center gap-1.5">
        {!inAtlas && <CurrentMapPill label={MAPS[mapId].label} onClick={goToAtlas} />}
        <IconButton label="Help">
          <HelpCircle className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton label="Settings">
          <Settings className="h-[18px] w-[18px]" />
        </IconButton>
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--purple-200)] bg-[var(--purple-50)] text-[13px] font-semibold text-[var(--purple)]">
          MA
        </div>
      </div>
    </Panel>
  );
}
