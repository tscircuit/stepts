import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"

export class ProductDefinitionContext extends Entity {
  readonly type = "PRODUCT_DEFINITION_CONTEXT"
  constructor(
    public name: string,
    public frameOfReference: Ref<Entity>, // APPLICATION_CONTEXT
    public lifecycleStage: string,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const frameOfReference = ctx.parseRef<Entity>(a[1])
    const lifecycleStage = ctx.parseString(a[2])
    return new ProductDefinitionContext(name, frameOfReference, lifecycleStage)
  }
  toStep(): string {
    return `PRODUCT_DEFINITION_CONTEXT(${stepStr(this.name)},${
      this.frameOfReference
    },${stepStr(this.lifecycleStage)})`
  }
}

register(
  "PRODUCT_DEFINITION_CONTEXT",
  ProductDefinitionContext.parse.bind(ProductDefinitionContext),
)
