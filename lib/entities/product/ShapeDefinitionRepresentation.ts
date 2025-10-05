import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { ProductDefinitionShape } from "./ProductDefinitionShape"

export class ShapeDefinitionRepresentation extends Entity {
  readonly type = "SHAPE_DEFINITION_REPRESENTATION"
  constructor(
    public definition: Ref<ProductDefinitionShape>,
    public usedRepresentation: Ref<Entity>, // SHAPE_REPRESENTATION or ADVANCED_BREP_SHAPE_REPRESENTATION
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const definition = ctx.parseRef<ProductDefinitionShape>(a[0])
    const usedRepresentation = ctx.parseRef<Entity>(a[1])
    return new ShapeDefinitionRepresentation(definition, usedRepresentation)
  }
  toStep(): string {
    return `SHAPE_DEFINITION_REPRESENTATION(${this.definition},${this.usedRepresentation})`
  }
}

register(
  "SHAPE_DEFINITION_REPRESENTATION",
  ShapeDefinitionRepresentation.parse.bind(ShapeDefinitionRepresentation),
)
