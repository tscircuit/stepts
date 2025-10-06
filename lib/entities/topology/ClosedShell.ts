import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { AdvancedFace } from "./AdvancedFace"

export class ClosedShell extends Entity {
  readonly type = "CLOSED_SHELL"
  constructor(
    public name: string,
    public faces: Ref<AdvancedFace>[],
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const faces = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<AdvancedFace>(tok.trim()))
    return new ClosedShell(name, faces)
  }
  toStep(): string {
    return `CLOSED_SHELL(${this.name ? `'${this.name}'` : "''"},(${this.faces.join(",")}))`
  }
}

register("CLOSED_SHELL", ClosedShell.parse.bind(ClosedShell))
