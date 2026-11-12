'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { IndexSheet } from './IndexSheet';
import type { IndexData } from '../lib/indexData';

interface HeroProps {
  onOpenInstallModal: () => void;
  indexData: IndexData;
}

/** One command, one meaning: capture a site into the local library. */
const CAPTURE_COMMAND = 'docharvest capture https://docs.example.com';

export function Hero({ onOpenInstallModal, indexData }: HeroProps) {
  const [copied, setCopied] = useState(false);

  const copyCommand = async (cmd: string) => {
    let didCopy = false;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(cmd);
        didCopy = true;
      }
    } catch {
      // Fall through to the execCommand path below.
    }

    if (!didCopy) {
      const textarea = document.createElement('textarea');
      textarea.value = cmd;
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
    <section id="product" className="border-b border-rule">
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start lg:gap-16">
        <div className="min-w-0">
          <p className="sheet-label text-match">Local documentation capture</p>

          <h1 className="sheet-display mt-5 text-ink">
            Turn any docs site into context your agent can use.
          </h1>

          <p className="sheet-body mt-6 max-w-[52ch] text-lg">
            DocHarvest reads a documentation site and writes it to disk as Markdown: one file per
            page, a combined book, an llms.txt manifest, and a searchable index. Everything happens
            on your machine, and the files are yours to feed to an agent.
          </p>

          <div className="mt-8 border-y border-rule py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <code className="min-w-0 flex-1 break-all font-mono text-sm leading-relaxed text-ink">
                {CAPTURE_COMMAND}
              </code>
              <button
                type="button"
                onClick={() => copyCommand(CAPTURE_COMMAND)}
                aria-label="Copy capture command"
                className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border border-rule px-3 text-xs font-semibold text-ink-2 transition-colors hover:border-match hover:text-match focus-visible:outline-2 focus-visible:outline-match"
              >
                {copied ? (
                  <Check aria-hidden="true" className="h-4 w-4 text-match" />
                ) : (
                  <Copy aria-hidden="true" className="h-4 w-4" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="sheet-label mt-3 text-ink-3">
              The CLI is installed by pip, uv, Docker, or the Windows installer — no account.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 bg-match px-5 text-sm font-semibold text-bond transition-colors hover:bg-match-deep focus-visible:outline-2 focus-visible:outline-match"
            >
              Install DocHarvest
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </button>
            <a
              href="https://github.com/RohannShetty/DocHarvest"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 border border-rule px-5 text-sm font-semibold text-ink-2 transition-colors hover:border-rule-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              Read the source
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="min-w-0 border-t border-rule-strong pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-3">
            <p className="sheet-label text-match">Capture specimen</p>
            <span className="sheet-num text-xs text-ink-3">
              {indexData.provenance.totalRows} indexed lines
            </span>
          </div>
          <div className="mt-4">
            <IndexSheet
              rows={indexData.rows.slice(0, 14)}
              mode="specimen"
              provenance={indexData.provenance}
            />
          </div>
          <p className="sheet-label mt-4 text-ink-3">
            Rows are read from committed capture data, not a mock terminal.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Hero;
