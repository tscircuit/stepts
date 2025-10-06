import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { FillAreaStyle } from "./FillAreaStyle"

export class SurfaceStyleFillArea extends Entity {
  readonly type = "SURFACE_STYLE_FILL_AREA"
  constructor(public style: Ref<FillAreaStyle>) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    return new SurfaceStyleFillArea(ctx.parseRef<FillAreaStyle>(a[0]))
  }
  override toStep(): string {
    return `SURFACE_STYLE_FILL_AREA(${this.style})`
  }
}

register(
  "SURFACE_STYLE_FILL_AREA",
  SurfaceStyleFillArea.parse.bind(SurfaceStyleFillArea),
)
