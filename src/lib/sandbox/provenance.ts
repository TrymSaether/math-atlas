/**
 * Provenance propagation — how the runtime DERIVES each object's justification
 * from its kind and its dependencies. Authors never set provenance; this is the
 * only place it is decided, so honesty is enforced in one auditable function.
 *
 * The model is a precedence lattice. Each object starts from a base level set by
 * its kind, then takes the maximum of that base and all of its dependencies:
 *
 *   authored (3)  — a human assertion, or anything downstream of one. Absorbing:
 *                   a claim built on an assertion is only as good as the assertion.
 *   computed (2)  — an opaque numerical method (a primitive) participated.
 *                   Absorbs `constructed`: you cannot be more transparent than a
 *                   step in your own derivation.
 *   constructed (1) — derived purely through transparent operations (expressions,
 *                   geometric constructors) over honest inputs.
 *   input (0)     — a free leaf the user manipulates; a parameter, not a claim.
 *
 * Value-honesty is independent of all this: the evaluator computes exactly what
 * was written. Provenance governs only how much a *claim* can be trusted, and how
 * the UI must present it (an `authored` object can never wear computed authority).
 */

import type { Provenance, ProvenanceKind, WorkspaceObject } from "./model";

const PRECEDENCE: Record<ProvenanceKind, number> = {
  input: 0,
  constructed: 1,
  computed: 2,
  authored: 3,
};

/** Base provenance level contributed by an object's own kind, ignoring deps. */
function baseProvenance(obj: WorkspaceObject): Provenance {
  switch (obj.kind) {
    case "freeScalar":
    case "freePoint":
      return { just: "input" };
    case "expr":
    case "construct":
      // Transparent derivation. May still be lifted to `computed` or `authored`
      // by a dependency below.
      return { just: "constructed" };
    case "primitive":
      return { just: "computed", method: obj.op };
    case "authored":
      return { just: "authored" };
  }
}

/** The provenance with the higher precedence (ties keep `a`). */
function maxProvenance(a: Provenance, b: Provenance): Provenance {
  return PRECEDENCE[b.just] > PRECEDENCE[a.just] ? b : a;
}

/**
 * Derive an object's provenance from its kind and the provenance of every object
 * it depends on. `depProvenances` are the already-derived provenances of this
 * object's direct dependencies (the evaluator visits in topological order, so
 * they are available before this object is reached).
 */
export function deriveProvenance(obj: WorkspaceObject, depProvenances: Provenance[]): Provenance {
  let result = baseProvenance(obj);
  for (const dep of depProvenances) {
    result = maxProvenance(result, dep);
  }
  // Annotate the absorbing transition so the UI can explain *why* something is
  // authored/computed even when the object itself is a plain expression.
  if (result.just === "authored" && obj.kind !== "authored") {
    return { just: "authored", note: "depends on an authored claim" };
  }
  return result;
}

export { PRECEDENCE };
