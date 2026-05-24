/** Apple Maps–inspired palette: soft pastel tints per domain, neutral nodes, blue accent for selection. */

export const APPLE_BLUE = "#0A84FF";
export const APPLE_BLUE_SOFT = "#E6F0FF";
export const CANVAS_BG = "#F7F5F0";
export const INK_900 = "#1C1C1E";
export const INK_700 = "#3A3A3C";
export const INK_500 = "#6E6E73";
export const INK_300 = "#AEAEB2";
export const INK_100 = "#E5E5EA";
export const HAIRLINE = "rgba(0, 0, 0, 0.08)";

interface DomainTone {
  color: string;
  tint: string;
  border: string;
}

/** Soft pastel palette used to color domain accents. Order is cycled deterministically per field. */
const DOMAIN_TONES: DomainTone[] = [
  { color: "#3A82F7", tint: "#E7F0FE", border: "#C9DCFB" }, // blue
  { color: "#34A853", tint: "#E7F5EA", border: "#C7E4CD" }, // green
  { color: "#E07A4B", tint: "#FBEDE3", border: "#F2D2BC" }, // peach
  { color: "#8E5BD9", tint: "#F0E8FB", border: "#DBC9F0" }, // lilac
  { color: "#D9A441", tint: "#F8EFD8", border: "#ECDAA8" }, // amber
  { color: "#3FA9B5", tint: "#E1F2F4", border: "#BCDEE2" }, // teal
  { color: "#D55F88", tint: "#FAE3EC", border: "#F0C5D5" }, // rose
  { color: "#7E8A99", tint: "#EEF1F3", border: "#D6DCE2" }, // slate
  { color: "#A78A6B", tint: "#F2ECE3", border: "#DCCBB3" }, // sand
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

export function getDomainTone(domainId: string, fallbackIndex?: number): DomainTone {
  const cached = domainToneCache.get(domainId);
  if (cached) return cached;
  const idx =
    typeof fallbackIndex === "number"
      ? fallbackIndex
      : hash(domainId);
  const tone = DOMAIN_TONES[idx % DOMAIN_TONES.length];
  domainToneCache.set(domainId, tone);
  return tone;
}

/** Assign tones in domain-order so adjacent domains do not collide visually. */
export function assignDomainTones(domainIds: string[]): Map<string, DomainTone> {
  const result = new Map<string, DomainTone>();
  domainIds.forEach((id, index) => {
    const tone = DOMAIN_TONES[index % DOMAIN_TONES.length];
    result.set(id, tone);
    domainToneCache.set(id, tone);
  });
  return result;
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

export function rgbaFromHex(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
