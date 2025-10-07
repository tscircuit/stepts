import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { PresentationStyleAssignment } from "./PresentationStyleAssignment"

export class StyledItem extends Entity {
  readonly type = "STYLED_ITEM"
  constructor(
    public name: string,
    public styles: Ref<PresentationStyleAssignment>[],
    public item: Ref<Entity>,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const styles = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<PresentationStyleAssignment>(tok))
    const item = ctx.parseRef<Entity>(a[2])
    return new StyledItem(name, styles, item)
  }
  override toStep(): string {
    return `STYLED_ITEM(${stepStr(
      this.name,
    )},(${this.styles.join(",")}),${this.item})`
  }
}

register("STYLED_ITEM", StyledItem.parse.bind(StyledItem))
