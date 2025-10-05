import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Product } from "./Product"

export class ProductDefinitionFormation extends Entity {
  readonly type = "PRODUCT_DEFINITION_FORMATION"
  constructor(
    public id: string,
    public description: string,
    public ofProduct: Ref<Product>,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const id = a[0] === "$" ? "" : ctx.parseString(a[0])
    const description = a[1] === "$" ? "" : ctx.parseString(a[1])
    const ofProduct = ctx.parseRef<Product>(a[2])
    return new ProductDefinitionFormation(id, description, ofProduct)
  }
  toStep(): string {
    return `PRODUCT_DEFINITION_FORMATION(${
      this.id ? stepStr(this.id) : "$"
    },${this.description ? stepStr(this.description) : "$"},${this.ofProduct})`
  }
}

register(
  "PRODUCT_DEFINITION_FORMATION",
  ProductDefinitionFormation.parse.bind(ProductDefinitionFormation),
)
