This is a **class-based, strongly-typed STEP core** you can hand to a higher-level geometry library. It focuses on parsing, creating and serializing STEP files. It is used by higher-level libraries want to generate STEP files for various purposes.

## Codebase Rules

- One test per file
- Use `bun` for testing and running scripts

## Structure

```
stepts/
├─ lib/
│  ├─ core/                 # No STEP specifics—framework for IDs, refs, repo, utils
│  │  ├─ Entity.ts
│  │  ├─ Repository.ts
│  │  ├─ Ref.ts
│  │  ├─ stepFormat.ts      # low-level text helpers (escape, numbers)
│  │  └─ index.ts
│  ├─ io/                   # File-level concerns (headers, schema, units, read/write)
│  │  ├─ header.ts
│  │  ├─ schema.ts          # AP214/AP242 constants & helpers
│  │  ├─ units.ts
│  │  ├─ writer.ts          # repo → ISO-10303-21 string
│  │  └─ reader.ts          # string → repo (tokenize, splitArgs)
│  ├─ parse/                # Entity registry and parsing entrypoints
│  │  ├─ registry.ts
│  │  ├─ tokenize.ts
│  │  └─ parseRepository.ts
│  ├─ types/                # Shared types & discriminated unions
│  │  ├─ geometry.d.ts
│  │  ├─ topology.d.ts
│  │  ├─ product.d.ts
│  │  └─ presentation.d.ts
│  ├─ entities/             # STEP entity classes (strongly-typed)
│  │  ├─ geometry/
│  │  │  ├─ CartesianPoint.ts
│  │  │  ├─ Direction.ts
│  │  │  ├─ Axis2Placement3D.ts
│  │  │  ├─ Line.ts
│  │  │  ├─ Circle.ts
│  │  │  ├─ Plane.ts
│  │  │  ├─ CylindricalSurface.ts
│  │  │  └─ ToroidalSurface.ts
│  │  ├─ topology/
│  │  │  ├─ VertexPoint.ts
│  │  │  ├─ EdgeCurve.ts
│  │  │  ├─ OrientedEdge.ts
│  │  │  ├─ EdgeLoop.ts
│  │  │  ├─ FaceOuterBound.ts
│  │  │  ├─ FaceBound.ts
│  │  │  ├─ AdvancedFace.ts
│  │  │  ├─ ClosedShell.ts
│  │  │  └─ ManifoldSolidBrep.ts
│  │  ├─ product/
│  │  │  ├─ Product.ts
│  │  │  ├─ ProductContexts.ts
│  │  │  ├─ RepresentationContext.ts
│  │  │  ├─ ProductDefinition.ts
│  │  │  └─ AdvancedBrepShapeRepresentation.ts
│  │  ├─ presentation/
│  │  │  ├─ ColourRgb.ts
│  │  │  ├─ FillAreaStyleColour.ts
│  │  │  ├─ FillAreaStyle.ts
│  │  │  ├─ SurfaceStyleFillArea.ts
│  │  │  ├─ SurfaceSideStyle.ts
│  │  │  ├─ SurfaceStyleUsage.ts
│  │  │  ├─ PresentationStyleAssignment.ts
│  │  │  └─ StyledItem.ts
│  │  └─ Unknown.ts         # passthrough for entities not yet modeled
│  ├─ builders/             # Friendly factories for higher-level libs
│  │  ├─ placements.ts      # axis builders
│  │  ├─ topology.ts        # edge/loop/face/shell helpers
│  │  └─ styling.ts         # per-face color helpers
│  ├─ guards/               # runtime validation & narrowings
│  │  ├─ isCurve.ts
│  │  ├─ isSurface.ts
│  │  └─ assert.ts          # invariant/assert helpers
│  ├─ index.ts              # stable public API (barrels)
│
├─ tests/
│  ├─ roundtrip/
│  ├─ unit/
│  │  ├─ entities/
│  │  ├─ parse/
│  │  └─ io/
```

# Import notes

- **Type-safe references** (`Ref<T>`) with lazy resolution
- **Round-trippable entities** (`static parse(...)` and `toStep()`)
- **A repository** to manage IDs, inter-entity links, and emission order
- **Discriminated unions** for families (e.g., `Curve`, `Surface`, `Topo`)
