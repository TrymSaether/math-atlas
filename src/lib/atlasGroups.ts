import { atlasColors, hexToRgbString, palette } from "./colors";

export type AtlasGroup = {
  id: string;
  label: string;
  color: string;
  rgb: string;
  icon: string;
};

const GROUP_ALIASES: Record<string, Omit<AtlasGroup, "rgb">> = {
  foundations: { id: "foundations", label: "Foundations", color: atlasColors.foundations, icon: "book" },
  foundation: { id: "foundations", label: "Foundations", color: atlasColors.foundations, icon: "book" },
  topology: { id: "foundations", label: "Foundations", color: atlasColors.foundations, icon: "book" },

  continuity: { id: "continuity", label: "Continuity", color: atlasColors.continuity, icon: "waves" },
  convergence: { id: "continuity", label: "Continuity", color: atlasColors.continuity, icon: "waves" },

  connectedness: { id: "connectedness", label: "Connectedness", color: atlasColors.connectedness, icon: "link" },
  connected: { id: "connectedness", label: "Connectedness", color: atlasColors.connectedness, icon: "link" },

  compactness: { id: "compactness", label: "Compactness", color: atlasColors.compactness, icon: "network" },
  compact: { id: "compactness", label: "Compactness", color: atlasColors.compactness, icon: "network" },

  "fundamental group": { id: "fundamental_group", label: "Fundamental Group", color: atlasColors.fundamentalGroup, icon: "target" },
  fundamental_group: { id: "fundamental_group", label: "Fundamental Group", color: atlasColors.fundamentalGroup, icon: "target" },
  homotopy: { id: "homotopy", label: "Homotopy", color: atlasColors.homotopy, icon: "loop" },

  "covering spaces": { id: "covering_spaces", label: "Covering Spaces", color: atlasColors.coveringSpaces, icon: "layers" },
  covering_spaces: { id: "covering_spaces", label: "Covering Spaces", color: atlasColors.coveringSpaces, icon: "layers" },
  covering: { id: "covering_spaces", label: "Covering Spaces", color: atlasColors.coveringSpaces, icon: "layers" },

  examples: { id: "examples", label: "Examples", color: atlasColors.examples, icon: "star" },
  example: { id: "examples", label: "Examples", color: atlasColors.examples, icon: "star" },
};

const fallbackColors = [
  palette.blue,
  palette.mint,
  palette.violet,
  palette.orange,
  palette.teal,
  palette.rose,
  palette.gold,
];

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function colorFor(value: string): string {
  let hash = 0;
  for (const ch of value) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return fallbackColors[hash % fallbackColors.length];
}

export function getAtlasGroup(topic: string): AtlasGroup {
  const key = topic.trim().toLowerCase();
  const normalized = slug(topic);
  const known = GROUP_ALIASES[key] ?? GROUP_ALIASES[normalized];
  const group = known ?? {
    id: normalized || "general",
    label: titleCase(topic || "General"),
    color: colorFor(topic || "general"),
    icon: "circle",
  };

  return {
    ...group,
    rgb: hexToRgbString(group.color),
  };
}
