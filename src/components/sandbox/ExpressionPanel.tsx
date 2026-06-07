/**
 * The Desmos-style expression list: one editable row per workspace object, with
 * a status glyph, color swatch, value/measure readout, slider (for free
 * parameters), provenance badge, and visibility/delete controls.
 *
 * Styling leans on the atlas design tokens (type scale, chrome borders, mono
 * readouts) so the sandbox reads as part of the same product.
 */

import { useMemo } from "react";
import { Eye, EyeSlash, Trash, Plus } from "@phosphor-icons/react";
import { useSandbox, DEFAULT_SLIDER } from "../../lib/workspace/store";
import { formatValue } from "../../lib/workspace/engine";
import { PALETTE } from "../../lib/workspace/library";
import type { Computed, FactStatus, GeomShape, Provenance, Row } from "../../lib/workspace/types";
import { MathField } from "./MathField";

export function ExpressionPanel() {
  const ws = useSandbox((s) => s.ws);
  const compiled = useSandbox((s) => s.compiled);
  const addRow = useSandbox((s) => s.addRow);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {ws.rows.map((row, i) => (
          <ExpressionRow key={row.id} row={row} index={i + 1} computed={compiled.byId[row.id]} />
        ))}
      </div>
      <button
        onClick={() => addRow()}
        className="flex items-center gap-2 border-t px-4 py-3 text-ui-xs transition-colors hover:bg-[var(--surface-2)]"
        style={{ borderColor: "var(--hairline)", color: "var(--fg-2)" }}
      >
        <Plus size={14} weight="bold" />
        New expression
      </button>
    </div>
  );
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

  const cycleColor = () => {
    const i = PALETTE.indexOf(row.color as (typeof PALETTE)[number]);
    setColor(row.id, PALETTE[(i + 1) % PALETTE.length]);
  };

  return (
    <div
      onMouseDown={() => selectRow(row.id)}
      className="group relative border-b transition-colors"
      style={{
        borderColor: "var(--hairline)",
        background: selected ? "var(--surface-2)" : "transparent",
        boxShadow: selected ? "inset 2px 0 0 var(--accent)" : "inset 2px 0 0 transparent",
      }}
    >
      <div className="flex items-stretch">
        {/* Index + status gutter */}
        <div
          className="flex w-8 flex-col items-center justify-center gap-1 py-2 text-ui-2xs tabular-nums"
          style={{ color: "var(--fg-4)" }}
          title={statusTitle(status)}
        >
          <span>{index}</span>
          <StatusGlyph status={status} />
        </div>

        {/* Color swatch */}
        <button onClick={cycleColor} title="Cycle color" className="flex w-7 items-center justify-center">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: row.color, boxShadow: "0 0 0 1px color-mix(in srgb, var(--fg-1) 12%, transparent)" }}
          />
        </button>

        {/* Editor + readout */}
        <div className="min-w-0 flex-1 py-2 pr-1">
          <div style={{ color: "var(--fg-1)" }}>
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
            <div className="mt-1 text-ui-2xs" style={{ color: "var(--red)" }}>
              {computed.error}
            </div>
          ) : readout ? (
            <div className="mt-1 font-mono text-ui-2xs" style={{ color: "var(--fg-3)" }}>
              {readout}
            </div>
          ) : null}

          {isParam && (
            <ParamSlider row={row} value={asNumber(computed?.value)} onChange={(v) => setValue(row.id, v)} onConfig={(s) => setSlider(row.id, s)} />
          )}

          <ProvenanceBadge provenance={row.provenance} deps={computed?.deps ?? []} />
        </div>

        {/* Controls */}
        <div className="flex w-8 flex-col items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => toggleVisible(row.id)} title={row.visible ? "Hide" : "Show"} style={{ color: "var(--fg-3)" }}>
            {row.visible ? <Eye size={14} /> : <EyeSlash size={14} />}
          </button>
          <button onClick={() => removeRow(row.id)} title="Delete" style={{ color: "var(--fg-3)" }}>
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
  return (
    <div className="mt-2 flex items-center gap-2">
      <NumBox value={slider.min} onChange={(min) => onConfig({ ...slider, min })} />
      <input
        type="range"
        min={slider.min}
        max={slider.max}
        step={slider.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ws-slider min-w-0 flex-1"
        style={{ color: row.color }}
      />
      <NumBox value={slider.max} onChange={(max) => onConfig({ ...slider, max })} />
    </div>
  );
}

function NumBox({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-11 rounded-[var(--radius-xs)] bg-transparent px-1 py-0.5 text-center font-mono text-ui-2xs tabular-nums outline-none focus:border-[var(--accent)]"
      style={{ color: "var(--fg-3)", border: "1px solid var(--hairline)" }}
    />
  );
}

function ProvenanceBadge({ provenance, deps }: { provenance: Provenance; deps: string[] }) {
  const label = SOURCE_LABEL[provenance.source];
  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-ui-2xs" style={{ color: "var(--fg-4)" }}>
      <span
        className="rounded-[var(--radius-xs)] px-1 py-px uppercase tracking-label"
        style={{ background: "var(--chrome-hover)", color: "var(--fg-3)" }}
        title={provenance.note ?? `Source: ${label}${provenance.origin ? ` · ${provenance.origin}` : ""}`}
      >
        {label}
      </span>
      {deps.length > 0 && (
        <span className="truncate font-mono" title={`depends on ${deps.join(", ")}`}>
          ← {deps.join(", ")}
        </span>
      )}
    </div>
  );
}

const SOURCE_LABEL: Record<Provenance["source"], string> = {
  user: "you",
  atlas: "atlas",
  example: "example",
  derived: "derived",
};

function StatusGlyph({ status }: { status: FactStatus | "error" }) {
  const map: Record<FactStatus | "error", { ch: string; varName: string }> = {
    computed: { ch: "✓", varName: "--fact-computed" },
    recognized: { ch: "≅", varName: "--fact-recognized" },
    user: { ch: "★", varName: "--fact-user" },
    pending: { ch: "○", varName: "--fact-pending" },
    error: { ch: "⚠", varName: "--red" },
  };
  const { ch, varName } = map[status];
  return <span style={{ color: `var(${varName})` }}>{ch}</span>;
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
