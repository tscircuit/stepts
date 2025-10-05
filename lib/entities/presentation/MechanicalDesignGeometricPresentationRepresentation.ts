import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"

export class MechanicalDesignGeometricPresentationRepresentation extends Entity {
  readonly type = "MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION"
  constructor(
    public name: string,
    public items: Ref<Entity>[],
    public contextOfItems: Ref<Entity>, // GEOMETRIC_REPRESENTATION_CONTEXT
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
    const contextOfItems = ctx.parseRef<Entity>(a[2])
    return new MechanicalDesignGeometricPresentationRepresentation(
      name,
      items,
      contextOfItems,
    )
  }
  toStep(): string {
    return `MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION(${
      this.name ? stepStr(this.name) : "$"
    },(${this.items.join(",")}),${this.contextOfItems})`
  }
}

register(
  "MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION",
  MechanicalDesignGeometricPresentationRepresentation.parse.bind(
    MechanicalDesignGeometricPresentationRepresentation,
  ),
)
