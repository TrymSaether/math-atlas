#!/usr/bin/env python3
"""
Convert YAML knowledge graphs to JSON/JSONL with JSON Schema generation.
Supports both functional analysis and topology knowledge graphs.
"""

import yaml
import json
from pathlib import Path
from typing import Any, Dict, List
from jsonschema import Draft7Validator
import sys


def load_yaml(filepath: str) -> Dict[str, Any]:
    """Load YAML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def save_json(data: Dict[str, Any], filepath: str) -> None:
    """Save as formatted JSON."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved: {filepath}")


def save_jsonl(items: List[Dict[str, Any]], filepath: str) -> None:
    """Save as JSONL (one JSON object per line)."""
    with open(filepath, 'w', encoding='utf-8') as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    print(f"✓ Saved: {filepath} ({len(items)} items)")


def generate_json_schema(data: Dict[str, Any], title: str = "Knowledge Graph") -> Dict[str, Any]:
    """Generate a JSON schema from the data structure."""

    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": title,
        "type": "object",
        "properties": {}
    }

    # Analyze schema section
    if "schema" in data:
        schema["properties"]["schema"] = {
            "type": "object",
            "properties": {
                "version": {"type": "string"},
                "graph_model": {
                    "type": "object",
                    "properties": {
                        "top_level_field_id": {"type": "string"},
                        "directed": {"type": "boolean"},
                        "typed": {"type": "boolean"},
                        "multigraph": {"type": "boolean"},
                        "tree_policy": {"type": "string"}
                    }
                },
                "item_kinds": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "object",
                        "properties": {
                            "meaning": {"type": "string"}
                        }
                    }
                },
                "dependency_classes": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "object",
                        "properties": {
                            "meaning": {"type": "string"}
                        }
                    }
                },
                "edge_types": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "object"
                    }
                },
                "item_schema": {"type": "object"},
                "edge_schema": {"type": "object"}
            }
        }

    # Analyze items section
    if "items" in data:
        item_sample = data["items"][0] if data["items"] else {}
        schema["properties"]["items"] = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "label": {"type": "string"},
                    "kind": {"type": "string"},
                    "statement": {"type": ["string", "null"]},
                    "formal_statement": {"type": ["string", "null"]},
                    "definition": {"type": ["string", "null"]},
                    "intuition": {"type": ["string", "null"]},
                    "notation": {"type": ["string", "null", "array"]},
                    "assumptions": {"type": "array"},
                    "dependencies": {"type": "object"},
                    "outgoing_relations": {"type": "array"},
                    "metadata": {
                        "type": "object",
                        "properties": {
                            "tags": {"type": "array"},
                            "syllabus_priority": {"type": "string"},
                            "source": {"type": ["string", "null"]}
                        }
                    },
                    "hypotheses": {"type": "array"},
                    "conclusion": {"type": "string"},
                    "proof_methods": {"type": "array"},
                    "related_theorems": {"type": "array"},
                    "examples": {"type": "array"},
                    "applications": {"type": "array"},
                    "introduced_object": {"type": "string"},
                    "genus": {"type": "string"},
                    "differentia": {"type": "array"},
                    "non_examples": {"type": "array"},
                    "equivalent_definitions": {"type": "array"}
                }
            }
        }

    # Analyze edges section
    if "edges" in data:
        schema["properties"]["edges"] = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "source": {"type": "string"},
                    "target": {"type": "string"},
                    "type": {"type": "string"},
                    "dependency_class": {"type": ["string", "null"]},
                    "label": {"type": "string"},
                    "direction": {"type": "string"},
                    "confidence": {"type": ["number", "string"]},
                    "notes": {"type": ["string", "null"]}
                }
            }
        }

    # Analyze graph section
    if "graph" in data:
        schema["properties"]["graph"] = {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "label": {"type": "string"},
                "top_level_item": {"type": "string"},
                "items": {"type": "array"},
                "edges": {"type": "array"}
            }
        }

    # Analyze views section
    if "views" in data:
        schema["properties"]["views"] = {
            "type": "object",
            "additionalProperties": {
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "example_traversal": {"type": "string"}
                }
            }
        }

    # Analyze query_model section
    if "query_model" in data:
        schema["properties"]["query_model"] = {
            "type": "object",
            "properties": {
                "description": {"type": "string"},
                "traversal_conventions": {"type": "object"},
                "dependency_distinctions": {"type": "object"}
            }
        }

    # Analyze example_queries section
    if "example_queries" in data:
        schema["properties"]["example_queries"] = {
            "type": "array",
            "items": {"type": "object"}
        }

    return schema


def convert_yaml_to_json(yaml_file: str, output_dir: str = None) -> None:
    """Convert a YAML knowledge graph to JSON and JSONL formats."""

    yaml_path = Path(yaml_file)
    if not yaml_path.exists():
        print(f"✗ File not found: {yaml_file}")
        return

    if output_dir is None:
        output_dir = yaml_path.parent
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

    base_name = yaml_path.stem

    print(f"\n{'='*60}")
    print(f"Converting: {yaml_path.name}")
    print('='*60)

    # Load YAML
    print("Loading YAML...")
    data = load_yaml(yaml_file)

    # Save as JSON
    json_file = output_dir / f"{base_name}.json"
    save_json(data, str(json_file))
    json_size = json_file.stat().st_size / 1024
    print(f"  Size: {json_size:.1f} KB")

    # Extract and save items as JSONL
    if "items" in data:
        items_jsonl = output_dir / f"{base_name}_items.jsonl"
        save_jsonl(data["items"], str(items_jsonl))

    # Extract and save edges as JSONL
    if "edges" in data:
        edges_jsonl = output_dir / f"{base_name}_edges.jsonl"
        save_jsonl(data["edges"], str(edges_jsonl))

    # Generate and save JSON schema
    print("Generating JSON schema...")
    title = data.get("schema", {}).get("graph_model", {}).get("top_level_field_id", "Knowledge Graph")
    schema = generate_json_schema(data, title=f"{title.title()} Schema")

    schema_file = output_dir / f"{base_name}.schema.json"
    save_json(schema, str(schema_file))

    # Print statistics
    print("\nStatistics:")
    print(f"  Schema sections: {len(data) if isinstance(data, dict) else 0}")
    if "schema" in data:
        schema_data = data["schema"]
        print(f"  Item kinds: {len(schema_data.get('item_kinds', {}))}")
        print(f"  Dependency classes: {len(schema_data.get('dependency_classes', {}))}")
        print(f"  Edge types: {len(schema_data.get('edge_types', {}))}")

    if "items" in data:
        print(f"  Items: {len(data['items'])}")

    if "edges" in data:
        print(f"  Edges: {len(data['edges'])}")

    if "graph" in data:
        graph = data["graph"]
        if "items" in graph:
            print(f"  Graph items: {len(graph['items'])}")
        if "edges" in graph:
            print(f"  Graph edges: {len(graph['edges'])}")


def main():
    """Main conversion function."""

    # Files to convert
    files_to_convert = [
        "/Users/saether/onedrive_new/10_projects/topology-map/data/functional_analysis_knowledge_graph.yaml",
        "/Users/saether/onedrive_new/10_projects/topology-map/data/topology_knowledge_graph.yaml"
    ]

    output_dirs = {
        "functional_analysis": "/Users/saether/onedrive_new/10_projects/topology-map/data",
        "topology": "/Users/saether/onedrive_new/10_projects/topology-map/data"
    }

    for yaml_file in files_to_convert:
        yaml_path = Path(yaml_file)
        if yaml_path.exists():
            # Determine output directory
            if "functional_analysis" in yaml_file:
                out_dir = output_dirs["functional_analysis"]
            else:
                out_dir = output_dirs["topology"]

            convert_yaml_to_json(yaml_file, out_dir)
        else:
            print(f"⚠ File not found: {yaml_file}")

    print(f"\n{'='*60}")
    print("✓ Conversion complete!")
    print('='*60)


if __name__ == '__main__':
    main()
