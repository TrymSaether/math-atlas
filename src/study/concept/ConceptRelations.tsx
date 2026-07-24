import { useState } from "react";
import type { AtlasMap } from "@/atlas/model";
import type { ConceptRelations as Relations, RelationLink } from "./view";
import { ConnectionChip } from "./Specimen";

/**
 * The single "connections" treatment. Renders the view-model's faithful relation
 * groups (Depends on, Used by, Satisfies / violates, …) as eyebrow-labelled
 * environments of ConnectionChips — the same flush-left micro-label grammar the
 * concept body uses, so Links reads as one more facet rather than a table.
 *
 * The relation lives once, in the group eyebrow; the chips drop their (identical)
 * per-link caption so the row stays a clean wrap of node references.
 */
export function ConceptRelations({
  relations,
  map,
  onSelect,
  includeSeeAlso = true,
  initialPerGroup = Infinity,
}: {
  relations: Relations;
  map: AtlasMap;
  onSelect: (id: string) => void;
  includeSeeAlso?: boolean;
  /** Collapse long groups behind a "+N more" toggle (the panel uses 8). */
  initialPerGroup?: number;
}) {
  const groups = relations.groups.filter((g) => includeSeeAlso || g.key !== "related_to");
  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.key}>
          {g.label && (
            <div
              className="mb-1.5 text-caption-2 font-semibold uppercase tracking-label-tight"
              style={{ color: "var(--muted-foreground)" }}
            >
              {g.label}
            </div>
          )}
          <ChipRow links={g.links} map={map} onSelect={onSelect} initial={initialPerGroup} />
        </section>
      ))}
    </div>
  );
}

function ChipRow({
  links,
  map,
  onSelect,
  initial,
}: {
  links: RelationLink[];
  map: AtlasMap;
  onSelect: (id: string) => void;
  initial: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? links : links.slice(0, initial);
  const hidden = links.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((link) => (
        <ConnectionChip key={link.id} id={link.id} map={map} onClick={() => onSelect(link.id)} />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="self-center px-1 text-caption-1 hover:underline"
          style={{ color: "var(--primary-text)" }}
        >
          +{hidden} more
        </button>
      )}
    </div>
  );
}
