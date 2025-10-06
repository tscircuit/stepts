#!/usr/bin/env python3
"""Validate STEP files using OpenCascade or a pure-Python fallback.

When :mod:`pythonocc-core` is available the script performs the same
topological checks as earlier revisions.  On platforms where the OpenCascade
bindings are unavailable (notably Python 3.12 at the time of writing) a
lightweight parser validates the STEP syntax and provides summary statistics.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from collections import Counter
from dataclasses import dataclass
from typing import Dict, Iterable, Tuple, TypeVar

try:  # pragma: no cover - exercised only when pythonocc is installed
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

    HAVE_PYTHONOCC = True
except ModuleNotFoundError:  # pragma: no cover - fallback path exercised
    TopoDS_Shape = TypeVar("TopoDS_Shape")  # type: ignore[assignment]
    HAVE_PYTHONOCC = False


@dataclass
class ValidationResult:
    """Structured data describing a STEP validation run."""

    roots_transferred: int | None
    shapes_transferred: int | None
    topology_counts: Dict[str, int]
    is_valid: bool
    limited_to_largest_solid: bool
    backend: str


if HAVE_PYTHONOCC:  # pragma: no branch - condition set at import time

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
        """Load and validate ``path`` using OpenCascade."""

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
            backend="pythonocc",
        )
else:

    class StepSyntaxError(RuntimeError):
        """Raised when the pure-Python parser encounters malformed syntax."""


    _ENTITY_RE = re.compile(r"^#(\d+)\s*=\s*(.+);$", re.IGNORECASE)


    def _iter_statements(lines: Iterable[str]) -> Iterable[str]:
        buffer: list[str] = []

        def statement_complete(statement: str) -> bool:
            depth = 0
            in_string = False
            i = 0
            while i < len(statement):
                ch = statement[i]
                if ch == "'":
                    if in_string and i + 1 < len(statement) and statement[i + 1] == "'":
                        i += 1
                    else:
                        in_string = not in_string
                elif not in_string:
                    if ch == "(":
                        depth += 1
                    elif ch == ")":
                        depth -= 1
                        if depth < 0:
                            raise StepSyntaxError("unbalanced parentheses in statement")
                    elif ch == ";" and depth == 0:
                        return True
                i += 1
            return False

        for raw_line in lines:
            stripped = raw_line.strip()
            if not stripped:
                continue
            buffer.append(stripped)
            joined = " ".join(buffer)
            if statement_complete(joined):
                yield joined
                buffer.clear()

        if any(segment.strip() for segment in buffer):
            raise StepSyntaxError("unterminated statement at end of file")


    def _parse_entity(statement: str) -> Tuple[int, str]:
        match = _ENTITY_RE.match(statement)
        if not match:
            raise StepSyntaxError(f"expected entity assignment, got: {statement!r}")

        eid = int(match.group(1))
        rhs = match.group(2).strip()

        def first_token(expr: str) -> str:
            token = []
            for ch in expr:
                if ch.isspace() or ch == "(":
                    break
                token.append(ch)
            return "".join(token) or "COMPOSITE"

        return eid, first_token(rhs.upper())


    def _validate_syntax(path: str) -> ValidationResult:
        with open(path, "r", encoding="utf8") as stream:
            statements = list(_iter_statements(stream))

        if not statements or statements[0].upper() != "ISO-10303-21;":
            raise StepSyntaxError("STEP file must begin with ISO-10303-21;")

        index = 1
        if index >= len(statements) or statements[index].upper() != "HEADER;":
            raise StepSyntaxError("missing HEADER section")

        while index < len(statements) and statements[index].upper() != "ENDSEC;":
            index += 1

        if index >= len(statements):
            raise StepSyntaxError("HEADER section not terminated with ENDSEC;")

        index += 1
        if index >= len(statements) or statements[index].upper() != "DATA;":
            raise StepSyntaxError("missing DATA section")

        index += 1
        entity_types: Counter[str] = Counter()
        entity_ids: set[int] = set()

        while index < len(statements) and statements[index].upper() != "ENDSEC;":
            statement = statements[index]
            eid, entity_type = _parse_entity(statement)
            if eid in entity_ids:
                raise StepSyntaxError(f"duplicate entity id: #{eid}")
            entity_ids.add(eid)
            entity_types[entity_type] += 1
            index += 1

        if index >= len(statements) or statements[index].upper() != "ENDSEC;":
            raise StepSyntaxError("DATA section not terminated with ENDSEC;")

        index += 1
        if index >= len(statements) or statements[index].upper() != "END-ISO-10303-21;":
            raise StepSyntaxError("file must end with END-ISO-10303-21;")

        counts = {
            "entities": sum(entity_types.values()),
            "unique_entity_types": len(entity_types),
        }

        return ValidationResult(
            roots_transferred=None,
            shapes_transferred=None,
            topology_counts=counts,
            is_valid=True,
            limited_to_largest_solid=False,
            backend="syntax",
        )


    def validate(path: str, *, largest_only: bool) -> ValidationResult:
        if largest_only:
            print(
                "WARNING: --largest has no effect without pythonocc-core; "
                "performing whole-file syntax validation.",
                file=sys.stderr,
            )
        return _validate_syntax(path)


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
    print(f"Validation backend: {result.backend}")

    if result.roots_transferred is not None and result.shapes_transferred is not None:
        print(
            "Roots transferred: {roots}, Shapes: {shapes}".format(
                roots=result.roots_transferred,
                shapes=result.shapes_transferred,
            )
        )
    else:
        print("Roots transferred: n/a, Shapes: n/a")

    if result.limited_to_largest_solid:
        print("Validated only the largest solid found in the file.")

    print(f"Topology: {result.topology_counts}")

    if result.backend != "pythonocc":
        print(
            "NOTE: OpenCascade bindings not available; performed syntax "
            "validation only."
        )

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
