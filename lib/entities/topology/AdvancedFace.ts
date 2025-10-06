import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { Surface } from "../../types/topology"
import type { FaceOuterBound } from "./FaceOuterBound"

export class AdvancedFace extends Entity {
  readonly type = "ADVANCED_FACE"
  constructor(
    public name: string,
    public bounds: Ref<FaceOuterBound>[],
    public surface: Ref<Surface>,
    public sameSense: boolean,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const bounds = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<FaceOuterBound>(tok.trim()))
    const surf = ctx.parseRef<Surface>(a[2])
    const ss = a[3].trim() === ".T."
    return new AdvancedFace(name, bounds, surf, ss)
  }
  toStep(): string {
    return `ADVANCED_FACE(${this.name ? `'${this.name}'` : "''"},(${this.bounds.join(",")}),${this.surface},${
      this.sameSense ? ".T." : ".F."
    })`
  }
}

register("ADVANCED_FACE", AdvancedFace.parse.bind(AdvancedFace))
