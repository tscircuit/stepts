import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "../geometry/CartesianPoint"

export class VertexPoint extends Entity {
  readonly type = "VERTEX_POINT"
  constructor(
    public name: string,
    public pnt: Ref<CartesianPoint>,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    return new VertexPoint(name, ctx.parseRef<CartesianPoint>(a[1]))
  }
  toStep(): string {
    return `VERTEX_POINT(${this.name ? `'${this.name}'` : "''"},${this.pnt})`
  }
}

register("VERTEX_POINT", VertexPoint.parse.bind(VertexPoint))
