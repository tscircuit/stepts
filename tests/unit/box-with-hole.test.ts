import { writeFileSync } from "node:fs"
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
  CylindricalSurface,
  Direction,
  EdgeCurve,
  EdgeLoop,
  FaceBound,
  FaceOuterBound,
  Line,
  ManifoldSolidBrep,
  OrientedEdge,
  Plane,
  Product,
  ProductContext,
  ProductDefinition,
  ProductDefinitionContext,
  ProductDefinitionFormation,
  ProductDefinitionShape,
  type Ref,
  Repository,
  ShapeDefinitionRepresentation,
  Unknown,
  Vector,
  VertexPoint,
} from "../../lib"

test("create a rectangular prism with cylindrical hole", () => {
  const repo = new Repository()

  // ============================================================
  // PRODUCT STRUCTURE (required for CAD viewers)
  // ============================================================

  // Application context
  const appContext = repo.add(
    new ApplicationContext("core data for automotive mechanical design processes"),
  )
  repo.add(
    new ApplicationProtocolDefinition(
      "international standard",
      "automotive_design",
      2000,
      appContext,
    ),
  )

  // Product
  const productContext = repo.add(
    new ProductContext("", appContext, "mechanical"),
  )
  const product = repo.add(
    new Product("BoxWithHole", "BoxWithHole", "", [productContext]),
  )

  // Product definition
  const productDefContext = repo.add(
    new ProductDefinitionContext("part definition", appContext, "design"),
  )
  const productFormation = repo.add(
    new ProductDefinitionFormation("", "", product),
  )
  const productDefinition = repo.add(
    new ProductDefinition("design", "", productFormation, productDefContext),
  )

  // Product definition shape (links to geometry)
  const productDefShape = repo.add(
    new ProductDefinitionShape("", "", productDefinition),
  )

  // Unit context (complex multi-inheritance entity)
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
      `'confusion accuracy'`,
    ]),
  )

  const geomContext = repo.add(
    new Unknown("", [
      `( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((${uncertainty})) GLOBAL_UNIT_ASSIGNED_CONTEXT((${lengthUnit},${angleUnit},${solidAngleUnit})) REPRESENTATION_CONTEXT('Context #1','3D Context with UNIT and UNCERTAINTY') )`,
    ]),
  )

  // ============================================================
  // GEOMETRY
  // ============================================================

  // Box dimensions: 20x20x10
  // Hole: radius 3, centered at (10, 10)
  const boxWidth = 20
  const boxDepth = 20
  const boxHeight = 10
  const holeRadius = 3
  const holeCenterX = 10
  const holeCenterY = 10

  // Helper to create edges between vertices
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

  // Create outer box vertices (8 corners)
  const boxVertices = [
    // Bottom face (z=0)
    [0, 0, 0],
    [boxWidth, 0, 0],
    [boxWidth, boxDepth, 0],
    [0, boxDepth, 0],
    // Top face (z=boxHeight)
    [0, 0, boxHeight],
    [boxWidth, 0, boxHeight],
    [boxWidth, boxDepth, boxHeight],
    [0, boxDepth, boxHeight],
  ].map(([x, y, z]) =>
    repo.add(new VertexPoint("", repo.add(new CartesianPoint("", x, y, z)))),
  )

  // Create hole vertices - use single vertex per circle for cylindrical surface
  const holeBottomVertex = repo.add(
    new VertexPoint(
      "",
      repo.add(new CartesianPoint("", holeCenterX + holeRadius, holeCenterY, 0)),
    ),
  )

  const holeTopVertex = repo.add(
    new VertexPoint(
      "",
      repo.add(
        new CartesianPoint("", holeCenterX + holeRadius, holeCenterY, boxHeight),
      ),
    ),
  )

  // Create planar surfaces for box faces
  const origin = repo.add(new CartesianPoint("", 0, 0, 0))
  const xDir = repo.add(new Direction("", 1, 0, 0))
  const yDir = repo.add(new Direction("", 0, 1, 0))
  const zDir = repo.add(new Direction("", 0, 0, 1))
  const negZDir = repo.add(new Direction("", 0, 0, -1))

  // Bottom plane (z=0, normal pointing down for outer bound)
  const bottomFrame = repo.add(new Axis2Placement3D("", origin, negZDir, xDir))
  const bottomPlane = repo.add(new Plane("", bottomFrame))

  // Top plane (z=boxHeight)
  const topOrigin = repo.add(new CartesianPoint("", 0, 0, boxHeight))
  const topFrame = repo.add(new Axis2Placement3D("", topOrigin, zDir, xDir))
  const topPlane = repo.add(new Plane("", topFrame))

  // Front plane (y=0)
  const frontFrame = repo.add(
    new Axis2Placement3D(
      "",
      origin,
      repo.add(new Direction("", 0, -1, 0)),
      xDir,
    ),
  )
  const frontPlane = repo.add(new Plane("", frontFrame))

  // Back plane (y=boxDepth)
  const backOrigin = repo.add(new CartesianPoint("", 0, boxDepth, 0))
  const backFrame = repo.add(new Axis2Placement3D("", backOrigin, yDir, xDir))
  const backPlane = repo.add(new Plane("", backFrame))

  // Left plane (x=0)
  const leftFrame = repo.add(
    new Axis2Placement3D(
      "",
      origin,
      repo.add(new Direction("", -1, 0, 0)),
      yDir,
    ),
  )
  const leftPlane = repo.add(new Plane("", leftFrame))

  // Right plane (x=boxWidth)
  const rightOrigin = repo.add(new CartesianPoint("", boxWidth, 0, 0))
  const rightFrame = repo.add(new Axis2Placement3D("", rightOrigin, xDir, yDir))
  const rightPlane = repo.add(new Plane("", rightFrame))

  // Cylindrical surface for hole
  const holeCenter = repo.add(
    new CartesianPoint("", holeCenterX, holeCenterY, 0),
  )
  const holeFrame = repo.add(new Axis2Placement3D("", holeCenter, zDir, xDir))
  const cylinderSurface = repo.add(
    new CylindricalSurface("", holeFrame, holeRadius),
  )

  // Create outer edges for bottom face
  const bottomOuterEdges = [
    createEdge(boxVertices[0], boxVertices[1]),
    createEdge(boxVertices[1], boxVertices[2]),
    createEdge(boxVertices[2], boxVertices[3]),
    createEdge(boxVertices[3], boxVertices[0]),
  ]

  // Create circular edge for bottom hole (complete circle from vertex to itself)
  const bottomHoleCircleFrame = repo.add(
    new Axis2Placement3D(
      "",
      repo.add(new CartesianPoint("", holeCenterX, holeCenterY, 0)),
      zDir,
      xDir,
    ),
  )
  const bottomHoleCircle = repo.add(
    new Circle("", bottomHoleCircleFrame, holeRadius),
  )
  const bottomHoleEdge = repo.add(
    new EdgeCurve(
      "",
      holeBottomVertex,
      holeBottomVertex,
      bottomHoleCircle,
      true,
    ),
  )

  // Create outer edges for top face
  const topOuterEdges = [
    createEdge(boxVertices[4], boxVertices[5]),
    createEdge(boxVertices[5], boxVertices[6]),
    createEdge(boxVertices[6], boxVertices[7]),
    createEdge(boxVertices[7], boxVertices[4]),
  ]

  // Create circular edge for top hole (complete circle from vertex to itself)
  const topHoleCircleFrame = repo.add(
    new Axis2Placement3D(
      "",
      repo.add(new CartesianPoint("", holeCenterX, holeCenterY, boxHeight)),
      zDir,
      xDir,
    ),
  )
  const topHoleCircle = repo.add(new Circle("", topHoleCircleFrame, holeRadius))
  const topHoleEdge = repo.add(
    new EdgeCurve("", holeTopVertex, holeTopVertex, topHoleCircle, true),
  )

  // Create vertical edge for hole (connecting bottom to top)
  const holeVerticalEdge = createEdge(holeBottomVertex, holeTopVertex)

  // Create vertical edges for box (connecting bottom to top corners)
  const boxVerticalEdges = [0, 1, 2, 3].map((i) =>
    createEdge(boxVertices[i], boxVertices[i + 4]),
  )

  // Build Bottom Face (with hole)
  const bottomOuterLoop = repo.add(
    new EdgeLoop(
      "",
      bottomOuterEdges.map((e) => repo.add(new OrientedEdge("", e, true))),
    ),
  )
  const bottomOuterBound = repo.add(new FaceOuterBound("", bottomOuterLoop, true))

  const bottomInnerLoop = repo.add(
    new EdgeLoop("", [repo.add(new OrientedEdge("", bottomHoleEdge, false))]), // reversed for inner
  )
  const bottomInnerBound = repo.add(new FaceBound("", bottomInnerLoop, true))

  const bottomFace = repo.add(
    new AdvancedFace(
      "",
      [bottomOuterBound, bottomInnerBound as any],
      bottomPlane,
      true,
    ),
  )

  // Build Top Face (with hole)
  const topOuterLoop = repo.add(
    new EdgeLoop(
      "",
      topOuterEdges.map((e) => repo.add(new OrientedEdge("", e, false))), // reversed
    ),
  )
  const topOuterBound = repo.add(new FaceOuterBound("", topOuterLoop, true))

  const topInnerLoop = repo.add(
    new EdgeLoop("", [repo.add(new OrientedEdge("", topHoleEdge, true))]),
  )
  const topInnerBound = repo.add(new FaceBound("", topInnerLoop, true))

  const topFace = repo.add(
    new AdvancedFace(
      "",
      [topOuterBound, topInnerBound as any],
      topPlane,
      true,
    ),
  )

  // Build Front Face (y=0)
  const frontLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", bottomOuterEdges[0], true)),
      repo.add(new OrientedEdge("", boxVerticalEdges[1], true)),
      repo.add(new OrientedEdge("", topOuterEdges[0], false)),
      repo.add(new OrientedEdge("", boxVerticalEdges[0], false)),
    ]),
  )
  const frontBound = repo.add(new FaceOuterBound("", frontLoop, true))
  const frontFace = repo.add(new AdvancedFace("", [frontBound], frontPlane, true))

  // Build Right Face (x=boxWidth)
  const rightLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", bottomOuterEdges[1], true)),
      repo.add(new OrientedEdge("", boxVerticalEdges[2], true)),
      repo.add(new OrientedEdge("", topOuterEdges[1], false)),
      repo.add(new OrientedEdge("", boxVerticalEdges[1], false)),
    ]),
  )
  const rightBound = repo.add(new FaceOuterBound("", rightLoop, true))
  const rightFace = repo.add(new AdvancedFace("", [rightBound], rightPlane, true))

  // Build Back Face (y=boxDepth)
  const backLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", bottomOuterEdges[2], true)),
      repo.add(new OrientedEdge("", boxVerticalEdges[3], true)),
      repo.add(new OrientedEdge("", topOuterEdges[2], false)),
      repo.add(new OrientedEdge("", boxVerticalEdges[2], false)),
    ]),
  )
  const backBound = repo.add(new FaceOuterBound("", backLoop, true))
  const backFace = repo.add(new AdvancedFace("", [backBound], backPlane, true))

  // Build Left Face (x=0)
  const leftLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", bottomOuterEdges[3], true)),
      repo.add(new OrientedEdge("", boxVerticalEdges[0], true)),
      repo.add(new OrientedEdge("", topOuterEdges[3], false)),
      repo.add(new OrientedEdge("", boxVerticalEdges[3], false)),
    ]),
  )
  const leftBound = repo.add(new FaceOuterBound("", leftLoop, true))
  const leftFace = repo.add(new AdvancedFace("", [leftBound], leftPlane, true))

  // Build Cylindrical Hole Face (simple 4-edge loop)
  // Loop: bottom circle -> vertical line -> top circle (reversed) -> vertical line (reversed)
  const cylinderLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", bottomHoleEdge, true)),
      repo.add(new OrientedEdge("", holeVerticalEdge, true)),
      repo.add(new OrientedEdge("", topHoleEdge, false)),
      repo.add(new OrientedEdge("", holeVerticalEdge, false)),
    ]),
  )
  const cylinderBound = repo.add(new FaceOuterBound("", cylinderLoop, true))
  const cylinderFace = repo.add(
    new AdvancedFace("", [cylinderBound], cylinderSurface, false),
  )

  // Create Closed Shell with all faces
  const shell = repo.add(
    new ClosedShell("", [
      bottomFace,
      topFace,
      frontFace,
      rightFace,
      backFace,
      leftFace,
      cylinderFace,
    ]),
  )

  // Create Manifold Solid B-Rep
  const solid = repo.add(new ManifoldSolidBrep("BoxWithHole", shell))

  // ============================================================
  // LINK GEOMETRY TO PRODUCT
  // ============================================================

  // Create shape representation with the solid and link to product
  const shapeRepresentation = repo.add(
    new AdvancedBrepShapeRepresentation("", [solid], geomContext),
  )

  // Link product definition to shape representation
  repo.add(
    new ShapeDefinitionRepresentation(productDefShape, shapeRepresentation),
  )

  // Emit STEP text
  const stepText = repo.toPartFile({ name: "box-with-hole" })

  // Write to debug-output
  writeFileSync(
    "/Users/seve/w/tsc/stepts/debug-output/box-with-hole.step",
    stepText,
  )

  console.log("STEP file written to debug-output/box-with-hole.step")

  // Verify output contains expected entities
  expect(stepText).toContain("ISO-10303-21")
  expect(stepText).toContain("CARTESIAN_POINT")
  expect(stepText).toContain("DIRECTION")
  expect(stepText).toContain("AXIS2_PLACEMENT_3D")
  expect(stepText).toContain("PLANE")
  expect(stepText).toContain("CYLINDRICAL_SURFACE")
  expect(stepText).toContain("CIRCLE")
  expect(stepText).toContain("VERTEX_POINT")
  expect(stepText).toContain("LINE")
  expect(stepText).toContain("EDGE_CURVE")
  expect(stepText).toContain("ORIENTED_EDGE")
  expect(stepText).toContain("EDGE_LOOP")
  expect(stepText).toContain("FACE_OUTER_BOUND")
  expect(stepText).toContain("FACE_BOUND")
  expect(stepText).toContain("ADVANCED_FACE")
  expect(stepText).toContain("CLOSED_SHELL")
  expect(stepText).toContain("MANIFOLD_SOLID_BREP")
  expect(stepText).toContain("END-ISO-10303-21")
})
