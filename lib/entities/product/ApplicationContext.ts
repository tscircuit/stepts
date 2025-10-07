import { Entity } from "../../core/Entity"
import type { ParseContext } from "../../core/ParseContext"
import { stepStr } from "../../core/stepFormat"
import { register } from "../../parse/registry"

export class ApplicationContext extends Entity {
  readonly type = "APPLICATION_CONTEXT"
  constructor(public application: string) {
    super()
  }
  static override parse(a: string[], ctx: ParseContext) {
    const application = ctx.parseString(a[0])
    return new ApplicationContext(application)
  }
  toStep(): string {
    return `APPLICATION_CONTEXT(${stepStr(this.application)})`
  }
}

register(
  "APPLICATION_CONTEXT",
  ApplicationContext.parse.bind(ApplicationContext),
)
