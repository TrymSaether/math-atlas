export const DATA_URL = "/topology_dictionary.json";

export const STORAGE_THEME_KEY = "math-map-theme";

export const CHAPTERS = {
  "2": "Continuous maps & metric spaces",
  "3": "Topological spaces",
  "4": "Generating topologies",
  "5": "Subspaces, products & quotients",
  "6": "Connectedness, Hausdorff & compactness",
  "7": "The fundamental group",
  "8": "Covering spaces & π₁(S¹)",
  A: "Appendix A — Set theory",
  B: "Appendix B — Elementary algebra",
} as const;

export const CHAPTER_ORDER = ["2", "3", "4", "5", "6", "7", "8", "A", "B"] as const;

export const KIND_ORDER: Record<string, number> = {
  Definition: 0,
  Theorem: 1,
  Lemma: 2,
  Corollary: 3,
  Concept: 4,
};

export const KIND_FILTERS = ["all", "Definition", "Theorem", "Lemma", "Corollary"] as const;
