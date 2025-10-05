import type { Entity } from "./Entity"
import type { EntityId } from "./EntityId"
import type { Repository } from "./Repository"

// A typed reference to another entity (by #id) with lazy resolution.
export class Ref<T extends Entity> {
  constructor(public id: EntityId) {}

  resolve(repo: Repository): T {
    const e = repo.get(this.id)
    if (!e) throw new Error(`Unresolved #${this.id}`)
    return e as T
  }

  toString() {
    return `#${this.id}`
  }
}
