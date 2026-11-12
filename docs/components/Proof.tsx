import React from 'react';
import { RETRIEVAL_BENCHMARK } from '../data/benchmark';
import { PRODUCT_FACTS, STATS } from '../lib/stats';

function Tile({
  label,
  value,
  unit,
  children,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-rule-strong py-6 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
      <dt className="sheet-label text-ink-3">{label}</dt>
      <dd className={`sheet-num mt-3 text-3xl font-semibold ${accent ? 'text-match' : 'text-ink'}`}>
        {value}
        {unit ? <span className="ml-1.5 text-base font-normal text-ink-2">{unit}</span> : null}
      </dd>
      <p className="sheet-body mt-2 text-sm">{children}</p>
    </div>
  );
}

export function Proof() {
  const testsFailing: number = STATS.testsFailing;
  const testsClean = testsFailing === 0;

  return (
    <section id="proof" className="border-b border-rule bg-bond-2">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14">
          <div className="max-w-[44ch]">
            <p className="sheet-label text-match">07 — Checked values</p>
            <h2 className="sheet-head mt-4 text-ink">Two checks you can rerun yourself.</h2>
            <p className="sheet-body mt-5">
              Neither number is a projection. The retrieval figure comes from the checked-in fixture corpus, and the
              test figure comes from the repository suite at{' '}
              <span className="font-mono text-ink">{STATS.statsUpdated}</span>.
            </p>
          </div>

          <div className="grid border-y border-rule-strong sm:grid-cols-2">
            <Tile
              label="Fixture retrieval"
              value={RETRIEVAL_BENCHMARK.hitAtK.toFixed(2)}
              unit="hit@5"
              accent
            >
              {RETRIEVAL_BENCHMARK.queries} questions over {RETRIEVAL_BENCHMARK.datasetId}; mean reciprocal rank{' '}
              {RETRIEVAL_BENCHMARK.mrr.toFixed(2)}. Corpus hash{' '}
              <span className="font-mono text-ink">{RETRIEVAL_BENCHMARK.corpusHash.slice(0, 12)}…</span>
            </Tile>
            <Tile label="Repository suite" value={testsClean ? String(STATS.testsPassing) : `${STATS.testsPassing}/${STATS.testsCollected}`} unit="tests">
              {testsClean
                ? `passing, ${STATS.testsFailing} failing, ${STATS.testsSkipped} skipped on ${STATS.statsUpdated}.`
                : `${STATS.testsFailing} currently failing in the root suite.`}
            </Tile>
            <Tile label="Agent surface" value={String(STATS.mcpTools)} unit="MCP tools">
              Plus {PRODUCT_FACTS.mcpResources} resources and {PRODUCT_FACTS.mcpPrompts} prompts over stdio, with no
              network hop of its own.
            </Tile>
            <Tile label="Account required" value="None" accent>
              No login, no quota, no telemetry. Output stays under {PRODUCT_FACTS.libraryRoot}.
            </Tile>
          </div>
        </div>

        <p className="sheet-label mt-6 text-ink-3">
          Retrieval: <span className="text-ink-2">{RETRIEVAL_BENCHMARK.command}</span>, {RETRIEVAL_BENCHMARK.generatedAt}.
          Tests: <span className="text-ink-2">node docs/scripts/sync-stats.mjs --run</span>, which runs the suite and
          writes this page’s number.
        </p>
      </div>
    </section>
  );
}

export default Proof;
