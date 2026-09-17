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
      <section id="contract" data-sheet-line="02" className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="sheet-body">No capture manifest in this build.</p>
        </div>
      </section>
    );
  }

  const domain = hostOf(capture);
  const plate = PLATES.find((candidate) => candidate.key === activePlate) ?? PLATES[0];
  const plateData = capture.plates[plate.key];
  const ragOutput = capture.outputs.find((output) => output.path.endsWith('_rag.jsonl'));
  const plateFile = plateData?.file ?? ragOutput?.path ?? null;

  return (
    <section
      id="contract"
      data-sheet-line="02"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label">02 — THE MANIFEST</p>
        <h2 className="sheet-head mt-4 text-ink">One capture. One tree you can read.</h2>
        <p className="sheet-body mt-4 max-w-[68ch]">
          Sizes are bytes measured on disk from{' '}
          <span className="sheet-num text-ink">{capture.id}</span> ({isoDate(capture.captured)}, provider{' '}
          {capture.provider}). Two roots hold the same corpus: the library at{' '}
          <span className="sheet-num text-ink">~/.gitbook-downloader/docs/{domain}/</span> and the local copy at{' '}
          <span className="sheet-num text-ink">./{domain}-docs/</span>.
        </p>

        {/* The measured tree. */}
        <div className="mt-10 border-t border-rule-strong">
          <div className="flex items-baseline justify-between py-3">
            <span className="sheet-num text-sm text-ink">{domain}/</span>
            <span className="sheet-label">
              {capture.pages} pages · {formatBytes(capture.bytes.total)}
            </span>
          </div>

          <ul className="border-l border-rule pl-4">
            {capture.outputs.map((output) => (
              <li
                key={output.path}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2"
              >
                <span className="sheet-num text-[13px] text-ink">
                  {output.path}
                  {output.libraryName && (
                    <span className="sheet-label ml-2">local · {output.libraryName} in the library</span>
                  )}
                </span>
                <span className="sheet-num text-[13px] text-ink-2">
                  {output.bytes === null ? (
                    <span className="sheet-label">not in this capture</span>
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

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 border-t border-rule-strong pt-3">
            <span className="sheet-num text-[13px] text-ink-3">~/.gitbook-downloader/search.db</span>
            <span className="sheet-label">one index, all domains · FTS5</span>
          </div>
        </div>

        {/* The plates: verbatim heads of the files above. */}
        <div className="mt-12">
          <div role="tablist" aria-label="Manifest plates" className="flex flex-wrap border-b border-rule-strong">
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
                  className={`sheet-num cursor-pointer border-r border-rule px-4 py-2 text-[11px] tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-match ${
                    isActive ? 'text-match' : 'text-ink-3 hover:text-ink'
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
            className="mt-4"
          >
            {plateFile && <p className="sheet-label mb-2">{plateFile}</p>}
            {plateData?.excerpt ? (
              <pre className="max-h-[420px] overflow-auto text-[12px] leading-relaxed">
                {plateData.excerpt}
              </pre>
            ) : (
              <p className="sheet-body border border-rule bg-bond-2 px-4 py-6 text-ink-2">
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
