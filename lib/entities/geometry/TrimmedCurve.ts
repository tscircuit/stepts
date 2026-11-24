import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { fmtNum } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { CartesianPoint } from "./CartesianPoint"
import type { Circle } from "./Circle"
import type { Line } from "./Line"

export type TrimmedCurveBasis = Circle | Line
export type TrimmingSelect = Ref<CartesianPoint> | number

const parseTrimmingSelects = (
  arg: string,
  ctx: ParseContext,
): TrimmingSelect[] => {
  const values = arg
    .trim()
    .replace(/^\(|\)$/g, "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      if (token.startsWith("#")) return ctx.parseRef<CartesianPoint>(token)
      const parameter = ctx.parseNumber(token)
      if (!Number.isFinite(parameter)) {
        throw new Error(`Invalid STEP trimming parameter: ${token}`)
      }
      return parameter
    })
  if (values.length < 1 || values.length > 2) {
    throw new Error(`TRIMMED_CURVE trim sets require one or two values: ${arg}`)
  }
  return values
}

const formatTrimmingSelects = (values: TrimmingSelect[]): string =>
  `(${values
    .map((value) =>
      typeof value === "number" ? fmtNum(value) : value.toString(),
    )
    .join(",")})`

export class TrimmedCurve extends Entity {
  readonly type = "TRIMMED_CURVE"
  constructor(
    public name: string,
    public basisCurve: Ref<TrimmedCurveBasis>,
    public trim1: TrimmingSelect[],
    public trim2: TrimmingSelect[],
    public senseAgreement: boolean,
    public masterRepresentation: "CARTESIAN" | "PARAMETER",
  ) {
    super()
  }

  static override parse(a: string[], ctx: ParseContext) {
    const name = a[0] === "$" ? "" : ctx.parseString(a[0])
    const basis = ctx.parseRef<TrimmedCurveBasis>(a[1])
    const trim1 = parseTrimmingSelects(a[2], ctx)
    const trim2 = parseTrimmingSelects(a[3], ctx)
    const sense = a[4].trim() === ".T."
    const master = a[5].includes("CARTESIAN") ? "CARTESIAN" : "PARAMETER"

    return new TrimmedCurve(name, basis, trim1, trim2, sense, master)
  }

  toStep(): string {
    return `TRIMMED_CURVE(${this.name ? `'${this.name}'` : "''"},${this.basisCurve},${formatTrimmingSelects(this.trim1)},${formatTrimmingSelects(this.trim2)},${this.senseAgreement ? ".T." : ".F."},.${this.masterRepresentation}.)`
  }
}

register("TRIMMED_CURVE", TrimmedCurve.parse.bind(TrimmedCurve))
