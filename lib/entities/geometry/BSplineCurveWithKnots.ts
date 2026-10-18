import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtLogical, fmtNum, stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "./CartesianPoint"
import type { CartesianPoint2D } from "./CartesianPoint2D"

export class BSplineCurveWithKnots extends Entity {
  readonly type = "B_SPLINE_CURVE_WITH_KNOTS"
  constructor(
    public name: string,
    public degree: number,
    public controlPointsList: Ref<CartesianPoint | CartesianPoint2D>[],
    public curveForm: string,
    public closedCurve: boolean | null,
    public selfIntersect: boolean | null,
    public knotMultiplicities: number[],
    public knots: number[],
    public knotSpec: string,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const degree = ctx.parseNumber(a[1])
    const controlPoints = a[2]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<CartesianPoint | CartesianPoint2D>(tok.trim()))
    const curveForm = a[3].trim()
    const closedCurve = parseLogical(a[4])
    const selfIntersect = parseLogical(a[5])
    const knotMults = a[6]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseNumber(tok.trim()))
    const knots = a[7]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseNumber(tok.trim()))
    const knotSpec = a[8].trim()
    return new BSplineCurveWithKnots(
      name,
      degree,
      controlPoints,
      curveForm,
      closedCurve,
      selfIntersect,
      knotMults,
      knots,
      knotSpec,
    )
  }
  toStep(): string {
    const cps = `(${this.controlPointsList.join(",")})`
    const kms = `(${this.knotMultiplicities.join(",")})`
    const ks = `(${this.knots.map(fmtNum).join(",")})`
    const closed = fmtLogical(this.closedCurve)
    const self = fmtLogical(this.selfIntersect)
    return `B_SPLINE_CURVE_WITH_KNOTS(${stepStr(this.name)},${this.degree},${cps},${this.curveForm},${closed},${self},${kms},${ks},${this.knotSpec})`
  }
}

function parseLogical(token: string): boolean | null {
  switch (token.trim()) {
    case ".T.":
      return true
    case ".F.":
      return false
    case ".U.":
      return null
    default:
      throw new Error(`Invalid STEP logical: ${token}`)
  }
}

register(
  "B_SPLINE_CURVE_WITH_KNOTS",
  BSplineCurveWithKnots.parse.bind(BSplineCurveWithKnots),
)
