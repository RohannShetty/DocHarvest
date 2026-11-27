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
// reductionPct) describe one reference capture, documented in docs/CLAIMS.md
// (2026-11-13). They are reference measurements, not guarantees. reductionPct
// is 0 because no token reduction was measurable against the page's visible
// text; the earlier 83% figure could not be reproduced.

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
  testsCollected: 1001,
  testsPassing: 1001,
  testsFailing: 0,
  testsSkipped: 0,
  suiteSeconds: 175.22,
  statsUpdated: '2026-11-13',

  // ── Reference capture (docs/SEO_GUIDE.md §3) ─────────────────────────
  pagesCaptured: 470,
  reductionPct: 0,
  speedPagesPerSec: 6.2,
  captureTimeSec: 76.4,

  // ── Product surface ──────────────────────────────────────────────────
  agentsShipped: 17,
  harnesses: 14,
  mcpTools: 12,
} as const;

export type DocHarvestStats = typeof STATS;
