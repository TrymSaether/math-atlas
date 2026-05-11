#!/usr/bin/env python3
"""LLM-assisted dependency extraction.

Reads data/topology.raw.json, picks targets (all by default, or a slice
via --range / --kind / --chapter), and asks an LLM to identify
mathematical dependencies missed by the regex extractor. Validated
results are appended to data/topology.verified.json.

The prompt is in scripts/prompts/extract-dependencies.md. The model is
forced to ground every edge against a candidate ID list, so it cannot
fabricate citations.

Usage:
    export ANTHROPIC_API_KEY=...
    python3 scripts/llm_extract.py --kind theorem --chapter 6
    python3 scripts/merge.py
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "topology.raw.json"
VERIFIED = ROOT / "data" / "topology.verified.json"
PROMPT = ROOT / "scripts" / "prompts" / "extract-dependencies.md"

MODEL = "claude-sonnet-4-6"  # strong instruction-following; cheap enough at scale
MAX_CANDIDATES = 60          # cap to keep token cost bounded
MAX_TOKENS = 1200             # output budget per call


def parse_number(num: str) -> tuple[int, int]:
    """Map '3.16' → (3, 16); 'A.2' → (101, 2); 'B.5' → (102, 5)."""
    ch, idx = num.split(".")
    if ch == "A": ch_i = 101
    elif ch == "B": ch_i = 102
    else: ch_i = int(ch)
    return (ch_i, int(idx))


def predecessors(target: dict, nodes: list[dict]) -> list[dict]:
    """All nodes earlier in textbook order, plus all of A/B regardless."""
    t = parse_number(target["number"])
    out = []
    for n in nodes:
        if n["id"] == target["id"]:
            continue
        k = parse_number(n["number"])
        if k < t or n["chapter"] in {"A", "B"}:
            out.append(n)
    return out


def shortlist(target: dict, cands: list[dict], existing: list[str]) -> list[dict]:
    """Cheap lexical pre-filter: keep candidates whose title or tag
    keywords appear in the target body. Always keep candidates already
    in existing auto-edges and all definitions in the same chapter."""
    body = target["originalText"].lower()
    keep: dict[str, dict] = {}
    for c in cands:
        if c["id"] in existing:
            keep[c["id"]] = c
            continue
        if c["kind"] == "definition" and c["chapter"] == target["chapter"]:
            keep[c["id"]] = c
            continue
        score = 0
        title_words = re.findall(r"[a-z]{4,}", c["title"].lower())
        for w in set(title_words):
            if w in body:
                score += 2
        for tag in c.get("tags", []):
            if tag.replace("-", " ") in body:
                score += 1
        if score >= 2:
            keep[c["id"]] = c
    return list(keep.values())[:MAX_CANDIDATES]


def build_input(target: dict, cands: list[dict], existing_auto: list[dict]) -> dict:
    return {
        "target": {
            "id": target["id"],
            "kind": target["kind"],
            "number": target["number"],
            "title": target["title"],
            "sectionTitle": target["sectionTitle"],
            "originalText": target["originalText"][:4000],
        },
        "candidates": [
            {
                "id": c["id"],
                "kind": c["kind"],
                "number": c["number"],
                "title": c["title"],
                "sectionTitle": c["sectionTitle"],
                "summary": c["originalText"][:400],
            }
            for c in cands
        ],
        "existingAutoEdges": [
            {"from": e["from"], "relation": e["relation"], "confidence": e["confidence"]}
            for e in existing_auto
        ],
    }


def call_anthropic(system: str, user: str) -> str:
    import anthropic  # lazy import so the rest of the script runs without the lib
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    resp = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        temperature=0,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")


def parse_response(text: str, candidate_ids: set[str], target_id: str) -> tuple[list[dict], list[str]]:
    """Return (validated_edges, errors)."""
    # Be permissive: extract the first JSON array we see.
    m = re.search(r"\[.*\]", text, re.DOTALL)
    if not m:
        return [], [f"no JSON array in response: {text[:120]!r}"]
    try:
        arr = json.loads(m.group(0))
    except json.JSONDecodeError as e:
        return [], [f"json decode: {e}"]
    edges, errs = [], []
    for i, e in enumerate(arr):
        if not isinstance(e, dict): errs.append(f"#{i}: not an object"); continue
        if e.get("from") not in candidate_ids:
            errs.append(f"#{i}: from={e.get('from')} not in candidates"); continue
        if e.get("relation") not in {"statement", "proof", "illustration"}:
            errs.append(f"#{i}: bad relation {e.get('relation')}"); continue
        conf = e.get("confidence")
        if not isinstance(conf, (int, float)) or conf < 0.70 or conf > 0.99:
            errs.append(f"#{i}: bad confidence {conf}"); continue
        edges.append({
            "from": e["from"],
            "to": target_id,
            "relation": e["relation"],
            "source": "verified",
            "confidence": float(conf),
            "rationale": str(e.get("rationale", ""))[:160],
        })
    return edges, errs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", help="filter targets by kind")
    ap.add_argument("--chapter", help="filter targets by chapter")
    ap.add_argument("--limit", type=int, default=None, help="cap number of targets")
    ap.add_argument("--dry-run", action="store_true", help="print prompts, don't call API")
    args = ap.parse_args()

    raw = json.loads(RAW.read_text())
    nodes: list[dict] = raw["nodes"]
    auto_edges: list[dict] = raw["edges"]

    verified_doc = json.loads(VERIFIED.read_text())
    existing_verified_keys = {
        (e["from"], e["to"], e["relation"]) for e in verified_doc.get("edges", [])
    }

    targets = [n for n in nodes]
    if args.kind: targets = [n for n in targets if n["kind"] == args.kind]
    if args.chapter: targets = [n for n in targets if n["chapter"] == args.chapter]
    if args.limit: targets = targets[: args.limit]

    system = PROMPT.read_text()
    new_edges: list[dict] = []

    for i, target in enumerate(targets, 1):
        cands_all = predecessors(target, nodes)
        existing_auto_for_target = [e for e in auto_edges if e["to"] == target["id"]]
        existing_ids = [e["from"] for e in existing_auto_for_target]
        cands = shortlist(target, cands_all, existing_ids)
        if not cands:
            continue
        inp = build_input(target, cands, existing_auto_for_target)
        user = json.dumps(inp, ensure_ascii=False)

        print(f"[{i}/{len(targets)}] {target['kind']} {target['number']} "
              f"({len(cands)} candidates) — {target['title'][:60]}")

        if args.dry_run:
            print(user[:500] + " ...")
            continue

        try:
            reply = call_anthropic(system, user)
        except Exception as e:
            print(f"  API error: {e}"); continue

        edges, errs = parse_response(reply, {c["id"] for c in cands}, target["id"])
        for err in errs: print(f"  ! {err}")
        for e in edges:
            key = (e["from"], e["to"], e["relation"])
            if key in existing_verified_keys: continue
            existing_verified_keys.add(key)
            new_edges.append(e)
            print(f"  + {e['from']} —{e['relation']}→ {target['id']}  ({e['confidence']:.2f})")
        time.sleep(0.2)  # gentle rate

    if not new_edges:
        print("No new verified edges.")
        return 0

    verified_doc.setdefault("edges", []).extend(new_edges)
    VERIFIED.write_text(json.dumps(verified_doc, indent=2, ensure_ascii=False))
    print(f"Appended {len(new_edges)} edges → data/topology.verified.json")
    print("Run `python3 scripts/merge.py` to apply.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
