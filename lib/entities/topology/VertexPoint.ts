import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "../geometry/CartesianPoint"

export class VertexPoint extends Entity {
  readonly type = "VERTEX_POINT"
  constructor(public pnt: Ref<CartesianPoint>) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new VertexPoint(ctx.parseRef<CartesianPoint>(a[0]))
  }
  toStep(): string {
    return `VERTEX_POINT(${this.pnt})`
  }
}

register("VERTEX_POINT", VertexPoint.parse.bind(VertexPoint))
