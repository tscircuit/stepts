import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "./CartesianPoint"
import type { Direction } from "./Direction"

export class Axis2Placement3D extends Entity {
  readonly type = "AXIS2_PLACEMENT_3D"
  constructor(
    public name: string,
    public location: Ref<CartesianPoint>,
    public axis?: Ref<Direction>, // Z
    public refDirection?: Ref<Direction>, // X
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const loc = ctx.parseRef<CartesianPoint>(a[1])
    const axis = a[2] !== "$" ? ctx.parseRef<Direction>(a[2]) : undefined
    const refd = a[3] !== "$" ? ctx.parseRef<Direction>(a[3]) : undefined
    return new Axis2Placement3D(name, loc, axis, refd)
  }
  override toStep(): string {
    const A = this.axis ? this.axis.toString() : "$"
    const R = this.refDirection ? this.refDirection.toString() : "$"
    return `AXIS2_PLACEMENT_3D(${stepStr(this.name)},${
      this.location
    },${A},${R})`
  }
}

register("AXIS2_PLACEMENT_3D", Axis2Placement3D.parse.bind(Axis2Placement3D))
