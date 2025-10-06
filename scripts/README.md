# STEP File Validation Scripts

This directory contains Python scripts for validating and comparing STEP files.

## Scripts

### validate_step_simple.py

A pure-Python STEP file validator that checks structure and entity relationships without requiring external dependencies.

**Usage:**
```bash
python3 scripts/validate_step_simple.py <step_file>
```

**What it checks:**
- Entity statistics and type distribution
- Product structure chain (PRODUCT → PRODUCT_DEFINITION → SHAPE_REPRESENTATION)
- Geometry topology (solids, shells, faces)
- Unit context and complex multi-inheritance entities

**Example:**
```bash
python3 scripts/validate_step_simple.py debug-output/kicadoutput1.step
```

### compare_step.py

Compares two STEP files entity-by-entity to find differences.

**Usage:**
```bash
python3 scripts/compare_step.py <file1> <file2>
```

**What it shows:**
- Entity count differences
- Missing entities in either file
- Entity definition differences
- First 20 differences with details

**Example:**
```bash
python3 scripts/compare_step.py tests/roundtrip/kicadoutput01/kicadoutput01.step.txt debug-output/kicadoutput1.step
```

### validate_step.py

A more advanced STEP validator using pythonocc-core (requires installation).

**Note:** This script requires pythonocc-core which is not currently available via pip/uv. Use `validate_step_simple.py` instead for most validation needs.

## Requirements

- **validate_step_simple.py**: Python 3.9+ (no external dependencies)
- **compare_step.py**: Python 3.9+ (no external dependencies)
- **validate_step.py**: pythonocc-core (not easily installable)

## Common Workflows

### Validate generated STEP file
```bash
python3 scripts/validate_step_simple.py debug-output/kicadoutput1.step
```

### Compare original vs generated
```bash
python3 scripts/compare_step.py tests/roundtrip/kicadoutput01/kicadoutput01.step.txt debug-output/kicadoutput1.step
```

### Check round-trip fidelity
After running tests, compare the output with the original to ensure all entities are preserved correctly.
