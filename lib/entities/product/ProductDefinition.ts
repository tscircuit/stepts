import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { ProductDefinitionFormation } from "./ProductDefinitionFormation"

export class ProductDefinition extends Entity {
  readonly type = "PRODUCT_DEFINITION"
  constructor(
    public id: string,
    public description: string,
    public formation: Ref<ProductDefinitionFormation>,
    public frameOfReference: Ref<Entity>, // PRODUCT_DEFINITION_CONTEXT
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const id = a[0] === "$" ? "" : ctx.parseString(a[0])
    const description = a[1] === "$" ? "" : ctx.parseString(a[1])
    const formation = ctx.parseRef<ProductDefinitionFormation>(a[2])
    const frameOfReference = ctx.parseRef<Entity>(a[3])
    return new ProductDefinition(id, description, formation, frameOfReference)
  }
  toStep(): string {
    return `PRODUCT_DEFINITION(${stepStr(this.id)},${stepStr(this.description)},${this.formation},${this.frameOfReference})`
  }
}

register("PRODUCT_DEFINITION", ProductDefinition.parse.bind(ProductDefinition))
