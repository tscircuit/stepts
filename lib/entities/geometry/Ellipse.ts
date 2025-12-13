import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum, stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Axis2Placement3D } from "./Axis2Placement3D"

export class Ellipse extends Entity {
  readonly type = "ELLIPSE"
  constructor(
    public name: string,
    public placement: Ref<Axis2Placement3D>,
    public semiAxis1: number,
    public semiAxis2: number,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const placement = ctx.parseRef<Axis2Placement3D>(a[1])
    const semiAxis1 = ctx.parseNumber(a[2])
    const semiAxis2 = ctx.parseNumber(a[3])
    return new Ellipse(name, placement, semiAxis1, semiAxis2)
  }
  toStep(): string {
    return `ELLIPSE(${stepStr(this.name)},${this.placement},${fmtNum(this.semiAxis1)},${fmtNum(this.semiAxis2)})`
  }
}

register("ELLIPSE", Ellipse.parse.bind(Ellipse))
