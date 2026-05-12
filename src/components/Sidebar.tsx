import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Filter, Search, Network, Layers, Command,
  GitBranchPlus, GitMerge, Eye, EyeOff, Type, Text,
} from "lucide-react";
import { useStore } from "../store";
import { data } from "../data";
import { cn } from "../lib/utils";
import { KIND_LABEL, type NodeKind, type Relation } from "../types";
import { getThemePalette } from "../themes";

const KINDS: NodeKind[] = ["definition", "theorem", "lemma", "example", "proposition", "corollary"];
const RELATIONS: Relation[] = ["statement", "proof", "illustration"];

export function Sidebar({ visibleCount }: { visibleCount: number }) {
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
  const themeId = useStore((s) => s.themeId);
  const colorMode = useStore((s) => s.colorMode);
  const palette = getThemePalette(themeId, colorMode);

  const { allTopics, topicCounts, counts } = useMemo(() => {
    const tc: Record<string, number> = {};
    const kc: Record<string, number> = {};
    const firstNum: Record<string, [string, number[]]> = {};
    for (const n of data.nodes) {
      tc[n.topicCluster] = (tc[n.topicCluster] ?? 0) + 1;
      kc[n.kind] = (kc[n.kind] ?? 0) + 1;
      const nums = n.number.split(".").map((p) => Number(p) || 0);
      const key: [string, number[]] = [n.chapter, nums];
      const cur = firstNum[n.topicCluster];
      if (!cur || cmpKey(key, cur) < 0) firstNum[n.topicCluster] = key;
    }
    const topicsOrdered = Object.keys(tc).sort((a, b) => cmpKey(firstNum[a], firstNum[b]));
    return { allTopics: topicsOrdered, topicCounts: tc, counts: kc };
  }, []);

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="glass relative flex h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl"
    >
      <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full border bg-transparent" style={{ borderColor: "var(--primary)" }} />
          <div>
            <div className="font-display text-sm font-semibold tracking-wide title-gradient">
              TOPOLOGY · ATLAS
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--muted)" }}>
              concepts · dependencies
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Search</label>
            <div className="flex items-center gap-0.5 rounded-md border p-0.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <ScopeBtn active={searchScope === "all"} onClick={() => setSearchScope("all")} icon={<Text className="h-3 w-3" />} label="All" />
              <ScopeBtn active={searchScope === "title"} onClick={() => setSearchScope("title")} icon={<Type className="h-3 w-3" />} label="Title" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: "var(--muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchScope === "title" ? "title or number…" : "text · number · tag"}
              className="w-full rounded-lg border py-2 pl-8 pr-2 text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px]" style={{ color: "var(--muted)" }}>
            <span><span style={{ color: "var(--primary)" }}>{visibleCount}</span> / {data.nodes.length} visible</span>
            <span>{search ? `“${search}”` : "no query"}</span>
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="mt-2 flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px]"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}
          >
            <span className="flex items-center gap-1.5"><Command className="h-3 w-3" />Command Palette</span>
            <kbd className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: "var(--surface-muted)", color: "var(--ink)" }}>⌘K</kbd>
          </button>
        </div>

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
              className="mt-1.5 flex w-full items-center justify-between rounded-md border px-2 py-1 text-[11px]"
              style={{ borderColor: showOrphans ? "var(--border)" : "var(--primary)", background: showOrphans ? "var(--surface)" : "var(--surface-muted)", color: showOrphans ? "var(--ink)" : "var(--primary)" }}
            >
              <span className="flex items-center gap-1.5">
                {showOrphans ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {showOrphans ? "Show all items" : "Hide unlinked items"}
              </span>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>{showOrphans ? "ON" : "OFF"}</span>
            </button>
          )}
        </Section>

        <Section title="Highlight" icon={<GitBranchPlus className="h-3 w-3" />}>
          <div className="grid grid-cols-2 gap-1.5">
            <Pill active={highlight === "immediate"} onClick={() => setHighlight("immediate")}>
              <GitBranchPlus className="h-3 w-3" /> Immediate
            </Pill>
            <Pill active={highlight === "full"} onClick={() => setHighlight("full")}>
              <GitMerge className="h-3 w-3" /> Full Path
            </Pill>
          </div>
        </Section>

        <Section title="Kind" icon={<Filter className="h-3 w-3" />}>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.filter((k) => (counts[k] ?? 0) > 0).map((k) => (
              <KindPill key={k} k={k} active={kinds.has(k)} count={counts[k] ?? 0} onClick={() => toggleKind(k)} />
            ))}
          </div>
        </Section>

        <Section title="Edge relation">
          <div className="flex flex-col gap-1.5">
            {RELATIONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5" style={{ color: "var(--ink)" }}>
                <input
                  type="checkbox"
                  checked={relations.has(r)}
                  onChange={() => toggleRelation(r)}
                />
                <span className="h-2 w-6 rounded" style={{ background: palette.routeColors[r] }} />
                <span className="text-xs capitalize">{r}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section
          title="Theme"
          icon={<Layers className="h-3 w-3" />}
          aside={topics.size > 0 ? <button onClick={resetTopics} className="text-[10px]" style={{ color: "var(--primary)" }}>All</button> : null}
        >
          <div className="flex flex-col gap-1">
            {allTopics.map((t) => {
              const active = topics.size === 0 || topics.has(t);
              const muted = topics.size > 0 && !topics.has(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTopic(t)}
                  className="flex w-full items-center justify-between rounded-md border px-2 py-1 text-[12px] transition-colors"
                  style={{
                    borderColor: active && !muted ? "var(--primary)" : "var(--border)",
                    background: active && !muted ? "var(--surface-muted)" : "var(--surface)",
                    color: muted ? "var(--muted)" : "var(--ink)",
                    opacity: muted ? 0.55 : 1,
                  }}
                >
                  <span className="truncate text-left">{t}</span>
                  <span className="ml-2 shrink-0 text-[10px]" style={{ color: "var(--muted)" }}>{topicCounts[t]}</span>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      <div className="border-t p-3 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          {data.nodes.length} concepts · {data.edges.length} links
        </span>
        <span className="text-[10px]" style={{ color: "var(--muted)" }}>{allTopics.length} themes</span>
      </div>
    </motion.aside>
  );
}

function Section({ title, icon, aside, children }: { title: string; icon?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
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
      className="flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
      style={{ background: active ? "var(--surface-muted)" : "transparent", color: active ? "var(--primary)" : "var(--muted)" }}
    >
      {icon}{label}
    </button>
  );
}

function Pill({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors"
      style={{ borderColor: active ? "var(--primary)" : "var(--border)", background: active ? "var(--surface-muted)" : "var(--surface)", color: active ? "var(--primary)" : "var(--muted)" }}
    >
      {children}
    </button>
  );
}

function cmpKey(a: [string, number[]], b: [string, number[]]): number {
  if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
  const len = Math.max(a[1].length, b[1].length);
  for (let i = 0; i < len; i++) {
    const x = a[1][i] ?? 0, y = b[1][i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function KindPill({ k, active, count, onClick }: { k: NodeKind; active: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(`kind-${k}`, "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors")}
      style={{ borderColor: active ? "rgba(var(--c),0.55)" : "var(--border)", background: active ? "rgba(var(--c),0.10)" : "var(--surface)", color: active ? "rgba(var(--c),1)" : "var(--muted)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--c),1)]" />
      {KIND_LABEL[k]}
      <span style={{ color: "var(--muted)" }}>{count}</span>
    </button>
  );
}
