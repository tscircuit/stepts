#!/usr/bin/env python3
"""Validate STEP files with pythonocc-core.

This script inspects a STEP file using the OpenCascade BRep analyzer and reports
basic topology statistics.  It returns a non-zero exit code when parsing fails
or (optionally) when warnings are treated as errors.
"""
from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Dict

from OCC.Core.BRepCheck import BRepCheck_Analyzer
from OCC.Core.GProp import GProp_GProps
from OCC.Core.IFSelect import IFSelect_RetDone
from OCC.Core.Interface import Interface_Static
from OCC.Core.STEPControl import STEPControl_Reader
from OCC.Core.TopAbs import (
    TopAbs_EDGE,
    TopAbs_FACE,
    TopAbs_SHAPE,
    TopAbs_SOLID,
    TopAbs_VERTEX,
)
from OCC.Core.TopExp import TopExp_Explorer
from OCC.Core.TopoDS import TopoDS_Shape
from OCC.Core.BRepGProp import brepgprop_VolumeProperties


@dataclass
class ValidationResult:
    """Structured data describing a STEP validation run."""

    roots_transferred: int
    shapes_transferred: int
    topology_counts: Dict[str, int]
    is_valid: bool
    limited_to_largest_solid: bool


def count_subshapes(shape: TopoDS_Shape, kind: TopAbs_SHAPE) -> int:
    """Return the number of sub-shapes of ``kind`` in ``shape``."""

    explorer = TopExp_Explorer(shape, kind)
    count = 0
    while explorer.More():
        count += 1
        explorer.Next()
    return count


def load_step(path: str) -> tuple[TopoDS_Shape, int, int]:
    """Read a STEP file and return the top-level shape and transfer info."""

    Interface_Static.SetCVal("read.step.schema", "AP203,AP214,AP242")
    reader = STEPControl_Reader()
    status = reader.ReadFile(path)
    if status != IFSelect_RetDone:
        raise RuntimeError("parser failed to read STEP file")

    reader.TransferRoot()
    return reader.OneShape(), reader.NbRootsForTransfer(), reader.NbShapes()


def find_largest_solid(shape: TopoDS_Shape) -> TopoDS_Shape | None:
    """Return the solid with the greatest volume within ``shape``."""

    explorer = TopExp_Explorer(shape, TopAbs_SOLID)
    largest = None
    largest_volume = -1.0

    while explorer.More():
        solid = explorer.Current()
        props = GProp_GProps()
        brepgprop_VolumeProperties(solid, props)
        volume = props.Mass()
        if volume > largest_volume:
            largest = solid
            largest_volume = volume
        explorer.Next()

    return largest


def summarize_topology(shape: TopoDS_Shape) -> Dict[str, int]:
    """Return counts of common sub-shapes contained in ``shape``."""

    return {
        "solids": count_subshapes(shape, TopAbs_SOLID),
        "faces": count_subshapes(shape, TopAbs_FACE),
        "edges": count_subshapes(shape, TopAbs_EDGE),
        "vertices": count_subshapes(shape, TopAbs_VERTEX),
    }


def validate(path: str, *, largest_only: bool) -> ValidationResult:
    """Load and validate ``path``.

    Args:
        path: The STEP file to inspect.
        largest_only: Whether validation should be restricted to the largest
            solid found in the file.
    """

    shape, roots, shapes = load_step(path)

    limited = False
    if largest_only:
        largest = find_largest_solid(shape)
        if largest is not None:
            shape = largest
            limited = True

    analyzer = BRepCheck_Analyzer(shape, True)
    counts = summarize_topology(shape)
    return ValidationResult(
        roots_transferred=roots,
        shapes_transferred=shapes,
        topology_counts=counts,
        is_valid=analyzer.IsValid(),
        limited_to_largest_solid=limited,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate a STEP file (AP203/AP214/AP242) using OpenCascade checks.",
    )
    parser.add_argument("file", help="path to .step/.stp")
    parser.add_argument(
        "--largest",
        action="store_true",
        help="only validate the largest solid found",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="treat warnings as errors (nonzero exit)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if not os.path.exists(args.file):
        parser.error(f"file not found: {args.file}")

    try:
        result = validate(args.file, largest_only=args.largest)
    except RuntimeError as exc:  # pragma: no cover - defensive guard
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    print(f"STEP file: {args.file}")
    print(
        "Roots transferred: {roots}, Shapes: {shapes}".format(
            roots=result.roots_transferred,
            shapes=result.shapes_transferred,
        )
    )

    if result.limited_to_largest_solid:
        print("Validated only the largest solid found in the file.")

    print(f"Topology: {result.topology_counts}")

    if result.is_valid:
        print("RESULT: VALID (no topology/geometry errors detected)")
        return 0

    print("RESULT: INVALID — issues found:")
    print(
        "  • One or more edges/faces/vertices failed BRep checks "
        "(self-intersection, gaps, tolerance issues, etc.)."
    )
    return 1 if args.strict else 0


if __name__ == "__main__":  # pragma: no cover - manual invocation
    sys.exit(main())
