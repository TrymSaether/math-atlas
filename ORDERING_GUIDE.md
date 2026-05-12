# Node Ordering Improvements

## Overview

The graph utility has been enhanced with conceptual flow ordering that groups nodes by topic and complexity level, making the concept flow more intuitive and educational.

## New Functions in `src/lib/graph.ts`

### Core Comparison Functions

- **`cmpConceptualFlow(a, b)`** - Compare nodes by topic cluster → node kind → chapter
- **`cmpNum(a, b)`** - Compare nodes by chapter/section (original textbook order)

### Sorting Functions

- **`topoSortWith(nodeIds, adj, allNodes, comparator)`** - Topological sort with custom comparator
- **`topoSort(...)`** - Topological sort using numeric order (default)
- **`sortNodesConceptually(nodes)`** - Sort all nodes by conceptual flow
- **`sortNodesNumeric(nodes)`** - Sort all nodes by chapter order

### Learning Path Functions

- **`buildLearningPathConceptual(targetId, edges, allowed, nodes)`** - Build prerequisite chain using conceptual ordering
- **`buildLearningPath(...)`** - Build prerequisite chain using numeric ordering (original)

## Topic Cluster Priority (Conceptual Flow Order)

1. **Overture** (2 nodes) - Introduction & motivation
2. **Set Theory** (15 nodes) - Foundational concepts
3. **Algebra** (21 nodes) - Algebraic structures
4. **Metric Foundations** (12 nodes) - Metric spaces basics
5. **Topological Spaces** (35 nodes) - Core topology
6. **Generating Topologies** (16 nodes) - Bases & subbases
7. **Constructions** (26 nodes) - Subspaces, products, quotients
8. **Topological Properties** (43 nodes) - Compactness, connectedness, etc.
9. **Fundamental Group** (38 nodes) - Algebraic topology
10. **Fundamental Group of S¹** (18 nodes) - Specific example

## Node Kind Priority (Within Cluster)

1. **definition** - Core concepts first
2. **lemma** - Supporting lemmas
3. **theorem** - Main results
4. **example** - Illustrations
5. **remark** - Commentary
6. **exercise** - Exercises

## Usage Examples

### Example 1: Sort all nodes conceptually

```typescript
import { sortNodesConceptually } from "./lib/graph";

const sortedNodes = sortNodesConceptually(allNodes);
// Returns nodes ordered: Set Theory → Algebra → Metrics → Topology → ...
```

### Example 2: Build learning path with conceptual ordering

```typescript
import { buildLearningPathConceptual } from "./lib/graph";

const path = buildLearningPathConceptual(
  targetId,
  edges,
  allowedRelations,
  allNodes,
);
// Prerequisites presented in order: foundational concepts first
```

### Example 3: Custom sorting with topological constraints

```typescript
import { topoSortWith, cmpConceptualFlow } from "./lib/graph";

const sorted = topoSortWith(nodeIds, adjacency, allNodes, cmpConceptualFlow);
// Topologically sorted while respecting conceptual flow order
```

## Benefits

✅ **Progressive Complexity** - Simple foundational concepts appear before advanced applications  
✅ **Better Learning Flow** - Related concepts cluster together thematically  
✅ **Dependency Aware** - Topological ordering ensures prerequisites come first  
✅ **Kind-Aware** - Definitions of concepts precede their examples and applications  
✅ **Backward Compatible** - Original numeric ordering still available via `cmpNum`

## Integration Points

To enable conceptual flow ordering in the UI, update components that display or sort nodes:

- **GraphCanvas** - Consider using `sortNodesConceptually()` for initial layout
- **Sidebar/ListViews** - Use conceptual ordering for better user navigation
- **Path Finding** - Use `buildLearningPathConceptual()` for learning sequences
- **Command Palette** - Could offer toggle between ordering modes
