#!/usr/bin/env python3
"""
Validate STEP file using pythonocc-core
"""
import sys
from OCC.Core.STEPControl import STEPControl_Reader
from OCC.Core.IFSelect import IFSelect_ReturnStatus
from OCC.Extend.TopologyUtils import TopologyExplorer
from OCC.Core.TopoDS import TopoDS_Shape

def validate_step_file(filename: str):
    """Validate a STEP file and report detailed information"""
    print(f"Validating STEP file: {filename}\n")

    # Create STEP reader
    reader = STEPControl_Reader()

    # Read file
    print("Reading file...")
    status = reader.ReadFile(filename)

    if status != IFSelect_ReturnStatus.IFSelect_RetDone:
        print(f"❌ ERROR: Failed to read file. Status: {status}")
        return False

    print("✅ File read successfully")

    # Get number of roots
    print(f"\nNumber of roots in file: {reader.NbRootsForTransfer()}")

    # Transfer roots
    print("Transferring shapes...")
    reader.TransferRoots()

    # Get number of shapes
    nb_shapes = reader.NbShapes()
    print(f"Number of shapes transferred: {nb_shapes}")

    if nb_shapes == 0:
        print("❌ ERROR: No shapes found in file!")
        print("\nThis usually means:")
        print("  - Missing or invalid PRODUCT_DEFINITION_SHAPE")
        print("  - Missing shape representation")
        print("  - Broken entity references")
        return False

    # Analyze each shape
    for i in range(1, nb_shapes + 1):
        print(f"\n{'='*60}")
        print(f"Shape {i}/{nb_shapes}")
        print('='*60)

        shape = reader.Shape(i)

        if shape.IsNull():
            print("❌ Shape is null!")
            continue

        # Get topology information
        print(f"Shape type: {shape.ShapeType()}")

        explorer = TopologyExplorer(shape)

        # Count topological elements
        print("\nTopological elements:")
        print(f"  Solids: {explorer.number_of_solids()}")
        print(f"  Shells: {explorer.number_of_shells()}")
        print(f"  Faces: {explorer.number_of_faces()}")
        print(f"  Edges: {explorer.number_of_edges()}")
        print(f"  Vertices: {explorer.number_of_vertices()}")

        # Check for geometry
        if explorer.number_of_faces() > 0:
            print("\n✅ Shape contains faces (mesh can be generated)")
        else:
            print("\n❌ Shape has NO faces (cannot generate mesh)")

        if explorer.number_of_solids() > 0:
            print("✅ Shape contains solids")
        else:
            print("⚠️  Shape has no solids (may be a surface model)")

    print(f"\n{'='*60}")
    print("SUMMARY")
    print('='*60)

    if nb_shapes > 0:
        print(f"✅ Successfully loaded {nb_shapes} shape(s)")
        return True
    else:
        print("❌ Failed to load any shapes")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate_step.py <step_file>")
        sys.exit(1)

    filename = sys.argv[1]
    success = validate_step_file(filename)
    sys.exit(0 if success else 1)
