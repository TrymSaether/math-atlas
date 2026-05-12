# Topology graph dataset cleanup

This branch documents a completed cleanup/enrichment pass for the topology concept-map dataset.

## Source files used

- `data/topology.raw.json`
- `data/topology.verified.json`
- `topology.pdf`

The repository already contains these sources, including the PDF, verified dependency data, extraction scripts, and React graph components.

## Main corrections

- Removed a false duplicate node: an extracted `Theorem 3.16` fragment that was actually continuation text from the proof of `Theorem 3.23`.
- Redirected mistaken dependency edges from that fragment to the real `Theorem 3.16: Composition of continuous maps`.
- Merged raw auto-extracted edges with verified edges, with verified edges taking precedence by endpoint pair.
- Rejected verified edges below confidence `0.7`.
- Added deterministic edge IDs.
- Normalized labels, whitespace, page artifacts, chapter groups, statement text, and concept-map priority metadata.
- Validated node IDs, edge endpoints, edge IDs, and duplicate theorem/definition numbering.

## Cleaned graph counts

| Item | Count |
|---|---:|
| Raw nodes | 227 |
| Clean nodes | 226 |
| Raw auto edges | 95 |
| Verified edges input | 306 |
| Verified edges accepted | 306 |
| Clean edges | 376 |
| Removed nodes | 1 |
| Validation errors | 0 |

## Enrichment pass

The second pass added graph-analysis and learning-map metadata:

| Item | Count |
|---|---:|
| Nodes | 226 |
| Edges | 376 |
| Weak components | 36 |
| Largest component size | 191 |
| Dependency cycles found | 0 |
| Review-worthy edges flagged | 71 |
| Core map nodes | 60 |
| Core map edges | 109 |

## Semantic layers added

- `metric-foundations`
- `topological-core`
- `generated-topologies`
- `constructions`
- `properties`
- `homotopy`
- `fundamental-group`
- `covering-spaces`
- `algebra`
- `applications`

## Most important bridge concepts detected

1. Topological spaces
2. Continuous maps between topological spaces
3. Closed subsets
4. Product topology
5. Homotopy
6. Connected space
7. Path-connected space
8. Homeomorphisms
9. Quotient space
10. Pasting lemma

## Recommended next steps

1. Add the cleaned JSON as `src/data/topology.json` after confirming the app should consume the enriched-but-schema-compatible form.
2. Review the 71 flagged edges, especially low-confidence auto edges and edges that move backward across semantic layers.
3. Add UI filters for `semanticLayer`, `pedagogicalRole`, `conceptMapPriority`, and `reviewFlags`.
4. Consider displaying the 60-node core concept map as the default view and allowing users to expand into examples and proof dependencies.

## Notes on app compatibility

The current app schema in `src/types.ts` accepts the existing node and edge fields. The enriched dataset adds extra metadata fields. Since the current Zod objects are not strict, unknown metadata fields should be stripped during parsing unless the schema is extended. To expose the enrichment in the UI, extend `TopoNode` and `TopoEdge` with optional metadata fields rather than relying on implicit stripping.
