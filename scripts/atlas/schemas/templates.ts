/**
 * JSON skeletons for `atlas new`. Each returns a source-shaped object the strict
 * SourceGraphSchema will accept once the author fills the TeX in. Kind drives
 * which content facets are pre-stubbed (a theorem gets statement+proof, a
 * definition gets definition, etc.).
 */
import type { SourceConcept, SourceDomain } from "@shared/maps/source";

export type NewKind =
  | "theorem"
  | "definition"
  | "proof"
  | "construction"
  | "example"
  | "exercise"
  | "lemma"
  | "corollary";

/** Empty-but-valid concept skeleton; TeX bodies are placeholders to fill in. */
export function conceptTemplate(kind: NewKind | string, id: string, domain: string, label: string): SourceConcept {
  const c: SourceConcept = {
    id,
    kind: kind as SourceConcept["kind"],
    domain,
    label,
    content: { notation: [] },
    examples: [],
    assumptions: [],
    properties: [],
    tags: [],
    priority: "standard",
  };

  switch (kind) {
    case "theorem":
    case "lemma":
    case "corollary":
      c.content.statement = "TODO: informal statement";
      c.content.formal = "TODO: $\\text{formal statement}$";
      c.proof = {
        steps: [{ role: "setup", content: "TODO: proof", uses: [] }],
      };
      break;
    case "definition":
      c.content.definition = "TODO: genus and differentia";
      c.content.intuition = "TODO: intuition";
      break;
    case "construction":
      c.content.statement = "TODO: what is built and from what";
      break;
    case "example":
      c.kind = "example" as SourceConcept["kind"];
      c.content.statement = "TODO: the example";
      break;
    case "exercise":
      c.content.statement = "TODO: problem statement";
      c.proof = {
        steps: [{ role: "setup", content: "TODO: solution", uses: [] }],
      };
      break;
    case "proof":
      c.proof = { steps: [{ role: "setup", content: "TODO: step", uses: [] }] };
      break;
    default:
      c.content.statement = "TODO";
  }
  return c;
}

export function domainTemplate(id: string, label: string, order: number, palette = "blue"): SourceDomain {
  return { id, label, order, palette: palette as SourceDomain["palette"] };
}
