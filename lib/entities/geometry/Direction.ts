import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import { fmtNum, stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import { Direction2D } from "./Direction2D"

export class Direction extends Entity {
  readonly type = "DIRECTION"
  constructor(
    public name: string,
    public dx: number,
    public dy: number,
    public dz: number,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const comps = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .map(ctx.parseNumber)
    if (comps.length === 2) return new Direction2D(name, comps[0], comps[1])
    return new Direction(name, comps[0], comps[1], comps[2])
  }
  override toStep(): string {
    return `DIRECTION(${stepStr(this.name)},(${fmtNum(this.dx)},${fmtNum(
      this.dy,
    )},${fmtNum(this.dz)}))`
  }
}

register("DIRECTION", Direction.parse.bind(Direction))
