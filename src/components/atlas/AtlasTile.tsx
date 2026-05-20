import { ArrowRight, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../../store";
import type { MapId } from "../../data";
import type { LoadedMap } from "../../data/loadMap";
import { suggestedStarts } from "../../lib/suggestedStarts";
import { MathText } from "../../lib/katex";

interface MapMeta {
  id: string;
  label: string;
  description: string;
}

export function AtlasTile({
  mapId,
  meta,
  loaded,
}: {
  mapId: MapId;
  meta: MapMeta;
  loaded: LoadedMap;
}) {
  const openMap = useStore((s) => s.openMap);
  const { data } = loaded;
  const starts = suggestedStarts(loaded);
  const domains = data.domains;

  return (
    <motion.button
      type="button"
      onClick={() => openMap(mapId)}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6 text-left shadow-[var(--shadow-1)] transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.32)]"
    >
      {/* Top: domain swatch ribbon */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        {domains.map((d) => (
          <span
            key={d.id}
            title={d.label}
            style={{ background: d.color }}
            className="block h-full flex-1"
          />
        ))}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Map
          </div>
          <h2 className="mt-1 font-display text-[26px] leading-[1.1] text-[var(--text)]">
            {meta.label}
          </h2>
          <p className="mt-2 max-w-[44ch] text-[13px] leading-relaxed text-[var(--text-soft)]">
            {meta.description}
          </p>
        </div>
        <span className="rounded-full bg-[var(--primary-soft)] p-2 text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-[var(--on-primary)]">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-3 rounded-[14px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Concepts
          </dt>
          <dd className="mt-0.5 font-display text-[20px] leading-none text-[var(--text)]">
            {data.nodes.length}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Links
          </dt>
          <dd className="mt-0.5 font-display text-[20px] leading-none text-[var(--text)]">
            {data.edges.length}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Domains
          </dt>
          <dd className="mt-0.5 font-display text-[20px] leading-none text-[var(--text)]">
            {data.domains.length}
          </dd>
        </div>
      </dl>

      {starts.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            <Compass className="h-3 w-3" />
            Start here
          </div>
          <ul className="space-y-1">
            {starts.map((n) => (
              <li
                key={n.id}
                className={`kind-${n.kind} flex items-center gap-2 text-[12.5px] text-[var(--text-soft)]`}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "rgb(var(--c))" }}
                />
                <span className="truncate">
                  <MathText text={n.title} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.button>
  );
}
