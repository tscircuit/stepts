import { expect, test } from "bun:test"
import { CartesianPoint, Direction, eid, Repository } from "../../lib"

/**
 * This test verifies that Repository.set() correctly tracks maxId
 * when using non-sequential IDs (e.g., when merging external STEP models).
 */
test("repository set() correctly tracks maxId for non-sequential IDs", () => {
  const repo = new Repository()

  // Simulate merging external STEP models which use set() with specific IDs
  // This tests that maxId is correctly updated when using set() directly
  repo.set(eid(100), new CartesianPoint("", 0, 0, 0))
  repo.set(eid(200), new CartesianPoint("", 1, 1, 1))
  repo.set(eid(50), new CartesianPoint("", 2, 2, 2))

  // Now add() should use maxId + 1 = 201
  const newRef = repo.add(new Direction("", 1, 0, 0))
  expect(Number(newRef.id)).toBe(201)

  // Add another to verify sequential behavior continues
  const anotherRef = repo.add(new Direction("", 0, 1, 0))
  expect(Number(anotherRef.id)).toBe(202)
})
