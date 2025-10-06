#!/usr/bin/env python3
"""
Convert STEP files to GLTF format.

Usage:
    python step_to_gltf.py input.step output.gltf

Requirements:
    pip install pythonocc-core trimesh numpy
"""

import sys
import argparse
from pathlib import Path

try:
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Core.IFSelect import IFSelect_RetDone
    from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_FACE
    from OCC.Core.BRep import BRep_Tool
    from OCC.Core.TopLoc import TopLoc_Location
    from OCC.Core.gp import gp_Pnt
except ImportError:
    print("Error: pythonocc-core is not installed.", file=sys.stderr)
    print("Install with: pip install pythonocc-core", file=sys.stderr)
    sys.exit(1)

try:
    import trimesh
    import numpy as np
except ImportError:
    print("Error: trimesh or numpy is not installed.", file=sys.stderr)
    print("Install with: pip install trimesh numpy", file=sys.stderr)
    sys.exit(1)


def read_step_file(step_path: str):
    """Read a STEP file and return the shape."""
    reader = STEPControl_Reader()
    status = reader.ReadFile(step_path)

    if status != IFSelect_RetDone:
        raise RuntimeError(f"Failed to read STEP file: {step_path}")

    reader.TransferRoots()
    shape = reader.OneShape()

    return shape


def tessellate_shape(shape, linear_deflection=0.1, angular_deflection=0.5):
    """Tessellate the shape into triangular mesh."""
    # Create incremental mesh
    mesh = BRepMesh_IncrementalMesh(shape, linear_deflection, False, angular_deflection, True)
    mesh.Perform()

    if not mesh.IsDone():
        raise RuntimeError("Mesh generation failed")

    return shape


def shape_to_trimesh(shape):
    """Convert OCC shape to trimesh object."""
    vertices = []
    faces = []
    vertex_offset = 0

    # Explore all faces in the shape
    explorer = TopExp_Explorer(shape, TopAbs_FACE)

    while explorer.More():
        face = explorer.Current()
        location = TopLoc_Location()
        triangulation = BRep_Tool.Triangulation(face, location)

        if triangulation:
            transformation = location.Transformation()

            # Extract vertices
            face_vertices = []
            for i in range(1, triangulation.NbNodes() + 1):
                pnt = triangulation.Node(i)
                pnt.Transform(transformation)
                face_vertices.append([pnt.X(), pnt.Y(), pnt.Z()])

            # Extract triangles
            for i in range(1, triangulation.NbTriangles() + 1):
                triangle = triangulation.Triangle(i)
                n1, n2, n3 = triangle.Get()

                # Adjust indices (1-based to 0-based) and add offset
                faces.append([
                    n1 - 1 + vertex_offset,
                    n2 - 1 + vertex_offset,
                    n3 - 1 + vertex_offset
                ])

            vertices.extend(face_vertices)
            vertex_offset = len(vertices)

        explorer.Next()

    if not vertices:
        raise RuntimeError("No mesh data extracted from STEP file")

    # Create trimesh object
    mesh = trimesh.Trimesh(
        vertices=np.array(vertices),
        faces=np.array(faces)
    )

    return mesh


def convert_step_to_gltf(input_path: str, output_path: str, linear_deflection=0.1, angular_deflection=0.5):
    """Convert STEP file to GLTF format."""
    print(f"Reading STEP file: {input_path}")
    shape = read_step_file(input_path)

    print("Tessellating geometry...")
    tessellated_shape = tessellate_shape(shape, linear_deflection, angular_deflection)

    print("Converting to mesh...")
    mesh = shape_to_trimesh(tessellated_shape)

    print(f"Mesh statistics: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces")

    print(f"Writing GLTF file: {output_path}")
    mesh.export(output_path)

    print("Conversion complete!")


def main():
    parser = argparse.ArgumentParser(description="Convert STEP files to GLTF format")
    parser.add_argument("input", help="Input STEP file path")
    parser.add_argument("output", help="Output GLTF file path")
    parser.add_argument(
        "--linear-deflection",
        type=float,
        default=0.1,
        help="Linear deflection for tessellation (default: 0.1)"
    )
    parser.add_argument(
        "--angular-deflection",
        type=float,
        default=0.5,
        help="Angular deflection for tessellation in radians (default: 0.5)"
    )

    args = parser.parse_args()

    # Validate input file exists
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    # Ensure output has .gltf or .glb extension
    output_path = Path(args.output)
    if output_path.suffix.lower() not in [".gltf", ".glb"]:
        print("Warning: Output file should have .gltf or .glb extension")

    try:
        convert_step_to_gltf(
            str(input_path),
            str(output_path),
            args.linear_deflection,
            args.angular_deflection
        )
    except Exception as e:
        print(f"Error during conversion: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
