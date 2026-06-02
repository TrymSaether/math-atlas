#!/usr/bin/env python3
"""Extract a node skeleton from Stein-Shakarchi's *Fourier Analysis*.

Reads content/fourier_ss.raw.txt (produced by `pdftotext -layout
content/fourier_analysis_ss.pdf`) and emits content/ss_blocks.json: one entry per
numbered environment (Theorem / Lemma / Corollary / Proposition).

Notes on the source:
  * Numbering restarts each chapter ("Theorem 1.1" exists in several chapters), so
    every block is anchored to a chapter and the node id is chapter-prefixed.
  * SS has NO numbered "Definition" environments; definitions are inline prose and
    are handled by the enrichment tier, not here.
  * Chapters are anchored via the verso running header
    "Chapter N. UPPERCASE TITLE", which recurs every other page.

This is a from-scratch *skeleton* builder (statements + proofs + provenance). It
does not invent edges; citation edges are derived in the assembly step.
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "fourier_ss.raw.txt"
OUT = ROOT / "content" / "ss_blocks.json"

CHAPTER_TITLES = {
    1: "The Genesis of Fourier Analysis",
    2: "Basic Properties of Fourier Series",
    3: "Convergence of Fourier Series",
    4: "Some Applications of Fourier Series",
    5: "The Fourier Transform on R",
    6: "The Fourier Transform on Rd",
    7: "Finite Fourier Analysis",
    8: "Dirichlet's Theorem",
}

KINDS = ("Theorem", "Lemma", "Corollary", "Proposition")
KIND_RE = "|".join(KINDS)
RESULT_KINDS = {"theorem", "lemma", "corollary", "proposition"}

# Verso running header: "<page>   Chapter N. UPPERCASE TITLE"
RUNNING_HEADER_RE = re.compile(r"^\s*\d+\s+Chapter\s+(\d+)\.\s+[A-Z][A-Z]", re.MULTILINE)

# Numbered environment head, e.g. "Theorem 2.1 (Best approximation) ..."
HEAD_RE = re.compile(
    rf"^(?P<kind>{KIND_RE})\s+(?P<num>\d+\.\d+)(?:\s*\((?P<title>[^)]+)\))?",
    re.MULTILINE,
)
PROOF_RE = re.compile(r"(?m)^\s*Proof\.\s*")

# References inside a statement/proof, e.g. "Theorem 2.1", "Lemma 3.2 in Chapter 2".
REF_RE = re.compile(
    rf"\b(?P<kind>{KIND_RE})\s+(?P<num>\d+\.\d+)"
    r"(?:\s+(?:in|of)\s+Chapter\s+(?P<chap>\d+))?",
    re.IGNORECASE,
)

PAGE_NUM_RE = re.compile(r"^\s*\d+\s*$")

# Chapters 1-8 end where the back matter begins. The Appendix has its own numbered
# environments that would otherwise be mislabeled as Chapter 8, so we truncate here.
BACK_MATTER_RE = re.compile(r"^\s*Appendix\s*:\s*Integration\s*$", re.MULTILINE)


@dataclass(frozen=True)
class Block:
    kind: str
    number: str          # e.g. "2.1"
    chapter: int
    title: str
    statement: str
    proof: str
    node_id: str
    ref: str             # human citation, e.g. "Stein-Shakarchi, Ch.2, Theorem 2.1"


def chapter_spans(text: str) -> list[tuple[int, int]]:
    """Return (char_offset, chapter_number) anchors from running headers, sorted."""
    anchors = [(m.start(), int(m.group(1))) for m in RUNNING_HEADER_RE.finditer(text)]
    return anchors


def chapter_at(anchors: list[tuple[int, int]], pos: int) -> int:
    """Chapter number of the nearest running header at or before pos."""
    chap = 1
    for offset, num in anchors:
        if offset <= pos:
            chap = num
        else:
            break
    return chap


def strip_running_headers(text: str) -> str:
    out = []
    for line in text.splitlines():
        if RUNNING_HEADER_RE.match(line):
            continue
        if PAGE_NUM_RE.match(line):
            continue
        out.append(line)
    return "\n".join(out)


def normalize(text: str) -> str:
    text = strip_running_headers(text)
    # de-hyphenate line breaks ("func-\ntion" -> "function")
    text = re.sub(r"([A-Za-z])-\n\s*([a-z])", r"\1\2", text)
    paras = []
    for para in re.split(r"\n\s*\n", text):
        joined = re.sub(r"\s+", " ", para).strip()
        if joined:
            paras.append(joined)
    return "\n\n".join(paras)


def split_statement_proof(kind: str, body: str) -> tuple[str, str]:
    m = PROOF_RE.search(body)
    if not m or kind.lower() not in RESULT_KINDS:
        return body, ""
    return body[: m.start()], body[m.end():]


def make_id(chapter: int, kind: str, number: str) -> str:
    short = {"theorem": "thm", "lemma": "lem", "corollary": "cor", "proposition": "prop"}[kind]
    return f"c{chapter}_{short}_{number.replace('.', '_')}"


def extract() -> list[Block]:
    raw = SRC.read_text(encoding="utf-8")
    cutoff = BACK_MATTER_RE.search(raw)
    if cutoff:
        raw = raw[: cutoff.start()]
    anchors = chapter_spans(raw)
    heads = list(HEAD_RE.finditer(raw))
    # First pass: collect candidate blocks (may contain duplicate numbers from
    # in-prose back-references that happen to start a line).
    candidates: list[Block] = []
    for i, m in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(raw)
        kind = m.group("kind").lower()
        number = m.group("num")
        chapter = chapter_at(anchors, m.start())
        title = (m.group("title") or "").strip()
        body = raw[m.end(): end]
        statement_raw, proof_raw = split_statement_proof(kind, body)
        statement = normalize(statement_raw)
        proof = normalize(proof_raw)
        if not statement:
            continue
        node_id = make_id(chapter, kind, number)
        ref = f"Stein-Shakarchi, Ch.{chapter}, {kind.title()} {number}"
        candidates.append(Block(kind, number, chapter, title, statement, proof, node_id, ref))

    # Dedupe (chapter, kind, number): the real environment carries the longest
    # statement; later same-numbered hits are passing references in prose.
    best: dict[str, Block] = {}
    for b in candidates:
        cur = best.get(b.node_id)
        if cur is None or len(b.statement) + len(b.proof) > len(cur.statement) + len(cur.proof):
            best[b.node_id] = b
    return sorted(best.values(), key=lambda b: (b.chapter, b.kind, [int(x) for x in b.number.split(".")]))


def find_references(block: Block, id_by_key: dict[tuple[int, str, str], str]) -> list[str]:
    """Resolve in-text references to node ids that exist in the skeleton.

    A reference "Lemma 3.2 in Chapter 2" pins the chapter explicitly; otherwise the
    reference is assumed to live in the same chapter as the citing block.
    """
    deps: list[str] = []
    text = f"{block.statement}\n{block.proof}"
    for m in REF_RE.finditer(text):
        kind = m.group("kind").lower()
        number = m.group("num")
        chap = int(m.group("chap")) if m.group("chap") else block.chapter
        target = id_by_key.get((chap, kind, number))
        if target and target != block.node_id:
            deps.append(target)
    return list(dict.fromkeys(deps))


def main() -> int:
    blocks = extract()
    id_by_key = {(b.chapter, b.kind, b.number): b.node_id for b in blocks}

    records = []
    for b in blocks:
        rec = asdict(b)
        rec["references"] = find_references(b, id_by_key)
        records.append(rec)

    OUT.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    by_chapter: dict[int, int] = {}
    by_kind: dict[str, int] = {}
    edges = 0
    for r in records:
        by_chapter[r["chapter"]] = by_chapter.get(r["chapter"], 0) + 1
        by_kind[r["kind"]] = by_kind.get(r["kind"], 0) + 1
        edges += len(r["references"])
    print(f"Extracted {len(records)} numbered blocks -> {OUT.relative_to(ROOT)}")
    print("By chapter:", {f"Ch.{k} {CHAPTER_TITLES[k]}": v for k, v in sorted(by_chapter.items())})
    print("By kind:   ", by_kind)
    print(f"Resolved citation references: {edges}")
    with_proof = sum(1 for r in records if r["proof"])
    print(f"Blocks with a proof: {with_proof}/{len(records)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
