import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { ProductContext } from "./ProductContext"

// Minimal AP214 identity graph (expand as needed)
export class Product extends Entity {
  readonly type = "PRODUCT"
  constructor(
    public name: string,
    public id: string,
    public description: string,
    public frameOfReference: Ref<ProductContext>[],
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const id = ctx.parseString(a[1])
    const description = ctx.parseString(a[2])
    const refs = a[3]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<ProductContext>(tok.trim()))
    return new Product(name, id, description, refs)
  }
  toStep(): string {
    return `PRODUCT(${stepStr(this.name)},${stepStr(this.id)},${stepStr(this.description)},(${this.frameOfReference.join(",")}))`
  }
}

register("PRODUCT", Product.parse.bind(Product))
