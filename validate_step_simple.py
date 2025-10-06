#!/usr/bin/env python3
"""
Simple STEP file validator - checks structure and entity relationships
"""
import sys
import re
from collections import defaultdict

def parse_step_file(filename: str):
    """Parse STEP file and extract entity information"""
    with open(filename, 'r') as f:
        content = f.read()

    # Extract DATA section
    data_match = re.search(r'DATA;(.*?)ENDSEC;', content, re.DOTALL)
    if not data_match:
        print("❌ ERROR: No DATA section found")
        return None

    data_section = data_match.group(1)

    # Parse entities
    entities = {}
    entity_types = defaultdict(int)

    # Find all entities
    entity_pattern = re.compile(r'#(\d+)\s*=\s*(.+?);', re.DOTALL)

    for match in entity_pattern.finditer(data_section):
        entity_id = int(match.group(1))
        entity_def = match.group(2).strip()

        # Extract entity type
        type_match = re.match(r'([A-Z0-9_]+)\s*\(', entity_def)
        if type_match:
            entity_type = type_match.group(1)
        elif entity_def.startswith('('):
            entity_type = 'COMPLEX'
        else:
            entity_type = 'UNKNOWN'

        entities[entity_id] = {
            'type': entity_type,
            'def': entity_def
        }
        entity_types[entity_type] += 1

    return entities, entity_types

def validate_product_structure(entities):
    """Validate that product structure entities are present and linked"""
    print("\n" + "="*60)
    print("VALIDATING PRODUCT STRUCTURE")
    print("="*60)

    # Find products
    products = [eid for eid, e in entities.items() if e['type'] == 'PRODUCT']
    print(f"\nFound {len(products)} PRODUCT entities")

    if len(products) == 0:
        print("❌ ERROR: No PRODUCT entities found!")
        return False

    # For each product, trace the chain
    for product_id in products[:3]:  # Check first 3
        print(f"\n--- Tracing PRODUCT #{product_id} ---")

        # Find PRODUCT_DEFINITION_FORMATION referencing this product
        pdf_list = []
        for eid, e in entities.items():
            if e['type'] == 'PRODUCT_DEFINITION_FORMATION':
                if f'#{product_id}' in e['def']:
                    pdf_list.append(eid)

        print(f"  → PRODUCT_DEFINITION_FORMATION: {pdf_list}")

        # Find PRODUCT_DEFINITION referencing pdf
        pd_list = []
        for pdf_id in pdf_list:
            for eid, e in entities.items():
                if e['type'] == 'PRODUCT_DEFINITION':
                    if f'#{pdf_id}' in e['def']:
                        pd_list.append(eid)

        print(f"  → PRODUCT_DEFINITION: {pd_list}")

        # Find PRODUCT_DEFINITION_SHAPE referencing pd
        pds_list = []
        for pd_id in pd_list:
            for eid, e in entities.items():
                if e['type'] == 'PRODUCT_DEFINITION_SHAPE':
                    if f'#{pd_id}' in e['def']:
                        pds_list.append(eid)

        print(f"  → PRODUCT_DEFINITION_SHAPE: {pds_list}")

        # Find SHAPE_DEFINITION_REPRESENTATION referencing pds
        sdr_list = []
        for pds_id in pds_list:
            for eid, e in entities.items():
                if e['type'] == 'SHAPE_DEFINITION_REPRESENTATION':
                    if f'#{pds_id}' in e['def']:
                        sdr_list.append(eid)

        print(f"  → SHAPE_DEFINITION_REPRESENTATION: {sdr_list}")

        # Find shape representation
        for sdr_id in sdr_list:
            sdr_def = entities[sdr_id]['def']
            # Extract second argument (the representation reference)
            ref_match = re.search(r'#\d+,#(\d+)\)', sdr_def)
            if ref_match:
                rep_id = int(ref_match.group(1))
                rep_type = entities.get(rep_id, {}).get('type', 'NOT_FOUND')
                print(f"  → Representation #{rep_id} ({rep_type})")

                # If it's ADVANCED_BREP_SHAPE_REPRESENTATION, find the solids
                if rep_type == 'ADVANCED_BREP_SHAPE_REPRESENTATION':
                    rep_def = entities[rep_id]['def']
                    # Extract items list
                    items_match = re.search(r'\(\((.*?)\),#', rep_def)
                    if items_match:
                        items = [int(x.strip()[1:]) for x in items_match.group(1).split(',') if x.strip().startswith('#')]
                        print(f"    → Items: {items}")
                        for item_id in items:
                            item_type = entities.get(item_id, {}).get('type', 'NOT_FOUND')
                            print(f"      → #{item_id} ({item_type})")

    return True

def validate_geometry(entities):
    """Validate that geometry entities are present"""
    print("\n" + "="*60)
    print("VALIDATING GEOMETRY")
    print("="*60)

    # Count topology
    solids = [eid for eid, e in entities.items() if e['type'] == 'MANIFOLD_SOLID_BREP']
    shells = [eid for eid, e in entities.items() if e['type'] == 'CLOSED_SHELL']
    faces = [eid for eid, e in entities.items() if e['type'] == 'ADVANCED_FACE']

    print(f"\nTopology:")
    print(f"  MANIFOLD_SOLID_BREP: {len(solids)}")
    print(f"  CLOSED_SHELL: {len(shells)}")
    print(f"  ADVANCED_FACE: {len(faces)}")

    if len(solids) == 0:
        print("\n❌ ERROR: No MANIFOLD_SOLID_BREP entities found!")
        return False

    if len(faces) == 0:
        print("\n❌ ERROR: No ADVANCED_FACE entities found!")
        return False

    print("\n✅ Geometry structure looks valid")
    return True

def validate_units(entities):
    """Validate that unit context is present"""
    print("\n" + "="*60)
    print("VALIDATING UNITS & CONTEXT")
    print("="*60)

    # Look for complex entities or unit entities
    complex = [eid for eid, e in entities.items() if e['type'] == 'COMPLEX']
    length_units = [eid for eid, e in entities.items() if 'LENGTH_UNIT' in e['def'] or 'UNIT' in e['type']]

    print(f"\nComplex entities: {len(complex)}")
    print(f"Unit-related entities: {len(length_units)}")

    if len(complex) == 0 and len(length_units) == 0:
        print("\n⚠️  WARNING: No unit context found (may cause import issues)")
        return False

    print("\n✅ Unit context present")
    return True

def main(filename: str):
    print(f"Validating STEP file: {filename}\n")

    result = parse_step_file(filename)
    if not result:
        return False

    entities, entity_types = result

    print("="*60)
    print("ENTITY STATISTICS")
    print("="*60)
    print(f"\nTotal entities: {len(entities)}")
    print(f"\nEntity types ({len(entity_types)}):")
    for entity_type, count in sorted(entity_types.items(), key=lambda x: -x[1])[:20]:
        print(f"  {entity_type}: {count}")

    # Run validation checks
    checks_passed = 0
    checks_total = 3

    if validate_product_structure(entities):
        checks_passed += 1

    if validate_geometry(entities):
        checks_passed += 1

    if validate_units(entities):
        checks_passed += 1

    print("\n" + "="*60)
    print("VALIDATION SUMMARY")
    print("="*60)
    print(f"\nChecks passed: {checks_passed}/{checks_total}")

    if checks_passed == checks_total:
        print("\n✅ File appears to be valid!")
        return True
    else:
        print(f"\n⚠️  File has {checks_total - checks_passed} issue(s)")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate_step_simple.py <step_file>")
        sys.exit(1)

    filename = sys.argv[1]
    success = main(filename)
    sys.exit(0 if success else 1)
