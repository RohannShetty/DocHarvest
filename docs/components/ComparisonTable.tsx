import React from 'react';
import { MATRIX_ROWS } from '../data/showcaseData';
import { VERSION } from '../lib/version';

/**
 * Line 05 — The Comparison.
 *
 * Eight capabilities, three columns:
 * - DocHarvest (all green checks, local, free, FastMCP)
 * - Raw scrapers (curl/Scrapy)
 * - Cloud reader APIs (Firecrawl/Jina)
 */

const COLUMNS = [
  { key: 'docharvest' as const, label: `DocHarvest v${VERSION}`, highlight: true },
  { key: 'rawScrapers' as const, label: 'Raw scrapers (curl/Scrapy)', highlight: false },
  { key: 'cloudApis' as const, label: 'Cloud reader APIs', highlight: false },
];

function Cell({ value, highlight }: { value: boolean | string; highlight: boolean }) {
  if (value === true) {
    return <span className={highlight ? 'text-match font-bold' : 'text-ink'}>✓</span>;
  }
  if (value === false) {
    return <span className="text-ink-3">✗</span>;
  }
  return <span className="sheet-label text-ink-2">{value}</span>;
}

export function ComparisonTable() {
  return (
    <section
      id="matrix"
      data-sheet-line="05"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="sheet-label">05 — THE COMPARISON</p>
            <h2 className="sheet-head mt-2 text-ink">Eight capabilities, three columns.</h2>
          </div>
          <span className="sheet-num text-[12px] text-ink-3">
            Local · Zero per-page cost · 100% Privacy
          </span>
        </div>

        <p className="sheet-body mt-4 max-w-[68ch]">
          Raw scrapers dump unprocessed HTML soup. Cloud reader APIs charge per-page fees and send your
          private docs off-machine. DocHarvest compiles verified, token-optimized local corpora for free.
        </p>

        <div className="mt-10 overflow-x-auto border border-rule-strong bg-bond-2">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">capability, DocHarvest, raw scrapers and cloud reader APIs</caption>
            <thead>
              <tr className="border-b border-rule-strong bg-bond">
                <th scope="col" className="sheet-label py-3.5 pl-4 pr-4 font-medium text-ink">
                  Capability &amp; Architectural Guarantee
                </th>
                {COLUMNS.map((column) => (
                  <th
                    scope="col"
                    key={column.key}
                    className={`sheet-label py-3.5 pr-4 text-center font-medium ${
                      column.highlight ? 'text-match font-semibold bg-match/5' : 'text-ink-2'
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-rule align-top hover:bg-bond/30 transition-colors">
                  <th scope="row" className="py-3.5 pl-4 pr-6 text-left font-normal">
                    <span className="sheet-term text-[13px] text-ink font-medium">{row.feature}</span>
                    <span className="sheet-label mt-1 block text-ink-3">{row.detail}</span>
                  </th>
                  {COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      className={`py-3.5 pr-4 text-center text-[14px] ${
                        column.highlight ? 'bg-match/5' : ''
                      }`}
                    >
                      <Cell value={row[column.key]} highlight={column.highlight} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ComparisonTable;
