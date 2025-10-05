import type { Entity } from "./Entity"
import type { EntityId } from "./EntityId"
import { eid } from "./EntityId"
import type { Ref } from "./Ref"
import { stepStr } from "./stepFormat"

// Repository manages ids, storage, and emission
export class Repository {
  private map = new Map<EntityId, Entity>()
  private order: EntityId[] = [] // insertion/emit order
  schema: "AP214" | "AP242" = "AP214"
  units = { length: "MM", angle: "RAD" as "RAD", solidAngle: "SR" as "SR" }

  set(id: EntityId, e: Entity) {
    if (!this.map.has(id)) this.order.push(id)
    this.map.set(id, e)
  }

  add(e: Entity): Ref<typeof e> {
    const id = eid(this.order.length ? Math.max(...this.order) + 1 : 1)
    this.set(id, e)
    return new (require("./Ref").Ref)<typeof e>(id)
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
        meta.author ?? "tscircuit"
      )}),(${stepStr(meta.org ?? "tscircuit")}),${stepStr("generator")},${stepStr("")},${stepStr("")});`,
      `FILE_SCHEMA(('${
        this.schema === "AP214"
          ? "AUTOMOTIVE_DESIGN"
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
