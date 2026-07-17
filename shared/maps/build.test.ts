import { describe, expect, it } from "vitest";
import { buildArtifact } from "./build.ts";
import { SourceGraphSchema, type SourceConcept, type SourceEdge, type SourceGraph } from "./source.ts";

function concept(id: string, overrides: Partial<SourceConcept> = {}): SourceConcept {
  return {
    id,
    kind: "definition",
    domain: "core",
    label: id,
    content: { notation: [] },
    examples: [],
    assumptions: [],
    properties: [],
    tags: [],
    priority: "standard",
    ...overrides,
  };
}

function graph(concepts: SourceConcept[], edges: SourceEdge[] = []): SourceGraph {
  return {
    id: "test_map",
    label: "Test map",
    field: "Tests",
    version: 1,
    updated: "2026-06-27",
    domains: [{ id: "core", label: "Core", order: 0, palette: "blue" }],
    concepts,
    edges,
  };
}

function issueMessages(input: unknown): string[] {
  const result = SourceGraphSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("buildArtifact characterization", () => {
  it("orients an authored dependency from prerequisite to dependent and derives its id", () => {
    const source = graph(
      [concept("foundation"), concept("result")],
      [{ source: "result", target: "foundation", relation: "uses" }],
    );

    const { artifact } = buildArtifact(source);

    expect(artifact.edges).toEqual([
      {
        id: "e_foundation__uses__result",
        from: "foundation",
        to: "result",
        relation: "uses",
        isDependency: true,
        scope: "statement",
      },
    ]);
  });

  it("computes degree and longest prerequisite depth", () => {
    const source = graph(
      [concept("a"), concept("b"), concept("c")],
      [
        { source: "b", target: "a", relation: "uses" },
        { source: "c", target: "b", relation: "uses" },
      ],
    );

    const { artifact } = buildArtifact(source);
    const metrics = Object.fromEntries(
      artifact.nodes.map((node) => [node.id, { degree: node.degree, depth: node.depth }]),
    );

    expect(metrics).toEqual({
      a: { degree: 1, depth: 0 },
      b: { degree: 2, depth: 1 },
      c: { degree: 1, depth: 2 },
    });
  });

  it("deduplicates a symmetric relation regardless of authored direction", () => {
    const source = graph(
      [concept("alpha"), concept("beta")],
      [
        { source: "alpha", target: "beta", relation: "related_to" },
        { source: "beta", target: "alpha", relation: "related_to" },
      ],
    );

    const { artifact } = buildArtifact(source);

    expect(artifact.edges).toHaveLength(1);
    expect(artifact.edges[0]).toMatchObject({ from: "alpha", to: "beta", relation: "related_to" });
  });

  it("adds proof-only dependencies and suppresses pairs already required by the statement", () => {
    const source = graph(
      [
        concept("foundation"),
        concept("helper"),
        concept("theorem", {
          kind: "theorem",
          proof: {
            steps: [{ role: "argument", content: "Apply both facts.", uses: ["foundation", "helper"] }],
          },
        }),
      ],
      [{ source: "theorem", target: "foundation", relation: "uses" }],
    );

    const { artifact } = buildArtifact(source);

    expect(artifact.proofEdges).toEqual([
      {
        id: "ep_helper__uses__theorem",
        from: "helper",
        to: "theorem",
        relation: "uses",
        isDependency: true,
        scope: "proof",
      },
    ]);
  });
});

describe("SourceGraphSchema characterization", () => {
  it("accepts a minimal valid graph and applies source defaults", () => {
    const input = {
      id: "test_map",
      label: "Test map",
      field: "Tests",
      version: 1,
      updated: "2026-06-27",
      domains: [{ id: "core", label: "Core", order: 0, palette: "blue" }],
      concepts: [{ id: "alpha", kind: "definition", domain: "core", label: "Alpha" }],
    };

    const parsed = SourceGraphSchema.parse(input);

    expect(parsed.concepts[0]).toMatchObject({
      content: { notation: [] },
      examples: [],
      assumptions: [],
      properties: [],
      tags: [],
      priority: "standard",
    });
    expect(parsed.edges).toEqual([]);
  });

  it("rejects edges that reference missing concepts", () => {
    const input = graph([concept("alpha")], [{ source: "alpha", target: "missing", relation: "uses" }]);

    expect(issueMessages(input)).toContain("Edge references missing target concept: missing");
  });

  it("rejects circular dependency graphs", () => {
    const input = graph(
      [concept("alpha"), concept("beta")],
      [
        { source: "alpha", target: "beta", relation: "uses" },
        { source: "beta", target: "alpha", relation: "uses" },
      ],
    );

    expect(issueMessages(input).some((message) => message.startsWith("Circular dependency among concepts:"))).toBe(
      true,
    );
  });

  it("rejects a generic uses edge subsumed by a specific dependency", () => {
    const input = graph(
      [concept("alpha"), concept("beta")],
      [
        { source: "alpha", target: "beta", relation: "uses" },
        { source: "alpha", target: "beta", relation: "defined_in_terms_of" },
      ],
    );

    expect(issueMessages(input)).toContain(
      "Redundant 'uses' edge alpha → beta: subsumed by 'defined_in_terms_of' on the same pair",
    );
  });
});
