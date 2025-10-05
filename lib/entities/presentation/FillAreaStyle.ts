import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { FillAreaStyleColour } from "./FillAreaStyleColour"

export class FillAreaStyle extends Entity {
  readonly type = "FILL_AREA_STYLE"
  constructor(
    public name: string,
    public items: Ref<FillAreaStyleColour>[],
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const items = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<FillAreaStyleColour>(tok))
    return new FillAreaStyle(a[0] === "$" ? "" : ctx.parseString(a[0]), items)
  }
  toStep(): string {
    return `FILL_AREA_STYLE(${
      this.name ? stepStr(this.name) : "$"
    },(${this.items.join(",")}))`
  }
}

register("FILL_AREA_STYLE", FillAreaStyle.parse.bind(FillAreaStyle))
