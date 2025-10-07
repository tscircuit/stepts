import { mkdirSync, writeFileSync } from "node:fs"
import { expect, test } from "bun:test"
import {
  AdvancedBrepShapeRepresentation,
  AdvancedFace,
  ApplicationContext,
  ApplicationProtocolDefinition,
  Axis2Placement3D,
  CartesianPoint,
  Circle,
  ClosedShell,
  ColourRgb,
  CylindricalSurface,
  Direction,
  EdgeCurve,
  EdgeLoop,
  FaceBound,
  FaceOuterBound,
  FillAreaStyle,
  FillAreaStyleColour,
  Line,
  ManifoldSolidBrep,
  MechanicalDesignGeometricPresentationRepresentation,
  OrientedEdge,
  Plane,
  PresentationStyleAssignment,
  Product,
  ProductContext,
  ProductDefinition,
  ProductDefinitionContext,
  ProductDefinitionFormation,
  ProductDefinitionShape,
  type Ref,
  Repository,
  ShapeDefinitionRepresentation,
  StyledItem,
  SurfaceSideStyle,
  SurfaceStyleFillArea,
  SurfaceStyleUsage,
  Unknown,
  Vector,
  VertexPoint,
} from "../../lib"
import { importStepWithOcct } from "../utils/occt/importer"
import { readFileSync } from "node:fs"

test("create a box with a circular hole through it", async () => {
  const repo = new Repository()

  // Product structure (required for STEP validation)
  const appContext = repo.add(
    new ApplicationContext(
      "core data for automotive mechanical design processes",
    ),
  )
  repo.add(
    new ApplicationProtocolDefinition(
      "international standard",
      "automotive_design",
      2010,
      appContext,
    ),
  )
  const productContext = repo.add(
    new ProductContext("", appContext, "mechanical"),
  )
  const product = repo.add(
    new Product("box-with-circular-hole", "box-with-circular-hole", "", [
      productContext,
    ]),
  )
  const productDefContext = repo.add(
    new ProductDefinitionContext("part definition", appContext, "design"),
  )
  const productDefFormation = repo.add(
    new ProductDefinitionFormation("", "", product),
  )
  const productDef = repo.add(
    new ProductDefinition("", "", productDefFormation, productDefContext),
  )
  const productDefShape = repo.add(
    new ProductDefinitionShape("", "", productDef),
  )

  // Representation context
  const lengthUnit = repo.add(
    new Unknown("", [
      "( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )",
    ]),
  )
  const angleUnit = repo.add(
    new Unknown("", [
      "( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) )",
    ]),
  )
  const solidAngleUnit = repo.add(
    new Unknown("", [
      "( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() )",
    ]),
  )
  const uncertainty = repo.add(
    new Unknown("UNCERTAINTY_MEASURE_WITH_UNIT", [
      `LENGTH_MEASURE(1.E-07)`,
      `${lengthUnit}`,
      `'distance_accuracy_value'`,
      `'Maximum Tolerance'`,
    ]),
  )
  const geomContext = repo.add(
    new Unknown("", [
      `( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((${uncertainty})) GLOBAL_UNIT_ASSIGNED_CONTEXT((${lengthUnit},${angleUnit},${solidAngleUnit})) REPRESENTATION_CONTEXT('box-with-circular-hole','3D') )`,
    ]),
  )

  // Box dimensions: 20x20x20 with a circular hole of radius 3 centered on front/back faces
  const size = 20
  const holeRadius = 3
  const holeCenter = size / 2 // 10

  // Create 8 vertices for the outer box corners
  const outerVertices = [
    // Bottom face (z=0)
    [0, 0, 0],
    [size, 0, 0],
    [size, size, 0],
    [0, size, 0],
    // Top face (z=size)
    [0, 0, size],
    [size, 0, size],
    [size, size, size],
    [0, size, size],
  ].map(([x, y, z]) =>
    repo.add(new VertexPoint("", repo.add(new CartesianPoint("", x, y, z)))),
  )

  // For a circular hole, we need a vertex on the circle for the front face
  const holeFrontVertex = repo.add(
    new VertexPoint(
      "",
      repo.add(new CartesianPoint("", holeCenter + holeRadius, 0, holeCenter)),
    ),
  )

  // And a vertex on the circle for the back face
  const holeBackVertex = repo.add(
    new VertexPoint(
      "",
      repo.add(
        new CartesianPoint("", holeCenter + holeRadius, size, holeCenter),
      ),
    ),
  )

  // Helper to create an edge between two vertices using a line
  function createEdge(
    v1: Ref<VertexPoint>,
    v2: Ref<VertexPoint>,
  ): Ref<EdgeCurve> {
    const p1 = v1.resolve(repo).pnt.resolve(repo)
    const p2 = v2.resolve(repo).pnt.resolve(repo)
    const dir = repo.add(
      new Direction("", p2.x - p1.x, p2.y - p1.y, p2.z - p1.z),
    )
    const vec = repo.add(new Vector("", dir, 1))
    const line = repo.add(new Line("", v1.resolve(repo).pnt, vec))
    return repo.add(new EdgeCurve("", v1, v2, line, true))
  }

  // Create all outer edges of the box (12 edges)
  const e0 = createEdge(outerVertices[0], outerVertices[1])
  const e1 = createEdge(outerVertices[1], outerVertices[2])
  const e2 = createEdge(outerVertices[2], outerVertices[3])
  const e3 = createEdge(outerVertices[3], outerVertices[0])
  const e4 = createEdge(outerVertices[4], outerVertices[5])
  const e5 = createEdge(outerVertices[5], outerVertices[6])
  const e6 = createEdge(outerVertices[6], outerVertices[7])
  const e7 = createEdge(outerVertices[7], outerVertices[4])
  const e8 = createEdge(outerVertices[0], outerVertices[4])
  const e9 = createEdge(outerVertices[1], outerVertices[5])
  const e10 = createEdge(outerVertices[2], outerVertices[6])
  const e11 = createEdge(outerVertices[3], outerVertices[7])

  // Create circular hole edges
  // Front face hole (y=0, circle in XZ plane)
  const frontHoleCenter = repo.add(
    new CartesianPoint("", holeCenter, 0, holeCenter),
  )
  const frontHolePlacement = repo.add(
    new Axis2Placement3D(
      "",
      frontHoleCenter,
      repo.add(new Direction("", 0, -1, 0)), // normal pointing forward (-Y)
      repo.add(new Direction("", 1, 0, 0)), // X direction
    ),
  )
  const frontHoleCircle = repo.add(
    new Circle("", frontHolePlacement, holeRadius),
  )
  const frontHoleEdge = repo.add(
    new EdgeCurve("", holeFrontVertex, holeFrontVertex, frontHoleCircle, true),
  )

  // Back face hole (y=size, circle in XZ plane)
  const backHoleCenter = repo.add(
    new CartesianPoint("", holeCenter, size, holeCenter),
  )
  const backHolePlacement = repo.add(
    new Axis2Placement3D(
      "",
      backHoleCenter,
      repo.add(new Direction("", 0, 1, 0)), // normal pointing backward (+Y)
      repo.add(new Direction("", 1, 0, 0)), // X direction
    ),
  )
  const backHoleCircle = repo.add(new Circle("", backHolePlacement, holeRadius))
  const backHoleEdge = repo.add(
    new EdgeCurve("", holeBackVertex, holeBackVertex, backHoleCircle, true),
  )

  // Create coordinate system
  const origin = repo.add(new CartesianPoint("", 0, 0, 0))
  const xDir = repo.add(new Direction("", 1, 0, 0))
  const yDir = repo.add(new Direction("", 0, 1, 0))
  const zDir = repo.add(new Direction("", 0, 0, 1))

  // Bottom face (z=0, normal pointing down) - no hole
  const bottomFrame = repo.add(
    new Axis2Placement3D(
      "",
      origin,
      repo.add(new Direction("", 0, 0, -1)),
      xDir,
    ),
  )
  const bottomPlane = repo.add(new Plane("", bottomFrame))
  const bottomLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", e0, true)),
      repo.add(new OrientedEdge("", e1, true)),
      repo.add(new OrientedEdge("", e2, true)),
      repo.add(new OrientedEdge("", e3, true)),
    ]),
  )
  const bottomFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", bottomLoop, true))],
      bottomPlane,
      true,
    ),
  )

  // Top face (z=size, normal pointing up) - no hole
  const topOrigin = repo.add(new CartesianPoint("", 0, 0, size))
  const topFrame = repo.add(new Axis2Placement3D("", topOrigin, zDir, xDir))
  const topPlane = repo.add(new Plane("", topFrame))
  const topLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", e4, false)),
      repo.add(new OrientedEdge("", e5, false)),
      repo.add(new OrientedEdge("", e6, false)),
      repo.add(new OrientedEdge("", e7, false)),
    ]),
  )
  const topFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", topLoop, true))],
      topPlane,
      true,
    ),
  )

  // Front face (y=0, normal pointing forward -Y) - WITH CIRCULAR HOLE
  const frontFrame = repo.add(
    new Axis2Placement3D(
      "",
      origin,
      repo.add(new Direction("", 0, -1, 0)),
      xDir,
    ),
  )
  const frontPlane = repo.add(new Plane("", frontFrame))
  const frontOuterLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", e0, true)),
      repo.add(new OrientedEdge("", e9, true)),
      repo.add(new OrientedEdge("", e4, false)),
      repo.add(new OrientedEdge("", e8, false)),
    ]),
  )
  const frontHoleLoop = repo.add(
    new EdgeLoop("", [repo.add(new OrientedEdge("", frontHoleEdge, false))]),
  )
  const frontFace = repo.add(
    new AdvancedFace(
      "",
      [
        repo.add(new FaceOuterBound("", frontOuterLoop, true)),
        repo.add(new FaceBound("", frontHoleLoop, true)),
      ],
      frontPlane,
      true,
    ),
  )

  // Back face (y=size, normal pointing backward +Y) - WITH CIRCULAR HOLE
  const backOrigin = repo.add(new CartesianPoint("", 0, size, 0))
  const backFrame = repo.add(new Axis2Placement3D("", backOrigin, yDir, xDir))
  const backPlane = repo.add(new Plane("", backFrame))
  const backOuterLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", e2, true)),
      repo.add(new OrientedEdge("", e11, true)),
      repo.add(new OrientedEdge("", e6, false)),
      repo.add(new OrientedEdge("", e10, false)),
    ]),
  )
  const backHoleLoop = repo.add(
    new EdgeLoop("", [repo.add(new OrientedEdge("", backHoleEdge, true))]),
  )
  const backFace = repo.add(
    new AdvancedFace(
      "",
      [
        repo.add(new FaceOuterBound("", backOuterLoop, true)),
        repo.add(new FaceBound("", backHoleLoop, true)),
      ],
      backPlane,
      true,
    ),
  )

  // Left face (x=0, normal pointing left -X)
  const leftFrame = repo.add(
    new Axis2Placement3D(
      "",
      origin,
      repo.add(new Direction("", -1, 0, 0)),
      yDir,
    ),
  )
  const leftPlane = repo.add(new Plane("", leftFrame))
  const leftLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", e3, true)),
      repo.add(new OrientedEdge("", e8, true)),
      repo.add(new OrientedEdge("", e7, false)),
      repo.add(new OrientedEdge("", e11, false)),
    ]),
  )
  const leftFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", leftLoop, true))],
      leftPlane,
      true,
    ),
  )

  // Right face (x=size, normal pointing right +X)
  const rightOrigin = repo.add(new CartesianPoint("", size, 0, 0))
  const rightFrame = repo.add(new Axis2Placement3D("", rightOrigin, xDir, yDir))
  const rightPlane = repo.add(new Plane("", rightFrame))
  const rightLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", e1, true)),
      repo.add(new OrientedEdge("", e10, true)),
      repo.add(new OrientedEdge("", e5, false)),
      repo.add(new OrientedEdge("", e9, false)),
    ]),
  )
  const rightFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", rightLoop, true))],
      rightPlane,
      true,
    ),
  )

  // Create cylindrical tunnel face for the hole
  // The cylinder axis is along Y, centered at (holeCenter, 0, holeCenter)
  const cylinderPlacement = repo.add(
    new Axis2Placement3D(
      "",
      frontHoleCenter,
      repo.add(new Direction("", 0, 1, 0)), // axis along Y
      repo.add(new Direction("", 1, 0, 0)), // ref direction
    ),
  )
  const cylinderSurface = repo.add(
    new CylindricalSurface("", cylinderPlacement, holeRadius),
  )
  const cylinderLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", frontHoleEdge, true)),
      repo.add(new OrientedEdge("", backHoleEdge, false)),
    ]),
  )
  const cylinderFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", cylinderLoop, true))],
      cylinderSurface,
      true,
    ),
  )

  // Create closed shell and solid (7 faces: 6 outer + 1 cylindrical hole)
  const shell = repo.add(
    new ClosedShell("", [
      bottomFace,
      topFace,
      frontFace,
      backFace,
      leftFace,
      rightFace,
      cylinderFace,
    ]),
  )
  const solid = repo.add(new ManifoldSolidBrep("BoxWithCircularHole", shell))

  // Add presentation/styling (required by occt-import-js)
  const color = repo.add(new ColourRgb("", 0.8, 0.8, 0.8))
  const fillColor = repo.add(new FillAreaStyleColour("", color))
  const fillStyle = repo.add(new FillAreaStyle("", [fillColor]))
  const surfaceFill = repo.add(new SurfaceStyleFillArea(fillStyle))
  const surfaceSide = repo.add(new SurfaceSideStyle("", [surfaceFill]))
  const surfaceUsage = repo.add(new SurfaceStyleUsage(".BOTH.", surfaceSide))
  const presStyle = repo.add(new PresentationStyleAssignment([surfaceUsage]))
  const styledItem = repo.add(new StyledItem("", [presStyle], solid))

  // Add mechanical design presentation representation
  repo.add(
    new MechanicalDesignGeometricPresentationRepresentation(
      "",
      [styledItem],
      geomContext,
    ),
  )

  // Shape representation
  const shapeRep = repo.add(
    new AdvancedBrepShapeRepresentation(
      "box-with-circular-hole",
      [solid],
      geomContext,
    ),
  )
  repo.add(new ShapeDefinitionRepresentation(productDefShape, shapeRep))

  // Emit STEP text
  const stepText = repo.toPartFile({ name: "box-with-circular-hole" })

  // Write to debug-output
  mkdirSync("debug-output", { recursive: true })
  const outputPath = "debug-output/box-with-circular-hole.step"
  writeFileSync(outputPath, stepText)

  console.log("STEP file written to debug-output/box-with-circular-hole.step")

  // Verify output contains expected entities
  expect(stepText).toContain("ISO-10303-21")
  expect(stepText).toContain("MANIFOLD_SOLID_BREP")
  expect(stepText).toContain("CIRCLE")
  expect(stepText).toContain("CYLINDRICAL_SURFACE")
  expect(stepText).toContain("END-ISO-10303-21")

  // Validate with occt-import-js
  console.log("Validating with occt-import-js...")
  const stepData = readFileSync(outputPath)
  const result = await importStepWithOcct(stepData)

  expect(result.success).toBe(true)
  expect(result.meshes.length).toBeGreaterThan(0)

  console.log("✓ STEP file validated successfully with occt-import-js")
  console.log(`  - Meshes: ${result.meshes.length}`)
  console.log(
    `  - Triangles: ${result.meshes.reduce((sum, m) => sum + m.index.array.length / 3, 0)}`,
  )
})
