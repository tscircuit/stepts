import { expect, test } from "bun:test"
import {
  Axis2Placement3D,
  BSplineCurveWithKnots,
  CartesianPoint,
  ConicalSurface,
  Direction,
  Ellipse,
  Repository,
  SphericalSurface,
} from "../../lib"

test("create SphericalSurface", () => {
  const repo = new Repository()

  const origin = repo.add(new CartesianPoint("", 0, 0, 0))
  const zDir = repo.add(new Direction("", 0, 0, 1))
  const xDir = repo.add(new Direction("", 1, 0, 0))
  const placement = repo.add(new Axis2Placement3D("", origin, zDir, xDir))

  const sphere = repo.add(new SphericalSurface("sphere", placement, 5.0))

  const stepText = repo.toPartFile({ name: "sphere" })
  expect(stepText).toContain("SPHERICAL_SURFACE")
  expect(stepText).toContain("5.")
  console.log(stepText)
})

test("create ConicalSurface", () => {
  const repo = new Repository()

  const origin = repo.add(new CartesianPoint("", 0, 0, 0))
  const zDir = repo.add(new Direction("", 0, 0, 1))
  const xDir = repo.add(new Direction("", 1, 0, 0))
  const placement = repo.add(new Axis2Placement3D("", origin, zDir, xDir))

  const cone = repo.add(new ConicalSurface("cone", placement, 2.0, 0.5))

  const stepText = repo.toPartFile({ name: "cone" })
  expect(stepText).toContain("CONICAL_SURFACE")
  expect(stepText).toContain("2.")
  expect(stepText).toContain("0.5")
  console.log(stepText)
})

test("create Ellipse", () => {
  const repo = new Repository()

  const origin = repo.add(new CartesianPoint("", 0, 0, 0))
  const zDir = repo.add(new Direction("", 0, 0, 1))
  const xDir = repo.add(new Direction("", 1, 0, 0))
  const placement = repo.add(new Axis2Placement3D("", origin, zDir, xDir))

  const ellipse = repo.add(new Ellipse("ellipse", placement, 10.0, 5.0))

  const stepText = repo.toPartFile({ name: "ellipse" })
  expect(stepText).toContain("ELLIPSE")
  expect(stepText).toContain("10.")
  expect(stepText).toContain("5.")
  console.log(stepText)
})

test("create BSplineCurveWithKnots", () => {
  const repo = new Repository()

  const p1 = repo.add(new CartesianPoint("", 0, 0, 0))
  const p2 = repo.add(new CartesianPoint("", 1, 0, 0))
  const p3 = repo.add(new CartesianPoint("", 2, 1, 0))
  const p4 = repo.add(new CartesianPoint("", 3, 0, 0))

  const bspline = repo.add(
    new BSplineCurveWithKnots(
      "curve",
      3,
      [p1, p2, p3, p4],
      ".UNSPECIFIED.",
      false,
      false,
      [4, 4],
      [0, 1],
      ".UNSPECIFIED.",
    ),
  )

  const stepText = repo.toPartFile({ name: "bspline" })
  expect(stepText).toContain("B_SPLINE_CURVE_WITH_KNOTS")
  expect(stepText).toContain(".UNSPECIFIED.")
  console.log(stepText)
})
