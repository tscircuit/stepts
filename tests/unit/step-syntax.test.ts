import { expect, test } from "bun:test"
import {
  CartesianPoint,
  CartesianPoint2D,
  Direction,
  Direction2D,
  BSplineCurveWithKnots,
  fmtNum,
  parseRepository,
  splitArgs,
  tokenizeSTEP,
} from "../../lib"

test("STEP delimiters ignore strings, escaped quotes and comments", () => {
  const name = "sensor1e-10; it's /* #99=FAKE(); */ ENDSEC; DATA;"
  const source = `HEADER; FILE_DESCRIPTION(('DATA;'), '2;1'); ENDSEC;
DATA;
/* #88=FAKE(); ENDSEC; */
#1 = CARTESIAN_POINT('sensor1e-10; it''s /* #99=FAKE(); */ ENDSEC; DATA;',
  (1., /* commas, semicolons; and parentheses () */ 2., 3.)) /* gap */ ;
ENDSEC;`
  const rows = tokenizeSTEP(source)
  expect(rows).toHaveLength(1)
  expect(Number(rows[0].id)).toBe(1)
  const repo = parseRepository(source)
  expect((repo.get(rows[0].id) as CartesianPoint).name).toBe(name)
  const output = repo.toPartFile({ name })
  const reparsed = parseRepository(output)
  expect((reparsed.get(rows[0].id) as CartesianPoint).name).toBe(name)
})

test("complex entities and multiline strings accept whitespace before semicolons", () => {
  const source = `DATA;
#1 = ( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )
  ;
#2 = CARTESIAN_POINT('line one
line two', (0., 1.)) ;
ENDSEC;`
  const rows = tokenizeSTEP(source)
  expect(rows.map((row) => row.type)).toEqual(["Unknown", "CARTESIAN_POINT"])
  expect(rows[0].args).toEqual([
    "( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )",
  ])
  const repo = parseRepository(source)
  expect((repo.entries()[1][1] as CartesianPoint2D).name).toBe(
    "line one\nline two",
  )
  expect(splitArgs("'it''s, a string', (1., (2., 3.)), $")).toEqual([
    "'it''s, a string'",
    "(1., (2., 3.))",
    "$",
  ])
})

test.each([
  ["DATA; #1=X('unclosed); ENDSEC;", "Unterminated string"],
  ["DATA; /* unclosed", "Unterminated comment"],
  ["DATA; #1=X((1.,2.); ENDSEC;", "Unterminated parenthesis"],
  ["DATA; #1=X()); ENDSEC;", "Unexpected closing parenthesis"],
  ["DATA; #1=X()", "Missing closing semicolon"],
  ["DATA; #1=X();", "Unterminated DATA section"],
  [
    "HEADER; FILE_DESCRIPTION(('DATA;'), '2;1'); ENDSEC;",
    "Could not find DATA",
  ],
])("reject malformed STEP: %s", (source, message) => {
  expect(() => tokenizeSTEP(source)).toThrow(message)
  expect(() => parseRepository(source)).toThrow(message)
})

test("STEP reals use valid mantissas and exponents", () => {
  for (const [value, expected] of [
    [0, "0."],
    [-2, "-2."],
    [0.125, "0.125"],
    [1e-10, "1.E-10"],
    [-1e-10, "-1.E-10"],
    [1.25e-10, "1.25E-10"],
    [1e21, "1.E+21"],
  ] as const) {
    expect(fmtNum(value)).toBe(expected)
  }
})

test.each([NaN, Infinity, -Infinity])(
  "reject non-finite STEP real %s",
  (value) => {
    expect(() => fmtNum(value)).toThrow("STEP real must be finite")
  },
)

test("typed 2D geometry, spline logicals and integer multiplicities round-trip", () => {
  const source = `DATA;
#1=CARTESIAN_POINT('uv1',(0.,1.));
#2=CARTESIAN_POINT('uv2',(1.,2.));
#3=DIRECTION('uv direction',(0.,1.));
#4=CARTESIAN_POINT('xyz',(0.,1.,2.));
#5=DIRECTION('xyz direction',(0.,0.,1.));
#6=B_SPLINE_CURVE_WITH_KNOTS('',1,(#1,#2),.UNSPECIFIED.,.F.,.U.,(2,2),(0.,1.),.UNSPECIFIED.);
ENDSEC;`
  const repo = parseRepository(source)
  const entities = repo.entries().map(([, entity]) => entity)
  expect(entities[0]).toBeInstanceOf(CartesianPoint2D)
  expect(entities[0]).not.toBeInstanceOf(CartesianPoint)
  expect(entities[2]).toBeInstanceOf(Direction2D)
  expect(entities[2]).not.toBeInstanceOf(Direction)
  expect(entities[3]).toBeInstanceOf(CartesianPoint)
  expect(entities[4]).toBeInstanceOf(Direction)
  expect(entities[5]).toBeInstanceOf(BSplineCurveWithKnots)
  expect((entities[5] as BSplineCurveWithKnots).selfIntersect).toBeNull()
  const output = repo.toPartFile({ name: "geometry" })
  expect(tokenizeSTEP(output).map((row) => row.args)).toEqual(
    tokenizeSTEP(source).map((row) => row.args),
  )
  expect(output).toContain("CARTESIAN_POINT('uv1',(0.,1.))")
  expect(output).toContain("DIRECTION('uv direction',(0.,1.))")
  expect(output).toContain(".F.,.U.,(2,2),(0.,1.)")
  const roundTripped = parseRepository(output)
  expect(
    roundTripped.entries().map(([, entity]) => entity.toStep(roundTripped)),
  ).toEqual(entities.map((entity) => entity.toStep(repo)))
})

test("comments between slices preserve adjacent arguments and statements", () => {
  const source = `DATA; /* first */ /* second */
#1=/* before type */CARTESIAN_POINT(/* name */'µ,;''sensor',
(/* x */1./* after x */,/* y */2.,3.)); /* after statement */
#2=DIRECTION('',(0.,0.,1.)); /* before end */ENDSEC; /* trailing */`
  const repo = parseRepository(source)
  expect(repo.entries()).toHaveLength(2)
  const point = repo.get(repo.entries()[0][0]) as CartesianPoint
  expect([point.name, point.x, point.y, point.z]).toEqual([
    "µ,;'sensor",
    1,
    2,
    3,
  ])
  expect(splitArgs("/* only a comment */")).toEqual([])
})
