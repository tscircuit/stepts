import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Axis2Placement3D } from "./Axis2Placement3D"

export class Circle extends Entity {
  readonly type = "CIRCLE"
  constructor(
    public name: string,
    public placement: Ref<Axis2Placement3D>,
    public radius: number,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const pl = ctx.parseRef<Axis2Placement3D>(a[1])
    const r = ctx.parseNumber(a[2])
    return new Circle(name, pl, r)
  }
  toStep(): string {
    return `CIRCLE(${this.name ? `'${this.name}'` : "''"},${this.placement},${fmtNum(this.radius)})`
  }
}

register("CIRCLE", Circle.parse.bind(Circle))
