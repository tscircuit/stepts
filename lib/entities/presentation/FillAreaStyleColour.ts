import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { ColourRgb } from "./ColourRgb"

export class FillAreaStyleColour extends Entity {
  readonly type = "FILL_AREA_STYLE_COLOUR"
  constructor(public name: string, public colour: Ref<ColourRgb>) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new FillAreaStyleColour(
      ctx.parseString(a[0]),
      ctx.parseRef<ColourRgb>(a[1])
    )
  }
  toStep(): string {
    return `FILL_AREA_STYLE_COLOUR(${stepStr(this.name)},${this.colour})`
  }
}

register("FILL_AREA_STYLE_COLOUR", FillAreaStyleColour.parse.bind(FillAreaStyleColour))
