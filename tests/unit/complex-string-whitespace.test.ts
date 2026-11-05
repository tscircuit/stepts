import { test } from "bun:test"
import assert from "node:assert/strict"
import { Unknown } from "../../lib/entities/Unknown"
import { parseRepository, tokenizeSTEP } from "../../lib/parse"

test("complex entity formatting preserves quoted whitespace", () => {
  const strings = [
    ["'Board Rev A'", "'3D Context'"],
    ["'Board  \tRev A'", "'type'"],
    ["'Board ''Rev A'''", "'type'"],
    ["'Board ENDSEC; #99=FAKE(); A'", "'C /* D */'"],
    ["'Board\nRev\nA'", "'type'"],
    ["'board rev a'", "'type'"],
    ["''", "''"],
    ["'A'' B'", "'C D'"],
    ["'Line\r\n    Rev'", "'Context\r\n\tTYPE'"],
    ["'  Board Rev A  '", "'type'"],
  ]

  for (const [identifier, context] of strings) {
    for (const separator of [" ", "  \t", "\n"]) {
      const components = [
        "GEOMETRIC_REPRESENTATION_CONTEXT(3)",
        `REPRESENTATION_CONTEXT(${identifier},${context})`,
      ]
      const source = `DATA; #1=( ${components.join(separator)} );
#2=CUSTOM_CONTEXT('Next Board',(#1),.U.); ENDSEC;`
      const repo = parseRepository(source)
      const expected = `(\n${components.join("\n")}\n)`
      const entity = repo.entries()[0][1]
      assert.equal(entity.toStep(repo), expected)

      const output = repo.toPartFile({ name: "complex strings" })
      const rows = tokenizeSTEP(output)
      assert.deepEqual(
        rows.map((row) => [Number(row.id), row.type]),
        [[1, "Unknown"], [2, "CUSTOM_CONTEXT"]],
      )
      assert.deepEqual(rows[1].args, ["'Next Board'", "(#1)", ".U."])
      const roundTripped = parseRepository(output)
      assert.equal(roundTripped.entries()[0][1].toStep(roundTripped), expected)
    }
  }

  for (const [body, expected] of [
    [
      "( LENGTH_UNIT()   NAMED_UNIT(*)\tSI_UNIT(.MILLI.,.METRE.) )",
      "(\nLENGTH_UNIT()\nNAMED_UNIT(*)\nSI_UNIT(.MILLI.,.METRE.)\n)",
    ],
    ["( A('')B((#2,3.),.U.) )", "(\nA('')B((#2,3.),.U.)\n)"],
  ]) {
    const repo = parseRepository(`DATA; #1=${body}; ENDSEC;`)
    assert.equal(repo.entries()[0][1].toStep(repo), expected)
  }

  // Unknown also supports direct construction, before parsing removes comments.
  for (const [body, expected] of [
    [
      "( A(/* ' */ 'Board Rev A') B() )",
      "(\nA(/* ' */ 'Board Rev A')\nB()\n)",
    ],
    [
      "( A('First Part',/* ' */'Second Part') B() )",
      "(\nA('First Part',/* ' */'Second Part')\nB()\n)",
    ],
    [
      "( A(/* '' ' */ 'Board ''Rev A''') B() )",
      "(\nA(/* '' ' */ 'Board ''Rev A''')\nB()\n)",
    ],
    [
      "( A(/* ' comment\nA B */ 'Board Rev A') B() )",
      "(\nA(/* ' comment\nA B */ 'Board Rev A')\nB()\n)",
    ],
    [
      "( A('/* '' marker */ Board Rev A') B() )",
      "(\nA('/* '' marker */ Board Rev A')\nB()\n)",
    ],
    ["( A('Board Rev A') B() )", "(\nA('Board Rev A')\nB()\n)"],
    [
      "( A(/* Note */ 'Board Rev A') B() )",
      "(\nA(/* Note */ 'Board Rev A')\nB()\n)",
    ],
    [
      "( A('Board Rev A') /* ' */ B() )",
      "(\nA('Board Rev A') /* ' */\nB()\n)",
    ],
  ]) {
    assert.equal(new Unknown("", [body]).toStep(), expected)
  }
})
