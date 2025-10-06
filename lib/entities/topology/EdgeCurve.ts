import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { Curve } from "../../types/geometry"
import type { VertexPoint } from "./VertexPoint"

export class EdgeCurve extends Entity {
  readonly type = "EDGE_CURVE"
  constructor(
    public name: string,
    public start: Ref<VertexPoint>,
    public end: Ref<VertexPoint>,
    public curve: Ref<Curve>, // accepts Line or Circle ref
    public sameSense: boolean,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const s = ctx.parseRef<VertexPoint>(a[1])
    const e = ctx.parseRef<VertexPoint>(a[2])
    const c = ctx.parseRef<Curve>(a[3] as any)
    const same = a[4].trim() === ".T."
    return new EdgeCurve(name, s, e, c, same)
  }
  toStep(): string {
    return `EDGE_CURVE(${this.name ? `'${this.name}'` : "''"},${this.start},${this.end},${this.curve},${
      this.sameSense ? ".T." : ".F."
    })`
  }
}

register("EDGE_CURVE", EdgeCurve.parse.bind(EdgeCurve))
