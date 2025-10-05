import type { Entity } from "./Entity"
import type { Ref } from "./Ref"
import type { Repository } from "./Repository"

// Parse context: access to repo + token decoders
export interface ParseContext {
  repo: Repository
  parseRef<T extends Entity>(tok: string): Ref<T>
  parseNumber(tok: string): number
  parseString(tok: string): string
}
