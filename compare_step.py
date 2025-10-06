#!/usr/bin/env python3
"""
Compare two STEP files entity by entity
"""
import sys
import re

def parse_entities(filename: str):
    """Parse STEP file entities into a dictionary"""
    with open(filename, 'r') as f:
        content = f.read()

    # Extract DATA section
    data_match = re.search(r'DATA;(.*?)ENDSEC;', content, re.DOTALL)
    if not data_match:
        return {}

    data_section = data_match.group(1)

    # Parse entities
    entities = {}
    entity_pattern = re.compile(r'#(\d+)\s*=\s*(.+?);', re.DOTALL)

    for match in entity_pattern.finditer(data_section):
        entity_id = int(match.group(1))
        entity_def = match.group(2).strip()
        # Normalize whitespace for comparison
        entity_def = ' '.join(entity_def.split())
        entities[entity_id] = entity_def

    return entities

def compare_entity(id, def1, def2):
    """Compare two entity definitions"""
    # Normalize both
    def1_norm = ' '.join(def1.split())
    def2_norm = ' '.join(def2.split())

    if def1_norm == def2_norm:
        return None  # Identical

    # Extract type
    type_match1 = re.match(r'([A-Z0-9_]+)\s*\(', def1_norm)
    type_match2 = re.match(r'([A-Z0-9_]+)\s*\(', def2_norm)

    type1 = type_match1.group(1) if type_match1 else "UNKNOWN"
    type2 = type_match2.group(1) if type_match2 else "UNKNOWN"

    return {
        'id': id,
        'type1': type1,
        'type2': type2,
        'def1': def1_norm[:100],
        'def2': def2_norm[:100],
    }

def main(file1: str, file2: str):
    print(f"Comparing:\n  File 1: {file1}\n  File 2: {file2}\n")

    entities1 = parse_entities(file1)
    entities2 = parse_entities(file2)

    print(f"File 1 entities: {len(entities1)}")
    print(f"File 2 entities: {len(entities2)}\n")

    # Find differences
    all_ids = set(entities1.keys()) | set(entities2.keys())
    differences = []

    for eid in sorted(all_ids):
        def1 = entities1.get(eid)
        def2 = entities2.get(eid)

        if def1 is None:
            differences.append({
                'id': eid,
                'issue': 'Missing in file 1'
            })
        elif def2 is None:
            differences.append({
                'id': eid,
                'issue': 'Missing in file 2'
            })
        else:
            diff = compare_entity(eid, def1, def2)
            if diff:
                differences.append(diff)

    if not differences:
        print("✅ Files are identical!")
        return True

    print(f"⚠️  Found {len(differences)} differences:\n")

    # Show first 20 differences
    for i, diff in enumerate(differences[:20]):
        print(f"Difference {i+1}:")
        if 'issue' in diff:
            print(f"  #{diff['id']}: {diff['issue']}")
        else:
            print(f"  #{diff['id']}")
            if diff['type1'] != diff['type2']:
                print(f"    Type: {diff['type1']} != {diff['type2']}")
            print(f"    File 1: {diff['def1']}")
            print(f"    File 2: {diff['def2']}")
        print()

    if len(differences) > 20:
        print(f"... and {len(differences) - 20} more differences")

    return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python compare_step.py <file1> <file2>")
        sys.exit(1)

    success = main(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)
