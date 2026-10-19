import type { Entity } from "../core/Entity"
import { eid } from "../core/EntityId"
import type { ParseContext } from "../core/ParseContext"
import { Ref } from "../core/Ref"
import { Repository } from "../core/Repository"
import { Unknown } from "../entities/Unknown"
import { getParser } from "./registry"
import { iterateSTEP } from "./tokenize"

// Build a repo from raw STEP data
export function parseRepository(data: string): Repository {
  const repo = new Repository()
  const ctx: ParseContext = {
    repo,
    parseRef<T extends Entity>(_tok: string) {
      const n = +_tok.replace("#", "").trim()
      return new Ref<T>(eid(n))
    },
    parseNumber(tok: string) {
      // handle 1., -3.5, 2.0E-1
      return Number(tok)
    },
    parseString(tok: string) {
      if (!tok.startsWith("'") || !tok.endsWith("'"))
        throw new Error(`Expected string: ${tok}`)
      return tok.slice(1, -1).replaceAll("''", "'")
    },
  }

  // first pass: instantiate classes with raw args; put into repo
  for (const row of iterateSTEP(data)) {
    const parser = getParser(row.type)
    if (!parser) {
      // store Unknown as a passthrough for round-trip
      repo.set(row.id, new Unknown(row.type, row.args))
      continue
    }
    const entity = parser(row.args, ctx)
    repo.set(row.id, entity)
  }
  return repo
}
