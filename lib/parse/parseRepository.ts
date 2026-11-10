import type { Entity } from "../core/Entity"
import { eid } from "../core/EntityId"
import type { ParseContext } from "../core/ParseContext"
import { Ref } from "../core/Ref"
import { Repository } from "../core/Repository"
import { Unknown } from "../entities/Unknown"
import { getParser } from "./registry"
import { iterateSTEP } from "./tokenize"

// Build a repo from raw STEP data
// ISO 10303-21 §6.4.4 string escapes: \X2\..\X0\ groups hold UTF-16
// code units, \X4\..\X0\ groups hold UTF-32 code points, and \X\hh is one
// 8-bit character.
function decodeStepEscapes(value: string): string {
  return value
    .replace(/\\X2\\([0-9A-Fa-f]+)\\X0\\/g, (_, hex: string) =>
      (hex.match(/.{1,4}/g) ?? [])
        .map((unit) => String.fromCodePoint(Number.parseInt(unit, 16)))
        .join(""),
    )
    .replace(/\\X4\\([0-9A-Fa-f]+)\\X0\\/g, (_, hex: string) =>
      (hex.match(/.{1,8}/g) ?? [])
        .map((unit) => String.fromCodePoint(Number.parseInt(unit, 16)))
        .join(""),
    )
    .replace(/\\X\\([0-9A-Fa-f]{2})/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
}

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
      return decodeStepEscapes(tok.slice(1, -1).replaceAll("''", "'"))
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
