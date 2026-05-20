import { ArrowLeft, Crosshair, Filter, Layers, GitBranch, X } from "lucide-react";
import { Panel } from "./ui";
import { cn } from "../lib/utils";
import { useStore, type LayoutMode } from "../store";
import { KIND_LABEL, RELATION_LABEL, type GraphData } from "../types";

const MODES: { id: LayoutMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "dependency", label: "Dependency", icon: GitBranch },
  { id: "cluster", label: "Cluster", icon: Filter },
];

function ModeToggle() {
  const layoutMode = useStore((s) => s.layoutMode);
  const setLayoutMode = useStore((s) => s.setLayoutMode);
  return (
    <div className="inline-flex items-center gap-0.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-0.5">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = layoutMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => setLayoutMode(mode.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12px] font-medium transition",
              active
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-[var(--shadow-1)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

function Chip({
  label,
  onRemove,
  tone = "default",
}: {
  label: string;
  onRemove: () => void;
  tone?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition",
        tone === "primary"
          ? "border-[rgba(var(--primary-rgb),0.32)] bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.14)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] hover:bg-[var(--surface-muted)]"
      )}
    >
      <span>{label}</span>
      <X className="h-3 w-3 opacity-70" />
    </button>
  );
}

export function FilterChipBar({ data }: { data: GraphData }) {
  const focusDomainId = useStore((s) => s.focusDomainId);
  const collapseToOverview = useStore((s) => s.collapseToOverview);
  const kinds = useStore((s) => s.kinds);
  const toggleKind = useStore((s) => s.toggleKind);
  const relations = useStore((s) => s.relations);
  const toggleRelation = useStore((s) => s.toggleRelation);
  const hiddenTopics = useStore((s) => s.hiddenTopics);
  const toggleTopicVisibility = useStore((s) => s.toggleTopicVisibility);
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const setRailSection = useStore((s) => s.setRailSection);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const focusDepth = useStore((s) => s.focusDepth);
  const setFocusDepth = useStore((s) => s.setFocusDepth);

  const focusDomain = focusDomainId ? data.domains.find((d) => d.id === focusDomainId) : null;
  const totalFilters = kinds.size + relations.size + hiddenTopics.size + (search ? 1 : 0);

  return (
    <Panel className="mb-3 flex h-12 w-full items-center gap-3 px-3">
      <ModeToggle />

      {focusDomain && (
        <>
          <span className="text-[var(--border)]" aria-hidden>·</span>
          <button
            type="button"
            onClick={collapseToOverview}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-soft)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to overview
          </button>
          <span
            className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
            style={{
              borderColor: focusDomain.border,
              background: focusDomain.tint,
              color: focusDomain.color,
            }}
          >
            {focusDomain.label}
          </span>
        </>
      )}

      <div className="ml-2 flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {search && <Chip label={`"${search}"`} onRemove={() => setSearch("")} tone="primary" />}
        {[...kinds].map((k) => (
          <Chip key={`kind-${k}`} label={KIND_LABEL[k]} onRemove={() => toggleKind(k)} />
        ))}
        {[...relations].map((r) => (
          <Chip key={`rel-${r}`} label={RELATION_LABEL[r]} onRemove={() => toggleRelation(r)} />
        ))}
        {[...hiddenTopics].map((t) => {
          const domain = data.domains.find((d) => d.id === t);
          return (
            <Chip
              key={`hide-${t}`}
              label={`Hide: ${domain?.label ?? t}`}
              onRemove={() => toggleTopicVisibility(t)}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleFocusMode}
          aria-pressed={focusMode}
          title="Focus mode dims everything except the selected concept's neighborhood."
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-[12px] font-medium transition",
            focusMode
              ? "border-[rgba(var(--primary-rgb),0.32)] bg-[var(--primary-soft)] text-[var(--primary)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] hover:bg-[var(--surface-muted)]"
          )}
        >
          <Crosshair className="h-3.5 w-3.5" />
          Focus
        </button>
        {focusMode && (
          <div className="inline-flex items-center gap-0.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-0.5">
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFocusDepth(d)}
                aria-pressed={focusDepth === d}
                aria-label={`Focus depth ${d}`}
                className={cn(
                  "h-6 w-6 rounded-[6px] text-[11px] font-semibold tabular-nums transition",
                  focusDepth === d
                    ? "bg-[var(--primary)] text-[var(--on-primary)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setRailSection("filter")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-[12px] font-medium transition",
            totalFilters > 0
              ? "border-[rgba(var(--primary-rgb),0.32)] bg-[var(--primary-soft)] text-[var(--primary)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] hover:bg-[var(--surface-muted)]"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {totalFilters > 0 && (
            <span className="rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-semibold tabular-nums text-[var(--on-primary)]">
              {totalFilters}
            </span>
          )}
        </button>
      </div>
    </Panel>
  );
}
