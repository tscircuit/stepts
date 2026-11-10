import { expect, test } from "bun:test"
import { parseRepository } from "../../lib"

// STEP allows optional name attributes to be omitted with "$". Several
// geometry/presentation entities used to throw "Expected string: $" when an
// exporter omitted the name instead of writing an empty quoted string.
const DOLLAR_NAME_STEP = `ISO-10303-21;
HEADER;
ENDSEC;
DATA;
#1 = CARTESIAN_POINT($,(1.,2.,3.));
#2 = DIRECTION($,(0.,0.,1.));
#3 = DIRECTION($,(1.,0.,0.));
#4 = AXIS2_PLACEMENT_3D($,#1,#2,#3);
#5 = PLANE($,#4);
#6 = COLOUR_RGB($,0.5,0.25,0.75);
#7 = FILL_AREA_STYLE_COLOUR($,#6);
#8 = CARTESIAN_POINT($,(4.,5.));
#9 = DIRECTION($,(1.,0.));
#10 = EDGE_LOOP($,(#11));
#11 = ORIENTED_EDGE($,*,*,#12,.T.);
#12 = EDGE_CURVE($,#13,#13,#14,.T.);
#13 = VERTEX_POINT($,#1);
#14 = CIRCLE($,#4,1.5);
#15 = FACE_OUTER_BOUND($,#10,.T.);
ENDSEC;
END-ISO-10303-21;
`

test("parses entities with $ (omitted) name attributes", () => {
  const repo = parseRepository(DOLLAR_NAME_STEP)
  const entries = repo.entries()
  expect(entries.length).toBe(15)
  for (const [, entity] of entries) {
    expect((entity as any).name).toBe("")
  }
})

test("entities with $ names serialize and reparse (roundtrip)", () => {
  const repo = parseRepository(DOLLAR_NAME_STEP)
  const serialized = repo.toPartFile({ name: "dollar-names" })
  expect(serialized).toContain("CARTESIAN_POINT('',(1.,2.,3.))")
  const reparsed = parseRepository(serialized)
  expect(reparsed.entries().length).toBe(15)
})

test("quoted names on the same entities still parse", () => {
  const named = DOLLAR_NAME_STEP.replaceAll("($,", "('named',")
  const repo = parseRepository(named)
  const entries = repo.entries()
  for (const [, entity] of entries) {
    expect((entity as any).name).toBe("named")
  }
})
