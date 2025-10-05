import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import { stepStr, fmtNum } from "../../core/stepFormat"
import { register } from "../../parse/registry"

export class Direction extends Entity {
  readonly type = "DIRECTION"
  constructor(
    public name: string,
    public dx: number,
    public dy: number,
    public dz: number
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const comps = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .map(ctx.parseNumber)
    return new Direction(name, comps[0], comps[1], comps[2] ?? 0)
  }
  toStep(): string {
    return `DIRECTION(${stepStr(this.name)},(${fmtNum(this.dx)},${fmtNum(
      this.dy
    )},${fmtNum(this.dz)}))`
  }
}

register("DIRECTION", Direction.parse.bind(Direction))
