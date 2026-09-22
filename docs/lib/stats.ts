// Centralized product facts and marketing stats for DocHarvest.
// Keep public claims here unless they are measured from docs/data/manifest.json.
// The reference benchmark values below are documented in docs/SEO_GUIDE.md §3.

export const PRODUCT_FACTS = {
  name: 'DocHarvest',
  packageName: 'gitbook-downloader',
  cli: 'docharvest',
  cliAlias: 'gitbook-dl',
  libraryRoot: '~/.gitbook-downloader',
  localBookFile: 'book.md',
  libraryBookFile: 'docs.md',
  dedicatedProviders: 8,
  mcpResources: 2,
  mcpPrompts: 2,
} as const;

export const STATS = {
  agentsShipped: 17,        // harness cards rendered in the showcase
  harnesses: 14,            // documented client configs in the README matrix
  pagesCaptured: 673,       // pages in the canonical full-suite OpenAlgo capture
  reductionPct: 83,         // measured token reduction vs raw HTML (82.8%)
  speedPagesPerSec: 37.0,   // 673 pages / 18.2 s on the canonical capture
  captureTimeSec: 18.2,     // wall-clock seconds for the reference capture
  testsPassing: 765,        // uv run pytest, 2026-09-16
  mcpTools: 12,             // tools registered in src/gitbook_downloader/mcp/server.py
} as const;

export type DocHarvestStats = typeof STATS;
