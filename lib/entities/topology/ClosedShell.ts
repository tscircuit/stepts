import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { AdvancedFace } from "./AdvancedFace"

export class ClosedShell extends Entity {
  readonly type = "CLOSED_SHELL"
  constructor(public faces: Ref<AdvancedFace>[]) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const faces = a[0]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<AdvancedFace>(tok))
    return new ClosedShell(faces)
  }
  toStep(): string {
    return `CLOSED_SHELL((${this.faces.join(",")}))`
  }
}

register("CLOSED_SHELL", ClosedShell.parse.bind(ClosedShell))
