# TODO: KiCad STEP File Support

This checklist tracks progress toward full support for parsing and round-tripping the `tests/roundtrip/kicadoutput01/kicadoutput01.step.txt` file.

## Overview

**Target File**: `tests/roundtrip/kicadoutput01/kicadoutput01.step.txt`
- **Total Entities**: 1,878 entities
- **Unique Entity Types**: 41 types
- **Currently Supported**: 24 types (59%)
- **To Implement**: 17 types (41%)
- **Infrastructure**: Complex entity parsing for multi-inheritance

**Progress**: ████████████████░░░░░░░░░░░░ 24/41 (59%)

## Already Implemented 

### Core Geometry
- [x] CARTESIAN_POINT
- [x] DIRECTION
- [x] AXIS2_PLACEMENT_3D
- [x] LINE
- [x] CIRCLE
- [x] PLANE

### Topology
- [x] VERTEX_POINT
- [x] EDGE_CURVE
- [x] ORIENTED_EDGE
- [x] EDGE_LOOP
- [x] FACE_BOUND
- [x] FACE_OUTER_BOUND
- [x] ADVANCED_FACE
- [x] CLOSED_SHELL
- [x] MANIFOLD_SOLID_BREP

### Product Structure
- [x] PRODUCT
- [x] ADVANCED_BREP_SHAPE_REPRESENTATION

### Presentation
- [x] COLOUR_RGB
- [x] FILL_AREA_STYLE_COLOUR
- [x] FILL_AREA_STYLE
- [x] SURFACE_STYLE_FILL_AREA
- [x] SURFACE_SIDE_STYLE
- [x] SURFACE_STYLE_USAGE
- [x] PRESENTATION_STYLE_ASSIGNMENT
- [x] STYLED_ITEM

## To Implement =�

### High Priority - Geometry & Topology (Required for Basic Parsing)

- [ ] **VECTOR** - Vector entity used in LINE definitions
  - Location: `lib/entities/geometry/Vector.ts`
  - Used by: LINE (currently hardcoded in LINE.parse)

- [ ] **CYLINDRICAL_SURFACE** - Cylindrical surface geometry
  - Location: `lib/entities/geometry/CylindricalSurface.ts`
  - Used by: ADVANCED_FACE

- [ ] **TOROIDAL_SURFACE** - Toroidal surface geometry
  - Location: `lib/entities/geometry/ToroidalSurface.ts`
  - Used by: ADVANCED_FACE

### High Priority - Product Structure (Required for Assembly)

- [ ] **PRODUCT_DEFINITION_FORMATION** - Links product to versions
  - Location: `lib/entities/product/ProductDefinitionFormation.ts`

- [ ] **PRODUCT_DEFINITION** - Defines a specific version/design
  - Location: `lib/entities/product/ProductDefinition.ts`

- [ ] **PRODUCT_DEFINITION_SHAPE** - Links definition to shape
  - Location: `lib/entities/product/ProductDefinitionShape.ts`

- [ ] **PRODUCT_CONTEXT** - Product application context
  - Location: `lib/entities/product/ProductContext.ts`

- [ ] **PRODUCT_DEFINITION_CONTEXT** - Definition lifecycle context
  - Location: `lib/entities/product/ProductDefinitionContext.ts`

- [ ] **SHAPE_DEFINITION_REPRESENTATION** - Links shape to representation
  - Location: `lib/entities/product/ShapeDefinitionRepresentation.ts`

- [ ] **SHAPE_REPRESENTATION** - Container for shape items
  - Location: `lib/entities/product/ShapeRepresentation.ts`

### High Priority - Application & Context

- [ ] **APPLICATION_CONTEXT** - Top-level application scope
  - Location: `lib/entities/product/ApplicationContext.ts`

- [ ] **APPLICATION_PROTOCOL_DEFINITION** - Protocol (e.g., AP214)
  - Location: `lib/entities/product/ApplicationProtocolDefinition.ts`

### Medium Priority - Units & Uncertainty

- [ ] **REPRESENTATION_CONTEXT** - Base context for representations
  - Location: `lib/entities/io/RepresentationContext.ts`

- [ ] **GEOMETRIC_REPRESENTATION_CONTEXT** - 3D geometric context
  - Location: `lib/entities/io/GeometricRepresentationContext.ts`
  - Note: Complex multi-inheritance entity

- [ ] **GLOBAL_UNIT_ASSIGNED_CONTEXT** - Unit system context
  - Location: `lib/entities/io/GlobalUnitAssignedContext.ts`

- [ ] **GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT** - Uncertainty/tolerance
  - Location: `lib/entities/io/GlobalUncertaintyAssignedContext.ts`

- [ ] **UNCERTAINTY_MEASURE_WITH_UNIT** - Tolerance specification
  - Location: `lib/entities/io/UncertaintyMeasureWithUnit.ts`

### Medium Priority - Unit Definitions

- [ ] **NAMED_UNIT** - Base unit entity
  - Location: `lib/entities/io/NamedUnit.ts`

- [ ] **SI_UNIT** - SI unit specification
  - Location: `lib/entities/io/SiUnit.ts`
  - Note: Complex multi-inheritance entity

- [ ] **LENGTH_UNIT** - Length unit type
  - Location: `lib/entities/io/LengthUnit.ts`

- [ ] **PLANE_ANGLE_UNIT** - Angle unit type
  - Location: `lib/entities/io/PlaneAngleUnit.ts`

- [ ] **SOLID_ANGLE_UNIT** - Solid angle unit type
  - Location: `lib/entities/io/SolidAngleUnit.ts`

### Medium Priority - Assembly & Relationships

- [ ] **NEXT_ASSEMBLY_USAGE_OCCURRENCE** - Part in assembly
  - Location: `lib/entities/product/NextAssemblyUsageOccurrence.ts`

- [ ] **CONTEXT_DEPENDENT_SHAPE_REPRESENTATION** - Positioned shape
  - Location: `lib/entities/product/ContextDependentShapeRepresentation.ts`

- [ ] **ITEM_DEFINED_TRANSFORMATION** - Transformation matrix
  - Location: `lib/entities/product/ItemDefinedTransformation.ts`

- [ ] **REPRESENTATION_RELATIONSHIP** - Links representations
  - Location: `lib/entities/product/RepresentationRelationship.ts`

### Lower Priority - Metadata

- [ ] **PRODUCT_RELATED_PRODUCT_CATEGORY** - Product classification
  - Location: `lib/entities/product/ProductRelatedProductCategory.ts`

- [ ] **MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION** - Presentation metadata
  - Location: `lib/entities/presentation/MechanicalDesignGeometricPresentationRepresentation.ts`

## Infrastructure Improvements

- [ ] **Complex Entity Parser** - Handle multi-inheritance entities
  - Location: `lib/parse/complexEntity.ts`
  - Description: Parse entities like `( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNIT_ASSIGNED_CONTEXT(...) )`
  - These entities combine multiple types with different parameters

- [ ] **Type Guards** - Runtime type checking
  - Location: `lib/guards/`
  - Add guards for: `isSurface`, `isCurve`, `isUnit`, etc.

- [ ] **Entity Type Unions** - Discriminated unions
  - Location: `lib/types/`
  - Add: `Surface`, `Unit`, `Context` type unions

## Testing Strategy

- [ ] **Unit Tests** - Test each new entity type
  - Create tests in `tests/unit/entities/` for each entity

- [ ] **Integration Test** - Parse entire KiCad file
  - Test: `tests/roundtrip/kicadoutput01/kicadoutput01.test.ts`
  - Goal: Parse all entities without errors

- [ ] **Round-trip Test** - Parse and re-serialize
  - Ensure output matches input structurally

- [ ] **Validation Test** - Verify entity relationships
  - Check that all references resolve correctly

## Estimated Completion Order

1. **Phase 1: Core Geometry** (HIGH)
   - VECTOR, CYLINDRICAL_SURFACE, TOROIDAL_SURFACE

2. **Phase 2: Product Structure** (HIGH)
   - PRODUCT_DEFINITION_FORMATION � PRODUCT_DEFINITION � PRODUCT_DEFINITION_SHAPE
   - SHAPE_DEFINITION_REPRESENTATION, SHAPE_REPRESENTATION
   - PRODUCT_CONTEXT, PRODUCT_DEFINITION_CONTEXT

3. **Phase 3: Application Context** (HIGH)
   - APPLICATION_CONTEXT, APPLICATION_PROTOCOL_DEFINITION

4. **Phase 4: Units & Contexts** (MEDIUM)
   - Unit entities (SI_UNIT, LENGTH_UNIT, etc.)
   - Context entities (GEOMETRIC_REPRESENTATION_CONTEXT, etc.)

5. **Phase 5: Assembly** (MEDIUM)
   - Assembly-related entities (NEXT_ASSEMBLY_USAGE_OCCURRENCE, etc.)

6. **Phase 6: Complex Entity Parsing** (MEDIUM)
   - Infrastructure for multi-inheritance entities

7. **Phase 7: Final Testing** (ALL)
   - Round-trip testing and validation

## Notes

- **Multi-inheritance Entities**: Some entities like `GEOMETRIC_REPRESENTATION_CONTEXT` are defined with multiple parent types wrapped in parentheses. This requires special parsing logic.

- **Optional Parameters**: Many entities have optional parameters denoted by `$` or `*`. Parser must handle these gracefully.

- **Entity References**: The KiCad file contains ~1,878 entities with complex reference graphs. Ensure lazy resolution works efficiently.

- **Unknown Entities**: Currently, unknown entities are preserved as `Unknown` type for round-trip compatibility. This is good for MVP.

## Current Status

The library can currently parse and round-trip simple STEP files (like the square example in tests). To support the KiCad file, we need to:

1. ✅ Core parsing infrastructure is complete
2. ✅ Basic geometry and topology entities work
3. ❌ Need product structure entities (PRODUCT_DEFINITION, etc.)
4. ❌ Need advanced surface types (CYLINDRICAL_SURFACE, TOROIDAL_SURFACE)
5. ❌ Need context and unit entities
6. ❌ Need complex entity parsing for multi-inheritance

**Next Step**: Start with Phase 1 (VECTOR, CYLINDRICAL_SURFACE, TOROIDAL_SURFACE) as these are immediately needed for geometry parsing.
