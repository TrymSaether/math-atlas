import { XIcon } from "@phosphor-icons/react";
import { useStore } from "../../store";
import { getDomainTone } from "../../lib/colors";
import { KIND_LABEL, type NodeKind } from "../../types";
import { Glass } from "./Glass";
import { ShellButton, ShellChip, ShellIconButton, ShellPanelHeader, ShellSegmented, ShellSwitch } from "./Controls";
import { useEffect, useRef } from "react";

/**
 * Filters & display — the Liquid Glass control popover anchored to the control
 * cluster. Information hierarchy leads with what a learner actually narrows by
 * (domains, then concept kinds); the layout/overlay preferences sit below in a
 * clearly secondary "Display" group.
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
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    initialFocusRef.current?.focus();
  }, []);

  if (!map) return null;

  return (
    <Glass
      material="thick"
      className="shell-panel flex max-h-[min(78vh,580px)] w-75 flex-col"
      role="dialog"
      aria-label="Filters and display"
    >
      <ShellPanelHeader title="Filters">
        <ShellIconButton ref={initialFocusRef} onClick={onClose} aria-label="Close filters">
          <XIcon className="shell-icon" weight="regular" />
        </ShellIconButton>
      </ShellPanelHeader>

      <div className="panel-scrollbar min-h-0 flex-1 overflow-y-auto px-3.5 pb-3.5">
        {/* Content filters first — the load-bearing controls. */}
        <section className="shell-panel-section">
          <div className="mb-2 flex items-center justify-between">
            <span className="shell-panel-title">Domains</span>
            <ShellButton shape="pill" className="shell-panel-action" onClick={resetTopics}>
              All
            </ShellButton>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {map.data.domains.map((domain) => {
              const dimmed = topics.size > 0 && !topics.has(domain.id);
              return (
                <ShellChip
                  key={domain.id}
                  active={topics.has(domain.id)}
                  onClick={() => toggleTopic(domain.id)}
                  dotColor={getDomainTone(domain.id).color}
                  style={{ opacity: dimmed ? 0.55 : 1 }}
                >
                  <span className="max-w-35 truncate">{domain.label}</span>
                </ShellChip>
              );
            })}
          </div>
        </section>

        <section className="shell-panel-section">
          <span className="shell-panel-title">Concept kinds</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {map.kinds.map((kind) => (
              <ShellChip key={kind} active={kinds.has(kind as NodeKind)} onClick={() => toggleKind(kind as NodeKind)}>
                {KIND_LABEL[kind as NodeKind] ?? kind}
              </ShellChip>
            ))}
          </div>
        </section>

        {/* Secondary: how the map is drawn. */}
        <section className="shell-panel-section space-y-2.5">
          <span className="shell-panel-title">Display</span>
          <ShellSegmented
            label="Layout"
            value={view}
            onChange={setView}
            className="w-full"
            selectionRole="button"
            options={[
              { id: "dependency", label: "Dependency" },
              { id: "cluster", label: "Cluster" },
            ]}
          />
          <div className="glass-group">
            <ShellSwitch label="Domain regions" on={showRegions} onToggle={toggleRegions} />
            <ShellSwitch label="Soft links" on={showSoftDeps} onToggle={toggleSoftDeps} />
            <ShellSwitch label="Grid" on={showGrid} onToggle={toggleGrid} />
            <ShellSwitch label="Minimap" on={showMinimap} onToggle={toggleMinimap} />
          </div>
        </section>

        <section className="shell-panel-section space-y-2.5">
          <div className="glass-group">
            <ShellSwitch label="Focus neighborhood" on={focusMode} onToggle={toggleFocusMode} />
          </div>
          {focusMode && (
            <ShellSegmented
              label="Focus depth"
              value={String(focusDepth)}
              onChange={(d) => setFocusDepth(Number(d))}
              className="w-full"
              selectionRole="button"
              options={[
                { id: "1", label: "1 hop" },
                { id: "2", label: "2 hops" },
                { id: "3", label: "3 hops" },
              ]}
            />
          )}
        </section>
      </div>
    </Glass>
  );
}
