import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum, stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Axis2Placement3D } from "./Axis2Placement3D"

export class ToroidalSurface extends Entity {
  readonly type = "TOROIDAL_SURFACE"
  constructor(
    public name: string,
    public position: Ref<Axis2Placement3D>,
    public majorRadius: number,
    public minorRadius: number,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const position = ctx.parseRef<Axis2Placement3D>(a[1])
    const majorRadius = ctx.parseNumber(a[2])
    const minorRadius = ctx.parseNumber(a[3])
    return new ToroidalSurface(name, position, majorRadius, minorRadius)
  }
  toStep(): string {
    return `TOROIDAL_SURFACE(${this.name ? stepStr(this.name) : "$"},${
      this.position
    },${fmtNum(this.majorRadius)},${fmtNum(this.minorRadius)})`
  }
}

register("TOROIDAL_SURFACE", ToroidalSurface.parse.bind(ToroidalSurface))
