#!/usr/bin/env python3
"""
Convert topology.json to YAML schema format matching functional_analysis_knowledge_graph.yaml

This script reads the topology.json file and outputs a YAML file with:
- Schema definition with item kinds, dependency classes, edge types
- Items derived from nodes with dependencies
- Edges derived from the graph edges
"""

import json
import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional
from collections import defaultdict


def load_topology_json(filepath: str) -> Dict[str, Any]:
    """Load the topology.json file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def build_schema_definition() -> Dict[str, Any]:
    """Build the schema definition section for topology."""
    return {
        'version': '1.0.0',
        'graph_model': {
            'top_level_field_id': 'topology',
            'directed': True,
            'typed': True,
            'multigraph': True,
            'tree_policy': 'Trees are extracted views; the underlying model is a directed typed multigraph.'
        },
        'item_kinds': {
            'axiom': {'meaning': 'Accepted foundational principle used without proof.'},
            'assumption': {'meaning': 'Hypothesis required for a theorem, proof, construction, or example.'},
            'definition': {'meaning': 'Exact definition of a mathematical notion.'},
            'structure': {'meaning': 'Mathematical structure, usually a set with operations, topology, norm, or inner product.'},
            'object': {'meaning': 'Mathematical item that is neither primarily a theorem nor a definition, such as an operator or functional.'},
            'property': {'meaning': 'Predicate or qualitative condition carried by structures or objects.'},
            'construction': {'meaning': 'Procedure or induced object built from other objects.'},
            'notation': {'meaning': 'Symbolic convention or abbreviation.'},
            'example': {'meaning': 'Item satisfying one or more definitions or illustrating a theorem.'},
            'non_example': {'meaning': 'Item failing a definition because one or more required conditions fail.'},
            'counterexample': {'meaning': 'Item showing that a statement or implication fails when assumptions are removed.'},
            'lemma': {'meaning': 'Auxiliary proved result.'},
            'proposition': {'meaning': 'Proved result of moderate scope.'},
            'theorem': {'meaning': 'Central proved result.'},
            'corollary': {'meaning': 'Result following directly from another result.'},
            'conjecture': {'meaning': 'Plausible but unproved statement.'},
            'proof': {'meaning': 'Complete proof object proving a result.'},
            'proof_step': {'meaning': 'Atomic step inside a proof.'},
            'proof_method': {'meaning': 'Reusable proof strategy or technique.'},
            'application': {'meaning': 'Use of a result in another mathematical or applied context.'}
        },
        'dependency_classes': {
            'definitional_dependency': {'meaning': 'Needed to parse, state, or type-check an item.'},
            'logical_dependency': {'meaning': 'Used as a mathematical result, tool, or proof ingredient.'},
            'assumption_dependency': {'meaning': 'Hypothesis needed for truth or validity, not merely for notation.'},
            'construction_dependency': {'meaning': 'Needed to build the object or topology.'},
            'notation_dependency': {'meaning': 'Needed only to read notation.'},
            'pedagogical_dependency': {'meaning': 'Useful learning prerequisite, not logically necessary.'},
            'historical_dependency': {'meaning': 'Historical or motivational dependency.'}
        },
        'edge_types': build_edge_types_definition()
    }


def build_edge_types_definition() -> Dict[str, Any]:
    """Build the edge_types definition section."""
    # All target kinds anchor
    all_target_kinds = [
        'axiom', 'assumption', 'definition', 'structure', 'object', 'property',
        'construction', 'notation', 'example', 'non_example', 'counterexample',
        'lemma', 'proposition', 'theorem', 'corollary', 'conjecture', 'proof',
        'proof_step', 'proof_method', 'application'
    ]

    return {
        'defines': {
            'meaning': 'Source supplies the definition of target.',
            'allowed_source_kinds': ['definition', 'notation', 'construction'],
            'allowed_target_kinds': all_target_kinds,
            'inverse_edge_type': 'defined_by',
            'transitive': False,
            'symmetric': False
        },
        'defined_by': {
            'meaning': 'Source is defined by target.',
            'allowed_source_kinds': all_target_kinds,
            'allowed_target_kinds': ['definition', 'notation', 'construction'],
            'inverse_edge_type': 'defines',
            'transitive': False,
            'symmetric': False
        },
        'requires': {
            'meaning': 'Source needs target to be stated, typed, or valid.',
            'allowed_source_kinds': all_target_kinds,
            'allowed_target_kinds': all_target_kinds,
            'inverse_edge_type': None,
            'transitive': True,
            'symmetric': False
        },
        'uses': {
            'meaning': 'Source uses target as a proof ingredient, tool, method, or standard result.',
            'allowed_source_kinds': ['lemma', 'proposition', 'theorem', 'corollary', 'conjecture', 'proof', 'proof_step', 'application'],
            'allowed_target_kinds': all_target_kinds,
            'inverse_edge_type': None,
            'transitive': False,
            'symmetric': False
        },
        'proves': {
            'meaning': 'Proof source proves result target.',
            'allowed_source_kinds': ['proof', 'proof_step'],
            'allowed_target_kinds': ['lemma', 'proposition', 'theorem', 'corollary', 'conjecture'],
            'inverse_edge_type': None,
            'transitive': False,
            'symmetric': False
        },
        'implies': {
            'meaning': 'Truth of source entails truth of target.',
            'allowed_source_kinds': ['lemma', 'proposition', 'theorem', 'corollary', 'conjecture', 'axiom', 'assumption', 'property', 'definition'],
            'allowed_target_kinds': ['lemma', 'proposition', 'theorem', 'corollary', 'conjecture', 'property', 'definition'],
            'inverse_edge_type': None,
            'transitive': True,
            'symmetric': False
        },
        'equivalent_to': {
            'meaning': 'Source and target are logically or definitionally equivalent in the stated context.',
            'allowed_source_kinds': all_target_kinds,
            'allowed_target_kinds': all_target_kinds,
            'inverse_edge_type': None,
            'transitive': False,
            'symmetric': True
        },
        'generalizes': {
            'meaning': 'Source is a broader version of target.',
            'allowed_source_kinds': ['lemma', 'proposition', 'theorem', 'corollary', 'conjecture', 'definition', 'structure', 'object', 'property'],
            'allowed_target_kinds': ['lemma', 'proposition', 'theorem', 'corollary', 'conjecture', 'definition', 'structure', 'object', 'property'],
            'inverse_edge_type': 'specializes',
            'transitive': True,
            'symmetric': False
        },
        'specializes': {
            'meaning': 'Source is a narrower version of target.',
            'allowed_source_kinds': ['lemma', 'proposition', 'theorem', 'corollary', 'conjecture', 'definition', 'structure', 'object', 'property'],
            'allowed_target_kinds': ['lemma', 'proposition', 'theorem', 'corollary', 'conjecture', 'definition', 'structure', 'object', 'property'],
            'inverse_edge_type': 'generalizes',
            'transitive': True,
            'symmetric': False
        },
        'has_example': {
            'meaning': 'Source is illustrated by example target.',
            'allowed_source_kinds': ['definition', 'structure', 'object', 'property', 'theorem'],
            'allowed_target_kinds': ['example', 'non_example'],
            'inverse_edge_type': None,
            'transitive': False,
            'symmetric': False
        }
    }


def build_item_schema() -> Dict[str, Any]:
    """Build the item_schema section."""
    return {
        'required_fields': {
            'id': 'string',
            'label': 'string',
            'kind': 'item_kind',
            'statement': 'string | null',
            'formal_statement': 'string | null',
            'definition': 'string | null',
            'intuition': 'string | null',
            'notation': 'string | list[string] | null',
            'assumptions': 'list[string]',
            'dependencies': {
                'definitional_dependency': 'list[string]',
                'logical_dependency': 'list[string]',
                'assumption_dependency': 'list[string]',
                'construction_dependency': 'list[string]',
                'notation_dependency': 'list[string]',
                'pedagogical_dependency': 'list[string]',
                'historical_dependency': 'list[string]'
            },
            'outgoing_relations': 'list[string]',
            'metadata': {
                'tags': 'list[string]',
                'syllabus_priority': 'low | medium | high | core',
                'source': 'string | null'
            }
        },
        'additional_fields_by_kind': {
            'theorem': {
                'hypotheses': 'list[string]',
                'conclusion': 'string',
                'proof_methods': 'list[string]',
                'related_theorems': 'list[string]',
                'examples': 'list[string]',
                'applications': 'list[string]',
                'variants': [
                    {
                        'id': 'string',
                        'label': 'string',
                        'hypotheses': 'list[string]',
                        'conclusion': 'string'
                    }
                ]
            },
            'definition': {
                'introduced_object': 'string',
                'genus': 'string',
                'differentia': 'list[string]',
                'examples': 'list[string]',
                'non_examples': 'list[string]',
                'equivalent_definitions': 'list[string]'
            },
            'proof': {
                'proves': 'string',
                'strategy': 'string',
                'steps': 'list[string]',
                'uses_methods': 'list[string]',
                'uses_results': 'list[string]',
                'critical_assumptions': 'list[string]'
            }
        }
    }


def build_edge_schema() -> Dict[str, Any]:
    """Build the edge_schema section."""
    return {
        'required_fields': {
            'id': 'string',
            'source': 'string',
            'target': 'string',
            'type': 'edge_type',
            'dependency_class': 'dependency_class | null',
            'label': 'string',
            'direction': 'source_to_target',
            'confidence': 'high | medium | low',
            'notes': 'string | null'
        },
        'direction_semantics': 'Each edge is read literally as source --type--> target.'
    }


def map_edge_relation_to_type(relation: str) -> str:
    """Map topology.json relation to edge_type."""
    # In topology.json, edges use 'proof' or 'statement' as relation
    # Map these to appropriate edge types
    if relation == 'proof':
        return 'uses'  # proof dependencies use the result
    elif relation == 'statement':
        return 'requires'  # statement dependencies require understanding
    else:
        return 'requires'


def map_edge_relation_to_dependency_class(relation: str) -> str:
    """Map topology.json relation to dependency_class."""
    if relation == 'proof':
        return 'logical_dependency'
    elif relation == 'statement':
        return 'definitional_dependency'
    else:
        return 'logical_dependency'


def build_items_from_nodes(nodes: List[Dict], edges_list: List[Dict]) -> List[Dict[str, Any]]:
    """
    Build items from nodes, including their dependencies.

    Args:
        nodes: List of node objects from topology.json
        edges_list: List of edge objects from topology.json

    Returns:
        List of item objects with dependencies
    """
    # Build edge index for quick lookup
    edges_by_target = defaultdict(list)
    for edge in edges_list:
        edges_by_target[edge['to']].append(edge)

    items = []
    for node in nodes:
        node_id = node['id']

        # Categorize edges by type for this node
        dependencies = {
            'definitional_dependency': [],
            'logical_dependency': [],
            'assumption_dependency': [],
            'construction_dependency': [],
            'notation_dependency': [],
            'pedagogical_dependency': [],
            'historical_dependency': []
        }

        outgoing_relations = []

        # Process edges where this node is the target (incoming edges)
        if node_id in edges_by_target:
            for edge in edges_by_target[node_id]:
                dep_class = map_edge_relation_to_dependency_class(edge['relation'])
                dependencies[dep_class].append(edge['from'])
                outgoing_relations.append(f"{edge['from']}--{map_edge_relation_to_type(edge['relation'])}-->{node_id}")

        # Build the item object
        item = {
            'id': node_id,
            'label': node.get('title', ''),
            'kind': node.get('kind', 'definition'),
            'statement': node.get('originalText', None),
            'formal_statement': node.get('formalStatement', None) or None,
            'definition': node.get('definition', None),
            'intuition': node.get('explanation', None) or None,
            'notation': None,
            'assumptions': [],
            'dependencies': dependencies,
            'outgoing_relations': outgoing_relations,
            'metadata': {
                'tags': node.get('tags', []),
                'syllabus_priority': 'core' if node.get('kind') == 'theorem' else 'medium',
                'source': node.get('topicCluster', None)
            }
        }

        # Add kind-specific fields
        if node.get('kind') == 'theorem':
            item['hypotheses'] = []
            item['conclusion'] = node.get('title', '')
            item['proof_methods'] = []
            item['related_theorems'] = []
            item['examples'] = []
            item['applications'] = []
        elif node.get('kind') == 'definition':
            item['introduced_object'] = node.get('title', '')
            item['genus'] = ''
            item['differentia'] = []
            item['examples'] = []
            item['non_examples'] = []
            item['equivalent_definitions'] = []

        items.append(item)

    return items


def build_edges_from_graph(edges_list: List[Dict]) -> List[Dict[str, Any]]:
    """Build edge objects from the graph edges."""
    edges = []
    for edge in edges_list:
        edge_obj = {
            'id': edge.get('id', f"{edge['from']}->{edge['to']}"),
            'source': edge['from'],
            'target': edge['to'],
            'type': map_edge_relation_to_type(edge['relation']),
            'dependency_class': map_edge_relation_to_dependency_class(edge['relation']),
            'label': f"{edge['relation']} dependency",
            'direction': 'source_to_target',
            'confidence': edge.get('confidence', 0.8),
            'notes': edge.get('rationale', None)
        }
        edges.append(edge_obj)

    return edges


def convert_topology_to_yaml(input_file: str, output_file: str) -> None:
    """Convert topology.json to YAML schema format."""
    print(f"Loading topology.json from {input_file}...")
    data = load_topology_json(input_file)

    nodes = data.get('nodes', [])
    edges_list = data.get('edges', [])

    print(f"Found {len(nodes)} nodes and {len(edges_list)} edges")

    # Build output structure
    output = {
        'schema': {
            'version': '1.0.0',
            'graph_model': {
                'top_level_field_id': 'topology',
                'directed': True,
                'typed': True,
                'multigraph': True,
                'tree_policy': 'Trees are extracted views; the underlying model is a directed typed multigraph.'
            },
            'item_kinds': build_schema_definition()['item_kinds'],
            'dependency_classes': build_schema_definition()['dependency_classes'],
            'edge_types': build_schema_definition()['edge_types'],
            'item_schema': build_item_schema(),
            'edge_schema': build_edge_schema()
        },
        'items': build_items_from_nodes(nodes, edges_list),
        'edges': build_edges_from_graph(edges_list)
    }

    # Custom YAML representer for null values
    def represent_none(self, _):
        return self.represent_scalar('tag:yaml.org,2002:null', '')

    yaml.add_representer(type(None), represent_none)

    print(f"Writing output to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        yaml.dump(output, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    print(f"Conversion complete! Output written to {output_file}")
    print(f"Total items: {len(output['items'])}")
    print(f"Total edges: {len(output['edges'])}")


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 2:
        input_path = sys.argv[1]
        output_path = sys.argv[2]
    else:
        # Default paths relative to script location
        script_dir = Path(__file__).parent
        input_path = script_dir.parent / 'src' / 'data' / 'topology.json'
        output_path = script_dir.parent / 'topology_knowledge_graph.yaml'

    convert_topology_to_yaml(str(input_path), str(output_path))
