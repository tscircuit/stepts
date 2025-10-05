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
  VertexPoint,
} from "../../lib"

test("create a square face", () => {
  // Build a single planar face square as a toy example
  const repo = new Repository()

  // Geometry frame
  const p0 = repo.add(new CartesianPoint("", 0, 0, 0))
  const dz = repo.add(new Direction("", 0, 0, 1))
  const dx = repo.add(new Direction("", 1, 0, 0))
  const frame = repo.add(new Axis2Placement3D("", p0, dz, dx))
  const plane = repo.add(new Plane("", frame))

  // Square vertices
  const v = [
    [0, 0, 0],
    [10, 0, 0],
    [10, 10, 0],
    [0, 10, 0],
  ].map(([x, y, z]) =>
    repo.add(new VertexPoint(repo.add(new CartesianPoint("", x, y, z)))),
  )

  // Edges (lines)
  function edge(i: number, j: number): Ref<EdgeCurve> {
    const p = v[i].resolve(repo).pnt
    const q = v[j].resolve(repo).pnt
    const dir = repo.add(
      new Direction(
        "",
        q.resolve(repo).x - p.resolve(repo).x,
        q.resolve(repo).y - p.resolve(repo).y,
        q.resolve(repo).z - p.resolve(repo).z,
      ),
    )
    const line = repo.add(new Line(p, dir, 1)) // param length not used by many kernels
    return repo.add(new EdgeCurve(v[i], v[j], line, true))
  }

  const ec = [edge(0, 1), edge(1, 2), edge(2, 3), edge(3, 0)]
  const oe = ec.map((e) => repo.add(new OrientedEdge("", e, true)))
  const loop = repo.add(new EdgeLoop("", oe))
  const fob = repo.add(new FaceOuterBound(loop, true))
  const face = repo.add(new AdvancedFace([fob], plane, true))
  const shell = repo.add(new ClosedShell([face]))
  repo.add(new ManifoldSolidBrep("", shell))

  // Emit STEP text
  const stepText = repo.toPartFile({ name: "square" })

  // Verify output contains expected entities
  expect(stepText).toContain("ISO-10303-21")
  expect(stepText).toContain("CARTESIAN_POINT")
  expect(stepText).toContain("DIRECTION")
  expect(stepText).toContain("AXIS2_PLACEMENT_3D")
  expect(stepText).toContain("PLANE")
  expect(stepText).toContain("VERTEX_POINT")
  expect(stepText).toContain("LINE")
  expect(stepText).toContain("EDGE_CURVE")
  expect(stepText).toContain("ORIENTED_EDGE")
  expect(stepText).toContain("EDGE_LOOP")
  expect(stepText).toContain("FACE_OUTER_BOUND")
  expect(stepText).toContain("ADVANCED_FACE")
  expect(stepText).toContain("CLOSED_SHELL")
  expect(stepText).toContain("MANIFOLD_SOLID_BREP")
  expect(stepText).toContain("END-ISO-10303-21")

  console.log(stepText)
})
