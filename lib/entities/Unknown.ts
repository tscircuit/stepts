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
      // Complex entity: output multi-line format for better compatibility
      const content = this.args[0].slice(2, -2).trim() // Remove "( " and " )"
      // Consume complete comments and strings, including doubled apostrophes,
      // before replacing whitespace between entity names with line breaks.
      const formatted = content.replace(
        /\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|\s+(?=[A-Z_])/g,
        (part) =>
          part.startsWith("/*") || part.startsWith("'") ? part : "\n",
      )
      return `(\n${formatted}\n)`
    }
    // Simple unknown entity
    return `${this.type}(${this.args.join(",")})`
  }
}
