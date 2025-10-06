# stepts

A strongly-typed TypeScript library for parsing, creating, and serializing STEP (ISO 10303-21) files. This library provides a class-based, type-safe approach to working with STEP entities, making it easy for higher-level libraries to generate STEP files for CAD and 3D modeling purposes.

## Features

- **Type-safe references** (`Ref<T>`) with lazy resolution
- **Round-trippable entities** (`static parse(...)` and `toStep()`)
- **Repository pattern** to manage IDs, inter-entity links, and emission order
- **Discriminated unions** for entity families (e.g., `Curve`, `Surface`)
- **Unknown entity passthrough** for round-trip compatibility
- **Support for AP214 and AP242** schemas

## Installation

```bash
bun install
```

## Usage

### Creating a STEP file

```typescript
import {
  Repository,
  CartesianPoint,
  Direction,
  Axis2Placement3D,
  Plane,
  VertexPoint,
  Line,
  EdgeCurve,
  OrientedEdge,
  EdgeLoop,
  FaceOuterBound,
  AdvancedFace,
  ClosedShell,
  ManifoldSolidBrep,
} from "stepts"

// Create a repository to manage entities
const repo = new Repository()

// Build geometry: a planar square face
const p0 = repo.add(new CartesianPoint("", 0, 0, 0))
const dz = repo.add(new Direction("", 0, 0, 1))
const dx = repo.add(new Direction("", 1, 0, 0))
const frame = repo.add(new Axis2Placement3D("", p0, dz, dx))
const plane = repo.add(new Plane("", frame))

// Add vertices
const v = [
  [0, 0, 0],
  [10, 0, 0],
  [10, 10, 0],
  [0, 10, 0],
].map(([x, y, z]) =>
  repo.add(new VertexPoint(repo.add(new CartesianPoint("", x, y, z))))
)

// Create edges and build topology...
// (See tests/unit/square-example.test.ts for complete example)

// Emit STEP file
const stepText = repo.toPartFile({
  name: "square",
  author: "Your Name",
  org: "Your Organization"
})

console.log(stepText)
```

### Parsing a STEP file

```typescript
import { parseRepository } from "stepts"

const stepFileContent = `
ISO-10303-21;
HEADER;
...
DATA;
#1 = CARTESIAN_POINT('',(0.,0.,0.));
...
ENDSEC;
END-ISO-10303-21;
`

const repo = parseRepository(stepFileContent)

// Access entities by ID
const point = repo.get(eid(1))

// Iterate all entities
for (const [id, entity] of repo.entries()) {
  console.log(`#${id} = ${entity.type}`)
}
```

### Validating a STEP file with pythonocc-core

This repository bundles a Python utility that runs OpenCascade's topology
checks against an exported STEP file.  Install the Python dependency set with
[`uv`](https://docs.astral.sh/uv/) (Python 3.9–3.11 is required):

```bash
uv sync --python 3.10
```

You can then validate any STEP file using Bun's script runner:

```bash
bun run validate-step ./path/to/model.step
```

Pass `--largest` to restrict validation to the largest solid in the file and
`--strict` to return a non-zero exit code when OpenCascade reports warnings.

## Testing

```bash
bun test
```

## Structure

```
stepts/
├─ lib/
│  ├─ core/                 # Framework for IDs, refs, repo, utils
│  ├─ io/                   # File-level concerns
│  ├─ parse/                # Entity registry and parsing
│  ├─ types/                # Shared types & discriminated unions
│  ├─ entities/             # STEP entity classes
│  │  ├─ geometry/          # CartesianPoint, Direction, Line, Circle, etc.
│  │  ├─ topology/          # VertexPoint, EdgeCurve, AdvancedFace, etc.
│  │  ├─ product/           # Product structure entities
│  │  └─ presentation/      # Color and styling entities
│  └─ index.ts              # Public API
└─ tests/
   └─ unit/                 # Unit tests
```

## License

Private

## Development

This project was created using `bun init` and uses [Bun](https://bun.com) as its runtime.
