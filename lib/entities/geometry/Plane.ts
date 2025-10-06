import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Axis2Placement3D } from "./Axis2Placement3D"

export class Plane extends Entity {
  readonly type = "PLANE"
  constructor(
    public name: string,
    public placement: Ref<Axis2Placement3D>,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    return new Plane(
      ctx.parseString(a[0]),
      ctx.parseRef<Axis2Placement3D>(a[1]),
    )
  }
  override toStep(): string {
    return `PLANE(${stepStr(this.name)},${this.placement})`
  }
}

register("PLANE", Plane.parse.bind(Plane))
