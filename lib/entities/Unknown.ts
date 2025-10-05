import { Entity } from "../core/Entity"

// Unknown entity passthrough
export class Unknown extends Entity {
  constructor(
    public type: string,
    public args: string[],
  ) {
    super()
  }
  toStep(): string {
    return `${this.type}(${this.args.join(",")})`
  }
}
