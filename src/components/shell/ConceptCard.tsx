import { useEffect, useMemo, useRef, useState } from "react";
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
  ShareNetworkIcon,
  StackIcon,
  ListNumbersIcon,
  FlaskIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useStore } from "../../store";
import { useConceptView } from "../../lib/conceptView";
import { ConceptHeader, ConceptBody, ConceptRelations } from "../concept";
import { shareUrl } from "../../hooks/useUrlSync";
import { cn } from "../../lib/utils";
import { Material, ShellIconButton, ShellPanelHeader } from "../primitives";

const USED_BY_INITIAL = 8;

/**
 * The concept place-card — the deep-study surface. A left-docked standard-material
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

  // Maps-style stat row: three always-present metrics. The third adapts to the
  // concept's most salient body — proof steps, then worked examples, then
  // recorded properties — so a definition doesn't read "0 Proof steps".
  const stats: { icon: Icon; value: number; label: string }[] = [
    { icon: ShareNetworkIcon, value: view.relations.count, label: "Relations" },
    { icon: StackIcon, value: peers.length, label: "In domain" },
    view.proof.hasProof
      ? {
          icon: ListNumbersIcon,
          value: view.proof.steps.length,
          label: view.proof.label === "Solution" ? "Steps" : "Proof steps",
        }
      : view.examples.length > 0
        ? { icon: FlaskIcon, value: view.examples.length, label: view.examples.length === 1 ? "Example" : "Examples" }
        : { icon: ListNumbersIcon, value: view.properties.length, label: "Properties" },
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [nodeId]);

  const openIn = (surface: "dictionary" | "flashcards") => {
    select(nodeId);
    setSurface(surface);
  };

  return (
    <Material
      thickness="thick"
      className={cn(
        "shell-panel flex h-full flex-col transition-[width] duration-200",
        expanded ? "w-[min(580px,calc(100vw-24px))]" : "w-[min(400px,calc(100vw-24px))]",
      )}
      role="dialog"
      aria-label={`${view.kindLabel}: ${node.label}`}
    >
      <header className="shrink-0">
        <ShellPanelHeader
          title={
            <span className="shell-panel-pager">
              <ShellIconButton
                aria-label="Previous in domain"
                title="Previous in domain"
                disabled={!prev}
                onClick={() => prev && select(prev.id)}
              >
                <CaretUpIcon className="shell-icon" weight="regular" />
              </ShellIconButton>
              <ShellIconButton
                aria-label="Next in domain"
                title="Next in domain"
                disabled={!next}
                onClick={() => next && select(next.id)}
              >
                <CaretDownIcon className="shell-icon" weight="regular" />
              </ShellIconButton>
              {peerIdx >= 0 && (
                <span className="shell-panel-count">
                  {peerIdx + 1}/{peers.length}
                </span>
              )}
            </span>
          }
          className="shell-panel-header-card"
        >
          {userId && (
            <ShellIconButton
              aria-label={known ? "Mark as not known" : "Mark as known"}
              title={known ? "Mark as not known" : "Mark as known"}
              active={known}
              onClick={() => setNodeProgress(mapId, nodeId, known ? null : "known")}
            >
              <CheckCircleIcon className="shell-icon" weight="regular" />
            </ShellIconButton>
          )}
          <ShellIconButton aria-label="Open in Index" title="Open in Index" onClick={() => openIn("dictionary")}>
            <BookOpenTextIcon className="shell-icon" weight="regular" />
          </ShellIconButton>
          <ShellIconButton aria-label="Open in Study" title="Open in Study" onClick={() => openIn("flashcards")}>
            <CardsIcon className="shell-icon" weight="regular" />
          </ShellIconButton>
          <ShellIconButton
            aria-label={copied ? "Link copied" : "Copy link"}
            title="Copy link"
            active={copied}
            onClick={copyLink}
          >
            {copied ? <CheckIcon className="shell-icon" weight="regular" /> : <LinkSimpleIcon className="shell-icon" />}
          </ShellIconButton>
          <ShellIconButton
            aria-label={expanded ? "Collapse card" : "Expand card"}
            title={expanded ? "Collapse card" : "Expand card"}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ArrowsInSimpleIcon className="shell-icon" /> : <ArrowsOutSimpleIcon className="shell-icon" />}
          </ShellIconButton>
          <ShellIconButton aria-label="Close" title="Close" onClick={() => select(null)}>
            <XIcon className="shell-icon" weight="regular" />
          </ShellIconButton>
        </ShellPanelHeader>
        <div className="px-4">
          <ConceptHeader view={view} />
          <dl className="shell-card-stats">
            {stats.map((stat) => (
              <div className="shell-card-stat" key={stat.label}>
                <dd className="shell-card-stat-value">
                  <stat.icon weight="regular" aria-hidden />
                  {stat.value}
                </dd>
                <dt className="shell-card-stat-label">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="shell-panel-soft-rule" />
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
          <p className="text-footnote italic text-fg-3">No written content recorded for this concept yet.</p>
        )}
      </div>
    </Material>
  );
}
