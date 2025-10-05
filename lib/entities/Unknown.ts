import { Entity } from "../core/Entity"
import type { Repository } from "../core/Repository"

// Unknown entity passthrough
export class Unknown extends Entity {
  constructor(public type: string, public args: string[]) {
    super()
  }
  toStep(): string {
    return `${this.type}(${this.args.join(",")})`
  }
}
