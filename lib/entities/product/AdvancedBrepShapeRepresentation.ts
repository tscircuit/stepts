import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"

// Representation container
export class AdvancedBrepShapeRepresentation extends Entity {
  readonly type = "ADVANCED_BREP_SHAPE_REPRESENTATION"
  constructor(
    public name: string,
    public items: Ref<Entity>[], // solids etc.
    public context: Ref<Entity>, // GEOMETRIC_REPRESENTATION_CONTEXT...
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const items = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<Entity>(tok))
    const c = ctx.parseRef<Entity>(a[2])
    return new AdvancedBrepShapeRepresentation(name, items, c)
  }
  override toStep(): string {
    return `ADVANCED_BREP_SHAPE_REPRESENTATION(${stepStr(
      this.name,
    )},(${this.items.join(",")}),${this.context})`
  }
}

register(
  "ADVANCED_BREP_SHAPE_REPRESENTATION",
  AdvancedBrepShapeRepresentation.parse.bind(AdvancedBrepShapeRepresentation),
)
