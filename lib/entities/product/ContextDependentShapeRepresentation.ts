import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"

export class ContextDependentShapeRepresentation extends Entity {
  readonly type = "CONTEXT_DEPENDENT_SHAPE_REPRESENTATION"
  constructor(
    public representationRelation: Ref<Entity>, // REPRESENTATION_RELATIONSHIP
    public representedProductRelation: Ref<Entity>, // PRODUCT_DEFINITION_SHAPE
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const representationRelation = ctx.parseRef<Entity>(a[0])
    const representedProductRelation = ctx.parseRef<Entity>(a[1])
    return new ContextDependentShapeRepresentation(
      representationRelation,
      representedProductRelation,
    )
  }
  toStep(): string {
    return `CONTEXT_DEPENDENT_SHAPE_REPRESENTATION(${this.representationRelation},${this.representedProductRelation})`
  }
}

register(
  "CONTEXT_DEPENDENT_SHAPE_REPRESENTATION",
  ContextDependentShapeRepresentation.parse.bind(
    ContextDependentShapeRepresentation,
  ),
)
