import { test } from "bun:test"
import assert from "node:assert/strict"
import { parseRepository, tokenizeSTEP } from "../../lib"
import "../../lib/entities/geometry/TrimmedCurve"

test("geometry and topology entity names preserve apostrophes on round-trip", () => {
  const entities = [
    ["LINE", "#1,#2"],
    ["CIRCLE", "#1,2."],
    ["TRIMMED_CURVE", "#1,(#2),(#3),.T.,.CARTESIAN."],
    ["EDGE_CURVE", "#1,#2,#3,.F."],
    ["ADVANCED_FACE", "(#1,#2),#3,.T."],
    ["CLOSED_SHELL", "(#1,#2)"],
    ["VERTEX_POINT", "#1"],
    ["FACE_OUTER_BOUND", "#1,.F."],
  ]
  const names = [
    ["O'Brien's edge", "'O''Brien''s edge'"],
    ["end'", "'end'''"],
    ["''", "''''''"],
    ["owner's; /* edge */ (A,B)", "'owner''s; /* edge */ (A,B)'"],
    ["plain edge", "'plain edge'"],
    ["", "''"],
  ]

  for (const [type, args] of entities) {
    for (const [name, token] of names) {
      const source = `DATA; #10=${type}(${token},${args}); ENDSEC;`
      const repo = parseRepository(source)
      const [[id, entity]] = repo.entries()
      assert.equal(entity.type, type)
      assert.ok("name" in entity)
      assert.equal(entity.name, name)

      const output = repo.toPartFile({ name: "entity names" })
      assert.deepEqual(
        tokenizeSTEP(output),
        tokenizeSTEP(source),
        `${type} must preserve the name and non-name arguments`,
      )
      const reparsed = parseRepository(output)
      const reparsedEntity = reparsed.get(id)
      assert.ok(reparsedEntity && "name" in reparsedEntity)
      assert.equal(reparsedEntity.name, name)
    }
  }
})
