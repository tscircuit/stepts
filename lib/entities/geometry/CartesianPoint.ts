import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import { stepStr, fmtNum } from "../../core/stepFormat"
import { register } from "../../parse/registry"

export class CartesianPoint extends Entity {
  readonly type = "CARTESIAN_POINT"
  constructor(
    public name: string,
    public x: number,
    public y: number,
    public z: number
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = ctx.parseString(a[0])
    const coords = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .map(ctx.parseNumber)
    return new CartesianPoint(name, coords[0], coords[1], coords[2] ?? 0)
  }
  toStep(): string {
    return `CARTESIAN_POINT(${stepStr(this.name)},(${fmtNum(this.x)},${fmtNum(
      this.y
    )},${fmtNum(this.z)}))`
  }
}

register("CARTESIAN_POINT", CartesianPoint.parse.bind(CartesianPoint))
