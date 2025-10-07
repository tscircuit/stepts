import { readFileSync } from "node:fs"
import { expect, test } from "bun:test"
import "../fixtures/step-snapshot"

const fixtureUrl = new URL("../fixtures/simple-box.step", import.meta.url)

test("visual snapshot: simple-box STEP renders consistently", async () => {
  const stepData = readFileSync(fixtureUrl)
  await expect(stepData).toMatchStepSnapshot(import.meta.path, "simple-box")
}, 20000)
