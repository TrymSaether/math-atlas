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
  | "gold"
  | "brown"
  | "cyan"
  | "magenta";

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
  "brown",
  "cyan",
  "magenta",
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

function explicitKey(domain: GraphDomain): DomainKey | null {
  const candidate = (domain as { palette?: string }).palette
    ?.trim()
    .toLowerCase();
  if (candidate && candidate in TONES) return candidate as DomainKey;
  return null;
}

/**
 * Resolve a distinct palette key for every domain, honoring authored intent.
 *
 * 1. Domains with an explicit `palette` key are pinned first.
 * 2. Any whose key was already taken sweep `DOMAIN_KEYS` in `order`, taking the
 *    next free hue, wrapping by order index past 8 domains.
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

  // Ordered sweep for domains whose explicit palette key was already taken,
  // wrapping once the palette is exhausted. (Domains always carry a palette key
  // now, so step 1 handles the common case; this only resolves collisions.)
  const colorless = remaining.filter((d) => !result.has(d.id));
  let sweep = 0;
  colorless.forEach((domain, index) => {
    if (result.has(domain.id)) return;
    while (sweep < DOMAIN_KEYS.length && !freeKeys.has(DOMAIN_KEYS[sweep]))
      sweep++;
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
