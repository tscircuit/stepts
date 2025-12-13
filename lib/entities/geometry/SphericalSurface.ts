import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum, stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Axis2Placement3D } from "./Axis2Placement3D"

export class SphericalSurface extends Entity {
  readonly type = "SPHERICAL_SURFACE"
  constructor(
    public name: string,
    public position: Ref<Axis2Placement3D>,
    public radius: number,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const position = ctx.parseRef<Axis2Placement3D>(a[1])
    const radius = ctx.parseNumber(a[2])
    return new SphericalSurface(name, position, radius)
  }
  toStep(): string {
    return `SPHERICAL_SURFACE(${stepStr(this.name)},${this.position},${fmtNum(this.radius)})`
  }
}

register("SPHERICAL_SURFACE", SphericalSurface.parse.bind(SphericalSurface))
