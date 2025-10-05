// STEP text helpers
export const stepStr = (s: string) => `'${s.replace(/'/g, "''")}'`

export const fmtNum = (n: number) => (Number.isInteger(n) ? `${n}.` : `${n}`)
