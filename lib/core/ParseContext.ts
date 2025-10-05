import type { Entity } from "./Entity"
import type { Repository } from "./Repository"
import type { Ref } from "./Ref"

// Parse context: access to repo + token decoders
export interface ParseContext {
  repo: Repository
  parseRef<T extends Entity>(tok: string): Ref<T>
  parseNumber(tok: string): number
  parseString(tok: string): string
}
