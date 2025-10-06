import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "./CartesianPoint"
import type { Circle } from "./Circle"
import type { Line } from "./Line"

export type TrimmedCurveBasis = Circle | Line

export class TrimmedCurve extends Entity {
  readonly type = "TRIMMED_CURVE"
  constructor(
    public name: string,
    public basisCurve: Ref<TrimmedCurveBasis>,
    public trim1: Ref<CartesianPoint>, // First trim point
    public trim2: Ref<CartesianPoint>, // Second trim point
    public senseAgreement: boolean,
    public masterRepresentation: "CARTESIAN" | "PARAMETER",
  ) {
    super()
  }

  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const basis = ctx.parseRef<TrimmedCurveBasis>(a[1])

    // Trim values can be in arrays like (#123) or single refs
    const trim1Str = a[2].replace(/^\(|\)$/g, "")
    const trim2Str = a[3].replace(/^\(|\)$/g, "")

    const trim1 = ctx.parseRef<CartesianPoint>(trim1Str)
    const trim2 = ctx.parseRef<CartesianPoint>(trim2Str)

    const sense = a[4].trim() === ".T."
    const master = a[5].includes("CARTESIAN") ? "CARTESIAN" : "PARAMETER"

    return new TrimmedCurve(name, basis, trim1, trim2, sense, master)
  }

  toStep(): string {
    return `TRIMMED_CURVE(${this.name ? `'${this.name}'` : "''"},${this.basisCurve},(${this.trim1}),(${this.trim2}),${this.senseAgreement ? ".T." : ".F."},.${this.masterRepresentation}.)`
  }
}

register("TRIMMED_CURVE", TrimmedCurve.parse.bind(TrimmedCurve))
