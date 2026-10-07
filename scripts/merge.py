#!/usr/bin/env python3
"""Merge data/topology.raw.json (auto) with data/topology.verified.json
(hand-curated / LLM-extracted) into src/data/topology.json.

Rules:
  * A verified edge (from, to, relation) overrides any auto edge with
    the same triple.
  * A verified edge (from, to) with a different relation REPLACES the
    auto edge for that pair — verified relation wins.
  * Verified edges with confidence < 0.70 or with unknown node IDs are
    rejected and reported.
  * Edge IDs are regenerated deterministically.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUTO = ROOT / "data" / "topology.raw.json"
VERIFIED = ROOT / "data" / "topology.verified.json"
OUT = ROOT / "src" / "data" / "topology.json"


def main() -> int:
    auto = json.loads(AUTO.read_text())
    verified = json.loads(VERIFIED.read_text())

    node_ids = {n["id"] for n in auto["nodes"]}

    auto_edges = auto["edges"]
    verified_edges = verified.get("edges", [])

    # Validate verified edges.
    accepted: list[dict] = []
    rejected: list[tuple[dict, str]] = []
    for e in verified_edges:
        if e.get("from") not in node_ids:
            rejected.append((e, f"unknown 'from' id: {e.get('from')}"))
            continue
        if e.get("to") not in node_ids:
            rejected.append((e, f"unknown 'to' id: {e.get('to')}"))
            continue
        if (e.get("confidence") or 0) < 0.70:
            rejected.append((e, f"confidence below 0.70: {e.get('confidence')}"))
            continue
        if e.get("relation") not in {"statement", "proof", "illustration"}:
            rejected.append((e, f"bad relation: {e.get('relation')}"))
            continue
        accepted.append({**e, "source": "verified"})

    # Index by (from, to) for replacement, and (from, to, relation) for exact match.
    verified_pair = {(e["from"], e["to"]): e for e in accepted}

    merged: list[dict] = []
    seen_keys: set[tuple[str, str, str]] = set()

    for e in auto_edges:
        pair = (e["from"], e["to"])
        if pair in verified_pair:
            # Replaced below.
            continue
        key = (e["from"], e["to"], e["relation"])
        if key in seen_keys:
            continue
        seen_keys.add(key)
        merged.append(e)

    for e in accepted:
        key = (e["from"], e["to"], e["relation"])
        if key in seen_keys:
            continue
        seen_keys.add(key)
        merged.append(e)

    # Regenerate IDs.
    for e in merged:
        e["id"] = f"{e['relation']}-{e['from']}->{e['to']}"

    out = {"nodes": auto["nodes"], "edges": merged}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False))

    n_auto = sum(1 for e in merged if e.get("source") == "auto")
    n_ver = sum(1 for e in merged if e.get("source") == "verified")
    print(f"Merged → {OUT.relative_to(ROOT)}: {len(out['nodes'])} nodes, "
          f"{len(merged)} edges ({n_auto} auto, {n_ver} verified).")
    if rejected:
        print(f"Rejected {len(rejected)} verified edges:")
        for e, reason in rejected:
            print(f"  - {e.get('from')} → {e.get('to')} [{reason}]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
