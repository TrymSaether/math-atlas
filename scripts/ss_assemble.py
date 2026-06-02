#!/usr/bin/env python3
"""Assemble content/ss_blocks.json into src/data/maps/fourier_analysis.json.

Builds a FieldJson skeleton: one item per extracted Stein-Shakarchi environment,
chapter-mapped to a domain, plus citation edges derived from resolved in-text
references. Every node carries provenance (ref + metadata.source). Definitions,
intuition, and out-of-textbook branches are added by the enrichment tier later.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOCKS = ROOT / "content" / "ss_blocks.json"
OUT = ROOT / "src" / "data" / "maps" / "fourier_analysis.json"

# Chapter -> domain. Colors follow the topology palette (color.ts re-tones at runtime;
# tint/border are derived in normalizeFieldGraph, so only `color` must be sensible).
DOMAINS = [
    ("genesis",              "Genesis & Physical Origins",   1, "#2563EB",
     "Vibrating strings, the heat equation, and the birth of Fourier series."),
    ("fourier_series",       "Fourier Series",               2, "#0D9488",
     "Coefficients, convolutions, good kernels, summability on the circle."),
    ("convergence",          "Convergence",                  3, "#16A34A",
     "Mean-square and pointwise convergence; Parseval, Riemann-Lebesgue."),
    ("applications_series",  "Applications of Series",       4, "#CA8A04",
     "Isoperimetric inequality, equidistribution, the Weierstrass function."),
    ("fourier_transform_r",  "Fourier Transform on R",       5, "#DC2626",
     "Schwartz space, inversion, Plancherel, Poisson summation on the line."),
    ("fourier_transform_rd", "Fourier Transform on R^d",     6, "#9333EA",
     "Multivariable transform, radial functions, the wave and heat equations."),
    ("finite_fourier",       "Finite Fourier Analysis",      7, "#0891B2",
     "Fourier analysis on Z(N) and finite abelian groups; the DFT/FFT."),
    ("dirichlet",            "Dirichlet's Theorem",          8, "#DB2777",
     "Characters, L-functions, and primes in arithmetic progressions."),
]
CHAPTER_DOMAIN = {
    1: "genesis", 2: "fourier_series", 3: "convergence", 4: "applications_series",
    5: "fourier_transform_r", 6: "fourier_transform_rd", 7: "finite_fourier", 8: "dirichlet",
}


def build_item(block: dict) -> dict:
    title = block["title"].strip()
    kind = block["kind"]
    number = block["number"]
    label = title if title else f"{kind.title()} {number}"
    deps = block.get("references", [])
    return {
        "id": block["node_id"],
        "label": label,
        "kind": kind,
        "domain": CHAPTER_DOMAIN[block["chapter"]],
        "statement": block["statement"] or None,
        "formal_statement": None,          # enrichment/latexify tier fills this
        "definition": None,
        "intuition": None,
        "proof": block["proof"] or None,
        "proof_dependencies": deps,
        "notation": None,
        "ref": block["ref"],
        "dependencies": {"logical_dependency": deps} if deps else {},
        "outgoing_relations": [],
        "related": [],
        "assumptions": [],
        "metadata": {
            "tags": [f"chapter-{block['chapter']}"],
            "syllabus_priority": "medium",
            "source": block["ref"],
        },
    }


def build_edges(blocks: list[dict]) -> list[dict]:
    edges = []
    seen = set()
    for b in blocks:
        for target in b.get("references", []):
            eid = f"e_{b['node_id']}__uses__{target}"
            if eid in seen:
                continue
            seen.add(eid)
            edges.append({
                "id": eid,
                "source": b["node_id"],
                "target": target,
                "type": "uses",                 # source depends on target
                "dependency_class": "logical_dependency",
                "label": "",
                "direction": "source_to_target",
                "confidence": "high",           # parsed verbatim from the text
                "notes": "Citation extracted from Stein-Shakarchi proof/statement text.",
            })
    return edges


def main() -> int:
    blocks = json.loads(BLOCKS.read_text(encoding="utf-8"))
    items = [build_item(b) for b in blocks]
    edges = build_edges(blocks)

    domains = [
        {"id": i, "label": l, "order": o, "color": c, "description": d}
        for (i, l, o, c, d) in DOMAINS
    ]

    doc = {
        "graph": {
            "id": "fourier_analysis_ss_v1",
            "label": "Fourier Analysis (Stein-Shakarchi)",
            "field": "fourier_analysis",
            "model": "directed_typed_multigraph",
            "design_notes": [
                "Spine extracted from Stein & Shakarchi, Fourier Analysis: An Introduction "
                "(Princeton Lectures in Analysis I).",
                "Nodes are the book's numbered theorems, lemmas, propositions, and corollaries; "
                "every node carries a chapter/number citation in `ref` and `metadata.source`.",
                "Edges are citation dependencies parsed verbatim from statement/proof text "
                "(confidence=high). Inline definitions, intuition, and out-of-textbook branches "
                "are added by the enrichment tier (source=auto).",
            ],
            "domains": domains,
            "items": items,
            "edges": edges,
        }
    }

    OUT.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} items, {len(edges)} edges -> {OUT.relative_to(ROOT)}")
    from collections import Counter
    print("Items per domain:", dict(Counter(it["domain"] for it in items)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
