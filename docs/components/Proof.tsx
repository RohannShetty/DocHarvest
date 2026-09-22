import React from 'react';
import { STATS } from '../lib/stats';

export function Proof() {
  return (
    <section id="proof" className="border-b border-rule-strong bg-bond-2 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div>
            <p className="sheet-label text-match">Proof and benchmarks</p>
            <h2 className="sheet-head mt-4 max-w-[12ch] text-ink">Numbers with a stated context.</h2>
            <p className="sheet-body mt-5 max-w-[40ch] text-ink-2">These values describe a reference capture and the current repository. They are not a promise about every source site.</p>
          </div>

          <div>
            <dl className="grid border-y border-rule-strong sm:grid-cols-2">
              <div className="border-b border-rule-strong py-6 sm:border-r sm:pr-8">
                <dt className="sheet-label text-ink-3">Reference capture</dt>
                <dd className="sheet-num mt-3 text-3xl font-semibold text-ink">{STATS.pagesCaptured} pages</dd>
                <p className="sheet-body mt-2 text-sm text-ink-2">in {STATS.captureTimeSec} seconds, about {STATS.speedPagesPerSec} pages per second</p>
              </div>
              <div className="border-b border-rule-strong py-6 sm:pl-8">
                <dt className="sheet-label text-ink-3">Measured reduction</dt>
                <dd className="sheet-num mt-3 text-3xl font-semibold text-match">~{STATS.reductionPct}%</dd>
                <p className="sheet-body mt-2 text-sm text-ink-2">fewer tokens than the raw HTML comparison</p>
              </div>
              <div className="py-6 sm:border-r sm:pr-8">
                <dt className="sheet-label text-ink-3">Agent surface</dt>
                <dd className="sheet-num mt-3 text-3xl font-semibold text-ink">{STATS.mcpTools} tools</dd>
                <p className="sheet-body mt-2 text-sm text-ink-2">plus resources and prompts over stdio</p>
              </div>
              <div className="py-6 sm:pl-8">
                <dt className="sheet-label text-ink-3">Repository verification</dt>
                <dd className="sheet-num mt-3 text-3xl font-semibold text-ink">{STATS.testsPassing}</dd>
                <p className="sheet-body mt-2 text-sm text-ink-2">tests passing in the root suite on 2026-09-16</p>
              </div>
            </dl>
            <p className="sheet-label mt-5 text-ink-3">Source: docs/SEO_GUIDE.md §3 and the root test run. Benchmark values are reference measurements, not guarantees.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Proof;
