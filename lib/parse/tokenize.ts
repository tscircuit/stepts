import { type EntityId, eid } from "../core/EntityId"

// Split: "#12 = ENTITY_NAME(arg1,arg2,...);"
export interface RawEntityRow {
  id: EntityId
  type: string
  args: string[]
}

export function tokenizeSTEP(data: string): RawEntityRow[] {
  const entities: RawEntityRow[] = []

  // Remove header and footer, get just the DATA section
  const dataStart = data.indexOf("DATA;")
  const dataEnd = data.indexOf("ENDSEC;", dataStart)
  if (dataStart === -1 || dataEnd === -1) {
    throw new Error("Could not find DATA section in STEP file")
  }

  const dataSection = data.substring(dataStart + 5, dataEnd)

  // Split into entity strings by finding #NUM = pattern
  // We need to handle multi-line entities and complex multi-inheritance entities
  const entityPattern = /#(\d+)\s*=\s*/g
  let match: RegExpExecArray | null
  const entityStarts: { index: number; id: number }[] = []

  // Find all entity starts
  while ((match = entityPattern.exec(dataSection)) !== null) {
    entityStarts.push({
      index: match.index,
      id: parseInt(match[1], 10),
    })
  }

  // Extract each entity by finding the closing semicolon
  for (let i = 0; i < entityStarts.length; i++) {
    const start = entityStarts[i]
    const nextStart =
      i + 1 < entityStarts.length
        ? entityStarts[i + 1].index
        : dataSection.length

    // Find the entity text between this start and next start
    const entityText = dataSection.substring(start.index, nextStart)

    // Find the first semicolon - that's the end of this entity
    const semiIndex = entityText.indexOf(";")
    if (semiIndex === -1) {
      throw new Error(
        `Could not find closing semicolon for entity #${start.id}`,
      )
    }

    const fullEntity = entityText.substring(0, semiIndex + 1)

    // Extract the type and arguments
    // Pattern: #NUM = TYPE(args); or #NUM = ( TYPE1(...) TYPE2(...) );
    // First check if it's a complex multi-inheritance entity
    if (fullEntity.match(/#\d+\s*=\s*\(/)) {
      // Complex entity: treat the whole thing as Unknown for now
      const complexMatch = fullEntity.match(/#\d+\s*=\s*\(([\s\S]*)\);/)
      if (!complexMatch) {
        throw new Error(
          `Could not parse complex entity: ${fullEntity.substring(0, 100)}`,
        )
      }
      // Store as type "Unknown" with the complex structure in args[0]
      entities.push({
        id: eid(start.id),
        type: "Unknown",
        args: [`( ${complexMatch[1].trim()} )`],
      })
    } else {
      // Simple entity
      const match = fullEntity.match(/#\d+\s*=\s*([A-Z0-9_]+)\s*\(([\s\S]*)\);/)
      if (!match) {
        throw new Error(
          `Could not parse entity: ${fullEntity.substring(0, 100)}`,
        )
      }

      const type = match[1].trim()
      const argsBody = match[2].trim()

      const args = splitArgs(argsBody)
      entities.push({ id: eid(start.id), type, args })
    }
  }

  return entities
}

// Splits top-level args respecting parentheses and quotes
export function splitArgs(s: string): string[] {
  const out: string[] = []
  let buf = ""
  let depth = 0
  let inStr = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === "'" && s[i - 1] !== "\\") inStr = !inStr
    if (!inStr) {
      if (c === "(") depth++
      if (c === ")") depth--
      if (c === "," && depth === 0) {
        out.push(buf.trim())
        buf = ""
        continue
      }
    }
    buf += c
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}
