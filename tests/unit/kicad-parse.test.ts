import { expect, test } from "bun:test"
import { readFileSync } from "fs"
import { parseRepository } from "../../lib"

test("parse KiCad STEP file", async () => {
  const stepText = readFileSync(
    "tests/roundtrip/kicadoutput01/kicadoutput01.step.txt",
    "utf-8",
  )

  const repo = parseRepository(stepText)

  // Check that we parsed entities
  const entries = repo.entries()
  console.log(`Parsed ${entries.length} entities`)

  // Count entity types
  const typeCounts = new Map<string, number>()
  for (const [, entity] of entries) {
    const count = typeCounts.get(entity.type) || 0
    typeCounts.set(entity.type, count + 1)
  }

  // Log entity type distribution
  console.log("\nEntity type distribution:")
  const sortedTypes = Array.from(typeCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  )
  for (const [type, count] of sortedTypes) {
    console.log(`  ${type}: ${count}`)
  }

  // Count Unknown entities
  const unknownCount = typeCounts.get("Unknown") || 0
  console.log(`\nUnknown entities: ${unknownCount}`)

  expect(entries.length).toBeGreaterThan(0)

  // Visual snapshot of the full KiCad STEP scene
  await expect(stepText).toMatchStepSnapshot(import.meta.path, "kicadoutput01")
}, 60000)
