# stepts

A strongly-typed TypeScript library for parsing, creating, and serializing STEP (ISO 10303-21) files. This library provides a class-based, type-safe approach to working with STEP entities, making it easy for higher-level libraries to generate STEP files for CAD and 3D modeling purposes.

## Features

- **Type-safe references** (`Ref<T>`) with lazy resolution
- **Round-trippable entities** (`static parse(...)` and `toStep()`)
- **Repository pattern** to manage IDs, inter-entity links, and emission order
- **Discriminated unions** for entity families (e.g., `Curve`, `Surface`)
- **Unknown entity passthrough** for round-trip compatibility
- **Support for AP214 and AP242** schemas
- **Geometry & Topology**: Points, lines, circles, planes, cylindrical surfaces, edges, faces, solids
- **Product Structure**: Complete product definition hierarchy
- **Presentation**: Colors and styling for faces

## Installation

```bash
npm install stepts
# or
bun add stepts
```

## Quick Start

### Creating a Simple Box

```typescript
import { Repository, CartesianPoint, ManifoldSolidBrep } from "stepts"

const repo = new Repository()

// Create vertices for a box
const vertices = [
  [0, 0, 0],
  [10, 0, 0],
  [10, 10, 0],
  [0, 10, 0], // bottom
  [0, 0, 10],
  [10, 0, 10],
  [10, 10, 10],
  [0, 10, 10], // top
].map(([x, y, z]) =>
  repo.add(new VertexPoint("", repo.add(new CartesianPoint("", x, y, z))))
)

// Create edges, faces, shell, and solid...
// (See tests/unit/simple-box.test.ts for complete example)

// Export to STEP format
const stepText = repo.toPartFile({ name: "my-box" })
```

### Parsing a STEP File

```typescript
import { parseRepository } from "stepts"
import { readFileSync } from "fs"

// Load and parse
const stepContent = readFileSync("model.step", "utf-8")
const repo = parseRepository(stepContent)

// Access entities
for (const [id, entity] of repo.entries()) {
  if (entity.type === "CARTESIAN_POINT") {
    console.log(`Point #${id}:`, entity.x, entity.y, entity.z)
  }
}

// Re-export
const newStepText = repo.toPartFile({ name: "modified-model" })
```

## Core Concepts

### Repository

The `Repository` manages all entities and their relationships:

```typescript
const repo = new Repository()

// Add entities
const point = repo.add(new CartesianPoint("", 0, 0, 0))
const direction = repo.add(new Direction("", 0, 0, 1))

// Reference entities
const entity = repo.get(eid(1))
const allEntities = repo.entries()

// Export to STEP
const stepText = repo.toPartFile({
  name: "part-name",
  author: "Author Name",
  org: "Organization",
})
```

### Type-Safe References

Use `Ref<T>` for type-safe entity references:

```typescript
import type { Ref } from "stepts"

const point: Ref<CartesianPoint> = repo.add(new CartesianPoint("", 5, 5, 5))
const vertex = repo.add(new VertexPoint("", point))

// Resolve references
const resolvedPoint = point.resolve(repo)
console.log(resolvedPoint.x, resolvedPoint.y, resolvedPoint.z)
```

### Entity Types

#### Geometry

- `CartesianPoint` - 3D point
- `Direction` - 3D direction vector
- `Vector` - Direction with magnitude
- `Line` - Infinite line
- `Circle` - Circular curve
- `Plane` - Planar surface
- `CylindricalSurface` - Cylindrical surface
- `Axis2Placement3D` - Coordinate system placement

#### Topology

- `VertexPoint` - Topological vertex
- `EdgeCurve` - Edge defined by curve
- `OrientedEdge` - Edge with orientation
- `EdgeLoop` - Closed loop of edges
- `FaceOuterBound` / `FaceBound` - Face boundaries
- `AdvancedFace` - Face with surface geometry
- `ClosedShell` - Closed shell of faces
- `ManifoldSolidBrep` - Solid B-rep

#### Product Structure

- `Product` - Product definition
- `ProductDefinition` - Specific product version
- `ProductDefinitionShape` - Shape aspect of product
- `AdvancedBrepShapeRepresentation` - Shape representation
- `ApplicationContext` - Application context

#### Presentation

- `ColourRgb` - RGB color
- `StyledItem` - Styling for geometry
- `SurfaceStyleFillArea` - Surface fill styling

## Examples

### Box with Square Hole

```typescript
// Create a 20x20x20 box with a 6x6 square hole through it
// See: tests/unit/box-with-square-hole.test.ts
```

### Box with Circular Hole

```typescript
// Create a 20x20x20 box with a circular hole (radius 3) through it
// Uses Circle and CylindricalSurface
// See: tests/unit/box-with-circular-hole.test.ts
```

### Parsing and Round-Trip

```typescript
// Parse existing STEP file, modify, and re-export
// Preserves unknown entities for compatibility
// See: tests/roundtrip/kicadoutput01/kicadoutput01.test.ts
```

## Validation

You can validate STEP files using third-party tools like `occt-import-js`. This library focuses on parsing, creating, and serializing STEP files, while validation can be performed by external CAD kernels.

## API Reference

### Repository Methods

```typescript
// Entity management
repo.add(entity: Entity): Ref<Entity>
repo.get(id: EntityId): Entity | undefined
repo.entries(): [EntityId, Entity][]

// Export to STEP
repo.toPartFile(options: {
  name: string
  author?: string
  org?: string
  description?: string
}): string
```

### Parsing

```typescript
import { parseRepository } from "stepts"

// Parse STEP file content
parseRepository(stepText: string): Repository
```

## Testing

Run the test suite:

```bash
bun test
```

Run specific tests:

```bash
bun test tests/unit/simple-box.test.ts
bun test tests/unit/box-with-circular-hole.test.ts
```

## Advanced Usage

### Custom Entity Creation

```typescript
import { Entity } from "stepts"
import type { ParseContext } from "stepts"

class MyCustomEntity extends Entity {
  readonly type = "MY_CUSTOM_ENTITY"

  constructor(public name: string, public value: number) {
    super()
  }

  toStep(): string {
    return `MY_CUSTOM_ENTITY('${this.name}',${this.value})`
  }

  static parse(args: string[], ctx: ParseContext) {
    return new MyCustomEntity(
      ctx.parseString(args[0]),
      ctx.parseNumber(args[1])
    )
  }
}
```

### Working with Unknown Entities

For complex multi-inheritance entities or unsupported entity types, use `Unknown`:

```typescript
import { Unknown } from "stepts"

// Preserve complex entity during round-trip
const geomContext = repo.add(
  new Unknown("", [
    `( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((...)) REPRESENTATION_CONTEXT('name','3D') )`,
  ])
)
```
