import { Command, Search, Text, Type } from "lucide-react";
import { Button, Input, Section } from "../ui";
import { useStore } from "../../store";
import { cn } from "../../lib/utils";

export function SearchPanel({ visibleCount, totalCount }: { visibleCount: number; totalCount: number }) {
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const searchScope = useStore((s) => s.searchScope);
  const setSearchScope = useStore((s) => s.setSearchScope);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);

  return (
    <Section title="Search" aside={<ScopeToggle scope={searchScope} setScope={setSearchScope} />}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchScope === "title" ? "Search titles…" : "Search text, tags, formulas…"}
          className="pl-9"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span><span className="text-[var(--primary)]">{visibleCount}</span> / {totalCount} visible</span>
        <span>{search ? `“${search}”` : "no query"}</span>
      </div>
      <Button variant="quiet" size="sm" onClick={() => setPaletteOpen(true)} className="mt-3 w-full justify-between">
        <span className="flex items-center gap-1.5"><Command className="h-3.5 w-3.5" /> Command palette</span>
        <kbd className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">⌘K</kbd>
      </Button>
    </Section>
  );
}

function ScopeToggle({ scope, setScope }: { scope: "all" | "title"; setScope: (scope: "all" | "title") => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] p-0.5">
      <button onClick={() => setScope("all")} className={scopeButton(scope === "all")} title="Search all text"><Text className="h-3 w-3" /> All</button>
      <button onClick={() => setScope("title")} className={scopeButton(scope === "title")} title="Search titles"><Type className="h-3 w-3" /> Title</button>
    </div>
  );
}

function scopeButton(active: boolean) {
  return cn("flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium uppercase tracking-wider transition", active ? "bg-[rgba(var(--primary-rgb),0.12)] text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--text-soft)]");
}
