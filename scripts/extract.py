#!/usr/bin/env python3
"""Extract mathematical items from topology notes into a schema-conformant graph.

The expected input is plain text produced from lecture notes, typically via:

    pdftotext -layout topology.pdf content/topology.raw.txt

The output is a JSON graph with:
  - nodes for Definitions, Theorems, Lemmas, Examples, Propositions, Corollaries
  - directed dependency edges inferred from textual references

By convention, dependency edges point from the referenced item to the item that
uses it. In other words, if Theorem 3.4 says "by Lemma 3.3", the edge is:

    source = lemma:3.3:...
    target = theorem:3.4:...
    type   = proof_dependency
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

SCHEMA_VERSION = "1.0.0"
GENERATOR = "extract_rewritten.py"

KINDS = ("Definition", "Theorem", "Lemma", "Example", "Proposition", "Corollary")
KIND_RE = "|".join(KINDS)
NUM_RE = r"[0-9A-Z]+\.[0-9]+"

# Accept headings at column 0 or with layout indentation. Do not require a title.
# Examples matched:
#   Definition 3.1
#   Definition 3.1.
#   Theorem 6.12 (Heine-Borel)
HEADING_RE = re.compile(
    rf"^[ \t]*(?P<kind>{KIND_RE})\s+(?P<number>{NUM_RE})(?:\s*\((?P<title>[^)\n]+)\))?(?:[.:])?",
    re.MULTILINE,
)

PROOF_RE = re.compile(r"(?:^|\n|\s)Proof\.?\s*", re.IGNORECASE)

SECTIONS: dict[str, str] = {
    "1": "Introduction",
    "2": "Continuous maps",
    "3": "Topological spaces",
    "4": "Generating topologies",
    "5": "Constructing topological spaces",
    "6": "Topological properties",
    "7": "The fundamental group",
    "8": "The fundamental group of the circle",
    "A": "Set theory",
    "B": "Elementary algebra",
}

TOPIC_CLUSTERS: dict[str, str] = {
    "1": "Overture",
    "2": "Metric Foundations",
    "3": "Topological Spaces",
    "4": "Generating Topologies",
    "5": "Constructions",
    "6": "Topological Properties",
    "7": "Fundamental Group",
    "8": "Fundamental Group of S¹",
    "A": "Set Theory",
    "B": "Algebra",
}

KIND_TO_NODE_KIND: dict[str, str] = {
    "Definition": "definition",
    "Theorem": "theorem",
    "Lemma": "lemma",
    "Example": "example",
    "Proposition": "proposition",
    "Corollary": "corollary",
}

# ---------------------------------------------------------------------------
# Reference patterns
# ---------------------------------------------------------------------------
REF_LIST = rf"{NUM_RE}(?:\s*(?:,|;|&|\band\b)\s*{NUM_RE})*"

EXPLICIT_REF_RE = re.compile(
    rf"\b(?P<kind>{KIND_RE})s?\s+(?P<refs>{REF_LIST})",
    re.IGNORECASE,
)

# Examples:
#   by Theorem 3.4
#   using 3.4
#   follows from Lemmas 3.1 and 3.2
BY_REF_RE = re.compile(
    rf"\b(?:by|from|using|applying|via|due to|as in|follows from)\s+"
    rf"(?:the\s+)?(?:{KIND_RE})?s?\s*(?P<refs>{REF_LIST})",
    re.IGNORECASE,
)

# Examples:
#   (see 3.4)
#   (cf. 3.4, 3.5)
#   (3.4; 3.5)
PAREN_REF_RE = re.compile(
    rf"\(\s*(?:see\s+|cf\.?\s+|by\s+|from\s+|using\s+)?(?P<refs>{NUM_RE}(?:\s*[,;]\s*{NUM_RE})*)\s*\)",
    re.IGNORECASE,
)

PREVIOUS_REF_RE = re.compile(
    rf"\b(?:the\s+)?(?:previous|preceding|above)\s+(?P<kind>{KIND_RE})\b",
    re.IGNORECASE,
)

TAG_RULES: tuple[tuple[str, str], ...] = (
    ("metric", "metric"),
    ("topolog", "topology"),
    ("continuous", "continuity"),
    ("homeomorph", "homeomorphism"),
    ("homotop", "homotopy"),
    ("compact", "compactness"),
    ("connected", "connectedness"),
    ("hausdorff", "hausdorff"),
    ("open", "open-sets"),
    ("closed", "closed-sets"),
    ("basis", "basis"),
    ("subbasis", "subbasis"),
    ("subspace", "subspace"),
    ("product", "product"),
    ("quotient", "quotient"),
    ("path", "paths"),
    ("cover", "covering"),
    ("fundamental group", "fundamental-group"),
    ("group", "groups"),
    ("set", "sets"),
    ("map", "maps"),
)


def default_root() -> Path:
    """Return a useful project root when this file lives in scripts/.

    If the file is copied elsewhere, this still gives a stable default: the
    parent of the script's directory.
    """
    return Path(__file__).resolve().parent.parent


def slugify(text: str, max_len: int = 72) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    text = re.sub(r"-{2,}", "-", text)
    return text[:max_len].strip("-") or "item"


def compact_token(text: str) -> str:
    """Make an ID component suitable for compact edge ids."""
    return slugify(text.replace(":", "-"), max_len=48)


def stable_edge_id(edge_type: str, source: str, target: str) -> str:
    digest = hashlib.sha1(f"{edge_type}|{source}|{target}".encode("utf-8")).hexdigest()[
        :10
    ]
    return f"edge:{edge_type}:{compact_token(source)}:{digest}"


def chapter_of(number: str) -> str:
    return number.split(".", 1)[0]


def collect_numbers(text: str) -> list[str]:
    return re.findall(NUM_RE, text)


def unique_preserving_order(values: Iterable[str]) -> list[str]:
    return list(dict.fromkeys(values))


# ---------------------------------------------------------------------------
# Text cleanup
# ---------------------------------------------------------------------------
def strip_page_artifacts(text: str) -> str:
    """Remove common pdftotext page headers/footers without touching prose."""
    cleaned: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        upper = s.upper()

        if re.fullmatch(r"\d+", s):
            continue
        if "INTRODUCTION TO TOPOLOGY" in upper:
            continue
        # Common layout header: "12  3. TOPOLOGICAL SPACES".
        if re.fullmatch(r"\d+\s+[0-9A-Z]+\.\s+[A-Z][A-Z0-9 .,'’:-]+", s):
            continue
        # Common centered section header, e.g. "3. TOPOLOGICAL SPACES".
        if re.fullmatch(r"[0-9A-Z]+\.\s+[A-Z][A-Z0-9 .,'’:-]+", s):
            continue

        cleaned.append(line.rstrip())
    return "\n".join(cleaned)


def clean_matrix_artifacts(text: str) -> str:
    """Replace shattered matrix-like numeric bracket blocks with a placeholder."""
    matrix_pat = re.compile(r"(?:\[\s*(?:-?\d+\s*){2,}\s*\]\s*){2,}")
    text = matrix_pat.sub(" [matrix omitted] ", text)
    text = re.sub(r"(?:\|\s*){4,}", "", text)
    return text


def clean_text(text: str) -> str:
    """Normalize line breaks while preserving paragraph boundaries."""
    text = clean_matrix_artifacts(text)
    # Join hyphenated words split across lines.
    text = re.sub(r"(\w)-\n\s*(\w)", r"\1\2", text)
    paragraphs: list[str] = []
    for para in re.split(r"\n\s*\n", text):
        joined = re.sub(r"[ \t\r\f\v]+", " ", para)
        joined = re.sub(r"\n+", " ", joined).strip()
        if joined:
            paragraphs.append(joined)
    return "\n\n".join(paragraphs)


def split_statement_and_proof(text: str) -> tuple[str, str | None]:
    match = PROOF_RE.search(text)
    if not match:
        return text.strip(), None
    statement = text[: match.start()].strip()
    proof = text[match.start() :].strip()
    return statement, proof or None


def title_from_body(
    kind: str, number: str, explicit_title: str | None, body: str
) -> str:
    if explicit_title and explicit_title.strip():
        return clean_text(explicit_title).strip()
    # Avoid inventing a mathematical title from a long statement. Use a stable label.
    return f"{kind} {number}"


def node_id_for(kind: str, number: str, title: str, body: str) -> str:
    node_kind = KIND_TO_NODE_KIND[kind]
    if title != f"{kind} {number}":
        slug_source = title
    else:
        # Fall back to the first few meaningful words of the statement.
        slug_source = body[:120]
    return f"{node_kind}:{number}:{slugify(slug_source)}"


def derive_tags(title: str, body: str) -> list[str]:
    seed = f"{title} {body[:1200]}".lower()
    tags = {tag for needle, tag in TAG_RULES if needle in seed}
    return sorted(tags)


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------
def extract_nodes(text: str, *, domain: str) -> list[dict[str, Any]]:
    matches = list(HEADING_RE.finditer(text))
    nodes: list[dict[str, Any]] = []
    seen_ids: Counter[str] = Counter()

    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        kind_original = match.group("kind")
        number = match.group("number")
        explicit_title = match.group("title")
        raw_body = text[match.end() : end]
        cleaned_body = clean_text(strip_page_artifacts(raw_body))
        if not cleaned_body:
            continue

        title = title_from_body(kind_original, number, explicit_title, cleaned_body)
        statement, proof = split_statement_and_proof(cleaned_body)
        base_node_id = node_id_for(
            kind_original, number, title, statement or cleaned_body
        )
        seen_ids[base_node_id] += 1
        node_id = (
            base_node_id
            if seen_ids[base_node_id] == 1
            else f"{base_node_id}-{seen_ids[base_node_id]}"
        )

        chapter = chapter_of(number)
        kind = KIND_TO_NODE_KIND[kind_original]

        nodes.append(
            {
                "id": node_id,
                "kind": kind,
                "label": (
                    f"{kind_original} {number}: {title}"
                    if title != f"{kind_original} {number}"
                    else f"{kind_original} {number}"
                ),
                "number": number,
                "title": title,
                "domain": domain,
                "chapter": {
                    "id": chapter,
                    "title": SECTIONS.get(chapter, ""),
                },
                "topicCluster": TOPIC_CLUSTERS.get(chapter, "Misc"),
                "text": {
                    "raw": cleaned_body,
                    "statement": statement,
                    "proof": proof,
                },
                "dependencies": {
                    "statement": [],
                    "proof": [],
                },
                "tags": derive_tags(title, cleaned_body),
                "metadata": {
                    "originalKind": kind_original,
                    "sourceOrder": len(nodes),
                },
            }
        )

    return nodes


# ---------------------------------------------------------------------------
# Edge inference
# ---------------------------------------------------------------------------
def context_around(text: str, start: int, end: int, radius: int = 80) -> str:
    lo = max(0, start - radius)
    hi = min(len(text), end + radius)
    ctx = text[lo:hi]
    return re.sub(r"\s+", " ", ctx).strip()


def infer_edges(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_number: dict[str, dict[str, Any]] = {node["number"]: node for node in nodes}
    edges_by_key: dict[tuple[str, str, str], dict[str, Any]] = {}

    def add_dependency(
        *,
        source_node: dict[str, Any],
        target_node: dict[str, Any],
        edge_type: str,
        method: str,
        reference_number: str,
        matched_text: str,
        context: str,
        confidence: float,
    ) -> None:
        source_id = source_node["id"]
        target_id = target_node["id"]
        if source_id == target_id:
            return

        dep_bucket = "proof" if edge_type == "proof_dependency" else "statement"
        target_node["dependencies"][dep_bucket].append(source_id)
        target_node["dependencies"][dep_bucket] = unique_preserving_order(
            target_node["dependencies"][dep_bucket]
        )

        key = (source_id, target_id, edge_type)
        evidence = {
            "method": method,
            "referenceNumber": reference_number,
            "matchedText": matched_text.strip(),
            "context": context,
            "confidence": round(confidence, 3),
        }

        if key not in edges_by_key:
            edges_by_key[key] = {
                "id": stable_edge_id(edge_type, source_id, target_id),
                "source": source_id,
                "target": target_id,
                "type": edge_type,
                "label": (
                    "used in proof"
                    if edge_type == "proof_dependency"
                    else "used in statement"
                ),
                "directed": True,
                "confidence": round(confidence, 3),
                "evidence": [evidence],
                "metadata": {
                    "sourceNumber": source_node["number"],
                    "targetNumber": target_node["number"],
                },
            }
        else:
            edge = edges_by_key[key]
            edge["confidence"] = round(max(edge["confidence"], confidence), 3)
            # Keep evidence compact and deterministic.
            ev_key = (method, reference_number, matched_text.strip())
            existing = {
                (e["method"], e["referenceNumber"], e["matchedText"])
                for e in edge["evidence"]
            }
            if ev_key not in existing:
                edge["evidence"].append(evidence)

    def scan_references(
        text: str, target_node: dict[str, Any], edge_type: str, target_index: int
    ) -> None:
        scans = [
            (BY_REF_RE, "by_reference", 0.92),
            (EXPLICIT_REF_RE, "explicit_reference", 0.86),
            (PAREN_REF_RE, "parenthetical_reference", 0.74),
        ]
        for regex, method, confidence in scans:
            for match in regex.finditer(text):
                matched_text = match.group(0)
                for number in collect_numbers(
                    match.group("refs") if "refs" in match.groupdict() else matched_text
                ):
                    source_node = by_number.get(number)
                    if not source_node:
                        continue
                    add_dependency(
                        source_node=source_node,
                        target_node=target_node,
                        edge_type=edge_type,
                        method=method,
                        reference_number=number,
                        matched_text=matched_text,
                        context=context_around(text, match.start(), match.end()),
                        confidence=confidence,
                    )

        for match in PREVIOUS_REF_RE.finditer(text):
            wanted_kind = KIND_TO_NODE_KIND[match.group("kind").title()]
            for prev_index in range(target_index - 1, -1, -1):
                candidate = nodes[prev_index]
                if candidate["kind"] == wanted_kind:
                    add_dependency(
                        source_node=candidate,
                        target_node=target_node,
                        edge_type=edge_type,
                        method="previous_reference",
                        reference_number=candidate["number"],
                        matched_text=match.group(0),
                        context=context_around(text, match.start(), match.end()),
                        confidence=0.58,
                    )
                    break

    for target_index, node in enumerate(nodes):
        statement = node["text"]["statement"] or ""
        proof = node["text"]["proof"] or ""
        scan_references(statement, node, "statement_dependency", target_index)
        scan_references(proof, node, "proof_dependency", target_index)

    return sorted(
        edges_by_key.values(),
        key=lambda e: (
            e["metadata"]["targetNumber"],
            e["type"],
            e["metadata"]["sourceNumber"],
        ),
    )


# ---------------------------------------------------------------------------
# Graph construction / validation
# ---------------------------------------------------------------------------
def build_graph(
    text: str, *, title: str, source_path: Path, domain: str
) -> dict[str, Any]:
    nodes = extract_nodes(text, domain=domain)
    edges = infer_edges(nodes)

    counts: dict[str, int] = {
        "nodes": len(nodes),
        "edges": len(edges),
    }
    counts.update(
        {
            f"nodes.{kind}": count
            for kind, count in Counter(node["kind"] for node in nodes).items()
        }
    )
    counts.update(
        {
            f"edges.{kind}": count
            for kind, count in Counter(edge["type"] for edge in edges).items()
        }
    )

    return {
        "schemaVersion": SCHEMA_VERSION,
        "metadata": {
            "title": title,
            "description": "Automatically extracted mathematical concept graph.",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "generator": GENERATOR,
            "source": {
                "path": str(source_path),
                "format": "pdftotext-layout",
            },
            "counts": counts,
        },
        "nodes": nodes,
        "edges": edges,
    }


def validate_graph(graph: dict[str, Any], schema_path: Path) -> None:
    try:
        import jsonschema  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "Validation requested, but the 'jsonschema' package is not installed."
        ) from exc

    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    jsonschema.validate(instance=graph, schema=schema)


def parse_args(argv: list[str]) -> argparse.Namespace:
    root = default_root()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--src",
        type=Path,
        default=root / "content" / "topology.raw.txt",
        help="Input text file",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=root / "data" / "topology.raw.json",
        help="Output graph JSON",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=root / "schemas" / "math-concept-graph.schema.json",
        help="JSON Schema path for --validate",
    )
    parser.add_argument(
        "--title",
        default="Topology Concept Graph",
        help="Graph title stored in metadata",
    )
    parser.add_argument(
        "--domain", default="topology", help="Domain assigned to extracted nodes"
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate output against --schema before writing",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)

    if not args.src.exists():
        print(f"Input file not found: {args.src}", file=sys.stderr)
        return 2

    text = args.src.read_text(encoding="utf-8")
    graph = build_graph(
        text, title=args.title, source_path=args.src, domain=args.domain
    )

    if args.validate:
        validate_graph(graph, args.schema)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(graph, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    counts = graph["metadata"]["counts"]
    print(f"Wrote {counts['nodes']} nodes, {counts['edges']} edges -> {args.out}")
    print(
        "Nodes by kind:",
        {
            k.removeprefix("nodes."): v
            for k, v in counts.items()
            if k.startswith("nodes.")
        },
    )
    print(
        "Edges by type:",
        {
            k.removeprefix("edges."): v
            for k, v in counts.items()
            if k.startswith("edges.")
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
