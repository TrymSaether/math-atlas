import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Filter, Search, Network, Layers, Command,
  GitBranchPlus, GitMerge, Sparkles, Eye, EyeOff, Type, Text,
} from "lucide-react";
import { useStore } from "../store";
import { cn } from "../lib/utils";
import { getNodeKindRgbString } from "../lib/colors";
import { KIND_LABEL, RELATION_COLOR, RELATION_LABEL, type NodeKind } from "../types";

export function Sidebar({ visibleCount }: { visibleCount: number }) {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const searchScope = useStore((s) => s.searchScope);
  const setSearchScope = useStore((s) => s.setSearchScope);
  const kinds = useStore((s) => s.kinds);
  const toggleKind = useStore((s) => s.toggleKind);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);
  const relations = useStore((s) => s.relations);
  const toggleRelation = useStore((s) => s.toggleRelation);
  const highlight = useStore((s) => s.highlight);
  const setHighlight = useStore((s) => s.setHighlight);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const showOrphans = useStore((s) => s.showOrphans);
  const setShowOrphans = useStore((s) => s.setShowOrphans);

  const { domains, domainCounts, counts } = useMemo(() => {
    if (!map) return { domains: [], domainCounts: {}, counts: {} };

    const tc: Record<string, number> = {};
    const kc: Record<string, number> = {};
    for (const n of map.data.nodes) {
      tc[n.domainId] = (tc[n.domainId] ?? 0) + 1;
      kc[n.kind] = (kc[n.kind] ?? 0) + 1;
    }
    return {
      domains: map.data.domains.filter((domain) => (tc[domain.id] ?? 0) > 0),
      domainCounts: tc,
      counts: kc,
    };
  }, [map]);

  if (!map) {
    return (
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="glass scanlines relative flex max-h-[38dvh] w-full shrink-0 flex-col justify-center overflow-hidden rounded-xl p-4 text-sm text-white/45 md:h-full md:max-h-none md:w-[280px] md:rounded-2xl"
      >
        Loading filters...
      </motion.aside>
    );
  }

  const { data } = map;

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="glass scanlines relative flex max-h-[38dvh] w-full shrink-0 flex-col overflow-hidden rounded-xl md:h-full md:max-h-none md:w-[280px] md:rounded-2xl"
    >
      <div className="border-b border-white/10 p-3 md:p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-7 w-7 rounded-full border border-accent-cyan/60 bg-accent-cyan/10 shadow-glow-cyan" />
            <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-accent-cyan animate-ring" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold tracking-wide title-gradient">
              {data.field || "math"}
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              concepts · dependencies
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 md:p-4 md:space-y-5">
        {/* Search */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest text-white/40">Search</label>
            <div className="flex items-center gap-0.5 rounded-md border border-white/10 bg-black/30 p-0.5">
              <ScopeBtn active={searchScope === "all"} onClick={() => setSearchScope("all")} icon={<Text className="h-3 w-3" />} label="All" />
              <ScopeBtn active={searchScope === "title"} onClick={() => setSearchScope("title")} icon={<Type className="h-3 w-3" />} label="Title" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchScope === "title" ? "title or number…" : "text · number · tag"}
              className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-8 pr-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-accent-cyan/60 focus:shadow-glow-cyan"
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-white/40">
            <span><span className="text-accent-cyan">{visibleCount}</span> / {data.nodes.length} visible</span>
            <span>{search ? `“${search}”` : "no query"}</span>
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/60 hover:bg-white/10"
          >
            <span className="flex items-center gap-1.5"><Command className="h-3 w-3" />Command Palette</span>
            <kbd className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
        </div>

        {/* View toggle */}
        <Section title="View" icon={<Eye className="h-3 w-3" />}>
          <div className="grid grid-cols-2 gap-1.5">
            <Pill active={view === "dependency"} onClick={() => setView("dependency")}>
              <Network className="h-3 w-3" /> Dependency
            </Pill>
            <Pill active={view === "cluster"} onClick={() => setView("cluster")}>
              <Layers className="h-3 w-3" /> Cluster
            </Pill>
          </div>
          {view === "dependency" && (
            <button
              onClick={() => setShowOrphans(!showOrphans)}
              className={cn(
                "mt-1.5 flex w-full items-center justify-between rounded-md border px-2 py-1 text-[11px]",
                showOrphans
                  ? "border-white/15 bg-white/5 text-white/80"
                  : "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
              )}
            >
              <span className="flex items-center gap-1.5">
                {showOrphans ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {showOrphans ? "Show all items" : "Hide unlinked items"}
              </span>
              <span className="text-white/40 text-[10px]">{showOrphans ? "ON" : "OFF"}</span>
            </button>
          )}
        </Section>

        {/* Highlight mode */}
        <Section title="Highlight" icon={<Sparkles className="h-3 w-3" />}>
          <div className="grid grid-cols-2 gap-1.5">
            <Pill active={highlight === "immediate"} onClick={() => setHighlight("immediate")}>
              <GitBranchPlus className="h-3 w-3" /> Immediate
            </Pill>
            <Pill active={highlight === "full"} onClick={() => setHighlight("full")}>
              <GitMerge className="h-3 w-3" /> Full Path
            </Pill>
          </div>
        </Section>

        {/* Kinds */}
        <Section title="Kind" icon={<Filter className="h-3 w-3" />}>
          <div className="flex flex-wrap gap-1.5">
            {map.kinds.filter((k) => (counts[k] ?? 0) > 0).map((k) => (
              <KindPill key={k} k={k} active={kinds.has(k)} count={counts[k] ?? 0} onClick={() => toggleKind(k)} />
            ))}
          </div>
        </Section>

        {/* Relations */}
        <Section title="Edge relation">
          <div className="grid grid-cols-2 gap-1.5 md:flex md:flex-col">
            {map.relations.map((r) => (
              <label key={r} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={relations.has(r)}
                  onChange={() => toggleRelation(r)}
                  className="accent-accent-cyan"
                />
                <span className="h-2 w-6 rounded" style={{ background: RELATION_COLOR[r] }} />
                <span className="truncate text-xs text-white/80">{RELATION_LABEL[r]}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Theme */}
        <Section
          title="Domain"
          icon={<Layers className="h-3 w-3" />}
          aside={
            topics.size > 0 ? (
              <button onClick={resetTopics} className="text-[10px] text-accent-cyan hover:underline">All</button>
            ) : null
          }
        >
          <div className="flex flex-col gap-1">
            {domains.map((domain) => {
              const active = topics.size === 0 || topics.has(domain.id);
              const muted = topics.size > 0 && !topics.has(domain.id);
              return (
                <button
                  key={domain.id}
                  onClick={() => toggleTopic(domain.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-2 py-1 text-[12px] transition-colors",
                    muted
                      ? "border-white/5 bg-white/[0.01] text-white/30 hover:text-white/60"
                      : active
                        ? "border-accent-cyan/40 bg-accent-cyan/8 text-white/90 shadow-glow-cyan"
                        : "border-white/10 bg-white/[0.02] text-white/55 hover:bg-white/5"
                  )}
                >
                  <span className="truncate text-left">{domain.label}</span>
                  <span className="ml-2 shrink-0 text-[10px] text-white/40">{domainCounts[domain.id]}</span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      <div className="border-t border-white/10 p-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          {data.nodes.length} concepts · {data.edges.length} links
        </span>
        <span className="text-[10px] text-white/30">{domains.length} domains</span>
      </div>
    </motion.aside>
  );
}

function Section({ title, icon, aside, children }: { title: string; icon?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40">
          {icon}{title}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

function ScopeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={`Search ${label}`}
      className={cn(
        "flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
        active ? "bg-accent-cyan/15 text-accent-cyan" : "text-white/40 hover:text-white/80"
      )}
    >
      {icon}{label}
    </button>
  );
}

function Pill({ active, onClick, children, muted }: { active?: boolean; onClick?: () => void; children: React.ReactNode; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
        muted
          ? "border-white/5 bg-white/[0.01] text-white/30 hover:text-white/60"
          : active
            ? "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan shadow-glow-cyan"
            : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}

function KindPill({ k, active, count, onClick }: { k: NodeKind; active: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ "--c": getNodeKindRgbString(k) } as React.CSSProperties}
      className={cn(
        `kind-${k}`,
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
        active
          ? "border-[rgba(var(--c),0.5)] bg-[rgba(var(--c),0.12)] text-[rgba(var(--c),1)]"
          : "border-white/10 bg-white/[0.02] text-white/40 hover:bg-white/5"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),1)]" />
      {KIND_LABEL[k]}
      <span className="text-white/40">{count}</span>
    </button>
  );
}
