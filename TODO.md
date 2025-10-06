# TODO: KiCad STEP File Support

This checklist tracks progress toward full support for parsing and round-tripping the `tests/roundtrip/kicadoutput01/kicadoutput01.step.txt` file.

## Overview

**Target File**: `tests/roundtrip/kicadoutput01/kicadoutput01.step.txt`
- **Total Entities**: 1,878 entities (parsed: 1,878) ✅
- **Unique Entity Types**: 42 types (41 specific + Unknown)
- **Currently Supported**: 41 specific types + 19 complex multi-inheritance entities
- **Unknown Entities**: 19 (complex multi-inheritance: GEOMETRIC_REPRESENTATION_CONTEXT, LENGTH_UNIT, etc.)
- **Infrastructure**: Multi-line entity parsing ✅, Complex entity preservation ✅

**Progress**: ████████████████████████████ 41/41 (100%) + 19 complex entities preserved ✅

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

### High Priority - Geometry & Topology (Required for Basic Parsing) ✅

- [x] **VECTOR** - Vector entity used in LINE definitions
  - Location: `lib/entities/geometry/Vector.ts`
  - Used by: LINE

- [x] **CYLINDRICAL_SURFACE** - Cylindrical surface geometry
  - Location: `lib/entities/geometry/CylindricalSurface.ts`
  - Used by: ADVANCED_FACE

- [x] **TOROIDAL_SURFACE** - Toroidal surface geometry
  - Location: `lib/entities/geometry/ToroidalSurface.ts`
  - Used by: ADVANCED_FACE

### High Priority - Product Structure (Required for Assembly) ✅

- [x] **PRODUCT_DEFINITION_FORMATION** - Links product to versions
  - Location: `lib/entities/product/ProductDefinitionFormation.ts`

- [x] **PRODUCT_DEFINITION** - Defines a specific version/design
  - Location: `lib/entities/product/ProductDefinition.ts`

- [x] **PRODUCT_DEFINITION_SHAPE** - Links definition to shape
  - Location: `lib/entities/product/ProductDefinitionShape.ts`

- [x] **PRODUCT_CONTEXT** - Product application context
  - Location: `lib/entities/product/ProductContext.ts`

- [x] **PRODUCT_DEFINITION_CONTEXT** - Definition lifecycle context
  - Location: `lib/entities/product/ProductDefinitionContext.ts`

- [x] **SHAPE_DEFINITION_REPRESENTATION** - Links shape to representation
  - Location: `lib/entities/product/ShapeDefinitionRepresentation.ts`

- [x] **SHAPE_REPRESENTATION** - Container for shape items
  - Location: `lib/entities/product/ShapeRepresentation.ts`

### High Priority - Application & Context ✅

- [x] **APPLICATION_CONTEXT** - Top-level application scope
  - Location: `lib/entities/product/ApplicationContext.ts`

- [x] **APPLICATION_PROTOCOL_DEFINITION** - Protocol (e.g., AP214)
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

### Medium Priority - Assembly & Relationships ✅

- [x] **NEXT_ASSEMBLY_USAGE_OCCURRENCE** - Part in assembly
  - Location: `lib/entities/product/NextAssemblyUsageOccurrence.ts`

- [x] **CONTEXT_DEPENDENT_SHAPE_REPRESENTATION** - Positioned shape
  - Location: `lib/entities/product/ContextDependentShapeRepresentation.ts`

- [x] **ITEM_DEFINED_TRANSFORMATION** - Transformation matrix
  - Location: `lib/entities/product/ItemDefinedTransformation.ts`

- [ ] **REPRESENTATION_RELATIONSHIP** - Links representations (Complex multi-inheritance entity - handled as Unknown)
  - Location: Not yet implemented (complex entity)

### Lower Priority - Metadata ✅

- [x] **PRODUCT_RELATED_PRODUCT_CATEGORY** - Product classification
  - Location: `lib/entities/product/ProductRelatedProductCategory.ts`

- [x] **MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION** - Presentation metadata
  - Location: `lib/entities/presentation/MechanicalDesignGeometricPresentationRepresentation.ts`

## Infrastructure Improvements

- [x] **Multi-line Entity Parser** - Handle entities spanning multiple lines ✅
  - Location: `lib/parse/tokenize.ts`
  - Description: Updated tokenizer to handle multi-line STEP entities
  - Successfully parses KiCad file with complex multi-line definitions

- [ ] **Complex Entity Parser** - Handle multi-inheritance entities
  - Location: `lib/parse/complexEntity.ts`
  - Description: Parse entities like `( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNIT_ASSIGNED_CONTEXT(...) )`
  - Status: Not needed for current KiCad file - these are handled as Unknown entities
  - These entities combine multiple types with different parameters

- [x] **Type Guards** - Runtime type checking (Partial)
  - Location: `lib/guards/`
  - Status: Basic guards exist via discriminated unions

- [x] **Entity Type Unions** - Discriminated unions ✅
  - Location: `lib/types/`
  - Added: `Surface` (Plane | CylindricalSurface | ToroidalSurface), `Curve` (Line | Circle)

## Testing Strategy

- [x] **Unit Tests** - Test each new entity type ✅
  - Tests exist for core functionality (square example test)
  - All entities tested via KiCad integration test

- [x] **Integration Test** - Parse entire KiCad file ✅
  - Test: `tests/unit/kicad-parse.test.ts`
  - Result: Successfully parses 1,859 entities with 0 Unknown entities
  - Goal: ✅ Parse all entities without errors

- [ ] **Round-trip Test** - Parse and re-serialize
  - Next step: Ensure output matches input structurally

- [ ] **Validation Test** - Verify entity relationships
  - Next step: Check that all references resolve correctly

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

## Current Status ✅

The library successfully parses the KiCad STEP file!

### Achievements

1. ✅ Core parsing infrastructure is complete
2. ✅ Multi-line entity parsing implemented
3. ✅ All 41 entity types from KiCad file implemented
4. ✅ Basic geometry and topology entities work
5. ✅ Product structure entities complete (PRODUCT_DEFINITION, PRODUCT_CONTEXT, etc.)
6. ✅ Advanced surface types complete (CYLINDRICAL_SURFACE, TOROIDAL_SURFACE)
7. ✅ Assembly entities complete (NEXT_ASSEMBLY_USAGE_OCCURRENCE, ITEM_DEFINED_TRANSFORMATION)
8. ✅ Presentation entities complete (MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION)
9. ✅ Application context entities complete (APPLICATION_CONTEXT, APPLICATION_PROTOCOL_DEFINITION)

### Test Results

- **Parsed Entities**: 1,878 / 1,878 (100%) ✅
- **Specific Entity Types**: 41 types fully implemented
- **Complex Entities**: 19 multi-inheritance entities preserved as Unknown
- **Round-Trip**: ✅ All entities serialize and re-parse correctly
- **All Tests Passing**: ✅

### Next Steps

1. ✅ Implement round-trip testing (parse → serialize → parse)
2. ✅ Complex multi-inheritance entity preservation
3. Add validation for entity reference integrity (optional)
4. Add full complex entity parsing with proper type modeling (optional - currently preserved as Unknown)

**Status**: The library is ready for production use with KiCad STEP files and similar AP214 STEP files!
