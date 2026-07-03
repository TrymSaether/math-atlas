import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BookText,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  FlaskConical,
  Layers,
  Link2,
  ListOrdered,
  Maximize2,
  Minimize2,
  Share2,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/app/store";
import { useConceptView } from "./view";
import { ConceptHeader, ConceptBody, ConceptRelations } from "./index";
import { shareUrl } from "@/app/useUrlSync";
import { cn } from "@/ui/cn";
import { Button } from "@/ui/button";
import { Surface } from "@/design";

const USED_BY_INITIAL = 8;

/**
 * The concept place-card — the deep-study surface. A left-docked thick-glass card
 * built on the shared `useConceptView` + concept/* renderers, presented as one
 * calm scroll: identity, statement, figure, the facet stack, proof, then
 * navigable relations.
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
          className="ds-panel ds-panel--left"
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

  // Maps-style stat row: three metrics; the third adapts to the concept's most
  // salient body — proof steps, then worked examples, then recorded properties.
  const stats: { icon: LucideIcon; value: number; label: string }[] = [
    { icon: Share2, value: view.relations.count, label: "Relations" },
    { icon: Layers, value: peers.length, label: "In domain" },
    view.proof.hasProof
      ? {
          icon: ListOrdered,
          value: view.proof.steps.length,
          label: view.proof.label === "Solution" ? "Steps" : "Proof steps",
        }
      : view.examples.length > 0
        ? {
            icon: FlaskConical,
            value: view.examples.length,
            label: view.examples.length === 1 ? "Example" : "Examples",
          }
        : { icon: ListOrdered, value: view.properties.length, label: "Properties" },
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [nodeId]);

  const openIn = (surface: "dictionary" | "flashcards") => {
    select(nodeId);
    setSurface(surface);
  };

  return (
    <Surface
      material="thick"
      role="dialog"
      aria-label={`${view.kindLabel}: ${node.label}`}
      className={cn(
        "flex h-full flex-col transition-[width] duration-200",
        expanded ? "w-[min(580px,calc(100vw-24px))]" : "w-[min(400px,calc(100vw-24px))]",
      )}
    >
      <header className="shrink-0">
        <div className="flex min-h-11 items-center justify-between gap-3 px-3 pt-2 pb-1">
          <div className="inline-flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Previous in domain"
              title="Previous in domain"
              disabled={!prev}
              onClick={() => prev && select(prev.id)}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Next in domain"
              title="Next in domain"
              disabled={!next}
              onClick={() => next && select(next.id)}
            >
              <ChevronDown className="size-4" />
            </Button>
            {peerIdx >= 0 && (
              <span className="ml-1 font-mono text-caption tabular-nums text-muted-foreground">
                {peerIdx + 1}/{peers.length}
              </span>
            )}
          </div>
          <div className="inline-flex items-center gap-0.5">
            {userId && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-8", known ? "text-primary" : "text-muted-foreground")}
                aria-label={known ? "Mark as not known" : "Mark as known"}
                title={known ? "Mark as not known" : "Mark as known"}
                onClick={() => setNodeProgress(mapId, nodeId, known ? null : "known")}
              >
                <CircleCheck className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Open in Index"
              title="Open in Index"
              onClick={() => openIn("dictionary")}
            >
              <BookText className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Open in Study"
              title="Open in Study"
              onClick={() => openIn("flashcards")}
            >
              <WalletCards className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", copied ? "text-primary" : "text-muted-foreground")}
              aria-label={copied ? "Link copied" : "Copy link"}
              title="Copy link"
              onClick={copyLink}
            >
              {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label={expanded ? "Collapse card" : "Expand card"}
              title={expanded ? "Collapse card" : "Expand card"}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Close"
              title="Close"
              onClick={() => select(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <div className="px-4">
          <ConceptHeader view={view} />
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div className="flex flex-col gap-0.5" key={stat.label}>
                <dd className="flex items-center gap-1.5 text-title-3 font-semibold text-foreground">
                  <stat.icon className="size-4 text-muted-foreground" aria-hidden />
                  {stat.value}
                </dd>
                <dt className="text-caption text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="mx-4 mt-3 h-px bg-linear-to-r from-transparent via-border to-transparent" />
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {view.hasContent ? (
          <div className="space-y-5">
            <ConceptBody view={view} map={map} density="full" onSelect={select} />
            {view.relations.count > 0 && (
              <div className="border-t border-border pt-4">
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
          <p className="text-footnote text-muted-foreground italic">
            No written content recorded for this concept yet.
          </p>
        )}
      </div>
    </Surface>
  );
}
