import { writeFileSync } from "node:fs"
import { expect, test } from "bun:test"
import {
  AdvancedFace,
  Axis2Placement3D,
  CartesianPoint,
  ClosedShell,
  Direction,
  EdgeCurve,
  EdgeLoop,
  FaceOuterBound,
  Line,
  ManifoldSolidBrep,
  OrientedEdge,
  Plane,
  type Ref,
  Repository,
  Vector,
  VertexPoint,
} from "../../lib"

test("create a simple box", () => {
  const repo = new Repository()

  // Box dimensions: 10x10x10
  const size = 10

  // Create 8 vertices for the box corners
  const vertices = [
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

  // Helper to create an edge between two vertices
  function createEdge(v1Idx: number, v2Idx: number): Ref<EdgeCurve> {
    const v1 = vertices[v1Idx]
    const v2 = vertices[v2Idx]
    const p1 = v1.resolve(repo).pnt.resolve(repo)
    const p2 = v2.resolve(repo).pnt.resolve(repo)
    const dir = repo.add(
      new Direction("", p2.x - p1.x, p2.y - p1.y, p2.z - p1.z),
    )
    const vec = repo.add(new Vector("", dir, 1))
    const line = repo.add(new Line("", v1.resolve(repo).pnt, vec))
    return repo.add(new EdgeCurve("", v1, v2, line, true))
  }

  // Create all 12 edges of the cube
  // Bottom face edges
  const e0 = createEdge(0, 1)
  const e1 = createEdge(1, 2)
  const e2 = createEdge(2, 3)
  const e3 = createEdge(3, 0)
  // Top face edges
  const e4 = createEdge(4, 5)
  const e5 = createEdge(5, 6)
  const e6 = createEdge(6, 7)
  const e7 = createEdge(7, 4)
  // Vertical edges
  const e8 = createEdge(0, 4)
  const e9 = createEdge(1, 5)
  const e10 = createEdge(2, 6)
  const e11 = createEdge(3, 7)

  // Create coordinate system
  const origin = repo.add(new CartesianPoint("", 0, 0, 0))
  const xDir = repo.add(new Direction("", 1, 0, 0))
  const yDir = repo.add(new Direction("", 0, 1, 0))
  const zDir = repo.add(new Direction("", 0, 0, 1))

  // Bottom face (z=0, normal pointing down)
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
      [repo.add(new FaceOuterBound(bottomLoop, true))],
      bottomPlane,
      true,
    ),
  )

  // Top face (z=size, normal pointing up)
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
      [repo.add(new FaceOuterBound(topLoop, true))],
      topPlane,
      true,
    ),
  )

  // Front face (y=0, normal pointing forward -Y)
  const frontFrame = repo.add(
    new Axis2Placement3D(
      "",
      origin,
      repo.add(new Direction("", 0, -1, 0)),
      xDir,
    ),
  )
  const frontPlane = repo.add(new Plane("", frontFrame))
  const frontLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", e0, true)),
      repo.add(new OrientedEdge("", e9, true)),
      repo.add(new OrientedEdge("", e4, false)),
      repo.add(new OrientedEdge("", e8, false)),
    ]),
  )
  const frontFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound(frontLoop, true))],
      frontPlane,
      true,
    ),
  )

  // Back face (y=size, normal pointing backward +Y)
  const backOrigin = repo.add(new CartesianPoint("", 0, size, 0))
  const backFrame = repo.add(new Axis2Placement3D("", backOrigin, yDir, xDir))
  const backPlane = repo.add(new Plane("", backFrame))
  const backLoop = repo.add(
    new EdgeLoop("", [
      repo.add(new OrientedEdge("", e2, true)),
      repo.add(new OrientedEdge("", e11, true)),
      repo.add(new OrientedEdge("", e6, false)),
      repo.add(new OrientedEdge("", e10, false)),
    ]),
  )
  const backFace = repo.add(
    new AdvancedFace(
      "",
      [repo.add(new FaceOuterBound(backLoop, true))],
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
      [repo.add(new FaceOuterBound(leftLoop, true))],
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
      [repo.add(new FaceOuterBound(rightLoop, true))],
      rightPlane,
      true,
    ),
  )

  // Create closed shell and solid
  const shell = repo.add(
    new ClosedShell("", [
      bottomFace,
      topFace,
      frontFace,
      backFace,
      leftFace,
      rightFace,
    ]),
  )
  const solid = repo.add(new ManifoldSolidBrep("SimpleBox", shell))

  // Emit STEP text
  const stepText = repo.toPartFile({ name: "simple-box" })

  // Write to debug-output
  writeFileSync(
    "/Users/seve/w/tsc/stepts/debug-output/simple-box.step",
    stepText,
  )

  console.log("STEP file written to debug-output/simple-box.step")

  // Verify output contains expected entities
  expect(stepText).toContain("ISO-10303-21")
  expect(stepText).toContain("MANIFOLD_SOLID_BREP")
  expect(stepText).toContain("END-ISO-10303-21")
})
