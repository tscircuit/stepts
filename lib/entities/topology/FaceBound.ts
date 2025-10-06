import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { EdgeLoop } from "./EdgeLoop"

export class FaceBound extends Entity {
  readonly type = "FACE_BOUND"
  constructor(
    public name: string,
    public bound: Ref<EdgeLoop>,
    public sameSense: boolean,
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    return new FaceBound(
      name,
      ctx.parseRef<EdgeLoop>(a[1]),
      a[2].trim() === ".T.",
    )
  }
  toStep(): string {
    return `FACE_BOUND(${stepStr(this.name)},${this.bound},${
      this.sameSense ? ".T." : ".F."
    })`
  }
}

register("FACE_BOUND", FaceBound.parse.bind(FaceBound))
