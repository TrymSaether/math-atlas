import type { CHAPTERS } from "./constants";

export type ChapterId = keyof typeof CHAPTERS;
export type FilterValue = "all" | string;
export type SortMode = "alpha" | "chapter" | "kind";

export interface DictionaryEntry {
  id: string;
  term: string;
  kind: string;
  ref: string;
  chapter: ChapterId;
  statement: string;
  gloss: string;
  example: string;
  related: string[];
  diagramPath?: string;
  diagramAlt?: string;
}
