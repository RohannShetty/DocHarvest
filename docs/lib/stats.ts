// Centralized product facts and marketing stats for DocHarvest.
//
// Two kinds of value live here:
//
//   1. PRODUCT_FACTS — names, paths and counts that only change with a release.
//   2. STATS         — every public claim the site makes.
//
// The `tests*` fields and `statsUpdated` are GENERATED. Regenerate them with
// `node docs/scripts/sync-stats.mjs --run` (or `--input <pytest output>` in CI)
// after any change to the suite. Never hand-edit a generated value: a number
// nobody regenerates becomes a claim that is eventually false — this file used
// to advertise 765 passing tests while the suite had grown past 800 with four
// of them failing. `tests/test_stats_drift.py` guards the contract.
//
// The benchmark values (pagesCaptured / captureTimeSec / speedPagesPerSec /
// reductionPct) describe one reference capture, documented in docs/SEO_GUIDE.md
// §3. They are reference measurements, not guarantees.

export const PRODUCT_FACTS = {
  name: 'DocHarvest',
  packageName: 'docharvest',
  cli: 'docharvest',
  cliAlias: 'gitbook-dl',
  libraryRoot: '~/.docharvest',
  localBookFile: 'book.md',
  libraryBookFile: 'docs.md',
  dedicatedProviders: 8,
  mcpResources: 2,
  mcpPrompts: 2,
} as const;

export const STATS = {
  // ── Generated from a real pytest run (do not hand-edit) ──────────────
  testsCollected: 882,
  testsPassing: 882,
  testsFailing: 0,
  testsSkipped: 0,
  suiteSeconds: 200.367,
  statsUpdated: '2026-09-28',

  // ── Reference capture (docs/SEO_GUIDE.md §3) ─────────────────────────
  pagesCaptured: 673,
  reductionPct: 83,
  speedPagesPerSec: 37.0,
  captureTimeSec: 18.2,

  // ── Product surface ──────────────────────────────────────────────────
  agentsShipped: 17,
  harnesses: 14,
  mcpTools: 12,
} as const;

export type DocHarvestStats = typeof STATS;
