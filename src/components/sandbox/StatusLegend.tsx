/** Bottom-right status legend: the fact-status glyph vocabulary. */
export function StatusLegend() {
  const items: { glyph: string; label: string; color: string }[] = [
    { glyph: "✓", label: "computed", color: "var(--fact-computed)" },
    { glyph: "≅", label: "recognized", color: "var(--fact-recognized)" },
    { glyph: "★", label: "user", color: "var(--fact-user)" },
  ];
  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-3.5 rounded-md border px-3 py-1.5"
      style={{
        background: "color-mix(in srgb, var(--surface) 92%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-ui-xs" style={{ color: "var(--fg-2)" }}>
          <span style={{ color: it.color }}>{it.glyph}</span>
          {it.label}
        </span>
      ))}
    </div>
  );
}
