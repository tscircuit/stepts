import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { EdgeLoop } from "./EdgeLoop"

export class FaceOuterBound extends Entity {
  readonly type = "FACE_OUTER_BOUND"
  constructor(
    public bound: Ref<EdgeLoop>,
    public sameSense: boolean,
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    return new FaceOuterBound(
      ctx.parseRef<EdgeLoop>(a[0]),
      a[1].trim() === ".T.",
    )
  }
  toStep(): string {
    return `FACE_OUTER_BOUND(${this.bound},${this.sameSense ? ".T." : ".F."})`
  }
}

register("FACE_OUTER_BOUND", FaceOuterBound.parse.bind(FaceOuterBound))
