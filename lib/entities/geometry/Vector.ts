import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum, stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { Direction } from "./Direction"

export class Vector extends Entity {
  readonly type = "VECTOR"
  constructor(
    public name: string,
    public orientation: Ref<Direction>,
    public magnitude: number,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const orientation = ctx.parseRef<Direction>(a[1])
    const magnitude = ctx.parseNumber(a[2])
    return new Vector(name, orientation, magnitude)
  }
  toStep(): string {
    return `VECTOR(${stepStr(this.name)},${
      this.orientation
    },${fmtNum(this.magnitude)})`
  }
}

register("VECTOR", Vector.parse.bind(Vector))
