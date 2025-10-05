import { expect, test } from "bun:test"
import { readFileSync, writeFileSync } from "node:fs"
import { parseRepository } from "../../../lib"

test("kicadoutput01 - parse and round-trip", () => {
  // Load the original STEP file
  const originalText = readFileSync(
    "tests/roundtrip/kicadoutput01/kicadoutput01.step.txt",
    "utf-8",
  )

  console.log("Parsing original file...")
  const repo1 = parseRepository(originalText)

  // Get entity statistics
  const entries1 = repo1.entries()
  console.log(`Parsed ${entries1.length} entities from original file`)

  // Count entity types
  const typeCounts1 = new Map<string, number>()
  for (const [, entity] of entries1) {
    const count = typeCounts1.get(entity.type) || 0
    typeCounts1.set(entity.type, count + 1)
  }

  // Verify no Unknown entities
  const unknownCount1 = typeCounts1.get("Unknown") || 0
  console.log(`Unknown entities in original: ${unknownCount1}`)
  expect(unknownCount1).toBe(0)

  // Verify we have all expected major entity types
  expect(typeCounts1.get("CARTESIAN_POINT")).toBeGreaterThan(0)
  expect(typeCounts1.get("DIRECTION")).toBeGreaterThan(0)
  expect(typeCounts1.get("ADVANCED_FACE")).toBeGreaterThan(0)
  expect(typeCounts1.get("MANIFOLD_SOLID_BREP")).toBeGreaterThan(0)
  expect(typeCounts1.get("PRODUCT")).toBeGreaterThan(0)

  // Serialize back to STEP format
  console.log("\nSerializing to STEP format...")
  const serialized = repo1.toPartFile({
    name: "KiCad electronic assembly",
    author: "Pcbnew",
    org: "Kicad",
  })

  // Save the serialized output for inspection
  writeFileSync(
    "tests/roundtrip/kicadoutput01/kicadoutput01-roundtrip.step.txt",
    serialized,
  )
  writeFileSync("debug-output/kicadoutput1.step", serialized)
  console.log("Saved round-trip output to kicadoutput01-roundtrip.step.txt")
  console.log("Saved round-trip output to debug-output/kicadoutput1.step")

  // Parse the serialized version
  console.log("\nParsing serialized file...")
  const repo2 = parseRepository(serialized)

  const entries2 = repo2.entries()
  console.log(`Parsed ${entries2.length} entities from serialized file`)

  // Count entity types in serialized version
  const typeCounts2 = new Map<string, number>()
  for (const [, entity] of entries2) {
    const count = typeCounts2.get(entity.type) || 0
    typeCounts2.set(entity.type, count + 1)
  }

  const unknownCount2 = typeCounts2.get("Unknown") || 0
  console.log(`Unknown entities in serialized: ${unknownCount2}`)

  // Verify entity counts match
  expect(entries2.length).toBe(entries1.length)
  expect(unknownCount2).toBe(0)

  // Verify entity type counts match
  console.log("\nComparing entity type counts:")
  for (const [type, count1] of typeCounts1.entries()) {
    const count2 = typeCounts2.get(type) || 0
    if (count1 !== count2) {
      console.log(`  ❌ ${type}: ${count1} -> ${count2}`)
    } else {
      console.log(`  ✅ ${type}: ${count1}`)
    }
    expect(count2).toBe(count1)
  }

  // Verify no new entity types appeared
  for (const [type, count2] of typeCounts2.entries()) {
    if (!typeCounts1.has(type)) {
      console.log(`  ⚠️  New type in serialized: ${type}: ${count2}`)
    }
  }

  console.log("\n✅ Round-trip test passed!")
  console.log(
    `Successfully parsed and re-serialized ${entries1.length} entities`,
  )
})
