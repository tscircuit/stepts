import { expect, test } from "bun:test"
import { readFileSync, existsSync, rmSync } from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import "../fixtures/step-snapshot"

const fixtureUrl = new URL("../fixtures/simple-box.step", import.meta.url)

test("visual snapshot: mismatch produces diff artifacts", async () => {
  // Ensure baseline exists (create it if missing)
  const __filename = fileURLToPath(import.meta.url)
  const snapshotDir = path.join(path.dirname(__filename), "__snapshots__")
  const baseName = "simple-box"
  const snapPath = path.join(snapshotDir, `${baseName}.snap.png`)
  const diffPath = path.join(snapshotDir, `${baseName}.diff.png`)

  // Clean previous mismatch artifacts for a deterministic test
  for (const p of [diffPath]) {
    if (existsSync(p)) rmSync(p)
  }

  const original = readFileSync(fixtureUrl)
  if (!existsSync(snapPath)) {
    await expect(original).toMatchStepSnapshot(import.meta.path, baseName)
  }

  // Modify STEP content slightly to force a visual change (change 'Orange' G channel 0.6 -> 0.8)
  const modifiedText = readFileSync(fixtureUrl, "utf-8").replace(
    "COLOUR_RGB('Orange',1.,0.6,0.);",
    "COLOUR_RGB('Orange',1.,0.8,0.);",
  )
  let failed = false
  // Ensure we do not update snapshots in this negative test
  process.env.BUN_UPDATE_SNAPSHOTS = ""
  try {
    await expect(Buffer.from(modifiedText)).toMatchStepSnapshot(
      import.meta.path,
      baseName,
    )
  } catch {
    failed = true
  }

  // Expect the matcher to fail and write diff artifact
  expect(failed).toBe(true)
  expect(existsSync(diffPath)).toBe(true)
}, 30000)
