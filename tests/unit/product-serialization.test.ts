import { expect, test } from "bun:test"
import {
  ApplicationContext,
  Product,
  ProductContext,
  ProductDefinitionFormation,
  Repository,
  parseRepository,
} from "../../lib"

test("serializes PRODUCT in STEP order without changing constructor arguments", () => {
  const repo = new Repository()
  const application = repo.add(new ApplicationContext("mechanical design"))
  const context = repo.add(new ProductContext("", application, "mechanical"))
  const product = new Product("Display name", "SKU-42", "description", [
    context,
  ])
  const productRef = repo.add(product)
  const formationRef = repo.add(
    new ProductDefinitionFormation("1", "", productRef),
  )

  expect(product.toStep()).toBe(
    "PRODUCT('SKU-42','Display name','description',(#2))",
  )
  const output = repo.toPartFile({ name: "product-fields" })
  expect(output).toContain(
    "#3 = PRODUCT('SKU-42','Display name','description',(#2));",
  )
  const parsed = parseRepository(output)
  const parsedProduct = productRef.resolve(parsed)
  expect(parsedProduct.id).toBe("SKU-42")
  expect(parsedProduct.name).toBe("Display name")
  expect(parsedProduct.description).toBe("description")
  expect(parsedProduct.frameOfReference[0].resolve(parsed)).toBe(
    context.resolve(parsed),
  )
  expect(formationRef.resolve(parsed).ofProduct.resolve(parsed)).toBe(
    parsedProduct,
  )

  // Literal wire expectations keep symmetric parse/serialize bugs visible.
  for (const [name, id, description, expected] of [
    [
      "O'Brien's part",
      "SKU'42",
      "Rev 'A'",
      "PRODUCT('SKU''42','O''Brien''s part','Rev ''A''',(#2))",
    ],
    [
      "simple-box",
      "simple-box",
      "",
      "PRODUCT('simple-box','simple-box','',(#2))",
    ],
    ["", "SKU-42", "", "PRODUCT('SKU-42','','',(#2))"],
    ["Display name", "", "", "PRODUCT('','Display name','',(#2))"],
  ]) {
    expect(new Product(name, id, description, [context]).toStep()).toBe(
      expected,
    )
  }
})
