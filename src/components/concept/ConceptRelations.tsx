import { Fragment, useState } from "react";
import type { LoadedMap } from "../../data";
import type {
  ConceptRelations as Relations,
  RelationLink,
} from "../../lib/conceptView";
import { ConnectionChip } from "../Specimen";

/**
 * The single "connections" treatment. Renders the view-model's faithful relation
 * groups (Depends on, Used by, Satisfies / violates, …) as gutter-labelled rows
 * of ConnectionChips, each chip captioned with its precise relation. Replaces the
 * three near-identical link renderers the surfaces used to carry.
 */
export function ConceptRelations({
  relations,
  map,
  onSelect,
  gutter = 86,
  includeSeeAlso = true,
  initialPerGroup = Infinity,
}: {
  relations: Relations;
  map: LoadedMap;
  onSelect: (id: string) => void;
  gutter?: number;
  includeSeeAlso?: boolean;
  /** Collapse long groups behind a "+N more" toggle (the panel uses 8). */
  initialPerGroup?: number;
}) {
  const groups = relations.groups.filter(
    (g) => includeSeeAlso || g.key !== "related_to",
  );
  if (groups.length === 0) return null;

  return (
    <dl
      className="m-0 grid items-baseline gap-x-3.5 gap-y-3.5 p-0"
      style={{ gridTemplateColumns: `${gutter}px minmax(0,1fr)` }}
    >
      {groups.map((g) => (
        <Fragment key={g.key}>
          <dt
            className="pt-[3px] text-right font-mono text-ui-2xs uppercase leading-tight tracking-label"
            style={{ color: "var(--fg-3)" }}
          >
            {g.label}
          </dt>
          <dd className="m-0 min-w-0">
            <ChipRow
              links={g.links}
              map={map}
              onSelect={onSelect}
              initial={initialPerGroup}
            />
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

function ChipRow({
  links,
  map,
  onSelect,
  initial,
}: {
  links: RelationLink[];
  map: LoadedMap;
  onSelect: (id: string) => void;
  initial: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? links : links.slice(0, initial);
  const hidden = links.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((link) => (
        <ConnectionChip
          key={link.id}
          id={link.id}
          map={map}
          caption={link.caption}
          onClick={() => onSelect(link.id)}
        />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="self-center px-1 text-ui-xs hover:underline"
          style={{ color: "var(--accent)" }}
        >
          +{hidden} more
        </button>
      )}
    </div>
  );
}
