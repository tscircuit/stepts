import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { VertexPoint } from "./VertexPoint"
import type { Curve } from "../../types/geometry"

export class EdgeCurve extends Entity {
  readonly type = "EDGE_CURVE"
  constructor(
    public start: Ref<VertexPoint>,
    public end: Ref<VertexPoint>,
    public curve: Ref<Curve>, // accepts Line or Circle ref
    public sameSense: boolean
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const s = ctx.parseRef<VertexPoint>(a[0])
    const e = ctx.parseRef<VertexPoint>(a[1])
    const c = ctx.parseRef<Curve>(a[2] as any)
    const same = a[3].trim() === ".T."
    return new EdgeCurve(s, e, c, same)
  }
  toStep(): string {
    return `EDGE_CURVE(${this.start},${this.end},${this.curve},${
      this.sameSense ? ".T." : ".F."
    })`
  }
}

register("EDGE_CURVE", EdgeCurve.parse.bind(EdgeCurve))
