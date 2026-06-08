#!/usr/bin/env python3
"""
Topology Knowledge Graph Converter
Converts topology.json into multiple efficient formats.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Any

import pyarrow as pa
import pyarrow.parquet as pq
import pandas as pd


def flatten_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten a graph item for tabular formats."""
    metadata = item.get("metadata", {})
    status = item.get("status", {})

    return {
        "id": item.get("id"),
        "label": item.get("label"),
        "display_label": item.get("display_label"),
        "canonical_label": item.get("canonical_label"),
        "kind": item.get("kind"),
        "domain": item.get("domain"),
        "chapter": item.get("chapter"),
        "ref": item.get("ref"),
        "statement": item.get("statement"),
        "formal_statement": item.get("formal_statement"),
        "definition": item.get("definition"),
        "intuition": item.get("intuition"),
        "gloss": item.get("gloss"),
        "notation": (
            str(item.get("notation")) if item.get("notation") is not None else None
        ),
        "syllabus_priority": metadata.get("syllabus_priority"),
        "tags": ",".join(metadata.get("tags", [])) if metadata.get("tags") else None,
        "status_content": status.get("content"),
        "full_text": " | ".join(
            filter(
                None,
                [
                    item.get("label"),
                    item.get("statement"),
                    item.get("definition"),
                    item.get("intuition"),
                    item.get("gloss"),
                ],
            )
        ),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Convert topology.json to multiple efficient formats.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default="./topology.json",
        help="Input JSON file",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default="./output",
        help="Output directory",
    )
    parser.add_argument(
        "--formats",
        choices=["parquet", "jsonl", "csv", "excel", "all"],
        default="all",
        nargs="+",
        help="Output formats to generate",
    )
    parser.add_argument(
        "--embeddings",
        action="store_true",
        help="Add placeholder for embeddings (full_text column)",
    )

    args = parser.parse_args()

    # Setup
    args.output.mkdir(parents=True, exist_ok=True)
    print(f"📂 Loading {args.input}...")

    with open(args.input, encoding="utf-8") as f:
        data = json.load(f)

    graph = data.get("graph", {})
    items = graph.get("items", [])
    edges = graph.get("edges", [])

    print(f"Found {len(items)} items and {len(edges)} edges.")

    # Flatten data
    flat_items = [flatten_item(item) for item in items]
    flat_edges = [
        {
            "edge_id": e.get("id"),
            "source": e.get("source"),
            "target": e.get("target"),
            "type": e.get("type"),
            "dependency_class": e.get("dependency_class"),
            "label": e.get("label"),
            "confidence": e.get("confidence"),
            "notes": e.get("notes"),
        }
        for e in edges
    ]

    items_df = pd.DataFrame(flat_items)
    edges_df = pd.DataFrame(flat_edges)

    formats = (
        args.formats
        if "all" not in args.formats
        else ["parquet", "jsonl", "csv", "excel"]
    )

    # === Parquet ===
    if any(f in formats for f in ["parquet"]):
        items_table = pa.Table.from_pandas(items_df)
        edges_table = pa.Table.from_pandas(edges_df)

        pq.write_table(
            items_table, args.output / "topology_items.parquet", compression="zstd"
        )
        pq.write_table(
            edges_table, args.output / "topology_edges.parquet", compression="zstd"
        )
        print("✅ Parquet files written")

    # === JSONL (great for LLMs) ===
    if "jsonl" in formats:
        items_df.to_json(
            args.output / "topology_items.jsonl", orient="records", lines=True
        )
        edges_df.to_json(
            args.output / "topology_edges.jsonl", orient="records", lines=True
        )
        print("✅ JSONL files written")

    # === CSV ===
    if "csv" in formats:
        items_df.to_csv(args.output / "topology_items.csv", index=False)
        edges_df.to_csv(args.output / "topology_edges.csv", index=False)
        print("✅ CSV files written")

    # === Excel ===
    if "excel" in formats:
        with pd.ExcelWriter(args.output / "topology.xlsx") as writer:
            items_df.to_excel(writer, sheet_name="Items", index=False)
            edges_df.to_excel(writer, sheet_name="Edges", index=False)
        print("✅ Excel workbook written")

    # Summary
    print("\n🎉 Conversion complete!")
    print(f"Output directory: {args.output}")
    print("\nRecommended next steps:")
    print("  • Use Parquet for fast queries")
    print("  • Use JSONL for fine-tuning / RAG")
    print("  • Load Parquet with Polars/Pandas for analysis")


if __name__ == "__main__":
    main()
