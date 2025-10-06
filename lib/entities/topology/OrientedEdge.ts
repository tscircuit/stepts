import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { EdgeCurve } from "./EdgeCurve"

export class OrientedEdge extends Entity {
  readonly type = "ORIENTED_EDGE"
  constructor(
    public name: string,
    public edge: Ref<EdgeCurve>,
    public orientation: boolean,
  ) {
    super()
  }
  static parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    // edge geometry and vertices are usually "$" in AP214 oriented edge rows
    const edge = ctx.parseRef<EdgeCurve>(a[3])
    const orient = a[4]?.trim?.() === ".T." || a[2]?.trim?.() === ".T." // exporter variance
    return new OrientedEdge(name, edge, orient)
  }
  toStep(): string {
    // AP214 canonical form: ( 'name', *, *, #edge, .T.|.F. )
    return `ORIENTED_EDGE(${stepStr(this.name)},*,*,${
      this.edge
    },${this.orientation ? ".T." : ".F."})`
  }
}

register("ORIENTED_EDGE", OrientedEdge.parse.bind(OrientedEdge))
