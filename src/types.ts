import { z } from "zod";

export type NodeKind = string;
export type Relation = string;
export type EdgeSource = "auto" | "verified";

export const SOURCE_DEPENDS_ON_TARGET = new Set([
  "requires",
  "uses",
  "assumes",
  "defined_by",
  "constructed_from",
  "subtype_of",
  "instance_of",
  "applied_to",
  "violates_assumption",
  "shows_necessity_of",
]);

const FIELD_EDGE_DIRECTIONS = new Set([
  "source_to_target",
  "target_to_source",
  "bidirectional",
]);

const IdSchema = z.string().trim().min(1);
const OptionalTextSchema = z.string().trim().default("");
const RequiredTextSchema = z.string().trim().min(1);
const StringArraySchema = z.array(z.string().trim().min(1)).default([]);

export const GraphDomainSchema = z.object({
  id: IdSchema,
  label: RequiredTextSchema,
  order: z.number().int().nonnegative(),
  color: RequiredTextSchema,
  tint: OptionalTextSchema,
  border: OptionalTextSchema,
});

export type GraphDomain = z.infer<typeof GraphDomainSchema>;

export const TopoNodeSchema = z.object({
  id: IdSchema,
  kind: z.string().trim().min(1),
  domainId: IdSchema,
  number: RequiredTextSchema,
  title: RequiredTextSchema,
  chapter: OptionalTextSchema,
  section: OptionalTextSchema,
  sectionTitle: OptionalTextSchema,
  topicCluster: RequiredTextSchema,
  originalText: OptionalTextSchema,
  formalStatement: OptionalTextSchema,
  mathematicalFormula: OptionalTextSchema,
  explanation: OptionalTextSchema,
  solution: OptionalTextSchema,
  statementDependencies: StringArraySchema,
  proofDependencies: StringArraySchema,
  tags: StringArraySchema,
  qualityFlags: StringArraySchema,
});

export type TopoNode = z.infer<typeof TopoNodeSchema>;
export type GraphNode = TopoNode;

export const TopoEdgeSchema = z.object({
  id: IdSchema,
  from: IdSchema,
  to: IdSchema,
  relation: z.string().trim().min(1),
  source: z.enum(["auto", "verified"]).default("auto"),
  confidence: z.number().min(0).max(1).default(1),
  label: OptionalTextSchema,
  dependencyClass: OptionalTextSchema,
  notes: OptionalTextSchema,
});

export type TopoEdge = z.infer<typeof TopoEdgeSchema>;
export type GraphEdge = TopoEdge;

export const TopoDataSchema = z
  .object({
    id: OptionalTextSchema,
    label: OptionalTextSchema,
    field: OptionalTextSchema,
    domains: z.array(GraphDomainSchema).default([]),
    nodes: z.array(TopoNodeSchema).default([]),
    edges: z.array(TopoEdgeSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const domainIds = new Set<string>();
    for (const domain of data.domains) {
      if (domainIds.has(domain.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["domains"],
          message: `Duplicate domain id: ${domain.id}`,
        });
      }
      domainIds.add(domain.id);
    }

    const nodeIds = new Set<string>();
    for (const node of data.nodes) {
      if (nodeIds.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes"],
          message: `Duplicate node id: ${node.id}`,
        });
      }
      nodeIds.add(node.id);
      if (domainIds.size > 0 && !domainIds.has(node.domainId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", node.id, "domainId"],
          message: `Node ${node.id} references missing domain: ${node.domainId}`,
        });
      }
    }

    const edgeIds = new Set<string>();
    for (const edge of data.edges) {
      if (edgeIds.has(edge.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["edges"],
          message: `Duplicate edge id: ${edge.id}`,
        });
      }
      edgeIds.add(edge.id);
      if (!nodeIds.has(edge.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["edges", edge.id, "from"],
          message: `Edge ${edge.id} references missing source node: ${edge.from}`,
        });
      }
      if (!nodeIds.has(edge.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["edges", edge.id, "to"],
          message: `Edge ${edge.id} references missing target node: ${edge.to}`,
        });
      }
    }
  });

export type TopoData = z.infer<typeof TopoDataSchema>;
export type GraphData = TopoData;

export const FieldItemSchema = z
  .object({
    id: IdSchema,
    label: RequiredTextSchema,
    kind: z.string().trim().min(1),
    domain: IdSchema,
    statement: z.string().nullable().optional(),
    formal_statement: z.string().nullable().optional(),
    definition: z.string().nullable().optional(),
    intuition: z.string().nullable().optional(),
    solution: z.string().nullable().optional(),
    notation: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),
    assumptions: z.array(z.string()).default([]),
    dependencies: z.record(z.array(z.string())).default({}),
    outgoing_relations: z.array(z.string()).default([]),
    metadata: z
      .object({
        tags: z.array(z.string()).default([]),
        syllabus_priority: z.string().default("medium"),
        source: z.string().nullable().optional(),
      })
      .default({ tags: [], syllabus_priority: "medium", source: null }),
  })
  .passthrough();

export const FieldEdgeSchema = z
  .object({
    id: IdSchema,
    source: IdSchema,
    target: IdSchema,
    type: z.string().trim().min(1),
    dependency_class: z.string().nullable().optional(),
    label: z.string().default(""),
    direction: z.string().default("source_to_target"),
    confidence: z.enum(["high", "medium", "low"]).default("medium"),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export const FieldJsonSchema = z
  .object({
    schema: z.unknown().optional(),
    graph: z
      .object({
        id: z.string(),
        label: z.string(),
        field: z.string(),
        model: z.string().optional(),
        design_notes: z.array(z.unknown()).default([]),
        domains: z.array(GraphDomainSchema),
        items: z.array(FieldItemSchema),
        edges: z.array(FieldEdgeSchema).default([]),
      })
      .passthrough(),
    views: z.unknown().optional(),
    query_model: z.unknown().optional(),
    example_queries: z.unknown().optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    const domainIds = new Set<string>();
    for (const domain of data.graph.domains) {
      if (domainIds.has(domain.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "domains"],
          message: `Duplicate domain id: ${domain.id}`,
        });
      }
      domainIds.add(domain.id);
    }
    const itemIds = new Set<string>();
    for (const item of data.graph.items) {
      if (itemIds.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "items"],
          message: `Duplicate item id: ${item.id}`,
        });
      }
      itemIds.add(item.id);
      if (!domainIds.has(item.domain)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "items", item.id, "domain"],
          message: `Item ${item.id} references missing domain: ${item.domain}`,
        });
      }
    }
    for (const item of data.graph.items) {
      for (const [dependencyClass, dependencyIds] of Object.entries(item.dependencies ?? {})) {
        for (const dependencyId of dependencyIds) {
          if (!itemIds.has(dependencyId)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["graph", "items", item.id, "dependencies", dependencyClass],
              message: `Item ${item.id} references missing dependency: ${dependencyId}`,
            });
          }
        }
      }
    }

    const edgeIds = new Set<string>();
    const semanticEdges = new Map<string, string>();
    for (const edge of data.graph.edges) {
      if (edgeIds.has(edge.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "edges"],
          message: `Duplicate edge id: ${edge.id}`,
        });
      }
      edgeIds.add(edge.id);

      if (!itemIds.has(edge.source)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "edges", edge.id, "source"],
          message: `Edge ${edge.id} references missing source item: ${edge.source}`,
        });
      }
      if (!itemIds.has(edge.target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "edges", edge.id, "target"],
          message: `Edge ${edge.id} references missing target item: ${edge.target}`,
        });
      }
      if (!FIELD_EDGE_DIRECTIONS.has(edge.direction)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "edges", edge.id, "direction"],
          message: `Edge ${edge.id} has unsupported direction: ${edge.direction}`,
        });
      }
      if (SOURCE_DEPENDS_ON_TARGET.has(edge.type) && edge.direction !== "source_to_target") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "edges", edge.id, "direction"],
          message: `Edge ${edge.id} relation ${edge.type} expects source_to_target direction`,
        });
      }

      const semanticKey = [
        edge.source,
        edge.target,
        edge.type,
        edge.dependency_class ?? "",
        edge.direction,
      ].join("\u0000");
      const existingEdgeId = semanticEdges.get(semanticKey);
      if (existingEdgeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["graph", "edges", edge.id],
          message: `Edge ${edge.id} duplicates semantic edge ${existingEdgeId}`,
        });
      } else {
        semanticEdges.set(semanticKey, edge.id);
      }
    }
  });

export type FieldJson = z.infer<typeof FieldJsonSchema>;
export type FieldItem = z.infer<typeof FieldItemSchema>;
export type FieldEdge = z.infer<typeof FieldEdgeSchema>;

function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const kindLabels = {
  definition: "Definition",
  theorem: "Theorem",
  lemma: "Lemma",
  example: "Example",
  proposition: "Proposition",
  corollary: "Corollary",
} as Record<string, string>;

export const KIND_LABEL = new Proxy(kindLabels, {
  get(target, prop) {
    if (typeof prop !== "string") return undefined;
    return target[prop] ?? titleCase(prop);
  },
}) as Record<string, string>;

const relationLabelBase = {
  statement: "Statement",
  proof: "Proof",
  illustration: "Illustration",
} as Record<string, string>;

export const RELATION_LABEL = new Proxy(relationLabelBase, {
  get(target, prop) {
    if (typeof prop !== "string") return undefined;
    return target[prop] ?? titleCase(prop);
  },
}) as Record<string, string>;

/** Single neutral hairline color for edges — domain accents live on nodes only. */
export const EDGE_COLOR = "rgba(0, 0, 0, 0.16)";
export const EDGE_COLOR_HIGHLIGHT = "#0A84FF";

export function parseTopoNode(input: unknown): TopoNode {
  return TopoNodeSchema.parse(input);
}
export function parseTopoEdge(input: unknown): TopoEdge {
  return TopoEdgeSchema.parse(input);
}
export function parseTopoData(input: unknown): TopoData {
  return TopoDataSchema.parse(input);
}
export function safeParseTopoData(input: unknown) {
  return TopoDataSchema.safeParse(input);
}
