import { expect, test } from "bun:test"
import { parseRepository } from "../../../lib"
import { importStepWithOcct } from "../../utils/occt/importer"

test("SolidWorks-format STEP parses and serializes without preprocessing", async () => {
  const source = await Bun.file(
    new URL("./solidworks.step", import.meta.url),
  ).text()
  const output = parseRepository(source).toPartFile({
    name: "SolidWorks fixture",
  })
  const before = await importStepWithOcct(source)
  const after = await importStepWithOcct(output)
  expect(before.meshes).toHaveLength(1)
  expect(after.meshes).toHaveLength(1)
  expect(after.meshes[0].attributes.position.array).toEqual(
    before.meshes[0].attributes.position.array,
  )
  expect(after.meshes[0].index.array).toEqual(before.meshes[0].index.array)
  await expect(output).toMatchStepSnapshot(
    import.meta.path,
    "solidworks-roundtrip",
  )
})
