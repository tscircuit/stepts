import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { OrientedEdge } from "./OrientedEdge"

export class EdgeLoop extends Entity {
  readonly type = "EDGE_LOOP"
  constructor(
    public name: string,
    public edges: Ref<OrientedEdge>[],
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const list = a[1]
      .replace(/^\(|\)$/g, "")
      .split(",")
      .filter(Boolean)
      .map((tok) => ctx.parseRef<OrientedEdge>(tok))
    return new EdgeLoop(name, list)
  }
  override toStep(): string {
    return `EDGE_LOOP(${
      stepStr(this.name)
    },(${this.edges.join(",")}))`
  }
}

register("EDGE_LOOP", EdgeLoop.parse.bind(EdgeLoop))
