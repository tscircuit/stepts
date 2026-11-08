import { readFileSync } from "node:fs"
import { expect, test } from "bun:test"
import { Product, ProductContext, eid, parseRepository } from "../../lib"

test("parses PRODUCT identifiers before display names", () => {
  // This checked-in Autodesk export has distinct id and name fields.
  const source = readFileSync(
    new URL("../../test-assets/MachineContactMedium.step", import.meta.url),
    "utf8",
  )
  const repo = parseRepository(source)
  const product = repo.get(eid(1658)) as Product
  expect(product).toBeInstanceOf(Product)
  expect(product.id).toBe("MediumMachineContact")
  expect(product.name).toBe("MediumMachineContact v1")
  expect(product.description).toBe("")
  expect(product.frameOfReference.map(String)).toEqual(["#1657"])
  expect(product.frameOfReference[0].resolve(repo)).toBeInstanceOf(
    ProductContext,
  )
  expect(product.toStep()).toBe(
    "PRODUCT('MediumMachineContact','MediumMachineContact v1','',(#1657))",
  )

  const reparsed = parseRepository(repo.toPartFile({ name: "product-fields" }))
  const roundTripped = reparsed.get(eid(1658)) as Product
  expect(roundTripped.id).toBe("MediumMachineContact")
  expect(roundTripped.name).toBe("MediumMachineContact v1")
  expect(roundTripped.frameOfReference[0].resolve(reparsed)).toBeInstanceOf(
    ProductContext,
  )

  // Preserve the parser's existing support for omitted string fields.
  const omitted = parseRepository(`DATA;
#1=PRODUCT($,'Display name',$,());
#2=PRODUCT('SKU-42',$,$,());
ENDSEC;`)
  expect((omitted.get(eid(1)) as Product).id).toBe("")
  expect((omitted.get(eid(1)) as Product).name).toBe("Display name")
  expect((omitted.get(eid(2)) as Product).id).toBe("SKU-42")
  expect((omitted.get(eid(2)) as Product).name).toBe("")
})
