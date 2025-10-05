import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { SurfaceStyleUsage } from "./SurfaceStyleUsage"

export class PresentationStyleAssignment extends Entity {
  readonly type = "PRESENTATION_STYLE_ASSIGNMENT"
  constructor(public items: Ref<SurfaceStyleUsage>[]) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const list = a[0]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<SurfaceStyleUsage>(tok))
    return new PresentationStyleAssignment(list)
  }
  toStep(): string {
    return `PRESENTATION_STYLE_ASSIGNMENT((${this.items.join(",")}))`
  }
}

register("PRESENTATION_STYLE_ASSIGNMENT", PresentationStyleAssignment.parse.bind(PresentationStyleAssignment))
