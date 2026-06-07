/**
 * The Desmos-style expression list: one editable row per workspace object, with
 * a color swatch, value/measure readout, slider (for free parameters),
 * lightweight dependency metadata, and visibility/delete controls.
 *
 * Styling leans on the atlas design tokens (type scale, chrome borders, mono
 * readouts) so the sandbox reads as part of the same product.
 */

import { useMemo, type CSSProperties } from "react";
import {
  Calculator,
  Eye,
  EyeSlash,
  Function as FunctionIcon,
  Graph,
  LinkSimple,
  Plus,
  SlidersHorizontal,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useSandbox, DEFAULT_SLIDER } from "../../lib/workspace/store";
import { formatValue } from "../../lib/workspace/engine";
import { PALETTE } from "../../lib/workspace/library";
import type { Computed, FactStatus, GeomShape, Row } from "../../lib/workspace/types";
import { MathField } from "./MathField";

export function ExpressionPanel() {
  const ws = useSandbox((s) => s.ws);
  const compiled = useSandbox((s) => s.compiled);
  const addRow = useSandbox((s) => s.addRow);
  const sections = useMemo(() => groupRows(ws.rows, compiled.byId), [compiled.byId, ws.rows]);

  return (
    <div className="sandbox-expression-panel flex h-full flex-col">
      <div className="sandbox-expression-list flex-1 overflow-y-auto px-1.5 pb-1.5 pt-1">
        {sections.map((section) => (
          <section key={section.id} className="sandbox-section">
            <div className="sandbox-section-header flex items-center gap-1.5 px-2 pb-1.5 pt-2">
              <span className="sandbox-section-icon flex items-center justify-center">
                <SectionIcon id={section.id} />
              </span>
              <span className="min-w-0 flex-1 truncate">{section.title}</span>
              <span className="font-mono tabular-nums">{section.rows.length}</span>
            </div>
            <div className="sandbox-section-rows">
              {section.rows.map(({ row, index, computed }) => (
                <ExpressionRow key={row.id} row={row} index={index} computed={computed} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addRow()}
        className="sandbox-add-expression flex items-center gap-2 px-3.5 py-2.5 text-ui-xs"
      >
        <Plus size={14} weight="bold" />
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
  const bySection = Object.fromEntries(sections.map((section) => [section.id, section])) as Record<SectionId, RowSection>;

  rows.forEach((row, i) => {
    const computed = byId[row.id];
    const entry = { row, index: i + 1, computed };
    if (computed?.error || computed?.kind === "invalid") {
      bySection.issues.rows.push(entry);
      return;
    }
    const rowType = rowTypeFor(computed);
    if (rowType === "slider") bySection.inputs.rows.push(entry);
    else if (rowType === "function" || rowType === "value" || rowType === "blank") bySection.definitions.rows.push(entry);
    else bySection.objects.rows.push(entry);
  });

  return sections.filter((section) => section.rows.length > 0);
}

function SectionIcon({ id }: { id: SectionId }) {
  const props = { size: 12, weight: "bold" as const };
  switch (id) {
    case "inputs":
      return <SlidersHorizontal {...props} />;
    case "definitions":
      return <FunctionIcon {...props} />;
    case "objects":
      return <Graph {...props} />;
    case "issues":
      return <WarningCircle {...props} />;
  }
}

function ExpressionRow({ row, index, computed }: { row: Row; index: number; computed?: Computed }) {
  const updateRow = useSandbox((s) => s.updateRow);
  const removeRow = useSandbox((s) => s.removeRow);
  const setColor = useSandbox((s) => s.setRowColor);
  const toggleVisible = useSandbox((s) => s.toggleRowVisible);
  const setSlider = useSandbox((s) => s.setRowSlider);
  const setValue = useSandbox((s) => s.setValue);
  const selectRow = useSandbox((s) => s.selectRow);
  const selected = useSandbox((s) => s.selectedRowId === row.id);
  const addRow = useSandbox((s) => s.addRow);

  const status = useMemo(() => statusFor(row, computed), [row, computed]);
  const isParam = computed?.kind === "parameter";
  const readout = useMemo(() => readoutFor(computed), [computed]);
  const rowType = useMemo(() => rowTypeFor(computed), [computed]);

  const cycleColor = () => {
    const i = PALETTE.indexOf(row.color as (typeof PALETTE)[number]);
    setColor(row.id, PALETTE[(i + 1) % PALETTE.length]);
  };

  return (
    <div
      onMouseDown={() => selectRow(row.id)}
      className="sandbox-expression-row group relative"
      data-selected={selected ? "true" : undefined}
      data-status={status}
    >
      <div className="flex min-h-[52px] items-stretch">
        {/* Index gutter */}
        <div
          className="sandbox-row-gutter flex w-7 items-center justify-center py-1.5 font-mono text-ui-2xs tabular-nums"
          title={statusTitle(status)}
        >
          <span>{index}</span>
        </div>

        {/* Color swatch */}
        <button type="button" onClick={cycleColor} title="Cycle color" className="sandbox-color-button flex w-6 items-center justify-center">
          <span
            className="sandbox-color-swatch"
            style={{ background: row.color }}
          />
        </button>

        {/* Editor + readout */}
        <div className="sandbox-row-body min-w-0 flex-1 py-1 pr-1">
          <div className="sandbox-field-frame">
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
            <div className="sandbox-row-error mt-1 flex items-center gap-1 text-ui-2xs">
              <WarningCircle size={12} weight="bold" />
              {computed.error}
            </div>
          ) : readout ? (
            <div className="sandbox-row-readout mt-0.5 flex items-center gap-1 font-mono text-ui-2xs">
              <RowTypeIcon kind={rowType} />
              {readout}
            </div>
          ) : null}

          {isParam && (
            <ParamSlider row={row} value={asNumber(computed?.value)} onChange={(v) => setValue(row.id, v)} onConfig={(s) => setSlider(row.id, s)} />
          )}

          <RowMeta deps={computed?.deps ?? []} status={status} note={row.provenance.note} />
        </div>

        {/* Controls */}
        <div className="sandbox-row-controls flex w-7 flex-col items-center justify-center gap-1">
          <button type="button" onClick={() => toggleVisible(row.id)} title={row.visible ? "Hide" : "Show"}>
            {row.visible ? <Eye size={14} /> : <EyeSlash size={14} />}
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
  const slider = row.slider ?? DEFAULT_SLIDER;
  const progress = sliderProgress(value, slider.min, slider.max);
  const sliderStyle = {
    color: row.color,
    "--slider-color": row.color,
    "--slider-progress": `${progress}%`,
  } as CSSProperties;

  return (
    <div className="sandbox-param-slider mt-1 flex items-center gap-1.5">
      <NumBox label="Minimum value" value={slider.min} onChange={(min) => onConfig({ ...slider, min })} />
      <input
        type="range"
        min={slider.min}
        max={slider.max}
        step={slider.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ws-slider min-w-0 flex-1"
        style={sliderStyle}
      />
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
      className="sandbox-num-box w-9 px-1 py-0.5 text-center font-mono text-ui-2xs tabular-nums outline-none"
    />
  );
}

function RowMeta({
  deps,
  status,
  note,
}: {
  deps: string[];
  status: FactStatus | "error";
  note?: string;
}) {
  if (!note && deps.length === 0 && status !== "error") return null;
  return (
    <div className="sandbox-row-meta mt-1 flex items-center gap-1.5 text-ui-2xs">
      <span className="sandbox-status-indicator flex items-center gap-1" title={statusTitle(status)}>
        <StatusIcon status={status} />
      </span>
      {note && (
        <span className="sandbox-note truncate" title={note}>
          {note}
        </span>
      )}
      {deps.length > 0 && (
        <span className="sandbox-deps flex min-w-0 items-center gap-1 truncate font-mono" title={`depends on ${deps.join(", ")}`}>
          <LinkSimple size={11} />
          <span className="truncate">{deps.join(", ")}</span>
        </span>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: FactStatus | "error" }) {
  const color = STATUS_COLOR[status];
  return <span className="sandbox-status-dot" style={{ background: `var(${color})` }} />;
}

const STATUS_COLOR: Record<FactStatus | "error", string> = {
  computed: "--fact-computed",
  recognized: "--fact-recognized",
  user: "--fact-user",
  pending: "--fact-pending",
  error: "--red",
};

type RowType = "slider" | "function" | "graph" | "value" | "blank";

function RowTypeIcon({ kind }: { kind: RowType }) {
  const props = { size: 12, weight: "bold" as const };
  switch (kind) {
    case "slider":
      return <SlidersHorizontal {...props} />;
    case "function":
      return <FunctionIcon {...props} />;
    case "graph":
      return <Graph {...props} />;
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

const asNumber = (v: unknown): number => (typeof v === "number" ? v : 0);

function sliderProgress(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}
