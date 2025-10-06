import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"

export class ProductContext extends Entity {
  readonly type = "PRODUCT_CONTEXT"
  constructor(
    public name: string,
    public frameOfReference: Ref<Entity>, // APPLICATION_CONTEXT
    public disciplineType: string,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const frameOfReference = ctx.parseRef<Entity>(a[1])
    const disciplineType = ctx.parseString(a[2])
    return new ProductContext(name, frameOfReference, disciplineType)
  }
  toStep(): string {
    return `PRODUCT_CONTEXT(${stepStr(this.name)},${this.frameOfReference},${stepStr(this.disciplineType)})`
  }
}

register("PRODUCT_CONTEXT", ProductContext.parse.bind(ProductContext))
