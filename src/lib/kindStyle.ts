import { nodeKindColors, palette } from "./colors";

const paletteCycle = [
  palette.cyan,
  palette.violet,
  palette.mint,
  palette.gold,
  palette.rose,
  palette.orange,
];

function colorForUnknown(value: string): string {
  let hash = 0;
  for (const ch of value) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return paletteCycle[hash % paletteCycle.length];
}

export function getKindColor(kind: string): string {
  return (
    (nodeKindColors as Record<string, string>)[kind] ?? colorForUnknown(kind)
  );
}

export function getKindTier(kind: string): "primary" | "secondary" | "compact" {
  if (["definition", "theorem", "structure", "object"].includes(kind))
    return "primary";
  if (
    [
      "lemma",
      "proposition",
      "corollary",
      "property",
      "construction",
      "proof",
    ].includes(kind)
  )
    return "secondary";
  return "compact";
}
