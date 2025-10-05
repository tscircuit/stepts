import type { Repository } from "./Repository"
import type { ParseContext } from "./ParseContext"

// Every entity supports parse + toStep
export abstract class Entity {
  abstract readonly type: string // e.g. "CARTESIAN_POINT"
  abstract toStep(repo: Repository): string

  // Generic parse contract: implement per subclass
  static parse(_a: string[], _ctx: ParseContext): Entity {
    throw new Error("not implemented")
  }
}
