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

### step_to_gltf.py

Converts STEP files to GLTF format for 3D visualization.

**Usage:**
```bash
# Using conda (recommended):
conda run -n stepts python scripts/step_to_gltf.py <input.step> <output.gltf>

# With custom tessellation quality:
conda run -n stepts python scripts/step_to_gltf.py input.step output.glb --linear-deflection 0.05
```

**Example:**
```bash
conda run -n stepts python scripts/step_to_gltf.py debug-output/kicadoutput1.step debug-output/output.gltf
```

**Note:** This script requires pythonocc-core and trimesh. See installation instructions below.

## Requirements

- **validate_step_simple.py**: Python 3.9+ (no external dependencies)
- **compare_step.py**: Python 3.9+ (no external dependencies)
- **validate_step.py**: pythonocc-core (requires conda)
- **step_to_gltf.py**: pythonocc-core, trimesh, numpy (requires conda)

### Installing pythonocc-core (for validate_step.py and step_to_gltf.py)

Since pythonocc-core is not available on PyPI, you need to use conda/mamba:

**Option 1: Using conda**
```bash
# Create environment from file
conda env create -f environment.yml

# Activate environment
conda activate stepts

# Run scripts
python scripts/step_to_gltf.py input.step output.gltf
```

**Option 2: Using conda run (without activation)**
```bash
# Create environment (one time)
conda env create -f environment.yml

# Run scripts directly
conda run -n stepts python scripts/step_to_gltf.py input.step output.gltf
```

**Option 3: Using mamba (faster)**
```bash
# Install mamba if you don't have it
conda install -n base conda-forge::mamba

# Create environment
mamba env create -f environment.yml

# Run scripts
mamba run -n stepts python scripts/step_to_gltf.py input.step output.gltf
```

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
