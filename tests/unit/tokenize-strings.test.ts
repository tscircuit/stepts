import { expect, test } from "bun:test"
import { CartesianPoint, eid, parseRepository } from "../../lib"
import {
  findStepEntityTerminator,
  splitArgs,
  tokenizeSTEP,
} from "../../lib/parse/tokenize"

const wrapData = (data: string) => `ISO-10303-21;
HEADER;
ENDSEC;
DATA;
${data}
ENDSEC;
END-ISO-10303-21;
`

test("does not treat a semicolon inside a STEP string as the entity terminator", () => {
  const rows = tokenizeSTEP(wrapData("#1=PRODUCT('Board; Rev A','desc',$,$);"))

  expect(rows).toHaveLength(1)
  expect(rows[0]).toMatchObject({
    type: "PRODUCT",
    args: ["'Board; Rev A'", "'desc'", "$", "$"],
  })
})

test("keeps doubled apostrophes inside a STEP string as one argument", () => {
  expect(splitArgs("'Seve''s origin',(0.,0.,0.)")).toEqual([
    "'Seve''s origin'",
    "(0.,0.,0.)",
  ])

  const rows = tokenizeSTEP(
    wrapData("#2=CARTESIAN_POINT('Seve''s origin',(0.,0.,0.));"),
  )
  expect(rows[0]?.args).toEqual(["'Seve''s origin'", "(0.,0.,0.)"])
})

test("ignores semicolons inside STEP comments when finding the entity terminator", () => {
  expect(
    findStepEntityTerminator("#1=PRODUCT('box', /* rev; 2 */ 'desc',$,$);"),
  ).toBe("#1=PRODUCT('box', /* rev; 2 */ 'desc',$,$);".length - 1)

  const rows = tokenizeSTEP(
    wrapData("#1=PRODUCT('box', /* rev; 2 */ 'desc',$,$);"),
  )
  expect(rows[0]?.args).toEqual(["'box'", "'desc'", "$", "$"])
})

test("parseRepository round-trips string names that contain semicolons and apostrophes", () => {
  const repo = parseRepository(
    wrapData(`#1=CARTESIAN_POINT('Board; Rev A',(1.,2.,3.));
#2=CARTESIAN_POINT('Seve''s origin',(0.,0.,0.));`),
  )

  const board = repo.get(eid(1)) as CartesianPoint
  const origin = repo.get(eid(2)) as CartesianPoint

  expect(board).toBeInstanceOf(CartesianPoint)
  expect(board.name).toBe("Board; Rev A")
  expect(board.x).toBe(1)
  expect(origin.name).toBe("Seve's origin")
  expect(origin.toStep()).toContain("'Seve''s origin'")
})
