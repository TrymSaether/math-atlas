#!/usr/bin/env python3
"""Extract Definitions, Theorems, Lemmas, Examples, Propositions, Corollaries
from the topology lecture-notes plain text (produced via `pdftotext -layout`).

Output: data/topology.raw.json, with nodes and auto-inferred dependency edges.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "topology.raw.txt"
OUT = ROOT / "data" / "topology.raw.json"

KINDS = ("Definition", "Theorem", "Lemma", "Example", "Proposition", "Corollary")
KIND_RE = "|".join(KINDS)
HEAD_RE = re.compile(
    rf"^[ \t]+(?P<kind>{KIND_RE})\s+(?P<num>[0-9A-B]+\.[0-9]+)(?:\s*\((?P<title>[^)]+)\))?",
    re.MULTILINE,
)

SECTIONS: dict[str, str] = {
    "1": "Introduction", "2": "Continuous maps", "3": "Topological spaces",
    "4": "Generating topologies", "5": "Constructing topological spaces",
    "6": "Topological properties", "7": "The fundamental group",
    "8": "The fundamental group of the circle", "A": "Set theory", "B": "Elementary algebra",
}

TOPIC_CLUSTERS: dict[str, str] = {
    "2": "Metric Foundations", "3": "Topological Spaces", "4": "Generating Topologies",
    "5": "Constructions", "6": "Topological Properties", "7": "Fundamental Group",
    "8": "Fundamental Group of S¹", "A": "Set Theory", "B": "Algebra", "1": "Overture",
}


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text[:60] or "item"


def kind_prefix(kind: str) -> str:
    return {"Definition": "def", "Theorem": "thm", "Lemma": "lem",
            "Example": "ex", "Proposition": "prop", "Corollary": "cor"}[kind]


def chapter_of(num: str) -> str:
    return num.split(".")[0]


# --------------------------------------------------------------------------- #
# Matrix / bracket cleanup
# --------------------------------------------------------------------------- #
def clean_matrix_artifacts(text: str) -> str:
    """The PDF→text step shatters matrices into garbage like `[1 0 0…[0 1 0…]`.
    We replace any sequence of >=2 consecutive bracketed numeric strips with
    a single `[matrix]` placeholder so the surrounding prose stays readable.
    """
    pat = re.compile(r"(?:\[\s*(?:-?\d+\s*){2,}\s*\]\s*){2,}")
    text = pat.sub(" [matrix omitted] ", text)
    # Also collapse stray sequences of pipe-separators that survive matrix renderings.
    text = re.sub(r"(?:\|\s*){4,}", "", text)
    return text


# --------------------------------------------------------------------------- #
# Extraction
# --------------------------------------------------------------------------- #
def extract_blocks(text: str) -> list[dict]:
    matches = list(HEAD_RE.finditer(text))
    blocks = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        kind = m.group("kind")
        num = m.group("num")
        title = (m.group("title") or "").strip()
        body = text[m.end(): end]
        body = strip_page_artifacts(body).strip()
        if not body:
            continue
        chap = chapter_of(num)
        slug = slugify(title) if title else slugify(body.split("\n")[0])
        node_id = f"{kind_prefix(kind)}-{num.replace('.', '-')}-{slug}"
        blocks.append({
            "id": node_id,
            "kind": kind.lower(),
            "number": num,
            "title": title or f"{kind} {num}",
            "chapter": chap,
            "section": chap,
            "sectionTitle": SECTIONS.get(chap, ""),
            "topicCluster": TOPIC_CLUSTERS.get(chap, "Misc"),
            "originalText": clean_text(clean_matrix_artifacts(body)),
            "explanation": "",
            "statementDependencies": [],
            "proofDependencies": [],
            "tags": derive_tags(kind, title, body),
        })
    return blocks


def strip_page_artifacts(text: str) -> str:
    lines = text.splitlines()
    cleaned: list[str] = []
    for line in lines:
        s = line.strip()
        if re.fullmatch(r"\d+", s):
            continue
        if re.fullmatch(r"\d+\s+\d+\.\s+.*", s):
            continue
        if "INTRODUCTION TO TOPOLOGY" in s.upper():
            continue
        cleaned.append(line)
    return "\n".join(cleaned)


def clean_text(text: str) -> str:
    out: list[str] = []
    for para in re.split(r"\n\s*\n", text):
        joined = re.sub(r"\s+", " ", para).strip()
        if joined:
            out.append(joined)
    return "\n\n".join(out)


def derive_tags(kind: str, title: str, body: str) -> list[str]:
    seed = f"{title} {body[:300]}".lower()
    tags = set()
    for word, tag in [
        ("metric", "metric"), ("topolog", "topology"), ("continuous", "continuity"),
        ("homeomorph", "homeomorphism"), ("homotop", "homotopy"),
        ("compact", "compactness"), ("connected", "connectedness"),
        ("hausdorff", "hausdorff"), ("open", "open-sets"), ("closed", "closed-sets"),
        ("basis", "basis"), ("subspace", "subspace"), ("product", "product"),
        ("quotient", "quotient"), ("path", "paths"), ("cover", "covering"),
        ("fundamental group", "fundamental-group"), ("group", "groups"),
        ("set", "sets"), ("map", "maps"),
    ]:
        if word in seed:
            tags.add(tag)
    return sorted(tags)


# --------------------------------------------------------------------------- #
# Edge inference
# --------------------------------------------------------------------------- #
EXPLICIT_REF = re.compile(
    rf"\b(?:{KIND_RE})s?\s+([0-9A-B]+\.[0-9]+(?:\s*(?:,|\sand)\s*[0-9A-B]+\.[0-9]+)*)"
)
# parenthetical "(see 3.16)" / "(by 3.16)" / "(3.16, 3.17)"
PAREN_REF = re.compile(r"\(\s*(?:see\s+|by\s+|cf\.?\s+|from\s+)?((?:[0-9A-B]+\.[0-9]+)(?:\s*[,;]\s*[0-9A-B]+\.[0-9]+)*)\s*\)")
# "by/from/applying/using Theorem X.Y"
BY_REF = re.compile(
    rf"\b(?:by|from|using|applying|due to|via)\s+(?:{KIND_RE})s?\s+([0-9A-B]+\.[0-9]+)"
)
# "the previous lemma" / "previous theorem" / "preceding definition"
PREV_REF = re.compile(
    rf"\b(?:the\s+)?(?:previous|preceding|above)\s+({KIND_RE})\b", re.IGNORECASE
)


def collect_numbers(s: str) -> list[str]:
    return re.findall(r"[0-9A-B]+\.[0-9]+", s)


def infer_edges(blocks: list[dict]) -> list[dict]:
    by_num: dict[str, str] = {b["number"]: b["id"] for b in blocks}
    # ordered list of (kind, idx) for "previous" lookups
    ordered = list(enumerate(blocks))
    edges: list[dict] = []
    seen: set[tuple[str, str, str]] = set()

    def add_edge(from_id: str, to_id: str, relation: str, confidence: float):
        key = (from_id, to_id, relation)
        if key in seen or from_id == to_id:
            return False
        seen.add(key)
        edges.append({
            "id": f"{relation}-{from_id}->{to_id}",
            "from": from_id, "to": to_id, "relation": relation,
            "source": "auto", "confidence": confidence,
        })
        return True

    for idx, b in ordered:
        body = b["originalText"]
        m = re.search(r"\bProof\.?\b", body)
        statement = body[: m.start()] if m else body
        proof = body[m.start():] if m else ""

        def scan(text: str, relation: str, base_conf: float, local: list[str]) -> None:
            # 1) Explicit "Definition X.Y" / "Theorem X.Y, X.Z"
            for match in EXPLICIT_REF.finditer(text):
                for n in collect_numbers(match.group(0)):
                    tgt = by_num.get(n)
                    if tgt and add_edge(tgt, b["id"], relation, base_conf):
                        local.append(tgt)
            # 2) Parenthetical bare numbers
            for match in PAREN_REF.finditer(text):
                for n in collect_numbers(match.group(0)):
                    tgt = by_num.get(n)
                    if tgt and add_edge(tgt, b["id"], relation, base_conf - 0.05):
                        local.append(tgt)
            # 3) "by Theorem X.Y" (already covered by 1, but raise confidence)
            for match in BY_REF.finditer(text):
                for n in collect_numbers(match.group(0)):
                    tgt = by_num.get(n)
                    if tgt and add_edge(tgt, b["id"], relation, min(0.95, base_conf + 0.05)):
                        local.append(tgt)
            # 4) "the previous lemma" — link to most recent prior block of that kind
            for match in PREV_REF.finditer(text):
                kind = match.group(1).lower()
                for j in range(idx - 1, -1, -1):
                    cand = blocks[j]
                    if cand["kind"] == kind:
                        add_edge(cand["id"], b["id"], relation, 0.55)
                        local.append(cand["id"])
                        break

        local_stmt: list[str] = []
        local_proof: list[str] = []
        scan(statement, "statement", 0.85, local_stmt)
        scan(proof, "proof", 0.78, local_proof)
        b["statementDependencies"] = list(dict.fromkeys(local_stmt))
        b["proofDependencies"] = list(dict.fromkeys(local_proof))
    return edges


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main() -> int:
    text = SRC.read_text(encoding="utf-8")
    blocks = extract_blocks(text)
    edges = infer_edges(blocks)
    ids = {b["id"] for b in blocks}
    for e in edges:
        assert e["from"] in ids and e["to"] in ids, e
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"nodes": blocks, "edges": edges}, indent=2, ensure_ascii=False))
    print(f"Wrote {len(blocks)} nodes, {len(edges)} edges -> {OUT.relative_to(ROOT)}")
    by_kind: dict[str, int] = {}
    for b in blocks:
        by_kind[b["kind"]] = by_kind.get(b["kind"], 0) + 1
    by_rel: dict[str, int] = {}
    for e in edges:
        by_rel[e["relation"]] = by_rel.get(e["relation"], 0) + 1
    print("By kind:", by_kind)
    print("By relation:", by_rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
