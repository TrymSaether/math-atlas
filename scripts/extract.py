#!/usr/bin/env python3
"""Extract proofs from content/topology.raw.txt into src/data/maps/topology.json.

The raw lecture notes are parsed into numbered Definition/Theorem/Lemma/Example/
Proposition/Corollary blocks. For theorem-like blocks, the text after a
standalone "Proof." marker is attached to matching FieldJson items by numeric
reference, without overwriting existing curated proof text.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "topology.raw.txt"
TOPOLOGY_MAP = ROOT / "src" / "data" / "maps" / "topology.json"

KINDS = ("Definition", "Theorem", "Lemma", "Example", "Proposition", "Corollary")
RESULT_KINDS = {"theorem", "lemma", "proposition", "corollary"}
KIND_RE = "|".join(KINDS)
HEAD_RE = re.compile(
    rf"^[ \t]+(?P<kind>{KIND_RE})\s+(?P<num>[0-9A-B]+\.[0-9]+)(?:\s*\((?P<title>[^)]+)\))?",
    re.MULTILINE,
)
PROOF_RE = re.compile(r"(?m)^[ \t]*Proof\.\s*")
REF_NUMBER_RE = re.compile(r"[0-9A-B]+\.[0-9]+")
PAGE_HEADER_RE = re.compile(r"\d+\s+[0-9A-B]+(?:\.\d+)*\.\s+.+")
PROOF_TAIL_STOP_RE = re.compile(
    r"^\s*(?:"
    r"(?:[0-9A-B]+(?:\.[0-9]+)?\s+Exercises\b)|"
    r"(?:Exercise\s+[0-9A-B]+\.[0-9]+)|"
    r"(?:Chapter\s+[0-9A-B]+\.)|"
    r"(?:The following\s+(?:theorem|lemma|proposition|corollary)\b)|"
    r"(?:An immediate consequence\b)|"
    r"(?:In light of\b)|"
    r"(?:We end this section\b)|"
    r"(?:[0-9A-B]+\.[0-9]+\s+[A-Z])|"
    r"(?:[0-9A-B]+\.\s+[A-Z])|"
    r"(?:Index\b)|"
    r"(?:Bibliography\b)"
    r")"
    ,
    re.IGNORECASE,
)
SUSPICIOUS_PROOF_PATTERNS = {
    "page header": PAGE_HEADER_RE,
    "Exercise": re.compile(r"\bExercise\b", re.IGNORECASE),
    "The next theorem": re.compile(r"\bThe next theorem\b", re.IGNORECASE),
    "The theorem can be extended": re.compile(r"\bThe theorem can be extended\b", re.IGNORECASE),
    "As an immediate consequence": re.compile(r"\bAs an immediate consequence\b", re.IGNORECASE),
    "In order to compute": re.compile(r"\bIn order to compute\b", re.IGNORECASE),
    "To compute the fundamental group": re.compile(r"\bTo compute the fundamental group\b", re.IGNORECASE),
    "private-use glyph": re.compile(r"[\ue000-\uf8ff]"),
    "fragmented math variable": re.compile(r"\$[A-Za-z]+\$\d"),
    "joined TeX command": re.compile(r"\\(?:circ|setminus|cap|cup)[A-Za-z]"),
}
TRAILING_DISCUSSION_RE = re.compile(
    r"\n\n(?:"
    r"The following\s+(?:theorem|lemma|proposition|corollary)\b|"
    r"The next theorem\b|"
    r"An immediate consequence\b|"
    r"As an immediate consequence\b|"
    r"A subset\b[^\n]*\bthe theorem can be extended\b|"
    r"The theorem can be extended\b|"
    r"The result in Theorem\b|"
    r"In order to compute\b|"
    r"To compute the fundamental group\b|"
    r"We have already seen\b|"
    r"In light of\b|"
    r"We end this section\b"
    r")",
    re.IGNORECASE,
)
PRIVATE_MATH_GLYPHS = {
    "": "𝒯",
    "": "𝒜",
    "": "ℬ",
    "": "𝒞",
    "": "𝒮",
    "": "𝒰",
}

KIND_ALIASES = {
    "theorem": {"theorem", "thm"},
    "lemma": {"lemma", "lem"},
    "proposition": {"proposition", "prop"},
    "corollary": {"corollary", "cor"},
}

EXPLICIT_REF = re.compile(
    rf"\b(?:{KIND_RE}|Thm\.?|Lem\.?|Prop\.?|Cor\.?)s?\s+"
    r"([0-9A-B]+\.[0-9]+(?:\s*(?:,|;|\sand\s+)\s*[0-9A-B]+\.[0-9]+)*)",
    re.IGNORECASE,
)
PAREN_REF = re.compile(
    r"\(\s*(?:see\s+|by\s+|cf\.?\s+|from\s+|using\s+|applying\s+)?"
    r"((?:[0-9A-B]+\.[0-9]+)(?:\s*[,;]\s*[0-9A-B]+\.[0-9]+)*)\s*\)",
    re.IGNORECASE,
)
BY_REF = re.compile(
    rf"\b(?:by|from|using|applying|due to|via)\s+"
    rf"(?:{KIND_RE}|Thm\.?|Lem\.?|Prop\.?|Cor\.?)s?\s+([0-9A-B]+\.[0-9]+)",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Block:
    kind: str
    number: str
    title: str
    body: str
    statement: str
    proof: str


def strip_page_artifacts(text: str) -> str:
    lines = text.splitlines()
    cleaned: list[str] = []
    for line in lines:
        s = line.strip()
        if re.fullmatch(r"\d+", s):
            continue
        if PAGE_HEADER_RE.fullmatch(s):
            continue
        if "INTRODUCTION TO TOPOLOGY" in s.upper():
            continue
        cleaned.append(line)
    return "\n".join(cleaned)


def clean_matrix_artifacts(text: str) -> str:
    pat = re.compile(r"(?:\[\s*(?:-?\d+\s*){2,}\s*\]\s*){2,}")
    text = pat.sub(" [matrix omitted] ", text)
    return re.sub(r"(?:\|\s*){4,}", "", text)


def clean_text(text: str) -> str:
    text = strip_page_artifacts(text)
    text = normalize_private_math_glyphs(text)
    text = re.sub(r"([A-Za-z])-\s+([a-z])", r"\1\2", text)
    out: list[str] = []
    for para in re.split(r"\n\s*\n", text):
        joined = re.sub(r"\s+", " ", para).strip()
        if joined:
            out.append(joined)
    return "\n\n".join(out)


def normalize_private_math_glyphs(text: str) -> str:
    for glyph, replacement in PRIVATE_MATH_GLYPHS.items():
        text = text.replace(glyph, replacement)
    return text


def clean_proof_text(text: str) -> str:
    text = clean_text(trim_proof_tail(text))
    match = TRAILING_DISCUSSION_RE.search(text)
    if match:
        text = text[: match.start()]
    return text.strip()


def split_statement_and_proof(kind: str, body: str) -> tuple[str, str]:
    match = PROOF_RE.search(body)
    if not match or kind.lower() not in RESULT_KINDS:
        return clean_text(body), ""
    return clean_text(body[: match.start()]), clean_proof_text(body[match.end() :])


def trim_proof_tail(text: str) -> str:
    lines = text.splitlines()
    kept: list[str] = []
    for line in lines:
        if PROOF_TAIL_STOP_RE.match(line):
            break
        kept.append(line)
    return "\n".join(kept).strip()


def suspicious_proof_flags(proof: str, proof_dependencies: list[str], item_id: str) -> list[str]:
    flags = [label for label, pattern in SUSPICIOUS_PROOF_PATTERNS.items() if pattern.search(proof)]
    if item_id in proof_dependencies:
        flags.append("self dependency")
    return flags


def extract_blocks(text: str) -> list[Block]:
    matches = list(HEAD_RE.finditer(text))
    blocks: list[Block] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        kind = match.group("kind")
        body = strip_page_artifacts(text[match.end() : end]).strip()
        body = clean_matrix_artifacts(body)
        if not body:
            continue
        statement, proof = split_statement_and_proof(kind, body)
        blocks.append(
            Block(
                kind=kind.lower(),
                number=match.group("num"),
                title=(match.group("title") or "").strip(),
                body=clean_text(body),
                statement=statement,
                proof=proof,
            )
        )
    return blocks


def item_ref_numbers(item: dict[str, Any]) -> set[str]:
    return set(REF_NUMBER_RE.findall(str(item.get("ref") or "")))


def item_ref_kind_aliases(item: dict[str, Any]) -> set[str]:
    ref = str(item.get("ref") or "").lower()
    aliases: set[str] = set()
    for kind, kind_aliases in KIND_ALIASES.items():
        if item.get("kind") == kind:
            aliases.add(kind)
        if any(re.search(rf"\b{re.escape(alias)}\.?\b", ref) for alias in kind_aliases):
            aliases.add(kind)
    return aliases


def build_ref_index(items: list[dict[str, Any]]) -> dict[tuple[str, str], list[dict[str, Any]]]:
    index: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for item in items:
        aliases = item_ref_kind_aliases(item)
        for number in item_ref_numbers(item):
            for kind in aliases:
                index.setdefault((kind, number), []).append(item)
    return index


def collect_ref_numbers(text: str) -> list[str]:
    numbers: list[str] = []
    for pattern in (EXPLICIT_REF, PAREN_REF, BY_REF):
        for match in pattern.finditer(text):
            numbers.extend(REF_NUMBER_RE.findall(match.group(0)))
    return list(dict.fromkeys(numbers))


def summarize(items: list[str], limit: int = 20) -> None:
    for value in items[:limit]:
        print(f"  - {value}")
    if len(items) > limit:
        print(f"  ... {len(items) - limit} more")


def run(dry_run: bool, force: bool = False) -> int:
    blocks = extract_blocks(SRC.read_text(encoding="utf-8"))
    proof_blocks = [block for block in blocks if block.kind in RESULT_KINDS and block.proof]

    data = json.loads(TOPOLOGY_MAP.read_text(encoding="utf-8"))
    items: list[dict[str, Any]] = data["graph"]["items"]
    ref_index = build_ref_index(items)
    id_by_number: dict[str, str] = {}
    for item in items:
        for number in item_ref_numbers(item):
            id_by_number.setdefault(number, item["id"])

    matched = 0
    skipped_existing: list[str] = []
    unmatched: list[str] = []
    ambiguous: list[str] = []
    unresolved_dependencies: list[str] = []
    suspicious_generated: list[str] = []

    for block in proof_blocks:
        candidates = ref_index.get((block.kind, block.number), [])
        label = f"{block.kind.title()} {block.number}"
        if len(candidates) != 1:
            target = ambiguous if candidates else unmatched
            ids = ", ".join(item["id"] for item in candidates) or "no candidates"
            target.append(f"{label} ({ids})")
            continue

        item = candidates[0]
        if str(item.get("proof") or "").strip() and not force:
            skipped_existing.append(f"{label} -> {item['id']}")
            continue

        dependency_ids: list[str] = []
        for number in collect_ref_numbers(block.proof):
            dependency_id = id_by_number.get(number)
            if dependency_id and dependency_id != item["id"]:
                dependency_ids.append(dependency_id)
            elif not dependency_id:
                unresolved_dependencies.append(f"{label}: {number}")
        dependency_ids = list(dict.fromkeys(dependency_ids))

        generated_flags = suspicious_proof_flags(block.proof, dependency_ids, item["id"])
        if generated_flags:
            suspicious_generated.append(f"{label} -> {item['id']} [{', '.join(generated_flags)}]")

        matched += 1
        if not dry_run:
            item["proof"] = block.proof
            item.pop("proof_dependencies", None)
            if dependency_ids:
                item["proof_dependencies"] = dependency_ids

    suspicious_stored: list[str] = []
    for item in items:
        proof = str(item.get("proof") or "")
        if not proof:
            continue
        proof_dependencies = list(item.get("proof_dependencies") or [])
        stored_flags = suspicious_proof_flags(proof, proof_dependencies, item["id"])
        if stored_flags:
            ref = item.get("ref") or item["id"]
            suspicious_stored.append(f"{ref} -> {item['id']} [{', '.join(stored_flags)}]")

    print(f"Proof blocks found: {len(proof_blocks)}")
    print(f"Matched new proofs: {matched}")
    print(f"Skipped existing proofs: {len(skipped_existing)}")
    print(f"Unmatched raw proof blocks: {len(unmatched)}")
    print(f"Ambiguous raw proof blocks: {len(ambiguous)}")
    print(f"Unresolved proof dependency refs: {len(unresolved_dependencies)}")
    print(f"Suspicious generated proofs: {len(suspicious_generated)}")
    print(f"Suspicious stored proofs: {len(suspicious_stored)}")

    if unmatched:
        print("\nUnmatched raw proof blocks:")
        summarize(unmatched)
    if ambiguous:
        print("\nAmbiguous raw proof blocks:")
        summarize(ambiguous)
    if skipped_existing:
        print("\nItems with existing proofs skipped:")
        summarize(skipped_existing)
    if unresolved_dependencies:
        print("\nUnresolved proof dependency refs:")
        summarize(sorted(set(unresolved_dependencies)))
    if suspicious_generated:
        print("\nSuspicious generated proofs:")
        summarize(suspicious_generated)
    if suspicious_stored:
        print("\nSuspicious stored proofs:")
        summarize(suspicious_stored)

    if dry_run:
        print("\nDry run only; topology.json was not modified.")
    else:
        TOPOLOGY_MAP.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nUpdated {TOPOLOGY_MAP.relative_to(ROOT)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="report without modifying topology.json")
    parser.add_argument("--force", action="store_true", help="replace existing proof fields")
    args = parser.parse_args()
    return run(dry_run=args.dry_run, force=args.force)


if __name__ == "__main__":
    sys.exit(main())
