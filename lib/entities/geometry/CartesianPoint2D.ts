import { Entity } from "../../core/Entity"
import { fmtNum, stepStr } from "../../core/stepFormat"

/** A point in a surface's 2D parameter space, separate from 3D model points. */
export class CartesianPoint2D extends Entity {
  readonly type = "CARTESIAN_POINT"
  constructor(
    public name: string,
    public x: number,
    public y: number,
  ) {
    super()
  }
  override toStep(): string {
    return `CARTESIAN_POINT(${stepStr(this.name)},(${fmtNum(this.x)},${fmtNum(this.y)}))`
  }
}
