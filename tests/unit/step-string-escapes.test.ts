import { expect, test } from "bun:test"
import { parseRepository } from "../../lib"

const parseProductId = (idArg: string) => {
  const step = `ISO-10303-21;
HEADER;
ENDSEC;
DATA;
#1 = PRODUCT('P1', '${idArg}', '', (#2));
#2 = PRODUCT_CONTEXT('', #3, 'mechanical');
#3 = APPLICATION_CONTEXT('automotive_design');
ENDSEC;
END-ISO-10303-21;`
  const repo = parseRepository(step)
  for (const [, entity] of repo.entries()) {
    if (entity.type === "PRODUCT") return (entity as any).id as string
  }
  throw new Error("PRODUCT not parsed")
}

// ISO 10303-21 §6.4.4 encodes non-ASCII string content as \X2\...\X0\
// (UTF-16), \X4\...\X0\ (UTF-32) or \X\hh (8-bit). Real exporters (KiCad,
// FreeCAD, SolidWorks) emit these for names like µ, °, Ø. The parser used to
// keep the raw escape text, silently corrupting every affected attribute.

test("decodes \\X2\\ UTF-16 escape blocks", () => {
  expect(parseProductId("\\X2\\00B5\\X0\\Foo")).toBe("µFoo")
  expect(parseProductId("\\X2\\00D8002C\\X0\\Hole")).toBe("Ø,Hole")
})

test("decodes \\X4\\ UTF-32 escape blocks", () => {
  expect(parseProductId("\\X4\\0001F600\\X0\\Face")).toBe("😀Face")
})

test("decodes \\X\\ 8-bit escapes", () => {
  expect(parseProductId("\\X\\B0")).toBe("°")
})

test("existing string handling is unchanged", () => {
  expect(parseProductId("it''s")).toBe("it's")
  expect(parseProductId("plain-name_01")).toBe("plain-name_01")
})
