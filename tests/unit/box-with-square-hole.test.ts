import { writeFileSync } from "node:fs"
import { expect, test } from "bun:test"
import {
  AdvancedBrepShapeRepresentation,
  AdvancedFace,
  ApplicationContext,
  ApplicationProtocolDefinition,
  Axis2Placement3D,
  CartesianPoint,
  ClosedShell,
  ColourRgb,
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
  importStepWithOcct,
} from "../../lib"
import { readFileSync } from "node:fs"

test("create a box with a square hole through it", async () => {
  const repo = new Repository()

  // Product structure (required for STEP validation)
  const appContext = repo.add(
    new ApplicationContext("core data for automotive mechanical design processes"),
  )
  repo.add(
    new ApplicationProtocolDefinition(
      "international standard",
      "automotive_design",
      2010,
      appContext,
    ),
  )
  const productContext = repo.add(new ProductContext("", appContext, "mechanical"))
  const product = repo.add(
    new Product("box-with-square-hole", "box-with-square-hole", "", [productContext]),
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
  const productDefShape = repo.add(new ProductDefinitionShape("", "", productDef))

  // Representation context
  const lengthUnit = repo.add(
    new Unknown("", ["( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )"]),
  )
  const angleUnit = repo.add(
    new Unknown("", ["( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) )"]),
  )
  const solidAngleUnit = repo.add(
    new Unknown("", ["( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() )"]),
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
      `( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((${uncertainty})) GLOBAL_UNIT_ASSIGNED_CONTEXT((${lengthUnit},${angleUnit},${solidAngleUnit})) REPRESENTATION_CONTEXT('box-with-square-hole','3D') )`,
    ]),
  )

  // Box dimensions: 20x20x20 with a 6x6 hole centered on front/back faces
  const size = 20
  const holeSize = 6
  const holeOffset = (size - holeSize) / 2 // 7

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

  // Create 8 vertices for the hole on the front face (y=0)
  const holeFrontVertices = [
    // Bottom of hole (z=holeOffset)
    [holeOffset, 0, holeOffset],
    [holeOffset + holeSize, 0, holeOffset],
    [holeOffset + holeSize, 0, holeOffset + holeSize],
    [holeOffset, 0, holeOffset + holeSize],
  ].map(([x, y, z]) =>
    repo.add(new VertexPoint("", repo.add(new CartesianPoint("", x, y, z)))),
  )

  // Create 8 vertices for the hole on the back face (y=size)
  const holeBackVertices = [
    [holeOffset, size, holeOffset],
    [holeOffset + holeSize, size, holeOffset],
    [holeOffset + holeSize, size, holeOffset + holeSize],
    [holeOffset, size, holeOffset + holeSize],
  ].map(([x, y, z]) =>
    repo.add(new VertexPoint("", repo.add(new CartesianPoint("", x, y, z)))),
  )

  // Helper to create an edge between two vertices
  function createEdge(v1: Ref<VertexPoint>, v2: Ref<VertexPoint>): Ref<EdgeCurve> {
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

  // Create hole edges on front face
  const hf0 = createEdge(holeFrontVertices[0], holeFrontVertices[1])
  const hf1 = createEdge(holeFrontVertices[1], holeFrontVertices[2])
  const hf2 = createEdge(holeFrontVertices[2], holeFrontVertices[3])
  const hf3 = createEdge(holeFrontVertices[3], holeFrontVertices[0])

  // Create hole edges on back face
  const hb0 = createEdge(holeBackVertices[0], holeBackVertices[1])
  const hb1 = createEdge(holeBackVertices[1], holeBackVertices[2])
  const hb2 = createEdge(holeBackVertices[2], holeBackVertices[3])
  const hb3 = createEdge(holeBackVertices[3], holeBackVertices[0])

  // Create edges connecting front and back hole
  const ht0 = createEdge(holeFrontVertices[0], holeBackVertices[0])
  const ht1 = createEdge(holeFrontVertices[1], holeBackVertices[1])
  const ht2 = createEdge(holeFrontVertices[2], holeBackVertices[2])
  const ht3 = createEdge(holeFrontVertices[3], holeBackVertices[3])

  // Create coordinate system
  const origin = repo.add(new CartesianPoint("", 0, 0, 0))
  const xDir = repo.add(new Direction("", 1, 0, 0))
  const yDir = repo.add(new Direction("", 0, 1, 0))
  const zDir = repo.add(new Direction("", 0, 0, 1))

  // Bottom face (z=0, normal pointing down) - no hole
  const bottomFrame = repo.add(
    new Axis2Placement3D("", origin, repo.add(new Direction("", 0, 0, -1)), xDir),
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

  // Front face (y=0, normal pointing forward -Y) - WITH HOLE
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
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", hf0, false)),
      repo.add(new OrientedEdge("", hf1, false)),
      repo.add(new OrientedEdge("", hf2, false)),
      repo.add(new OrientedEdge("", hf3, false)),
    ]),
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

  // Back face (y=size, normal pointing backward +Y) - WITH HOLE
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
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", hb0, true)),
      repo.add(new OrientedEdge("", hb1, true)),
      repo.add(new OrientedEdge("", hb2, true)),
      repo.add(new OrientedEdge("", hb3, true)),
    ]),
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

  // Create 4 internal faces for the hole tunnel
  // Bottom hole face (parallel to bottom, z=holeOffset)
  const holeBottomOrigin = repo.add(new CartesianPoint("", 0, 0, holeOffset))
  const holeBottomFrame = repo.add(
    new Axis2Placement3D("", holeBottomOrigin, repo.add(new Direction("", 0, 0, -1)), xDir),
  )
  const holeBottomPlane = repo.add(new Plane("", holeBottomFrame))
  const holeBottomLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", hf0, true)),
      repo.add(new OrientedEdge("", ht1, true)),
      repo.add(new OrientedEdge("", hb0, false)),
      repo.add(new OrientedEdge("", ht0, false)),
    ]),
  )
  const holeBottomFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", holeBottomLoop, true))],
      holeBottomPlane,
      true,
    ),
  )

  // Top hole face (parallel to top, z=holeOffset+holeSize)
  const holeTopOrigin = repo.add(new CartesianPoint("", 0, 0, holeOffset + holeSize))
  const holeTopFrame = repo.add(
    new Axis2Placement3D("", holeTopOrigin, zDir, xDir),
  )
  const holeTopPlane = repo.add(new Plane("", holeTopFrame))
  const holeTopLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", hf2, true)),
      repo.add(new OrientedEdge("", ht3, true)),
      repo.add(new OrientedEdge("", hb2, false)),
      repo.add(new OrientedEdge("", ht2, false)),
    ]),
  )
  const holeTopFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", holeTopLoop, true))],
      holeTopPlane,
      true,
    ),
  )

  // Left hole face (parallel to left, x=holeOffset)
  const holeLeftOrigin = repo.add(new CartesianPoint("", holeOffset, 0, 0))
  const holeLeftFrame = repo.add(
    new Axis2Placement3D("", holeLeftOrigin, repo.add(new Direction("", -1, 0, 0)), yDir),
  )
  const holeLeftPlane = repo.add(new Plane("", holeLeftFrame))
  const holeLeftLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", hf3, true)),
      repo.add(new OrientedEdge("", ht0, true)),
      repo.add(new OrientedEdge("", hb3, false)),
      repo.add(new OrientedEdge("", ht3, false)),
    ]),
  )
  const holeLeftFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", holeLeftLoop, true))],
      holeLeftPlane,
      true,
    ),
  )

  // Right hole face (parallel to right, x=holeOffset+holeSize)
  const holeRightOrigin = repo.add(new CartesianPoint("", holeOffset + holeSize, 0, 0))
  const holeRightFrame = repo.add(
    new Axis2Placement3D("", holeRightOrigin, xDir, yDir),
  )
  const holeRightPlane = repo.add(new Plane("", holeRightFrame))
  const holeRightLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", hf1, true)),
      repo.add(new OrientedEdge("", ht2, true)),
      repo.add(new OrientedEdge("", hb1, false)),
      repo.add(new OrientedEdge("", ht1, false)),
    ]),
  )
  const holeRightFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound("", holeRightLoop, true))],
      holeRightPlane,
      true,
    ),
  )

  // Create closed shell and solid (including all 10 faces: 6 outer + 4 hole)
  const shell = repo.add(
    new ClosedShell("", [
      bottomFace,
      topFace,
      frontFace,
      backFace,
      leftFace,
      rightFace,
      holeBottomFace,
      holeTopFace,
      holeLeftFace,
      holeRightFace,
    ]),
  )
  const solid = repo.add(new ManifoldSolidBrep("BoxWithSquareHole", shell))

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
    new AdvancedBrepShapeRepresentation("box-with-square-hole", [solid], geomContext),
  )
  repo.add(new ShapeDefinitionRepresentation(productDefShape, shapeRep))

  // Emit STEP text
  const stepText = repo.toPartFile({ name: "box-with-square-hole" })

  // Write to debug-output
  const outputPath = "/Users/seve/w/tsc/stepts/debug-output/box-with-square-hole.step"
  writeFileSync(outputPath, stepText)

  console.log("STEP file written to debug-output/box-with-square-hole.step")

  // Verify output contains expected entities
  expect(stepText).toContain("ISO-10303-21")
  expect(stepText).toContain("MANIFOLD_SOLID_BREP")
  expect(stepText).toContain("END-ISO-10303-21")

  // Validate with occt-import-js
  console.log("Validating with occt-import-js...")
  const stepData = readFileSync(outputPath)
  const result = await importStepWithOcct(stepData)

  expect(result.success).toBe(true)
  expect(result.meshes.length).toBeGreaterThan(0)

  console.log("✓ STEP file validated successfully with occt-import-js")
  console.log(`  - Meshes: ${result.meshes.length}`)
  console.log(`  - Triangles: ${result.meshes.reduce((sum, m) => sum + m.index.array.length / 3, 0)}`)
})
