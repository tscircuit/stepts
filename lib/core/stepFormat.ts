// STEP text helpers
export const stepStr = (s: string) => `'${s.replace(/'/g, "''")}'`

export const fmtNum = (n: number): string => {
  if (!Number.isFinite(n)) throw new Error("STEP real must be finite")
  const [mantissa, exponent] = String(n).split("e")
  const real = mantissa.includes(".") ? mantissa : `${mantissa}.`
  return exponent === undefined ? real : `${real}E${exponent}`
}

export const fmtLogical = (value: boolean | null): string => {
  if (value === null) return ".U."
  return value ? ".T." : ".F."
}
