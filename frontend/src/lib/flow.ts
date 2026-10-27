// Pure, side-effect-free helpers for capture / library / diff flow logic.
// Extracted so they can be regression-tested with node:test (no new deps).

export type DiffLineKind = "add" | "del" | "header" | "context"

/**
 * Toggle a version in the selected set. Never yields an empty set: if
 * `v` is the last selected item, the set is returned unchanged so the
 * "null = all versions" semantic is never contradicted by an explicit
 * empty selection.
 */
export function toggleVersionSelection(selected: string[], v: string): string[] {
  if (selected.includes(v)) {
    if (selected.length <= 1) return selected
    return selected.filter((x) => x !== v)
  }
  return [...selected, v]
}

/**
 * Compute the next selection for a "select all / none" toggle based on
 * actual set membership rather than length, so a manually-curated
 * selection that happens to match the filtered count is not mistakenly
 * cleared.
 */
export function computeSelectAll(selected: string[], all: string[]): string[] {
  const selectedSet = new Set(selected)
  const alreadyAll = all.length > 0 && all.every((d) => selectedSet.has(d))
  if (alreadyAll) return []
  return [...all]
}

/**
 * Classify a single unified-diff line.
 */
export function classifyDiffLine(line: string): DiffLineKind {
  if (line.startsWith("@@")) return "header"
  if (line.startsWith("+") && !line.startsWith("+++")) return "add"
  if (line.startsWith("-") && !line.startsWith("---")) return "del"
  return "context"
}
