import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum, stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Axis2Placement3D } from "./Axis2Placement3D"

export class ConicalSurface extends Entity {
  readonly type = "CONICAL_SURFACE"
  constructor(
    public name: string,
    public position: Ref<Axis2Placement3D>,
    public radius: number,
    public semiAngle: number,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const position = ctx.parseRef<Axis2Placement3D>(a[1])
    const radius = ctx.parseNumber(a[2])
    const semiAngle = ctx.parseNumber(a[3])
    return new ConicalSurface(name, position, radius, semiAngle)
  }
  toStep(): string {
    return `CONICAL_SURFACE(${stepStr(this.name)},${this.position},${fmtNum(this.radius)},${fmtNum(this.semiAngle)})`
  }
}

register("CONICAL_SURFACE", ConicalSurface.parse.bind(ConicalSurface))
