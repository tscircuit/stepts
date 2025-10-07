import { readFileSync } from "node:fs"
import { expect, test } from "bun:test"
import "../fixtures/png-matcher"
import "../fixtures/step-snapshot"

test("simple box STEP file renders to PNG snapshot", async () => {
  const fixtureUrl = new URL("../fixtures/simple-box.step", import.meta.url)
  const stepContent = readFileSync(fixtureUrl)
  
  await expect(stepContent).toMatchStepSnapshot(import.meta.path, "simple-box")
}, 30000)

test("simple box with custom options", async () => {
  const fixtureUrl = new URL("../fixtures/simple-box.step", import.meta.url)
  const stepContent = readFileSync(fixtureUrl)
  
  await expect(stepContent).toMatchStepSnapshot(
    import.meta.path, 
    "simple-box-custom",
    {
      width: 400,
      height: 300,
      background: [0.9, 0.9, 0.9, 1.0]
    }
  )
}, 30000)
