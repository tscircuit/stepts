import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"

// Simple AP214 color chain (per-face)
export class ColourRgb extends Entity {
  readonly type = "COLOUR_RGB"
  constructor(
    public name: string,
    public r: number,
    public g: number,
    public b: number,
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new ColourRgb(
      ctx.parseString(a[0]),
      ctx.parseNumber(a[1]),
      ctx.parseNumber(a[2]),
      ctx.parseNumber(a[3]),
    )
  }
  toStep(): string {
    return `COLOUR_RGB(${stepStr(this.name)},${this.r},${this.g},${this.b})`
  }
}

register("COLOUR_RGB", ColourRgb.parse.bind(ColourRgb))
