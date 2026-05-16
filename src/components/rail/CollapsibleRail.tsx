import { AnimatePresence, motion } from "framer-motion";
import { Compass, Route, SlidersHorizontal, GraduationCap, X, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { Panel } from "../ui";
import { cn } from "../../lib/utils";
import { useStore, type RailSection } from "../../store";
import type { LoadedMap } from "../../data/loadMap";
import { ExploreSection } from "./ExploreSection";
import { PlanSection } from "./PlanSection";
import { FilterSection } from "./FilterSection";
import { ProgressSection } from "./ProgressSection";

interface RailItem {
  id: RailSection;
  label: string;
  icon: LucideIcon;
}

const ITEMS: RailItem[] = [
  { id: "explore", label: "Explore", icon: Compass },
  { id: "plan", label: "Plan", icon: Route },
  { id: "filter", label: "Filter", icon: SlidersHorizontal },
  { id: "progress", label: "Progress", icon: GraduationCap },
];

export function CollapsibleRail({ loaded }: { loaded: LoadedMap }) {
  const railSection = useStore((s) => s.railSection);
  const toggleRailSection = useStore((s) => s.toggleRailSection);
  const setRailSection = useStore((s) => s.setRailSection);

  // Close on Escape.
  useEffect(() => {
    if (!railSection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRailSection(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [railSection, setRailSection]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative z-30 flex h-full shrink-0 items-stretch gap-3"
      aria-label="Workspace controls"
    >
      <Panel className="flex h-full w-[64px] shrink-0 flex-col items-center gap-1 px-2 py-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = railSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleRailSection(item.id)}
              aria-pressed={active}
              aria-label={item.label}
              className={cn(
                "group relative flex h-12 w-12 flex-col items-center justify-center rounded-[10px] border transition",
                active
                  ? "border-[rgba(var(--primary-rgb),0.32)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.08em]">{item.label}</span>
            </button>
          );
        })}
      </Panel>

      <AnimatePresence initial={false}>
        {railSection && (
          <motion.div
            key={railSection}
            initial={{ opacity: 0, x: -8, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 320 }}
            exit={{ opacity: 0, x: -8, width: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="h-full overflow-hidden"
          >
            <Panel className="flex h-full w-[320px] flex-col overflow-hidden">
              <header className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3">
                <div className="font-display text-[15px] leading-none text-[var(--text)]">
                  {ITEMS.find((i) => i.id === railSection)?.label}
                </div>
                <button
                  type="button"
                  onClick={() => setRailSection(null)}
                  aria-label="Close panel"
                  className="rounded-[8px] p-1 text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-4">
                {railSection === "explore" && <ExploreSection loaded={loaded} />}
                {railSection === "plan" && <PlanSection loaded={loaded} />}
                {railSection === "filter" && <FilterSection loaded={loaded} />}
                {railSection === "progress" && <ProgressSection loaded={loaded} />}
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
