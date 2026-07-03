import { type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";
import { useStore } from "./store";
import { getDomainTone } from "@/atlas/colors";
import { KIND_LABEL, type NodeKind } from "@/maps/types";
import { cn } from "@/shared/cn";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";
import { Surface } from "@/design";

/** A filter pill with an active (brand-tinted) state and an optional tone dot. */
function Chip({
  active,
  onClick,
  dotColor,
  style,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dotColor?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-footnote transition-colors",
        active
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-transparent bg-muted text-foreground hover:bg-accent",
      )}
    >
      {dotColor && <span className="size-2 shrink-0 rounded-full" style={{ background: dotColor }} />}
      {children}
    </button>
  );
}

/** A labelled row with a trailing shadcn Switch. */
function SwitchRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-subhead text-foreground">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={() => onToggle()} />
    </label>
  );
}

/** A full-width segmented control built on shadcn ToggleGroup. */
function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { id: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v)}
        className="w-full gap-0.5 rounded-lg bg-muted p-0.5"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.id}
            value={option.id}
            className="flex-1 rounded-md text-footnote data-[state=on]:bg-card data-[state=on]:shadow-sm"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/**
 * Filters & display — the control popover anchored to the control cluster.
 * Hierarchy leads with what a learner narrows by (domains, then concept kinds);
 * layout/overlay preferences sit below in a secondary "Display" group.
 */
export function LayersPanel({ onClose }: { onClose: () => void }) {
  const map = useStore((s) => s.loadedMaps[s.mapId]);
  const topics = useStore((s) => s.topics);
  const toggleTopic = useStore((s) => s.toggleTopic);
  const resetTopics = useStore((s) => s.resetTopics);
  const kinds = useStore((s) => s.kinds);
  const toggleKind = useStore((s) => s.toggleKind);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const showRegions = useStore((s) => s.showRegions);
  const toggleRegions = useStore((s) => s.toggleRegions);
  const showSoftDeps = useStore((s) => s.showSoftDeps);
  const toggleSoftDeps = useStore((s) => s.toggleSoftDeps);
  const showGrid = useStore((s) => s.showGrid);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const showMinimap = useStore((s) => s.showMinimap);
  const toggleMinimap = useStore((s) => s.toggleMinimap);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocusMode = useStore((s) => s.toggleFocusMode);
  const focusDepth = useStore((s) => s.focusDepth);
  const setFocusDepth = useStore((s) => s.setFocusDepth);

  if (!map) return null;

  return (
    <Surface
      material="regular"
      role="dialog"
      aria-label="Filters and display"
      className="flex max-h-[min(78vh,580px)] w-[300px] flex-col"
    >
      <header className="flex items-center justify-between px-3.5 pt-3 pb-1.5">
        <span className="text-headline font-semibold text-foreground">Filters</span>
        <Button
          autoFocus
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X className="size-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3.5 pt-1 pb-3.5">
        {/* Content filters first — the load-bearing controls. */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">Domains</span>
            <button
              type="button"
              className="text-footnote font-medium text-primary hover:underline"
              onClick={resetTopics}
            >
              All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {map.data.domains.map((domain) => {
              const dimmed = topics.size > 0 && !topics.has(domain.id);
              return (
                <Chip
                  key={domain.id}
                  active={topics.has(domain.id)}
                  onClick={() => toggleTopic(domain.id)}
                  dotColor={getDomainTone(domain.id).color}
                  style={{ opacity: dimmed ? 0.55 : 1 }}
                >
                  <span className="max-w-35 truncate">{domain.label}</span>
                </Chip>
              );
            })}
          </div>
        </section>

        <section>
          <span className="mb-2 block text-caption font-semibold tracking-wide text-muted-foreground uppercase">
            Concept kinds
          </span>
          <div className="flex flex-wrap gap-1.5">
            {map.kinds.map((kind) => (
              <Chip key={kind} active={kinds.has(kind as NodeKind)} onClick={() => toggleKind(kind as NodeKind)}>
                {KIND_LABEL[kind as NodeKind] ?? kind}
              </Chip>
            ))}
          </div>
        </section>

        {/* Secondary: how the map is drawn. */}
        <section className="space-y-2.5">
          <span className="block text-caption font-semibold tracking-wide text-muted-foreground uppercase">
            Display
          </span>
          <Segmented
            label="Layout"
            value={view}
            onChange={(v) => setView(v as typeof view)}
            options={[
              { id: "dependency", label: "Dependency" },
              { id: "cluster", label: "Cluster" },
            ]}
          />
          <div className="rounded-lg bg-muted/60 px-3 py-0.5">
            <SwitchRow label="Domain regions" checked={showRegions} onToggle={toggleRegions} />
            <SwitchRow label="Soft links" checked={showSoftDeps} onToggle={toggleSoftDeps} />
            <SwitchRow label="Grid" checked={showGrid} onToggle={toggleGrid} />
            <SwitchRow label="Minimap" checked={showMinimap} onToggle={toggleMinimap} />
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="rounded-lg bg-muted/60 px-3 py-0.5">
            <SwitchRow label="Focus neighborhood" checked={focusMode} onToggle={toggleFocusMode} />
          </div>
          {focusMode && (
            <Segmented
              label="Focus depth"
              value={String(focusDepth)}
              onChange={(v) => setFocusDepth(Number(v))}
              options={[
                { id: "1", label: "1 hop" },
                { id: "2", label: "2 hops" },
                { id: "3", label: "3 hops" },
              ]}
            />
          )}
        </section>
      </div>
    </Surface>
  );
}
