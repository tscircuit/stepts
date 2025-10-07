import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { ClosedShell } from "./ClosedShell"

export class ManifoldSolidBrep extends Entity {
  readonly type = "MANIFOLD_SOLID_BREP"
  constructor(
    public name: string,
    public outer: Ref<ClosedShell>,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    return new ManifoldSolidBrep(name, ctx.parseRef<ClosedShell>(a[1]))
  }
  override toStep(): string {
    return `MANIFOLD_SOLID_BREP(${stepStr(this.name)},${this.outer})`
  }
}

register("MANIFOLD_SOLID_BREP", ManifoldSolidBrep.parse.bind(ManifoldSolidBrep))
