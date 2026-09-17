/**
 * The sheet's data boundary.
 *
 * Two committed JSON files, both produced by `docs/scripts/build-index-data.mjs`
 * out of real DocHarvest captures:
 *
 *   data/index-data.json — the index rows (verbatim emitted-Markdown lines)
 *   data/manifest.json   — measured output tree, plates and byte counts
 *
 * Nothing on the page computes a size, a page count, a line number or an
 * excerpt: it reads them from here. Regenerate with the command printed in
 * the index section's provenance footnote.
 */

import indexDataJson from '../data/index-data.json';
import manifestJson from '../data/manifest.json';

export interface IndexRow {
  term: string;
  source: string;
  path: string;
  line: number;
  title: string | null;
  context: string;
}

export interface CaptureProvenance {
  id: string;
  sourceUrl: string | null;
  provider: string | null;
  captured: string | null;
  pages: number;
  rows: number;
}

export interface IndexProvenance {
  generated: string;
  generator: string;
  captures: CaptureProvenance[];
  terms: string[];
  totalRows: number;
  note: string;
}

export interface IndexData {
  provenance: IndexProvenance;
  rows: IndexRow[];
}

export interface ManifestOutput {
  path: string;
  bytes: number | null;
  pages?: number;
  libraryName?: string;
}

export interface ManifestPlate {
  file: string;
  excerpt: string | null;
}

export interface ManifestCapture {
  id: string;
  sourceUrl: string | null;
  provider: string | null;
  captured: string | null;
  title: string | null;
  declaredPages: number | null;
  pages: number;
  bytes: {
    'book.md': number | null;
    'llms.txt': number | null;
    pages: number;
    total: number;
  };
  outputs: ManifestOutput[];
  rawHtml: { url: string; bytes: number } | null;
  emitted: { path: string; bytes: number } | null;
  plates: {
    book: ManifestPlate | null;
    llms: ManifestPlate | null;
    page: ManifestPlate | null;
    rag: ManifestPlate | null;
  };
}

export interface Manifest {
  generated: string;
  generator: string;
  note: string;
  captures: ManifestCapture[];
}

export const INDEX_DATA: IndexData = indexDataJson;
export const MANIFEST: Manifest = manifestJson;

/** Derived counts — arithmetic over measured values, never a literal. */
export const SHEET_TOTALS = {
  rows: INDEX_DATA.provenance.totalRows,
  captures: INDEX_DATA.provenance.captures.length,
  pages: INDEX_DATA.provenance.captures.reduce((sum, capture) => sum + capture.pages, 0),
} as const;

const BYTE_UNITS = ['B', 'KB', 'MB'] as const;

/** Exact bytes for anything under 1 KB, one-decimal units above. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes.toLocaleString('en-US')} B`;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${BYTE_UNITS[unit]}`;
}

/** `2026-09-02T18:27:35Z` → `2026-09-02`. */
export function isoDate(value: string | null): string {
  if (!value) return 'unknown';
  return value.slice(0, 10);
}
