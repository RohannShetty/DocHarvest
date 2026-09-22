'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { IndexSheet } from './IndexSheet';
import type { IndexData } from '../lib/indexData';

interface HeroProps {
  onOpenInstallModal: () => void;
  indexData: IndexData;
}

const CAPTURE_COMMAND = 'docharvest capture https://docs.openalgo.in/v/v2.0 --rag --pdf';

export function Hero({ onOpenInstallModal, indexData }: HeroProps) {
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    let didCopy = false;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(CAPTURE_COMMAND);
        didCopy = true;
      }
    } catch {
      // Fall through to the synchronous browser fallback below.
    }

    if (!didCopy) {
      const textarea = document.createElement('textarea');
      textarea.value = CAPTURE_COMMAND;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      didCopy = document.execCommand('copy');
      textarea.remove();
    }

    setCopied(didCopy);
    if (didCopy) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="product" className="border-b border-rule-strong bg-bond px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-end lg:gap-16">
        <div className="min-w-0">
          <p className="sheet-label text-match">Documentation compiler for coding agents</p>
          <h1 className="sheet-display mt-5 max-w-[12ch] text-ink">
            Turn any docs site into context your agent can use.
          </h1>
          <p className="sheet-body mt-6 max-w-[58ch] text-lg text-ink-2">
            DocHarvest captures public documentation, removes page noise, and writes a local corpus with source URLs, search, snapshots, and exports.
          </p>

          <div className="mt-8 max-w-2xl border border-rule-strong bg-bond-2 p-3">
            <div className="flex items-start gap-3">
              <code className="min-w-0 flex-1 break-words text-sm leading-relaxed text-ink">{CAPTURE_COMMAND}</code>
              <button
                type="button"
                onClick={copyCommand}
                aria-label="Copy capture command"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-rule px-3 text-xs font-semibold text-ink-2 transition-colors hover:border-match hover:text-match active:translate-y-px"
              >
                {copied ? <Check aria-hidden="true" className="h-4 w-4 text-match" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="sheet-label mt-3 text-ink-3">One command. Local files. No account required.</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="inline-flex min-h-11 items-center gap-2 bg-match px-4 text-sm font-semibold text-bond transition-colors hover:bg-match-deep active:translate-y-px"
            >
              Install DocHarvest
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </button>
            <a
              href="https://github.com/RohannShetty/DocHarvest"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 border border-rule px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-ink-2 hover:text-ink active:translate-y-px"
            >
              Read the source
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="min-w-0 border border-rule-strong bg-bond-2 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4 border-b border-rule pb-3">
            <div>
              <p className="sheet-label text-match">Live capture specimen</p>
              <p className="mt-1 text-sm font-semibold text-ink">The output starts as a source-backed index.</p>
            </div>
            <span className="sheet-num text-xs text-ink-3">{indexData.provenance.totalRows} rows</span>
          </div>
          <div className="mt-4 max-h-[330px] overflow-hidden">
            <IndexSheet rows={indexData.rows.slice(0, 14)} mode="specimen" provenance={indexData.provenance} />
          </div>
          <p className="sheet-label mt-4 text-ink-3">Rows are read from committed capture data, not a mock terminal.</p>
        </div>
      </div>
    </section>
  );
}

export default Hero;
