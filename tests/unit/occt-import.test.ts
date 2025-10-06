import { readFileSync } from "node:fs"
import { expect, test } from "bun:test"
import { importStepWithOcct } from "../utils/occt/importer"

const fixtureUrl = new URL("../fixtures/simple-box.step", import.meta.url)

// Loading occt-import-js can take a moment on first run, so give it extra time.
test("occt-import-js can import the simple STEP box", async () => {
  const stepData = readFileSync(fixtureUrl)
  const result = await importStepWithOcct(stepData)

  expect(result.success).toBe(true)
  expect(result.meshes.length).toBeGreaterThan(0)
  const [firstMesh] = result.meshes
  expect(firstMesh.attributes.position.array.length).toBeGreaterThan(0)
  expect(firstMesh.index.array.length).toBeGreaterThan(0)
}, 20000)
