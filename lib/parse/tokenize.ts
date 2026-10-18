import { type EntityId, eid } from "../core/EntityId"

export interface RawEntityRow {
  id: EntityId
  type: string
  args: string[]
}

export function tokenizeSTEP(data: string): RawEntityRow[] {
  const entities: RawEntityRow[] = []
  let inData = false
  let foundData = false

  for (const statement of splitTopLevel(data, ";")) {
    const open = statement.indexOf("(")
    const keyword = (open < 0 ? statement : statement.slice(0, open)).trim()
    if (keyword === "DATA") {
      inData = true
      foundData = true
      continue
    }
    if (statement === "ENDSEC") {
      inData = false
      continue
    }
    if (!inData) continue

    const equals = statement.indexOf("=")
    const reference = statement.slice(0, equals).trim()
    if (equals < 0 || !/^#\d+$/.test(reference)) {
      throw new Error(`Invalid STEP entity reference: ${reference}`)
    }
    const id = eid(Number(reference.slice(1)))
    const body = statement.slice(equals + 1).trim()
    const argsStart = body.indexOf("(")
    if (argsStart < 0 || !body.endsWith(")")) {
      throw new Error(`Invalid STEP entity body for ${reference}`)
    }
    const argsBody = body.slice(argsStart + 1, -1).trim()
    if (argsStart === 0) {
      entities.push({ id, type: "Unknown", args: [`( ${argsBody} )`] })
    } else {
      const type = body.slice(0, argsStart).trim()
      if (!/^[A-Z][A-Z0-9_]*$/.test(type)) {
        throw new Error(`Invalid STEP entity type: ${type}`)
      }
      entities.push({ id, type, args: splitArgs(argsBody) })
    }
  }

  if (!foundData) throw new Error("Could not find DATA section in STEP file")
  if (inData) throw new Error("Unterminated DATA section in STEP file")
  return entities
}

export function splitArgs(source: string): string[] {
  return splitTopLevel(source, ",")
}

/** Split STEP syntax only outside strings, comments and nested lists. */
function splitTopLevel(source: string, delimiter: ";" | ","): string[] {
  const values: string[] = []
  let buffer = ""
  let depth = 0
  let inString = false
  let inComment = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    const next = source[i + 1]
    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false
        i++
      }
      continue
    }
    if (inString) {
      buffer += char
      if (char === "'") {
        if (next === "'") {
          buffer += next
          i++
        } else inString = false
      }
      continue
    }
    if (char === "/" && next === "*") {
      inComment = true
      buffer += " "
      i++
      continue
    }
    if (char === "'") inString = true
    if (char === "(") depth++
    if (char === ")") {
      depth--
      if (depth < 0) throw new Error("Unexpected closing parenthesis in STEP")
    }
    if (char === delimiter && depth === 0) {
      values.push(buffer.trim())
      buffer = ""
    } else buffer += char
  }

  if (inString) throw new Error("Unterminated string in STEP")
  if (inComment) throw new Error("Unterminated comment in STEP")
  if (depth !== 0) throw new Error("Unterminated parenthesis in STEP")
  if (buffer.trim()) {
    if (delimiter === ";") throw new Error("Missing closing semicolon in STEP")
    values.push(buffer.trim())
  }
  return values
}
