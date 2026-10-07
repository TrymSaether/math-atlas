#!/usr/bin/env python3
"""Merge the curated topology dictionary into the atlas topology map.

The dictionary (public/topology_dictionary.json) and the atlas map
(src/data/maps/topology.json) historically described the same subject in two
disjoint vocabularies: kebab-case ids + chapter grouping on one side,
snake_case ids + domain grouping on the other. This script unifies them into a
single source of truth, keyed by the atlas's snake_case ids.

For every dictionary entry it either:
  * MATCH  -> folds the curated fields (gloss/example/diagram/ref/chapter/
             related) onto the existing atlas item, or
  * NEW    -> creates a fresh atlas item (snake_case id, mapped kind, domain
             assigned from the dictionary chapter) carrying the same fields.

Matching is high-precision: exact match on normalized id, label, or term.
Lower-confidence candidates are left as NEW and recorded in the audit CSV so a
human can promote them later.

Outputs (all in-repo, so the merge is reviewable in the diff):
  * src/data/maps/topology.json        (rewritten in place)
  * scripts/reconciliation.csv         (audit trail: every entry + decision)
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATLAS_PATH = ROOT / "src" / "data" / "maps" / "topology.json"
DICT_PATH = ROOT / "public" / "topology_dictionary.json"
AUDIT_PATH = ROOT / "scripts" / "reconciliation.csv"

# New domain for the algebraic-topology material (chapters 7 & 8), which the
# atlas's point-set domain taxonomy does not cover.
NEW_DOMAINS = [
    {
        "id": "algebraic_topology",
        "label": "Algebraic Topology",
        "order": 8,
        "color": "#0EA5E9",
        "tint": "#E8F6FE",
        "border": "#B6E3F8",
    },
]

# Dictionary chapter -> atlas domain. Chapter 6 mixes three domains, so it is
# routed by keyword below instead of through this table.
CHAPTER_DOMAIN = {
    "2": "continuity",
    "3": "spaces_constructions",
    "4": "spaces_constructions",
    "5": "spaces_constructions",
    "7": "algebraic_topology",
    "8": "algebraic_topology",
    "A": "foundations",
    "B": "foundations",
}

KIND_MAP = {
    "Definition": "definition",
    "Theorem": "theorem",
    "Lemma": "lemma",
    "Corollary": "corollary",
    "Concept": "concept",
}

EMPTY_DEPENDENCIES = {
    "definitional_dependency": [],
    "logical_dependency": [],
    "assumption_dependency": [],
    "construction_dependency": [],
    "notation_dependency": [],
    "pedagogical_dependency": [],
    "historical_dependency": [],
}


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (value or "").lower())


def kebab_to_snake(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def domain_for(entry: dict) -> str:
    chapter = entry["chapter"]
    if chapter in CHAPTER_DOMAIN:
        return CHAPTER_DOMAIN[chapter]
    # Chapter 6 — connectedness, Hausdorff & compactness — route by term.
    text = norm(entry["term"] + " " + entry.get("statement", ""))
    if "connect" in text:
        return "connectedness"
    if any(k in text for k in ("hausdorff", "separ", "countab", "normal", "regular", "t1", "t2")):
        return "separation_countability"
    return "compactness"


def main() -> None:
    atlas = json.loads(ATLAS_PATH.read_text())
    entries = json.loads(DICT_PATH.read_text())
    graph = atlas["graph"]
    items = graph["items"]

    # Lookup tables for matching against existing atlas items.
    by_id: dict[str, dict] = {it["id"]: it for it in items}
    norm_index: dict[str, dict] = {}
    for it in items:
        for key in (it["id"], it.get("label", "")):
            norm_index.setdefault(norm(key), it)

    # First pass: resolve every dictionary entry to a canonical atlas id.
    decisions: list[dict] = []
    canonical_of: dict[str, str] = {}  # dictionary id -> canonical atlas id
    for entry in entries:
        match = (
            norm_index.get(norm(entry["id"]))
            or norm_index.get(norm(entry["term"]))
        )
        if match:
            canonical = match["id"]
            decision = "match"
        else:
            canonical = kebab_to_snake(entry["id"])
            # Guard against colliding with an unrelated existing id.
            if canonical in by_id:
                canonical = f"{canonical}_def"
            decision = "new"
        canonical_of[entry["id"]] = canonical
        decisions.append({"entry": entry, "canonical": canonical, "decision": decision})

    # Ensure new domains exist before attaching items to them.
    existing_domains = {d["id"] for d in graph["domains"]}
    for dom in NEW_DOMAINS:
        if dom["id"] not in existing_domains:
            graph["domains"].append(dom)

    # Second pass: merge fields / create items now that the id map is complete.
    new_count = 0
    for record in decisions:
        entry = record["entry"]
        canonical = record["canonical"]
        related = [
            canonical_of[r] for r in entry.get("related", []) if r in canonical_of
        ]
        dict_fields = {
            "chapter": entry["chapter"],
            "ref": entry["ref"],
            "gloss": entry.get("gloss", ""),
            "example": entry.get("example", ""),
            "diagram_path": entry.get("diagramPath", ""),
            "related": related,
        }

        if record["decision"] == "match":
            item = by_id[canonical]
            item.update(dict_fields)
            # Only fill statement if the atlas item lacks one, to avoid
            # clobbering curated graph content.
            if not item.get("statement") and entry.get("statement"):
                item["statement"] = entry["statement"]
        else:
            item = {
                "id": canonical,
                "statement": entry.get("statement"),
                "formal_statement": None,
                "definition": None,
                "intuition": entry.get("gloss") or None,
                "notation": None,
                "assumptions": [],
                "dependencies": dict(EMPTY_DEPENDENCIES),
                "outgoing_relations": [],
                "metadata": {
                    "tags": [],
                    "syllabus_priority": "medium",
                    "source": "Thaule, Introduction to Topology (TMA4190)",
                },
                "kind": KIND_MAP.get(entry["kind"], entry["kind"].lower()),
                "label": entry["term"],
                "domain": domain_for(entry),
                **dict_fields,
            }
            items.append(item)
            by_id[canonical] = item
            new_count += 1

    ATLAS_PATH.write_text(json.dumps(atlas, indent=2, ensure_ascii=False) + "\n")

    with AUDIT_PATH.open("w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["dictionary_id", "term", "kind", "chapter", "decision", "canonical_id", "domain"])
        for record in decisions:
            entry = record["entry"]
            item = by_id[record["canonical"]]
            writer.writerow([
                entry["id"], entry["term"], entry["kind"], entry["chapter"],
                record["decision"], record["canonical"], item["domain"],
            ])

    matched = sum(1 for r in decisions if r["decision"] == "match")
    print(f"entries:   {len(entries)}")
    print(f"matched:   {matched}")
    print(f"new items: {new_count}")
    print(f"total items now: {len(items)}")
    print(f"audit:     {AUDIT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
