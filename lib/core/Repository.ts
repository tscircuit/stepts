import type { Entity } from "./Entity"
import { type EntityId, eid } from "./EntityId"
import { Ref } from "./Ref"
import { stepStr } from "./stepFormat"

// Repository manages ids, storage, and emission
export class Repository {
  private map = new Map<EntityId, Entity>()
  private order: EntityId[] = [] // insertion/emit order
  private maxId = 0 // track max id to avoid Math.max(...order) stack overflow
  schema: "AP214" | "AP242" = "AP214"
  units = { length: "MM", angle: "RAD" as const, solidAngle: "SR" as const }

  set(id: EntityId, e: Entity) {
    if (!this.map.has(id)) {
      this.order.push(id)
      if (id > this.maxId) this.maxId = id
    }
    this.map.set(id, e)
  }

  add<T extends Entity>(e: T): Ref<T> {
    this.maxId++
    const id = eid(this.maxId)
    this.set(id, e)
    return new Ref<T>(id)
  }

  get(id: EntityId) {
    return this.map.get(id)
  }

  entries() {
    return this.order.map((id) => [id, this.map.get(id)!] as const)
  }

  // Emit a complete ISO-10303-21 file
  toPartFile(meta: { name: string; author?: string; org?: string }) {
    const now = new Date().toISOString().slice(0, 10).replace(/-/g, "-")
    const hdr = [
      "ISO-10303-21;",
      "HEADER;",
      `FILE_DESCRIPTION((${stepStr(meta.name)}),'2;1');`,
      `FILE_NAME(${stepStr(meta.name)},${stepStr(now)},(${stepStr(
        meta.author ?? "tscircuit",
      )}),(${stepStr(meta.org ?? "tscircuit")}),${stepStr("generator")},${stepStr("")},${stepStr("")});`,
      `FILE_SCHEMA(('${
        this.schema === "AP214"
          ? "AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }"
          : "AP242_MANAGED_MODEL_BASED_3D_ENGINEERING"
      }'));`,
      "ENDSEC;",
      "DATA;",
    ]
    const data = this.entries().map(([id, e]) => `#${id} = ${e.toStep(this)};`)
    const ftr = ["ENDSEC;", "END-ISO-10303-21;"]
    return [...hdr, ...data, ...ftr].join("\n")
  }
}
