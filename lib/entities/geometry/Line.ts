import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "./CartesianPoint"
import type { Vector } from "./Vector"

export class Line extends Entity {
  readonly type = "LINE"
  constructor(
    public pnt: Ref<CartesianPoint>,
    public dir: Ref<Vector>,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const p = ctx.parseRef<CartesianPoint>(a[0])
    const vecTok = a[1]

    // Support both inline VECTOR(...) and references to VECTOR entities
    if (vecTok.startsWith("VECTOR(")) {
      // Inline VECTOR - should have been parsed as a separate entity
      // but some exporters inline it
      throw new Error(
        "Inline VECTOR in LINE is not supported - VECTOR should be a separate entity",
      )
    }

    // Reference to VECTOR entity
    const vec = ctx.parseRef<Vector>(vecTok)
    return new Line(p, vec)
  }
  toStep(): string {
    return `LINE(${this.pnt},${this.dir})`
  }
}

register("LINE", Line.parse.bind(Line))
