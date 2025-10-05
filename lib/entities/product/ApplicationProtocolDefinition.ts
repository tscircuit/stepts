import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import type { Ref } from "../../core/Ref"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"
import type { ApplicationContext } from "./ApplicationContext"

export class ApplicationProtocolDefinition extends Entity {
  readonly type = "APPLICATION_PROTOCOL_DEFINITION"
  constructor(
    public status: string,
    public applicationInterpretedModelSchemaName: string,
    public applicationProtocolYear: number,
    public application: Ref<ApplicationContext>,
  ) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const status = ctx.parseString(a[0])
    const schemaName = ctx.parseString(a[1])
    const year = ctx.parseNumber(a[2])
    const application = ctx.parseRef<ApplicationContext>(a[3])
    return new ApplicationProtocolDefinition(status, schemaName, year, application)
  }
  toStep(): string {
    return `APPLICATION_PROTOCOL_DEFINITION(${stepStr(this.status)},${stepStr(
      this.applicationInterpretedModelSchemaName,
    )},${this.applicationProtocolYear},${this.application})`
  }
}

register(
  "APPLICATION_PROTOCOL_DEFINITION",
  ApplicationProtocolDefinition.parse.bind(ApplicationProtocolDefinition),
)
