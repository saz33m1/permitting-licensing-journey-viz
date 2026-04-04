#!/usr/bin/env python3
"""
Validate data/journeys.json for referential integrity and data quality.

Usage:
    python3 scripts/validate.py
    python3 scripts/validate.py --verbose

Checks:
    1. JSON is valid and parseable
    2. All required top-level keys exist
    3. No duplicate IDs within any collection
    4. All journey step IDs reference valid PLC nodes
    5. All journey category IDs reference valid categories
    6. No orphaned PLC nodes (nodes used by zero journeys)
    7. No orphaned categories (categories with zero journeys)
    8. All PLC nodes reference valid jurisdictions
    9. Summary statistics
"""

import json
import sys
from pathlib import Path
from collections import Counter

# Ensure UTF-8 output on Windows (default terminal encoding is cp1252)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VERBOSE = '--verbose' in sys.argv or '-v' in sys.argv
DATA_PATH = Path(__file__).parent.parent / 'data' / 'journeys.json'

def main():
    errors = []
    warnings = []

    # 1. Load and parse
    print(f"Validating {DATA_PATH}...")
    try:
        with open(DATA_PATH) as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"  ERROR: {DATA_PATH} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"  ERROR: Invalid JSON — {e}")
        sys.exit(1)

    # 2. Required keys
    for key in ['jurisdictions', 'categories', 'plcNodes', 'journeys']:
        if key not in data:
            errors.append(f"Missing required key: {key}")

    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
        sys.exit(1)

    jurisdictions = data['jurisdictions']
    categories = data['categories']
    nodes = data['plcNodes']
    journeys = data['journeys']

    jur_ids = {j['id'] for j in jurisdictions}
    cat_ids = {c['id'] for c in categories}
    node_ids = {n['id'] for n in nodes}

    # 3. Duplicate IDs
    for label, items in [('categories', categories), ('plcNodes', nodes), ('journeys', journeys)]:
        ids = [item['id'] for item in items]
        dupes = [id for id, count in Counter(ids).items() if count > 1]
        if dupes:
            errors.append(f"Duplicate IDs in {label}: {dupes}")

    # 4. Journey step references
    bad_steps = []
    for j in journeys:
        for step in j.get('steps', []):
            if step not in node_ids:
                bad_steps.append(f"{j['id']}: step '{step}' not found in plcNodes")
    if bad_steps:
        for b in bad_steps:
            errors.append(f"Bad step reference — {b}")

    # 5. Journey category references
    bad_cats = []
    for j in journeys:
        if j.get('cat') not in cat_ids:
            bad_cats.append(f"{j['id']}: cat '{j.get('cat')}' not found in categories")
    if bad_cats:
        for b in bad_cats:
            errors.append(f"Bad category reference — {b}")

    # 6. Orphaned nodes
    used_nodes = set()
    for j in journeys:
        used_nodes.update(j.get('steps', []))
    orphaned_nodes = node_ids - used_nodes
    if orphaned_nodes:
        warnings.append(f"Orphaned PLC nodes (used by zero journeys): {sorted(orphaned_nodes)}")

    # 7. Orphaned categories
    used_cats = {j.get('cat') for j in journeys}
    orphaned_cats = cat_ids - used_cats
    if orphaned_cats:
        warnings.append(f"Orphaned categories (zero journeys): {sorted(orphaned_cats)}")

    # 8. Node jurisdiction references
    for n in nodes:
        if n.get('jurisdiction') not in jur_ids:
            errors.append(f"Node '{n['id']}' has invalid jurisdiction: '{n.get('jurisdiction')}'")

    # 9. Report
    print()
    if errors:
        print(f"  ERRORS ({len(errors)}):")
        for e in errors:
            print(f"    ✗ {e}")
    if warnings:
        print(f"  WARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"    ⚠ {w}")
    if not errors and not warnings:
        print("  ✓ All checks passed")

    # Stats
    node_by_jur = Counter(n['jurisdiction'] for n in nodes)
    journeys_by_cat = Counter(j['cat'] for j in journeys)
    step_counts = [len(j['steps']) for j in journeys]
    avg_steps = sum(step_counts) / len(step_counts) if step_counts else 0

    print()
    print("  Summary:")
    print(f"    Jurisdictions:  {len(jurisdictions)}")
    print(f"    Categories:     {len(categories)}")
    print(f"    PLC Nodes:      {len(nodes)} (federal: {node_by_jur.get('federal',0)}, state: {node_by_jur.get('state',0)}, local: {node_by_jur.get('local',0)})")
    print(f"    Journeys:       {len(journeys)}")
    print(f"    Avg steps/journey: {avg_steps:.1f} (min: {min(step_counts)}, max: {max(step_counts)})")

    if VERBOSE:
        print()
        print("  Journeys by category:")
        for cat in categories:
            count = journeys_by_cat.get(cat['id'], 0)
            print(f"    {cat['name']}: {count}")

        print()
        print("  Most-used PLC nodes:")
        node_freq = Counter()
        for j in journeys:
            node_freq.update(j['steps'])
        for node_id, count in node_freq.most_common(10):
            node = next(n for n in nodes if n['id'] == node_id)
            print(f"    {node['name']} ({node['jurisdiction']}): {count} journeys")

    print()
    if errors:
        print(f"  FAILED — {len(errors)} error(s)")
        sys.exit(1)
    else:
        print(f"  PASSED")
        sys.exit(0)

if __name__ == '__main__':
    main()
