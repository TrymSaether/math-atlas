import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  XIcon,
  CaretUpIcon,
  CaretDownIcon,
  BookOpenTextIcon,
  CardsIcon,
  CheckCircleIcon,
  CheckIcon,
  LinkSimpleIcon,
  ArrowsOutSimpleIcon,
  ArrowsInSimpleIcon,
} from "@phosphor-icons/react";
import { useStore } from "../../store";
import { useConceptView } from "../../lib/conceptView";
import { ConceptHeader, ConceptBody, ConceptRelations } from "../concept";
import { shareUrl } from "../../hooks/useUrlSync";
import { cn } from "../../lib/utils";
import { Glass } from "./Glass";

const USED_BY_INITIAL = 8;

function HeaderButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "shell-btn shell-btn-icon rounded-full text-fg-2 outline-none",
        "hover:bg-surface-hover hover:text-fg-1 focus-visible:outline-2 focus-visible:outline-accent",
        "disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent",
        active && "bg-accent-soft text-accent",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The concept place-card — the deep-study surface. A left-docked Liquid Glass
 * card built entirely on the shared `useConceptView` + concept/* renderers
 * (same content as the Index detail and Study back), presented as one calm
 * scroll: identity, statement, figure, the facet stack, proof, then navigable
 * relations. Replaces the prototype's tabbed NodePanel.
 */
export function ConceptCard() {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId]);
  const id = useStore((s) => s.selectedId);
  const reduceMotion = useReducedMotion();

  const node = id && map ? (map.nodeById.get(id) ?? null) : null;
  const open = node !== null && map !== undefined;

  return (
    <AnimatePresence>
      {open && node && map && (
        <motion.aside
          key={node.id}
          initial={reduceMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.2, 0.7, 0.2, 1] }}
          className="shell-dock shell-dock-left pointer-events-auto"
        >
          <CardContent nodeId={node.id} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function CardContent({ nodeId }: { nodeId: string }) {
  const mapId = useStore((s) => s.mapId);
  const map = useStore((s) => s.loadedMaps[mapId])!;
  const node = map.nodeById.get(nodeId)!;
  const select = useStore((s) => s.select);
  const setSurface = useStore((s) => s.setSurface);
  const userId = useStore((s) => s.userId);
  const known = useStore((s) => s.progress[mapId]?.[nodeId] === "known");
  const setNodeProgress = useStore((s) => s.setNodeProgress);
  const view = useConceptView(node, map, mapId);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  // Domain peers drive the prev/next pager.
  const peers = useMemo(() => map.data.nodes.filter((n) => n.domain === node.domain), [map, node.domain]);
  const peerIdx = peers.findIndex((n) => n.id === node.id);
  const prev = peerIdx > 0 ? peers[peerIdx - 1] : null;
  const next = peerIdx >= 0 && peerIdx < peers.length - 1 ? peers[peerIdx + 1] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [nodeId]);

  const openIn = (surface: "dictionary" | "flashcards") => {
    select(nodeId);
    setSurface(surface);
  };

  return (
    <Glass
      material="thick"
      className={cn(
        "shell-panel flex h-full flex-col transition-[width] duration-200",
        expanded ? "w-[min(580px,calc(100vw-24px))]" : "w-[min(400px,calc(100vw-24px))]",
      )}
      role="dialog"
      aria-label={`${view.kindLabel}: ${node.label}`}
    >
      <header className="shrink-0 px-4 pt-2.5">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <HeaderButton label="Previous in domain" disabled={!prev} onClick={() => prev && select(prev.id)}>
              <CaretUpIcon className="h-4 w-4" weight="bold" />
            </HeaderButton>
            <HeaderButton label="Next in domain" disabled={!next} onClick={() => next && select(next.id)}>
              <CaretDownIcon className="h-4 w-4" weight="bold" />
            </HeaderButton>
            {peerIdx >= 0 && (
              <span className="ml-1.5 font-mono text-ui-meta text-fg-3">
                {peerIdx + 1}/{peers.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {userId && (
              <HeaderButton
                label={known ? "Mark as not known" : "Mark as known"}
                active={known}
                onClick={() => setNodeProgress(mapId, nodeId, known ? null : "known")}
              >
                <CheckCircleIcon className="h-4 w-4" weight={known ? "fill" : "regular"} />
              </HeaderButton>
            )}
            <HeaderButton label="Open in Index" onClick={() => openIn("dictionary")}>
              <BookOpenTextIcon className="h-4 w-4" />
            </HeaderButton>
            <HeaderButton label="Open in Study" onClick={() => openIn("flashcards")}>
              <CardsIcon className="h-4 w-4" />
            </HeaderButton>
            <HeaderButton label={copied ? "Link copied" : "Copy link"} active={copied} onClick={copyLink}>
              {copied ? <CheckIcon className="h-4 w-4" weight="bold" /> : <LinkSimpleIcon className="h-4 w-4" />}
            </HeaderButton>
            <HeaderButton label={expanded ? "Collapse card" : "Expand card"} onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ArrowsInSimpleIcon className="h-4 w-4" /> : <ArrowsOutSimpleIcon className="h-4 w-4" />}
            </HeaderButton>
            <HeaderButton label="Close" onClick={() => select(null)}>
              <XIcon className="h-4 w-4" weight="bold" />
            </HeaderButton>
          </div>
        </div>
        <ConceptHeader view={view} />
        <div className="-mx-4 mt-3 border-b border-border-subtle" />
      </header>

      <div ref={scrollRef} className="panel-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {view.hasContent ? (
          <div className="space-y-5">
            <ConceptBody view={view} map={map} density="full" onSelect={select} />
            {view.relations.count > 0 && (
              <div className="border-t border-border-subtle pt-4">
                <ConceptRelations
                  relations={view.relations}
                  map={map}
                  onSelect={select}
                  includeSeeAlso
                  initialPerGroup={USED_BY_INITIAL}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-ui-sm italic text-fg-3">No written content recorded for this concept yet.</p>
        )}
      </div>
    </Glass>
  );
}
