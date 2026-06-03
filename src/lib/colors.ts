/**
 * Math Atlas 8-domain palette + domain→tone resolution.
 *
 * Design contract (single source of truth):
 *  - Every visible tone is a CSS variable, so all hues retune automatically
 *    across the four themes (paper / chalkboard / 3b1b light / 3b1b dark).
 *  - A domain's *hue* is chosen from its authored data, not its array position:
 *    an explicit `palette` key wins; otherwise the authored hex `color` is
 *    snapped to its nearest palette anchor. Domains without either fall back to
 *    an ordered sweep. Assignment keeps hues distinct (a permutation while the
 *    domain count stays within the 8-hue palette), so adjacent clusters never
 *    collide.
 *  - Resolution is pure: `resolveDomainTones` takes the domains and returns a
 *    Map. A small module registry is primed from that result purely as a
 *    convenience for the many call sites that only hold a bare `domainId`.
 */

import type { GraphDomain } from "../types";

export interface DomainTone {
  /** Solid color (stroke, ID, dot, rail). */
  color: string;
  /** Pastel tint for region/cluster fills and chip backgrounds. */
  tint: string;
  /** Soft border weight for region outlines and chip borders. */
  border: string;
  /** Theme-adaptive ink for text sitting on `tint` (deepened for contrast). */
  text: string;
  /** Stable palette key. */
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

/** Palette order — also the fallback sweep order for domains with no hue hint. */
export const DOMAIN_KEYS: DomainKey[] = [
  "blue",
  "green",
  "purple",
  "red",
  "teal",
  "orange",
  "pink",
  "gold",
];

function makeTone(key: DomainKey): DomainTone {
  return {
    key,
    color: `var(--${key})`,
    tint: `var(--${key}-50)`,
    border: `var(--${key}-200)`,
    // Deepen the hue toward the page ink so it stays legible on the pale tint in
    // light themes and lifts off dark surfaces in dark themes — no per-theme
    // token needed because --fg-1 already flips with the scheme.
    text: `color-mix(in srgb, var(--${key}) 78%, var(--fg-1))`,
  };
}

const TONES: Record<DomainKey, DomainTone> = Object.fromEntries(
  DOMAIN_KEYS.map((key) => [key, makeTone(key)]),
) as Record<DomainKey, DomainTone>;

/**
 * Canonical light-theme RGB anchor per palette key. Used only to snap an
 * authored hex `color` to its nearest hue — the rendered value is still the
 * CSS variable, so this never freezes a domain to light-theme values.
 */
const ANCHORS: Record<DomainKey, [number, number, number]> = {
  blue: [0x25, 0x63, 0xeb],
  green: [0x16, 0xa3, 0x4a],
  purple: [0x7c, 0x3a, 0xed],
  red: [0xdc, 0x26, 0x26],
  teal: [0x0d, 0x94, 0x88],
  orange: [0xf9, 0x73, 0x16],
  pink: [0xdb, 0x27, 0x77],
  gold: [0xea, 0xb3, 0x08],
};

function parseHex(value: string | undefined): [number, number, number] | null {
  if (!value) return null;
  const match = value.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const hex = match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

/** Squared perceptual-ish distance (luma-weighted) between two RGB triples. */
function colorDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = (a[0] - b[0]) * 0.3;
  const dg = (a[1] - b[1]) * 0.59;
  const db = (a[2] - b[2]) * 0.11;
  return dr * dr + dg * dg + db * db;
}

function explicitKey(domain: GraphDomain): DomainKey | null {
  const candidate = (domain as { palette?: string }).palette?.trim().toLowerCase();
  if (candidate && candidate in TONES) return candidate as DomainKey;
  return null;
}

/**
 * Resolve a distinct palette key for every domain, honoring authored intent.
 *
 * 1. Domains with an explicit `palette` key are pinned first.
 * 2. Remaining domains with an authored hex `color` are matched to their
 *    nearest free anchor, processed closest-match-first so the strongest
 *    intent wins the contested hue and weaker matches spill to their next best.
 * 3. Anything left sweeps `DOMAIN_KEYS` in `order`, taking the next free hue.
 * 4. Past 8 domains the palette wraps by order index.
 */
export function resolveDomainTones(
  domains: GraphDomain[],
): Map<string, DomainTone> {
  const ordered = [...domains].sort(
    (a, b) => a.order - b.order || a.label.localeCompare(b.label),
  );
  const result = new Map<string, DomainTone>();
  const freeKeys = new Set<DomainKey>(DOMAIN_KEYS);

  const assign = (id: string, key: DomainKey) => {
    result.set(id, TONES[key]);
    freeKeys.delete(key);
  };

  // 1. Explicit palette keys.
  const remaining: GraphDomain[] = [];
  for (const domain of ordered) {
    const key = explicitKey(domain);
    if (key && freeKeys.has(key)) assign(domain.id, key);
    else remaining.push(domain);
  }

  // 2. Nearest-anchor matching for hex colors, closest pair first.
  const candidates: { id: string; key: DomainKey; dist: number }[] = [];
  const noColor: GraphDomain[] = [];
  for (const domain of remaining) {
    const rgb = parseHex(domain.color);
    if (!rgb) {
      noColor.push(domain);
      continue;
    }
    for (const key of DOMAIN_KEYS) {
      candidates.push({ id: domain.id, key, dist: colorDistance(rgb, ANCHORS[key]) });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist);
  for (const { id, key } of candidates) {
    if (result.has(id) || !freeKeys.has(key)) continue;
    assign(id, key);
  }

  // 3 + 4. Ordered sweep for the rest, wrapping once the palette is exhausted.
  const colorless = [...noColor, ...remaining.filter((d) => !result.has(d.id))];
  let sweep = 0;
  colorless.forEach((domain, index) => {
    if (result.has(domain.id)) return;
    while (sweep < DOMAIN_KEYS.length && !freeKeys.has(DOMAIN_KEYS[sweep])) sweep++;
    const key =
      sweep < DOMAIN_KEYS.length
        ? DOMAIN_KEYS[sweep]
        : DOMAIN_KEYS[index % DOMAIN_KEYS.length];
    assign(domain.id, key);
  });

  return result;
}

// --- Bare-id registry -------------------------------------------------------
// Many components only carry a `domainId`. They read from this registry, which
// the active map primes via `registerDomainTones` (see App.tsx / buildLoadedMap)
// before first paint. Resolution itself stays pure (above).

const registry = new Map<string, DomainTone>();

function hash(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Resolve the active map's domains and publish them to the bare-id registry. */
export function registerDomainTones(
  domains: GraphDomain[],
): Map<string, DomainTone> {
  const resolved = resolveDomainTones(domains);
  for (const [id, tone] of resolved) registry.set(id, tone);
  return resolved;
}

export function getDomainTone(domainId: string): DomainTone {
  const registered = registry.get(domainId);
  if (registered) return registered;
  // Deterministic fallback if a tone is requested before its map registered.
  return TONES[DOMAIN_KEYS[hash(domainId) % DOMAIN_KEYS.length]];
}

function mixColor(color: string, weight: number, against: string): string {
  return `color-mix(in srgb, ${color} ${weight}%, ${against})`;
}

/** Desaturated variant for the minimap, where tones must recede behind nodes. */
export function getMutedDomainTone(domainId: string): DomainTone {
  const tone = getDomainTone(domainId);
  return {
    ...tone,
    color: mixColor(tone.color, 62, "var(--fg-2)"),
    tint: mixColor(tone.tint, 40, "var(--surface)"),
    border: mixColor(tone.border, 46, "var(--border)"),
  };
}

export function clearDomainToneCache(): void {
  registry.clear();
}
