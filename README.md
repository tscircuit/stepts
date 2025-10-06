# stepts

A strongly-typed TypeScript library for parsing, creating, and serializing STEP (ISO 10303-21) files. This library provides a class-based, type-safe approach to working with STEP entities, making it easy for higher-level libraries to generate STEP files for CAD and 3D modeling purposes.

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

## Entity Classes Reference

### Geometry Entities

| Entity | Description |
|--------|-------------|
| [`CartesianPoint`](lib/entities/geometry/CartesianPoint.ts) | 3D point with x, y, z coordinates |
| [`Direction`](lib/entities/geometry/Direction.ts) | 3D direction vector with dx, dy, dz components |
| [`Vector`](lib/entities/geometry/Vector.ts) | Direction with magnitude |
| [`Line`](lib/entities/geometry/Line.ts) | Infinite line defined by point and direction vector |
| [`Circle`](lib/entities/geometry/Circle.ts) | Circular curve defined by placement and radius |
| [`Plane`](lib/entities/geometry/Plane.ts) | Planar surface defined by axis placement |
| [`CylindricalSurface`](lib/entities/geometry/CylindricalSurface.ts) | Cylindrical surface with position and radius |
| [`ToroidalSurface`](lib/entities/geometry/ToroidalSurface.ts) | Toroidal (torus/donut) surface with major and minor radii |
| [`Axis2Placement3D`](lib/entities/geometry/Axis2Placement3D.ts) | 3D coordinate system placement with location and axes |
| [`TrimmedCurve`](lib/entities/geometry/TrimmedCurve.ts) | Curve segment trimmed between two points |

### Topology Entities

| Entity | Description |
|--------|-------------|
| [`VertexPoint`](lib/entities/topology/VertexPoint.ts) | Topological vertex referencing a geometric point |
| [`EdgeCurve`](lib/entities/topology/EdgeCurve.ts) | Edge defined by start/end vertices and curve geometry |
| [`OrientedEdge`](lib/entities/topology/OrientedEdge.ts) | Edge with orientation flag for use in loops |
| [`EdgeLoop`](lib/entities/topology/EdgeLoop.ts) | Closed loop of oriented edges |
| [`FaceBound`](lib/entities/topology/FaceBound.ts) | Inner boundary of a face |
| [`FaceOuterBound`](lib/entities/topology/FaceOuterBound.ts) | Outer boundary of a face |
| [`AdvancedFace`](lib/entities/topology/AdvancedFace.ts) | Face with surface geometry and boundaries |
| [`ClosedShell`](lib/entities/topology/ClosedShell.ts) | Closed shell composed of faces |
| [`ManifoldSolidBrep`](lib/entities/topology/ManifoldSolidBrep.ts) | Solid boundary representation with closed shell |

### Product Structure Entities

| Entity | Description |
|--------|-------------|
| [`Product`](lib/entities/product/Product.ts) | Product definition with id, name, and description |
| [`ProductContext`](lib/entities/product/ProductContext.ts) | Product context with discipline type |
| [`ProductDefinition`](lib/entities/product/ProductDefinition.ts) | Specific product version |
| [`ProductDefinitionFormation`](lib/entities/product/ProductDefinitionFormation.ts) | Product version formation |
| [`ProductDefinitionShape`](lib/entities/product/ProductDefinitionShape.ts) | Shape aspect of product definition |
| [`ProductDefinitionContext`](lib/entities/product/ProductDefinitionContext.ts) | Product definition context with lifecycle stage |
| [`ShapeRepresentation`](lib/entities/product/ShapeRepresentation.ts) | Shape representation with geometric items |
| [`ShapeDefinitionRepresentation`](lib/entities/product/ShapeDefinitionRepresentation.ts) | Links shape definition to representation |
| [`AdvancedBrepShapeRepresentation`](lib/entities/product/AdvancedBrepShapeRepresentation.ts) | B-rep shape representation container |
| [`ApplicationContext`](lib/entities/product/ApplicationContext.ts) | Application context |
| [`ApplicationProtocolDefinition`](lib/entities/product/ApplicationProtocolDefinition.ts) | Application protocol (e.g., AP214, AP242) definition |
| [`ProductRelatedProductCategory`](lib/entities/product/ProductRelatedProductCategory.ts) | Product category classification |
| [`NextAssemblyUsageOccurrence`](lib/entities/product/NextAssemblyUsageOccurrence.ts) | Assembly relationship between products |
| [`ContextDependentShapeRepresentation`](lib/entities/product/ContextDependentShapeRepresentation.ts) | Context-dependent shape representation for assemblies |
| [`ItemDefinedTransformation`](lib/entities/product/ItemDefinedTransformation.ts) | Geometric transformation between placements |

### Presentation Entities

| Entity | Description |
|--------|-------------|
| [`ColourRgb`](lib/entities/presentation/ColourRgb.ts) | RGB color definition with red, green, blue values |
| [`FillAreaStyleColour`](lib/entities/presentation/FillAreaStyleColour.ts) | Fill area color style |
| [`FillAreaStyle`](lib/entities/presentation/FillAreaStyle.ts) | Fill area style with color styling |
| [`SurfaceStyleFillArea`](lib/entities/presentation/SurfaceStyleFillArea.ts) | Surface fill area style |
| [`SurfaceSideStyle`](lib/entities/presentation/SurfaceSideStyle.ts) | Surface side styling |
| [`SurfaceStyleUsage`](lib/entities/presentation/SurfaceStyleUsage.ts) | Surface style usage with side specification |
| [`PresentationStyleAssignment`](lib/entities/presentation/PresentationStyleAssignment.ts) | Assignment of presentation styles to geometry |
| [`StyledItem`](lib/entities/presentation/StyledItem.ts) | Styled item linking geometry to style |
| [`MechanicalDesignGeometricPresentationRepresentation`](lib/entities/presentation/MechanicalDesignGeometricPresentationRepresentation.ts) | Mechanical design presentation representation |

### Other Entities

| Entity | Description |
|--------|-------------|
| [`Unknown`](lib/entities/Unknown.ts) | Passthrough for unsupported or complex multi-inheritance entities |

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
