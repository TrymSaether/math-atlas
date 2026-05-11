import { z } from "zod";

export const NodeKind = z.enum([
  "definition", "theorem", "lemma", "example", "proposition", "corollary",
]);
export type NodeKind = z.infer<typeof NodeKind>;

export const Relation = z.enum(["statement", "proof", "illustration"]);
export type Relation = z.infer<typeof Relation>;

export const TopoNode = z.object({
  id: z.string(),
  kind: NodeKind,
  number: z.string(),
  title: z.string(),
  chapter: z.string(),
  section: z.string(),
  sectionTitle: z.string(),
  topicCluster: z.string(),
  originalText: z.string(),
  explanation: z.string().default(""),
  statementDependencies: z.array(z.string()).default([]),
  proofDependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});
export type TopoNode = z.infer<typeof TopoNode>;

export const TopoEdge = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  relation: Relation,
  source: z.enum(["auto", "verified"]),
  confidence: z.number().min(0).max(1),
});
export type TopoEdge = z.infer<typeof TopoEdge>;

export const TopoData = z.object({
  nodes: z.array(TopoNode),
  edges: z.array(TopoEdge),
});
export type TopoData = z.infer<typeof TopoData>;

export const KIND_LABEL: Record<NodeKind, string> = {
  definition: "Definition",
  theorem: "Theorem",
  lemma: "Lemma",
  example: "Example",
  proposition: "Proposition",
  corollary: "Corollary",
};

export const RELATION_COLOR: Record<Relation, string> = {
  statement: "#5ce1ff",
  proof: "#a78bff",
  illustration: "#ffd58a",
};
