import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"

export class ItemDefinedTransformation extends Entity {
  readonly type = "ITEM_DEFINED_TRANSFORMATION"
  constructor(
    public name: string,
    public description: string,
    public transformItem1: Ref<Entity>, // Usually AXIS2_PLACEMENT_3D
    public transformItem2: Ref<Entity>, // Usually AXIS2_PLACEMENT_3D
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const description = a[1] === "$" ? "" : ctx.parseString(a[1])
    const item1 = ctx.parseRef<Entity>(a[2])
    const item2 = ctx.parseRef<Entity>(a[3])
    return new ItemDefinedTransformation(name, description, item1, item2)
  }
  toStep(): string {
    return `ITEM_DEFINED_TRANSFORMATION(${stepStr(this.name)},${stepStr(this.description)},${this.transformItem1},${this.transformItem2})`
  }
}

register(
  "ITEM_DEFINED_TRANSFORMATION",
  ItemDefinedTransformation.parse.bind(ItemDefinedTransformation),
)
