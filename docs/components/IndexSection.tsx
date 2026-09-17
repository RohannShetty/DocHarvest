import React from 'react';
import { IndexSheet } from './IndexSheet';
import type { IndexData } from '../lib/indexData';

/**
 * Line 01 — the index, in full.
 *
 * The whole sheet, grouped by the capture each line came from, with the
 * provenance of the file it is read out of.
 */
export function IndexSection({ indexData }: { indexData: IndexData }) {
  const { provenance } = indexData;

  return (
    <section
      id="index"
      data-sheet-line="01"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label">01 — THE INDEX</p>
        <h2 className="sheet-head mt-4 text-ink">
          {provenance.captures.length} real captures, read line by line.
        </h2>
        <p className="sheet-body mt-4 max-w-[68ch]">
          Every row below is a verbatim line from Markdown DocHarvest emitted, with the file it came
          from. Type to filter.
        </p>

        <div className="mt-10">
          <IndexSheet rows={indexData.rows} mode="full" provenance={provenance} />
        </div>

        <p className="sheet-label mt-6 max-w-[92ch] leading-relaxed">
          Rows: docs/data/index-data.json — generated {provenance.generated} by{' '}
          <span className="text-ink-2">{provenance.generator}</span> · terms {provenance.terms.join(', ')} ·{' '}
          {provenance.note}
        </p>
      </div>
    </section>
  );
}

export default IndexSection;
