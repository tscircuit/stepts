import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { Surface } from "../../types/topology"
import type { FaceOuterBound } from "./FaceOuterBound"

export class AdvancedFace extends Entity {
  readonly type = "ADVANCED_FACE"
  constructor(
    public bounds: Ref<FaceOuterBound>[],
    public surface: Ref<Surface>,
    public sameSense: boolean,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const bounds = a[0]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<FaceOuterBound>(tok))
    const surf = ctx.parseRef<Surface>(a[1])
    const ss = a[2].trim() === ".T."
    return new AdvancedFace(bounds, surf, ss)
  }
  toStep(): string {
    return `ADVANCED_FACE((${this.bounds.join(",")}),${this.surface},${
      this.sameSense ? ".T." : ".F."
    })`
  }
}

register("ADVANCED_FACE", AdvancedFace.parse.bind(AdvancedFace))
