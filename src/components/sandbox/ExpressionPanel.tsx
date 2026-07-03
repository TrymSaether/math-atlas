/**
 * The Desmos-style expression list: one editable row per workspace object, with
 * a color swatch, value/measure readout, slider (for free parameters),
 * lightweight dependency metadata, and visibility/delete controls.
 *
 * Styling leans on the atlas design tokens (type scale, chrome borders, mono
 * readouts) so the sandbox reads as part of the same product.
 */

import { useMemo, useState, type CSSProperties } from "react";
import {
  Calculator,
  ChevronDown,
  Eye,
  EyeOff,
  Variable,
  LineChart,
  Link2,
  Plus,
  SlidersHorizontal,
  Trash,
  CircleAlert,
} from "lucide-react";
import { useSandbox, DEFAULT_SLIDER } from "../../lib/workspace/store";
import { formatValue } from "../../lib/workspace/engine";
import { PALETTE } from "../../lib/workspace/library";
import type { Computed, FactStatus, GeomShape, Row } from "../../lib/workspace/types";
import { MathText } from "../../lib/katex";
import { Slider } from "@/components/ui/slider";
import { MathField } from "./MathField";

export function ExpressionPanel() {
  const ws = useSandbox((s) => s.ws);
  const compiled = useSandbox((s) => s.compiled);
  const addRow = useSandbox((s) => s.addRow);
  const sections = useMemo(() => groupRows(ws.rows, compiled.byId), [compiled.byId, ws.rows]);
  const [collapsed, setCollapsed] = useState<Partial<Record<SectionId, boolean>>>({});

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="panel-scrollbar flex-1 overflow-y-auto px-1.5 pb-1.5 pt-1">
        {sections.map((section) => (
          <section
            key={section.id}
            className="overflow-hidden rounded-md border border-transparent bg-card/20 [&+&]:mt-[5px]"
          >
            <button
              type="button"
              className="flex min-h-[34px] w-full items-center gap-1.5 rounded-t-md border-b border-border/50 px-2 pb-1.5 pt-2 text-left text-caption-2 font-bold uppercase leading-none tracking-label-tight text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:bg-primary/10 focus-visible:shadow-[inset_0_0_0_1px_var(--primary)] focus-visible:outline-none"
              aria-expanded={!collapsed[section.id]}
              onClick={() => setCollapsed((next) => ({ ...next, [section.id]: !next[section.id] }))}
            >
              <span className="flex h-[17px] w-[17px] items-center justify-center rounded-xs bg-primary/[0.08] text-muted-foreground">
                <Sigma id={section.id} />
              </span>
              <span className="min-w-0 flex-1 truncate">{section.title}</span>
              <span className="font-mono tabular-nums">{section.rows.length}</span>
              <ChevronDown
                className={`h-3 w-3 shrink-0 text-muted-foreground/70 transition-transform ${
                  collapsed[section.id] ? "-rotate-90" : ""
                }`}
              />
            </button>
            {!collapsed[section.id] && (
              <div className="overflow-hidden rounded-b-md">
                {section.rows.map(({ row, index, computed }) => (
                  <ExpressionRow key={row.id} row={row} index={index} computed={computed} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addRow()}
        className="flex items-center gap-2 border-t border-border px-3.5 py-2.5 text-caption-1 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
      >
        <Plus size={14} />
        New expression
      </button>
    </div>
  );
}

type SectionId = "inputs" | "definitions" | "objects" | "issues";

interface RowEntry {
  row: Row;
  index: number;
  computed?: Computed;
}

interface RowSection {
  id: SectionId;
  title: string;
  rows: RowEntry[];
}

function groupRows(rows: Row[], byId: Record<string, Computed | undefined>): RowSection[] {
  const sections: RowSection[] = [
    { id: "inputs", title: "Inputs", rows: [] },
    { id: "definitions", title: "Definitions", rows: [] },
    { id: "objects", title: "Objects", rows: [] },
    { id: "issues", title: "Needs attention", rows: [] },
  ];
  const bySection = Object.fromEntries(sections.map((section) => [section.id, section])) as Record<
    SectionId,
    RowSection
  >;

  rows.forEach((row, i) => {
    const computed = byId[row.id];
    const entry = { row, index: i + 1, computed };
    if (computed?.error || computed?.kind === "invalid") {
      bySection.issues.rows.push(entry);
      return;
    }
    const rowType = rowTypeFor(computed);
    if (rowType === "slider") bySection.inputs.rows.push(entry);
    else if (rowType === "function" || rowType === "value" || rowType === "blank")
      bySection.definitions.rows.push(entry);
    else bySection.objects.rows.push(entry);
  });

  return sections.filter((section) => section.rows.length > 0);
}

function Sigma({ id }: { id: SectionId }) {
  const props = { size: 12, weight: "bold" as const };
  switch (id) {
    case "inputs":
      return <SlidersHorizontal {...props} />;
    case "definitions":
      return <Variable {...props} />;
    case "objects":
      return <LineChart {...props} />;
    case "issues":
      return <CircleAlert {...props} />;
  }
}

function ExpressionRow({ row, index, computed }: { row: Row; index: number; computed?: Computed }) {
  const updateRow = useSandbox((s) => s.updateRow);
  const removeRow = useSandbox((s) => s.removeRow);
  const setColor = useSandbox((s) => s.setRowColor);
  const toggleVisible = useSandbox((s) => s.toggleRowVisible);
  const setSlider = useSandbox((s) => s.setRowSlider);
  const setScalarValue = useSandbox((s) => s.setScalarValue);
  const selectRow = useSandbox((s) => s.selectRow);
  const selected = useSandbox((s) => s.selectedRowId === row.id);
  const addRow = useSandbox((s) => s.addRow);

  const status = useMemo(() => statusFor(row, computed), [row, computed]);
  const isParam = computed?.kind === "parameter";
  const readout = useMemo(() => readoutFor(computed), [computed]);
  const rowType = useMemo(() => rowTypeFor(computed), [computed]);
  const summary = useMemo(() => selectedSummaryFor(computed, readout), [computed, readout]);
  const evaluatedTex = useMemo(() => evaluatedTexFor(computed, rowType), [computed, rowType]);

  const cycleColor = () => {
    const i = PALETTE.indexOf(row.color as (typeof PALETTE)[number]);
    setColor(row.id, PALETTE[(i + 1) % PALETTE.length]);
  };

  return (
    <div
      onMouseDown={() => selectRow(row.id)}
      className="group relative mb-0 overflow-hidden rounded-sm border border-transparent bg-transparent transition-colors hover:border-border/30 hover:bg-foreground/5 data-[selected=true]:border-primary/25 data-[selected=true]:bg-primary/[0.06] data-[selected=true]:shadow-[inset_2px_0_0_var(--primary)]"
      data-selected={selected ? "true" : undefined}
      data-status={status}
      data-row-type={rowType}
    >
      <div className="flex min-h-[44px] items-stretch">
        {/* Index gutter */}
        <div
          className="flex w-6 items-center justify-center py-1 font-mono text-caption-2 leading-none tabular-nums text-muted-foreground"
          title={statusTitle(status)}
        >
          <span>{index}</span>
        </div>

        {/* Color swatch */}
        <button
          type="button"
          onClick={cycleColor}
          title="Cycle color"
          className="group/swatch flex w-5 items-start justify-center pt-3.5 text-muted-foreground"
        >
          <span
            className="block h-3 w-3 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.14)] transition-transform group-hover/swatch:scale-110"
            style={{ background: row.color }}
          />
        </button>

        {/* Editor + readout */}
        <div className="min-w-0 flex-1 overflow-hidden py-0.5 pr-1 text-foreground">
          <div className="rounded-xs border border-transparent transition focus-within:border-primary/40 focus-within:bg-primary/[0.08]">
            <MathField
              value={row.source}
              onChange={(src) => updateRow(row.id, src)}
              onEnter={() => addRow()}
              onFocus={() => selectRow(row.id)}
              ariaLabel={`expression ${index}`}
              placeholder="expression"
            />
          </div>

          {computed?.error ? (
            <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-xs bg-destructive/10 px-1.5 py-0.5 text-caption-2 text-destructive">
              <CircleAlert size={12} />
              {computed.error}
            </div>
          ) : selected && (evaluatedTex || summary) ? (
            <div className="mt-0.5 flex min-w-0 items-center gap-1 overflow-x-auto font-mono text-caption-2 leading-[1.2] text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_svg]:shrink-0 [&_svg]:text-muted-foreground/70">
              {evaluatedTex ? (
                <MathText text={`$${evaluatedTex}$`} />
              ) : (
                <>
                  <Rows3 kind={rowType} />
                  {summary}
                </>
              )}
            </div>
          ) : null}

          {isParam && (
            <ParamSlider
              row={row}
              value={asNumber(computed?.value)}
              onChange={(v) => setScalarValue(row.id, v)}
              onConfig={(s) => setSlider(row.id, s)}
            />
          )}

          {selected && <RowMeta row={row} computed={computed} status={status} />}
        </div>

        {/* Controls */}
        <div className="flex w-6 flex-col items-center justify-center gap-0.5 text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-data-[selected=true]:opacity-50 group-data-[selected=true]:group-hover:opacity-100 [&_button:hover]:bg-foreground/10 [&_button:hover]:text-foreground [&_button]:inline-flex [&_button]:h-5 [&_button]:w-5 [&_button]:items-center [&_button]:justify-center [&_button]:rounded-sm [&_button]:transition">
          <button type="button" onClick={() => toggleVisible(row.id)} title={row.visible ? "Hide" : "Show"}>
            {row.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button type="button" onClick={() => removeRow(row.id)} title="Delete">
            <Trash size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ParamSlider({
  row,
  value,
  onChange,
  onConfig,
}: {
  row: Row;
  value: number;
  onChange: (v: number) => void;
  onConfig: (s: { min: number; max: number; step: number }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const slider = row.slider ?? DEFAULT_SLIDER;
  const progress = slider.max > slider.min ? ((value - slider.min) / (slider.max - slider.min)) * 100 : 0;
  const sliderStyle = {
    "--slider-color": row.color,
    "--slider-progress": `${Math.min(100, Math.max(0, progress))}%`,
  } as CSSProperties;
  return (
    <div className="mt-1 flex items-center gap-1.5 pr-px text-muted-foreground" style={sliderStyle}>
      <NumBox label="Minimum value" value={slider.min} onChange={(min) => onConfig({ ...slider, min })} />
      <div className="relative flex min-h-[16px] min-w-0 flex-1 items-center">
        {dragging && (
          <span className="pointer-events-none absolute bottom-4 left-[var(--slider-progress)] z-[1] min-w-[28px] -translate-x-1/2 rounded-full border border-[color-mix(in_srgb,var(--slider-color)_28%,transparent)] bg-card px-1.5 py-1 text-center font-mono text-[10px] leading-none tabular-nums text-foreground shadow-[0_4px_10px_rgba(0,0,0,0.12)]">
            {formatValue(value)}
          </span>
        )}
        <Slider
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          onValueCommit={() => setDragging(false)}
          onPointerDown={() => setDragging(true)}
          className="w-full"
          style={{ "--primary": row.color } as CSSProperties}
        />
      </div>
      <NumBox label="Maximum value" value={slider.max} onChange={(max) => onConfig({ ...slider, max })} />
    </div>
  );
}

function NumBox({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <input
      aria-label={label}
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-9 [appearance:textfield] rounded-full border border-transparent bg-transparent px-1 py-0.5 text-center font-mono text-caption-2 tabular-nums text-muted-foreground/70 outline-none transition hover:border-border/50 hover:bg-card/40 hover:text-muted-foreground focus:border-primary/40 focus:bg-card focus:text-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

function RowMeta({ row, computed, status }: { row: Row; computed?: Computed; status: FactStatus | "error" }) {
  const [open, setOpen] = useState(false);
  const deps = computed?.deps ?? [];
  const depNotation = deps.length > 0 ? `${computed?.name ?? "row"}←${deps.join(",")}` : "";
  const details = [
    computed?.label ? { label: "Type", value: computed.label } : null,
    { label: "State", value: statusLabel(status) },
    computed?.name ? { label: "Name", value: computed.name } : null,
    deps.length > 0 ? { label: "Depends on", value: deps.join(", ") } : null,
    { label: "Source", value: row.provenance.source },
    row.provenance.origin ? { label: "Origin", value: row.provenance.origin } : null,
    row.provenance.note ? { label: "Note", value: row.provenance.note } : null,
    { label: "Visible", value: row.visible ? "yes" : "no" },
  ].filter(Boolean) as { label: string; value: string }[];

  if (details.length === 0 && status !== "error") return null;

  return (
    <div className="mt-1.5 text-caption-2 leading-[1.15] text-muted-foreground/70">
      <button
        type="button"
        className="flex min-w-0 max-w-full items-center gap-1.5 rounded-sm py-0.5 pr-1.5 text-left text-muted-foreground transition hover:bg-foreground/[0.04]"
        aria-expanded={open}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((next) => !next)}
      >
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-muted-foreground/70 transition-transform ${open ? "" : "-rotate-90"}`}
        />
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-label-tight text-muted-foreground">
          Details
        </span>
        {status === "error" && <CircleAlert className="shrink-0" size={12} />}
        {depNotation && (
          <span className="flex min-w-0 max-w-[168px] items-center gap-1 font-mono text-muted-foreground [&_svg]:text-muted-foreground/70">
            <Link2 size={11} />
            <span className="truncate">{depNotation}</span>
          </span>
        )}
        {row.provenance.note && !depNotation && (
          <span className="min-w-0 max-w-[116px] truncate text-muted-foreground/70">{row.provenance.note}</span>
        )}
      </button>

      {open && (
        <dl className="mt-1.5 grid max-w-full grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 border-t border-border/40 pt-1 [&_dd]:min-w-0 [&_dd]:overflow-hidden [&_dd]:text-ellipsis [&_dd]:whitespace-nowrap [&_dd]:text-caption-2 [&_dd]:text-muted-foreground [&_dt]:whitespace-nowrap [&_dt]:font-mono [&_dt]:text-[9.5px] [&_dt]:font-bold [&_dt]:uppercase [&_dt]:tracking-label-tight [&_dt]:text-muted-foreground/70">
          {details.map((detail) => (
            <div key={detail.label} className="contents">
              <dt>{detail.label}</dt>
              <dd title={detail.value}>{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

type RowType = "slider" | "function" | "graph" | "value" | "blank";

function Rows3({ kind }: { kind: RowType }) {
  const props = { size: 12, weight: "bold" as const };
  switch (kind) {
    case "slider":
      return <SlidersHorizontal {...props} />;
    case "function":
      return <Variable {...props} />;
    case "graph":
      return <LineChart {...props} />;
    case "value":
      return <Calculator {...props} />;
    case "blank":
      return null;
  }
}

function readoutFor(computed?: Computed): string {
  if (!computed) return "";
  if (computed.geom) return geomReadout(computed.geom);
  if (computed.kind === "function") return `${computed.name ?? "f"}(x)`;
  if (computed.value !== undefined) {
    return `${computed.name ? `${computed.name} = ` : ""}${formatValue(computed.value)}`;
  }
  return "";
}

function selectedSummaryFor(computed: Computed | undefined, readout: string): string {
  if (!computed || computed.kind === "parameter") return "";
  return readout;
}

function evaluatedTexFor(computed: Computed | undefined, rowType: RowType): string {
  if (!computed?.evaluatedTex || rowType === "slider" || rowType === "blank") return "";
  return computed.evaluatedTex;
}

function geomReadout(g: GeomShape): string {
  const r = (n: number) => formatValue(Math.round(n * 1e4) / 1e4);
  switch (g.kind) {
    case "segment":
      return `length ${r(Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]))}`;
    case "line":
      return "line";
    case "circle":
      return `r ${r(g.r)}`;
    case "polygon":
      return `area ${r(polygonArea(g.pts))}`;
    case "vector":
      return `|v| ${r(Math.hypot(g.tip[0] - g.tail[0], g.tip[1] - g.tail[1]))}`;
  }
}

function polygonArea(pts: readonly (readonly [number, number])[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) / 2;
}

function statusFor(row: Row, computed?: Computed): FactStatus | "error" {
  if (!computed || computed.kind === "blank") return "pending";
  if (computed.error || computed.kind === "invalid") return "error";
  if (computed.kind === "parameter" || computed.kind === "freePoint") return "user";
  if (row.provenance.source === "atlas") return "recognized";
  return "computed";
}

function rowTypeFor(computed?: Computed): RowType {
  if (!computed || computed.kind === "blank" || computed.kind === "invalid") return "blank";
  if (computed.kind === "parameter") return "slider";
  if (computed.kind === "function") return "function";
  if (computed.geom || computed.kind === "freePoint" || computed.kind === "point") return "graph";
  return "value";
}

function statusTitle(status: FactStatus | "error"): string {
  return {
    computed: "✓ computed — evaluated from its inputs",
    recognized: "≅ atlas — loaded from a prepared workspace",
    user: "★ free input — you control this value",
    pending: "○ empty",
    error: "⚠ error",
  }[status];
}

function statusLabel(status: FactStatus | "error"): string {
  return {
    computed: "evaluated from inputs",
    recognized: "loaded from atlas",
    user: "direct input",
    pending: "pending",
    error: "error",
  }[status];
}

const asNumber = (v: unknown): number => (typeof v === "number" ? v : 0);
