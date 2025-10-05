import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Product } from "./Product"

export class ProductRelatedProductCategory extends Entity {
  readonly type = "PRODUCT_RELATED_PRODUCT_CATEGORY"
  constructor(
    public name: string,
    public description: string,
    public products: Ref<Product>[],
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const description = a[1] === "$" ? "" : ctx.parseString(a[1])
    const products = a[2]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<Product>(tok))
    return new ProductRelatedProductCategory(name, description, products)
  }
  toStep(): string {
    return `PRODUCT_RELATED_PRODUCT_CATEGORY(${stepStr(this.name)},${
      this.description ? stepStr(this.description) : "$"
    },(${this.products.join(",")}))`
  }
}

register(
  "PRODUCT_RELATED_PRODUCT_CATEGORY",
  ProductRelatedProductCategory.parse.bind(ProductRelatedProductCategory),
)
