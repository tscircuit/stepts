import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { SurfaceStyleFillArea } from "./SurfaceStyleFillArea"

export class SurfaceSideStyle extends Entity {
  readonly type = "SURFACE_SIDE_STYLE"
  constructor(public name: string, public styles: Ref<SurfaceStyleFillArea>[]) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const list = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<SurfaceStyleFillArea>(tok))
    return new SurfaceSideStyle(a[0] === "$" ? "" : ctx.parseString(a[0]), list)
  }
  toStep(): string {
    return `SURFACE_SIDE_STYLE(${
      this.name ? stepStr(this.name) : "$"
    },(${this.styles.join(",")}))`
  }
}

register("SURFACE_SIDE_STYLE", SurfaceSideStyle.parse.bind(SurfaceSideStyle))
