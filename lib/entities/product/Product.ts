import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"

// Minimal AP214 identity graph (expand as needed)
export class Product extends Entity {
  readonly type = "PRODUCT"
  constructor(public name: string) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new Product(ctx.parseString(a[0]))
  }
  toStep(): string {
    // Keep other fields simple for MVP: name, id="", desc=""
    return `PRODUCT(${stepStr(this.name)},'','',())`
  }
}

register("PRODUCT", Product.parse.bind(Product))
