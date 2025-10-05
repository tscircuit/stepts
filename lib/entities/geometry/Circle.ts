import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Axis2Placement3D } from "./Axis2Placement3D"

export class Circle extends Entity {
  readonly type = "CIRCLE"
  constructor(public placement: Ref<Axis2Placement3D>, public radius: number) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const pl = ctx.parseRef<Axis2Placement3D>(a[0])
    const r = ctx.parseNumber(a[1])
    return new Circle(pl, r)
  }
  toStep(): string {
    return `CIRCLE(${this.placement},${fmtNum(this.radius)})`
  }
}

register("CIRCLE", Circle.parse.bind(Circle))
