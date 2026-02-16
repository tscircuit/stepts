import { expect, test } from "bun:test"
import { CartesianPoint, Direction, eid, Repository } from "../../lib"

/**
 * This test verifies that Repository can handle a large number of entities
 * without stack overflow.
 */
test("repository handles large number of entities without stack overflow", () => {
  const repo = new Repository()

  // Add 150,000 entities - this would have caused stack overflow before the fix
  // because Math.max(...array) with 150k elements exceeds call stack limit
  const entityCount = 150_000

  for (let i = 0; i < entityCount; i++) {
    // Alternate between CartesianPoint and Direction to simulate real usage
    if (i % 2 === 0) {
      repo.add(new CartesianPoint("", i, i, i))
    } else {
      repo.add(new Direction("", 1, 0, 0))
    }
  }

  // Verify all entities were added
  const entries = repo.entries()
  expect(entries.length).toBe(entityCount)

  // Verify IDs are sequential (1 to entityCount)
  const firstId = entries[0][0]
  const lastId = entries[entries.length - 1][0]
  expect(firstId).toBe(eid(1))
  expect(lastId).toBe(eid(entityCount))

  // Verify we can still add more entities after the large batch
  const newRef = repo.add(new CartesianPoint("", 999, 999, 999))
  expect(Number(newRef.id)).toBe(entityCount + 1)
})
