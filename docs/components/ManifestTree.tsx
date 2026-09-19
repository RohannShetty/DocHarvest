'use client';

import React, { useState } from 'react';
import { formatBytes, isoDate, type Manifest, type ManifestCapture } from '../lib/indexData';

/**
 * Line 02 — the manifest.
 *
 * The measured shape of one real capture: the tree DocHarvest wrote, every size
 * read off disk by the generator, and four plates quoting the files verbatim.
 * A file this capture never wrote prints "not in this capture" instead of a
 * number, so the tree cannot claim more than the run produced.
 */

type PlateKey = 'book' | 'llms' | 'page' | 'rag';

const PLATES: { key: PlateKey; numeral: string; label: string }[] = [
  { key: 'book', numeral: 'I', label: 'book.md' },
  { key: 'llms', numeral: 'II', label: 'llms.txt' },
  { key: 'page', numeral: 'III', label: 'pages/' },
  { key: 'rag', numeral: 'IV', label: 'exports/…_rag.jsonl' },
];

function hostOf(capture: ManifestCapture): string {
  if (!capture.sourceUrl) return capture.id;
  try {
    return new URL(capture.sourceUrl).hostname;
  } catch {
    return capture.id;
  }
}

export function ManifestTree({ manifest }: { manifest: Manifest }) {
  const capture = manifest.captures[0];
  const [activePlate, setActivePlate] = useState<PlateKey>('book');

  if (!capture) {
    return (
      <section id="contract" data-sheet-line="02" className="scroll-mt-16 border-t border-rule-strong bg-bond px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="sheet-body text-ink-3">No capture manifest in this build.</p>
        </div>
      </section>
    );
  }

  const domain = hostOf(capture);
  const plate = PLATES.find((candidate) => candidate.key === activePlate) ?? PLATES[0];
  const plateData = capture.plates[plate.key];
  const ragOutput = capture.outputs.find((output) => output.path.endsWith('_rag.jsonl'));
  const plateFile = plateData?.file ?? ragOutput?.path ?? null;

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = PLATES.findIndex((candidate) => candidate.key === activePlate);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % PLATES.length;
      setActivePlate(PLATES[nextIndex].key);
      document.getElementById(`plate-tab-${PLATES[nextIndex].key}`)?.focus();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + PLATES.length) % PLATES.length;
      setActivePlate(PLATES[prevIndex].key);
      document.getElementById(`plate-tab-${PLATES[prevIndex].key}`)?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActivePlate(PLATES[0].key);
      document.getElementById(`plate-tab-${PLATES[0].key}`)?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      setActivePlate(PLATES[PLATES.length - 1].key);
      document.getElementById(`plate-tab-${PLATES[PLATES.length - 1].key}`)?.focus();
    }
  };

  return (
    <section
      id="contract"
      data-sheet-line="02"
      className="scroll-mt-16 border-t border-rule-strong bg-bond px-6 py-20 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label text-match">02 — THE MANIFEST</p>
        <h2 className="sheet-head mt-4 text-ink">One capture. One tree you can read.</h2>
        <p className="sheet-body mt-4 max-w-[68ch] text-ink-2 leading-relaxed">
          Sizes are bytes measured on disk from{' '}
          <span className="sheet-num text-ink font-mono font-medium">{capture.id}</span> ({isoDate(capture.captured)}, provider{' '}
          <span className="text-ink font-mono font-medium">{capture.provider}</span>). Two roots hold the same corpus: the library at{' '}
          <span className="sheet-num text-ink font-mono">~/.gitbook-downloader/docs/{domain}/</span> and the local copy at{' '}
          <span className="sheet-num text-ink font-mono">./{domain}-docs/</span>.
        </p>

        {/* The measured tree. */}
        <div className="mt-10 border border-rule-strong bg-gradient-to-b from-bond-2 to-bond-2/70 p-6 shadow-sm">
          <div className="flex items-baseline justify-between border-b border-rule pb-3.5">
            <span className="sheet-num text-sm text-ink font-mono font-semibold">{domain}/</span>
            <span className="sheet-label text-match">
              {capture.pages} pages · {formatBytes(capture.bytes.total)}
            </span>
          </div>

          <ul className="mt-3.5 border-l border-rule pl-4 space-y-1.5">
            {capture.outputs.map((output) => (
              <li
                key={output.path}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule/60 py-2.5 hover:bg-bond/30 transition-colors"
              >
                <span className="sheet-num text-[13px] text-ink font-mono">
                  {output.path}
                  {output.libraryName && (
                    <span className="sheet-label ml-2 text-ink-3">local · {output.libraryName} in library</span>
                  )}
                </span>
                <span className="sheet-num text-[13px] text-ink-2 font-mono">
                  {output.bytes === null ? (
                    <span className="sheet-label text-ink-3">not in this capture</span>
                  ) : (
                    <>
                      {output.pages !== undefined && `${output.pages} pages · `}
                      {formatBytes(output.bytes)}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 border-t border-rule-strong pt-3.5">
            <span className="sheet-num text-[13px] text-ink-3 font-mono">~/.gitbook-downloader/search.db</span>
            <span className="sheet-label text-match">one index, all domains · FTS5</span>
          </div>
        </div>

        {/* The plates: verbatim heads of the files above. */}
        <div className="mt-14">
          <div
            role="tablist"
            aria-label="Manifest plates"
            onKeyDown={handleTabKeyDown}
            className="flex flex-wrap border-b border-rule-strong bg-bond-2"
          >
            {PLATES.map((candidate) => {
              const isActive = candidate.key === activePlate;
              return (
                <button
                  key={candidate.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`plate-${candidate.key}`}
                  id={`plate-tab-${candidate.key}`}
                  onClick={() => setActivePlate(candidate.key)}
                  className={`sheet-num cursor-pointer border-r border-rule px-5 py-2.5 text-[11px] tracking-[0.14em] transition-all focus-visible:outline-2 focus-visible:outline-match ${
                    isActive ? 'text-match bg-bond border-t-2 border-t-match font-semibold' : 'text-ink-3 hover:text-ink hover:bg-bond/50'
                  }`}
                >
                  {candidate.numeral} · {candidate.label}
                </button>
              );
            })}
          </div>

          <div
            id={`plate-${plate.key}`}
            role="tabpanel"
            aria-labelledby={`plate-tab-${plate.key}`}
            tabIndex={0}
            className="mt-4 focus-visible:outline-2 focus-visible:outline-match"
          >
            {plateFile && <p className="sheet-label mb-2.5 text-ink-3 font-mono">{plateFile}</p>}
            {plateData?.excerpt ? (
              <pre className="max-h-[420px] overflow-auto text-[12px] leading-relaxed border border-rule-strong bg-bond-2 p-4 shadow-sm font-mono">
                {plateData.excerpt}
              </pre>
            ) : (
              <p className="sheet-body border border-rule bg-bond-2 px-4 py-6 text-ink-2 shadow-sm">
                No RAG export in this capture — run capture with --rag
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ManifestTree;
