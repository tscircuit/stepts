import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { ProductDefinition } from "./ProductDefinition"

export class NextAssemblyUsageOccurrence extends Entity {
  readonly type = "NEXT_ASSEMBLY_USAGE_OCCURRENCE"
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public relatingProductDefinition: Ref<ProductDefinition>,
    public relatedProductDefinition: Ref<ProductDefinition>,
    public referenceDesignator: string,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const id = ctx.parseString(a[0])
    const name = ctx.parseString(a[1])
    const description = a[2] === "$" ? "" : ctx.parseString(a[2])
    const relating = ctx.parseRef<ProductDefinition>(a[3])
    const related = ctx.parseRef<ProductDefinition>(a[4])
    const designator = a[5] === "$" ? "" : ctx.parseString(a[5])
    return new NextAssemblyUsageOccurrence(
      id,
      name,
      description,
      relating,
      related,
      designator,
    )
  }
  toStep(): string {
    return `NEXT_ASSEMBLY_USAGE_OCCURRENCE(${stepStr(this.id)},${stepStr(
      this.name,
    )},${this.description ? stepStr(this.description) : "$"},${
      this.relatingProductDefinition
    },${this.relatedProductDefinition},${
      this.referenceDesignator ? stepStr(this.referenceDesignator) : "$"
    })`
  }
}

register(
  "NEXT_ASSEMBLY_USAGE_OCCURRENCE",
  NextAssemblyUsageOccurrence.parse.bind(NextAssemblyUsageOccurrence),
)
