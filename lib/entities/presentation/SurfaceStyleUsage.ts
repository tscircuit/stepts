import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { SurfaceSideStyle } from "./SurfaceSideStyle"

export class SurfaceStyleUsage extends Entity {
  readonly type = "SURFACE_STYLE_USAGE"
  constructor(
    public side: ".BOTH." | ".POS." | ".NEG.",
    public style: Ref<SurfaceSideStyle>,
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new SurfaceStyleUsage(
      a[0].trim() as any,
      ctx.parseRef<SurfaceSideStyle>(a[1]),
    )
  }
  toStep(): string {
    return `SURFACE_STYLE_USAGE(${this.side},${this.style})`
  }
}

register("SURFACE_STYLE_USAGE", SurfaceStyleUsage.parse.bind(SurfaceStyleUsage))
