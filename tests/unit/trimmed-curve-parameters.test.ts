import { expect, test } from "bun:test"
import { eid, parseRepository, TrimmedCurve } from "../../lib"

test("parses and serializes parameter-valued trimmed curves", () => {
  const source = `DATA;
#1=CARTESIAN_POINT('',(0.,0.,0.));
#2=DIRECTION('',(1.,0.,0.));
#3=VECTOR('',#2,1.);
#4=LINE('',#1,#3);
#5=TRIMMED_CURVE('trimmed',#4,(0.),(6.283185307179586),.T.,.PARAMETER.);
ENDSEC;`
  const repo = parseRepository(source)
  const curve = repo.get(eid(5)) as TrimmedCurve

  expect(curve).toBeInstanceOf(TrimmedCurve)
  expect(curve.trim1).toEqual([0])
  expect(curve.trim2).toEqual([6.283185307179586])

  const output = repo.toPartFile({ name: "trimmed" })
  expect(output).toContain(
    "TRIMMED_CURVE('trimmed',#4,(0.),(6.283185307179586),.T.,.PARAMETER.)",
  )
  expect((parseRepository(output).get(eid(5)) as TrimmedCurve).trim2).toEqual([
    6.283185307179586,
  ])
})
