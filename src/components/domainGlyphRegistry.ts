import type { MapId } from "../data";

export type DomainGlyphKey =
  | "generic-foundations"
  | "generic-examples"
  | "topology-continuity"
  | "topology-connectedness"
  | "topology-fundamental-group"
  | "topology-covering-spaces"
  | "topology-compactness"
  | "topology-homotopy"
  | "fourier-foundations"
  | "fourier-series"
  | "fourier-convergence"
  | "fourier-transform"
  | "fourier-distributions"
  | "fourier-discrete"
  | "fourier-applications"
  | "fourier-number-theory";

const GLOBAL_DOMAIN_GLYPHS: Record<string, DomainGlyphKey> = {
  examples_counterexamples: "generic-examples",
  examples_applications: "generic-examples",
};

const MAP_DOMAIN_GLYPHS: Partial<Record<MapId, Record<string, DomainGlyphKey>>> = {
  topology: {
    foundations: "generic-foundations",
    spaces_constructions: "topology-covering-spaces",
    continuity: "topology-continuity",
    compactness: "topology-compactness",
    connectedness: "topology-connectedness",
    separation_countability: "topology-homotopy",
    algebraic_topology: "topology-fundamental-group",
  },
  fourier_analysis: {
    foundations: "fourier-foundations",
    series: "fourier-series",
    convergence: "fourier-convergence",
    transform: "fourier-transform",
    distributions: "fourier-distributions",
    discrete: "fourier-discrete",
    applications: "fourier-applications",
    dirichlet: "fourier-number-theory",
  },
  functional_analysis: {
    spaces_norms: "topology-covering-spaces",
    examples_applications: "generic-examples",
  },
};

/** Resolve a domain id to a glyph, or `null` when none fits. */
export function getDomainGlyphId({ mapId, domainId }: { mapId?: MapId; domainId: string }): DomainGlyphKey | null {
  const mapExact = mapId ? MAP_DOMAIN_GLYPHS[mapId]?.[domainId] : undefined;
  if (mapExact) return mapExact;

  const globalExact = GLOBAL_DOMAIN_GLYPHS[domainId];
  if (globalExact) return globalExact;

  if (domainId.includes("example")) return "generic-examples";
  if (domainId.includes("foundation")) return "generic-foundations";
  return null;
}
