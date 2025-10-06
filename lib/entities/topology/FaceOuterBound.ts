import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { EdgeLoop } from "./EdgeLoop"

export class FaceOuterBound extends Entity {
  readonly type = "FACE_OUTER_BOUND"
  constructor(
    public name: string,
    public bound: Ref<EdgeLoop>,
    public sameSense: boolean,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    return new FaceOuterBound(
      ctx.parseString(a[0]),
      ctx.parseRef<EdgeLoop>(a[1]),
      a[2].trim() === ".T.",
    )
  }
  override toStep(): string {
    return `FACE_OUTER_BOUND('${this.name}',${this.bound},${this.sameSense ? ".T." : ".F."})`
  }
}

register("FACE_OUTER_BOUND", FaceOuterBound.parse.bind(FaceOuterBound))
