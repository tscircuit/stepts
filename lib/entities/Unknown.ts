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
    // Check if this is a complex multi-inheritance entity
    // (args[0] starts with "( " for complex entities)
    if (this.args.length === 1 && this.args[0].startsWith("( ")) {
      // Complex entity: output the full structure
      return this.args[0]
    }
    // Simple unknown entity
    return `${this.type}(${this.args.join(",")})`
  }
}
