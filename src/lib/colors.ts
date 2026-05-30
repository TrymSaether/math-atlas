/**
 * Math Atlas 8-domain palette.
 * Each tone carries: solid color, pastel tint (region fill), soft border.
 * All values are CSS variables so they automatically retune across light/dark themes.
 */

export interface DomainTone {
  /** Solid color (text, stroke, ID, dot) */
  color: string;
  /** Pastel tint for region/cluster fills */
  tint: string;
  /** Soft border weight for region outlines */
  border: string;
  /** Stable key (for inline classes if needed) */
  key: DomainKey;
}

export type DomainKey =
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "teal"
  | "orange"
  | "pink"
  | "gold";

const PALETTE: DomainTone[] = [
  {
    key: "blue",
    color: "var(--blue)",
    tint: "var(--blue-50)",
    border: "var(--blue-200)",
  },
  {
    key: "green",
    color: "var(--green)",
    tint: "var(--green-50)",
    border: "var(--green-200)",
  },
  {
    key: "purple",
    color: "var(--purple)",
    tint: "var(--purple-50)",
    border: "var(--purple-200)",
  },
  {
    key: "red",
    color: "var(--red)",
    tint: "var(--red-50)",
    border: "var(--red-200)",
  },
  {
    key: "teal",
    color: "var(--teal)",
    tint: "var(--teal-50)",
    border: "var(--teal-200)",
  },
  {
    key: "orange",
    color: "var(--orange)",
    tint: "var(--orange-50)",
    border: "var(--orange-200)",
  },
  {
    key: "pink",
    color: "var(--pink)",
    tint: "var(--pink-50)",
    border: "var(--pink-200)",
  },
  {
    key: "gold",
    color: "var(--gold)",
    tint: "var(--gold-50)",
    border: "var(--gold-200)",
  },
];

function hash(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const domainToneCache = new Map<string, DomainTone>();

function mixColor(color: string, weight: number, against: string): string {
  return `color-mix(in srgb, ${color} ${weight}%, ${against})`;
}

export function getDomainTone(
  domainId: string,
  fallbackIndex?: number,
): DomainTone {
  const cached = domainToneCache.get(domainId);
  if (cached) return cached;
  const idx =
    typeof fallbackIndex === "number" ? fallbackIndex : hash(domainId);
  const tone = PALETTE[idx % PALETTE.length];
  domainToneCache.set(domainId, tone);
  return tone;
}

export function getMutedDomainTone(
  domainId: string,
  fallbackIndex?: number,
): DomainTone {
  const tone = getDomainTone(domainId, fallbackIndex);
  return {
    ...tone,
    color: mixColor(tone.color, 62, "var(--fg-2)"),
    tint: mixColor(tone.tint, 40, "var(--surface)"),
    border: mixColor(tone.border, 46, "var(--border)"),
  };
}

/** Assign tones in domain-order so adjacent domains do not collide visually. */
export function assignDomainTones(
  domainIds: string[],
): Map<string, DomainTone> {
  const result = new Map<string, DomainTone>();
  domainIds.forEach((id, index) => {
    const tone = PALETTE[index % PALETTE.length];
    result.set(id, tone);
    domainToneCache.set(id, tone);
  });
  return result;
}

export function clearDomainToneCache(): void {
  domainToneCache.clear();
}
