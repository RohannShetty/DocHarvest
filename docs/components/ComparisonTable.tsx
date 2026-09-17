import React from 'react';
import { MATRIX_ROWS } from '../data/showcaseData';
import { VERSION } from '../lib/version';

/**
 * Line 05 — the comparison.
 *
 * Eight capabilities, three columns, no decoration: a filled rule for present,
 * a hairline cross for absent, and the honest string when a column is partial.
 * `--alert` is not used here — nothing in this table is a failure.
 */

const COLUMNS = [
  { key: 'docharvest' as const, label: `DocHarvest v${VERSION}` },
  { key: 'rawScrapers' as const, label: 'Raw scrapers (curl/Scrapy)' },
  { key: 'cloudApis' as const, label: 'Cloud reader APIs' },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-ink">✓</span>;
  if (value === false) return <span className="text-ink-3">✗</span>;
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
        <p className="sheet-label">05 — THE COMPARISON</p>
        <h2 className="sheet-head mt-4 text-ink">Eight capabilities, three columns.</h2>
        <p className="sheet-body mt-4 max-w-[68ch]">
          Raw scrapers are free too — the column says so. The difference is what each one hands your
          agent.
        </p>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse text-left">
          <caption className="sr-only">capability, DocHarvest, raw scrapers and cloud reader APIs</caption>
          <thead>
            <tr className="border-y border-rule-strong">
              <th scope="col" className="sheet-label py-2 pr-4 font-medium">
                capability
              </th>
              {COLUMNS.map((column) => (
                <th scope="col" key={column.key} className="sheet-label py-2 pr-4 text-center font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-rule align-top">
                <th scope="row" className="py-3 pr-6 text-left font-normal">
                  <span className="sheet-term text-[13px] text-ink">{row.feature}</span>
                  <span className="sheet-label mt-1 block">{row.detail}</span>
                </th>
                {COLUMNS.map((column) => (
                  <td key={column.key} className="py-3 pr-4 text-center text-[13px]">
                    <Cell value={row[column.key]} />
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
