import { type EntityId, eid } from "../core/EntityId"

// Split: "#12 = ENTITY_NAME(arg1,arg2,...);"
export interface RawEntityRow {
  id: EntityId
  type: string
  args: string[]
}

export function tokenizeSTEP(data: string): RawEntityRow[] {
  // naive but effective: one entity per line
  const lines = data.split(/\r?\n/).filter((l) => /^\s*#\d+\s*=/.test(l))
  return lines.map((line) => {
    const m = line.match(/^#(\d+)\s*=\s*([A-Z0-9_]+)\s*\((.*)\);/)
    if (!m) throw new Error(`Bad entity line: ${line}`)
    const id = eid(parseInt(m[1], 10))
    const type = m[2]
    const body = m[3].trim()

    const args = splitArgs(body)
    return { id, type, args }
  })
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
