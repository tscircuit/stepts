import { Entity } from "../../core/Entity"
import { fmtNum, stepStr } from "../../core/stepFormat"

/** A direction in a surface's 2D parameter space. */
export class Direction2D extends Entity {
  readonly type = "DIRECTION"
  constructor(
    public name: string,
    public dx: number,
    public dy: number,
  ) {
    super()
  }
  override toStep(): string {
    return `DIRECTION(${stepStr(this.name)},(${fmtNum(this.dx)},${fmtNum(this.dy)}))`
  }
}
