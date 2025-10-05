import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "./CartesianPoint"
import type { Direction } from "./Direction"

export class Line extends Entity {
  readonly type = "LINE"
  constructor(
    public pnt: Ref<CartesianPoint>,
    public dir: Ref<Direction>,
    public paramLen: number,
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const p = ctx.parseRef<CartesianPoint>(a[0])
    // vector is VECTOR(DIRECTION,len) but many exporters inline a direction; we'll accept DIRECTION ref via VECTOR wrapper or direct
    const vecTok = a[1]
    const m = vecTok.match(/^VECTOR\((#[0-9]+),([0-9Ee+.-]+)\)$/)
    if (!m) throw new Error("Expected VECTOR(...) in LINE")
    const dir = ctx.parseRef<Direction>(m[1])
    const len = ctx.parseNumber(m[2])
    return new Line(p, dir, len)
  }
  toStep(): string {
    return `LINE(${this.pnt},VECTOR(${this.dir},${fmtNum(this.paramLen)}))`
  }
}

register("LINE", Line.parse.bind(Line))
