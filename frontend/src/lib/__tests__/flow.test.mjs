import { strict as assert } from "node:assert/strict"
import { describe, it } from "node:test"
import {
  toggleVersionSelection,
  computeSelectAll,
  classifyDiffLine,
} from "../flow.ts"

describe("toggleVersionSelection", () => {
  it("adds a version not yet selected", () => {
    assert.deepStrictEqual(toggleVersionSelection(["v1"], "v2"), ["v1", "v2"])
  })

  it("removes a selected version when others remain", () => {
    assert.deepStrictEqual(toggleVersionSelection(["v1", "v2"], "v1"), ["v2"])
  })

  it("never empties the set (guards contradictory 'null = all' deselection)", () => {
    assert.deepStrictEqual(toggleVersionSelection(["v1"], "v1"), ["v1"])
    assert.deepStrictEqual(toggleVersionSelection([], "v1"), ["v1"])
  })
})

describe("computeSelectAll", () => {
  it("selects all when nothing is selected", () => {
    assert.deepStrictEqual(computeSelectAll([], ["a", "b"]), ["a", "b"])
  })

  it("deselects all when every filtered domain is already selected", () => {
    assert.deepStrictEqual(computeSelectAll(["a", "b"], ["a", "b"]), [])
  })

  it("selects all when a manual selection merely matches the count", () => {
    // Same length but different membership -> should still select all
    assert.deepStrictEqual(computeSelectAll(["a", "c"], ["a", "b"]), ["a", "b"])
  })

  it("returns empty for an empty domain list", () => {
    assert.deepStrictEqual(computeSelectAll([], []), [])
  })
})

describe("classifyDiffLine", () => {
  it("classifies added lines", () => {
    assert.strictEqual(classifyDiffLine("+ new line"), "add")
    assert.strictEqual(classifyDiffLine("+++ b/file"), "context")
  })

  it("classifies deleted lines", () => {
    assert.strictEqual(classifyDiffLine("- old line"), "del")
    assert.strictEqual(classifyDiffLine("--- a/file"), "context")
  })

  it("classifies hunks and context", () => {
    assert.strictEqual(classifyDiffLine("@@ -1,3 +1,4 @@"), "header")
    assert.strictEqual(classifyDiffLine(" unchanged line"), "context")
    assert.strictEqual(classifyDiffLine(""), "context")
  })
})
