import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { ProductDefinition } from "./ProductDefinition"

export class ProductDefinitionShape extends Entity {
  readonly type = "PRODUCT_DEFINITION_SHAPE"
  constructor(
    public name: string,
    public description: string,
    public definition: Ref<ProductDefinition>,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const description = a[1] === "$" ? "" : ctx.parseString(a[1])
    const definition = ctx.parseRef<ProductDefinition>(a[2])
    return new ProductDefinitionShape(name, description, definition)
  }
  toStep(): string {
    return `PRODUCT_DEFINITION_SHAPE(${stepStr(this.name)},${stepStr(this.description)},${this.definition})`
  }
}

register(
  "PRODUCT_DEFINITION_SHAPE",
  ProductDefinitionShape.parse.bind(ProductDefinitionShape),
)
