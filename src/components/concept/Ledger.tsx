import { Fragment, type ReactNode } from "react";

/**
 * A label-gutter "ledger": micro-labels in an aligned left column, content in a
 * single reading column on the right. Replaces the old flat stack of
 * label-on-top facet blocks — when every label lines up in the gutter, the eye
 * scans the rail of labels and the content reads as one column.
 */
export interface LedgerRow {
  /** Stable key + the gutter label (uppercase mono). */
  label: string;
  content: ReactNode;
}

export function Ledger({
  rows,
  gutter = 86,
  toneColor,
}: {
  rows: LedgerRow[];
  /** Gutter width in px; widen for the roomier dictionary detail. */
  gutter?: number;
  /** When set, labels take the domain tone instead of muted ink. */
  toneColor?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <dl
      className="m-0 grid items-baseline gap-x-3.5 gap-y-3.5 p-0"
      style={{ gridTemplateColumns: `${gutter}px minmax(0,1fr)` }}
    >
      {rows.map((row) => (
        <Fragment key={row.label}>
          <dt
            className="pt-[1px] text-right font-mono text-ui-2xs uppercase leading-tight tracking-label"
            style={{ color: toneColor ?? "var(--fg-3)" }}
          >
            {row.label}
          </dt>
          <dd className="m-0 min-w-0 text-ui-copy" style={{ color: "var(--fg-1)" }}>
            {row.content}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}
