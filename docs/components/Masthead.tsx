'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { IndexSheet } from './IndexSheet';
import { STATS } from '../lib/stats';
import type { IndexData } from '../lib/indexData';

/**
 * Line 00 — the masthead.
 *
 * The sheet's own first line: the claim, the one command that produces the
 * artifact, the four canonical figures with their provenance, and the live
 * index specimen beside them.
 */

interface MastheadProps {
  onOpenInstallModal: () => void;
  indexData: IndexData;
}

const CAPTURE_COMMAND = 'docharvest capture https://docs.openalgo.in/v/v2.0 --rag --pdf';

export function Masthead({ onOpenInstallModal, indexData }: MastheadProps) {
  const [copied, setCopied] = useState(false);

  const copyCaptureCommand = () => {
    navigator.clipboard?.writeText(CAPTURE_COMMAND).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const figures = [
    `${STATS.pagesCaptured} pages · ${STATS.captureTimeSec} s`,
    `~${STATS.speedPagesPerSec} pages/sec`,
    `~${STATS.reductionPct}% fewer tokens`,
    `${STATS.testsPassing} tests passing`,
  ];

  return (
    <section id="top" data-sheet-line="00" className="scroll-mt-16 border-b border-rule-strong">
      <div className="grid grid-cols-1 gap-14 px-6 py-16 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-24">
        <div className="lg:col-span-6">
          <p className="sheet-label">00 — THE SHEET</p>

          <h1 className="sheet-display mt-6 text-ink">
            Every mention, its source, and the line it sits on.
          </h1>

          <p className="sheet-body mt-6 max-w-[68ch]">
            DocHarvest captures a documentation site into one local corpus — Markdown pages, a single
            book file, an llms.txt manifest, and an FTS5 index your agent can query by name.
          </p>

          {/* The command is line 001 of the sheet, gutter and all. */}
          <div className="mt-8 flex items-center gap-3 border border-rule bg-bond-2 px-3 py-2">
            <span className="sheet-num w-8 shrink-0 text-right text-ink-3">001</span>
            <code className="sheet-num min-w-0 flex-1 break-words text-xs text-ink">
              {CAPTURE_COMMAND}
            </code>
            <button
              onClick={copyCaptureCommand}
              aria-label="Copy capture command"
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="sheet-label">{copied ? 'copied' : 'copy'}</span>
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              onClick={onOpenInstallModal}
              className="sheet-num cursor-pointer bg-match px-4 py-2.5 text-xs font-semibold text-bond transition-colors hover:bg-match-deep focus-visible:outline-2 focus-visible:outline-match"
            >
              Install in 30 seconds
            </button>
            <a
              href="https://github.com/RohannShetty/gitbook-downloader"
              target="_blank"
              rel="noreferrer"
              className="sheet-label inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              Repository
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <p className="sheet-label mt-4">
            Free &amp; MIT · No account · No API key · Nothing leaves your machine
          </p>

          <dl className="mt-10 grid grid-cols-2 border-t border-rule">
            {figures.map((figure) => (
              <div key={figure} className="border-b border-rule py-3 pr-4 odd:border-r">
                <dd className="sheet-num text-sm text-ink">{figure}</dd>
              </div>
            ))}
          </dl>
          <p className="sheet-label mt-3">
            Reference capture: docs.openalgo.in · canonical metrics: docs/SEO_GUIDE.md §3
          </p>
        </div>

        <div className="lg:col-span-6">
          <p className="sheet-label">01 — THE INDEX · SPECIMEN, FIRST 16 ROWS</p>
          <div className="sheet-unfurl mt-3">
            <IndexSheet rows={indexData.rows} mode="specimen" provenance={indexData.provenance} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Masthead;
