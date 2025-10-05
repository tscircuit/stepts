import type { Entity } from "../core/Entity"
import type { ParseContext } from "../core/ParseContext"

// Registry of known entity class parsers
type Parser = (args: string[], ctx: ParseContext) => Entity

const registry = new Map<string, Parser>()

export function register(type: string, parser: Parser) {
  registry.set(type, parser)
}

export function getParser(type: string): Parser | undefined {
  return registry.get(type)
}
