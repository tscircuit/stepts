import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum, stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "./CartesianPoint"

export class BSplineCurveWithKnots extends Entity {
  readonly type = "B_SPLINE_CURVE_WITH_KNOTS"
  constructor(
    public name: string,
    public degree: number,
    public controlPointsList: Ref<CartesianPoint>[],
    public curveForm: string,
    public closedCurve: boolean,
    public selfIntersect: boolean,
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
      .map((tok) => ctx.parseRef<CartesianPoint>(tok.trim()))
    const curveForm = a[3].trim()
    const closedCurve = a[4].trim() === ".T."
    const selfIntersect = a[5].trim() === ".T."
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
    const kms = `(${this.knotMultiplicities.map(fmtNum).join(",")})`
    const ks = `(${this.knots.map(fmtNum).join(",")})`
    const closed = this.closedCurve ? ".T." : ".F."
    const self = this.selfIntersect ? ".T." : ".F."
    return `B_SPLINE_CURVE_WITH_KNOTS(${stepStr(this.name)},${this.degree},${cps},${this.curveForm},${closed},${self},${kms},${ks},${this.knotSpec})`
  }
}

register(
  "B_SPLINE_CURVE_WITH_KNOTS",
  BSplineCurveWithKnots.parse.bind(BSplineCurveWithKnots),
)
