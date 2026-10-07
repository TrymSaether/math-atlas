export const DOMAIN_PALETTE_KEYS = [
  "blue",
  "orange",
  "green",
  "magenta",
  "teal",
  "red",
  "purple",
  "gold",
  "cyan",
  "brown",
  "pink",
  "lime",
  "indigo",
  "coral",
  "mint",
  "violet",
  "amber",
  "sky",
  "rose",
  "slate",
] as const;

export type DomainKey = (typeof DOMAIN_PALETTE_KEYS)[number];

export function isDomainKey(value: string): value is DomainKey {
  return (DOMAIN_PALETTE_KEYS as readonly string[]).includes(value);
}
