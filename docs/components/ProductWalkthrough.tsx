import React from 'react';
import { VERSION } from '../lib/version';
import {
  CAPTURE_COMMAND,
  CAPTURE_TRANSCRIPT,
  FRONTMATTER,
  OUTPUT_TREE,
} from '../data/capture-evidence';

export function ProductWalkthrough() {
  return (
    <section id="walkthrough" className="border-b border-rule">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-[56ch]">
          <p className="sheet-label text-match">03 — In the app</p>
          <h2 className="sheet-head mt-4 text-ink">The capture, shown as it ran.</h2>
          <p className="sheet-body mt-4">
            Real output from DocHarvest {VERSION} on 2026-11-13. Current screenshots are not
            available in this environment, so the section shows the run itself and the files
            it wrote. Both are copyable, and the same command reproduces them.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <figure>
            <div className="overflow-hidden border border-rule-strong bg-bond">
              <div className="border-b border-rule px-4 py-3 font-mono text-xs text-ink-2">
                <span className="text-ink-3">$ </span>
                {CAPTURE_COMMAND}
              </div>
              <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed text-ink-2">
                {CAPTURE_TRANSCRIPT}
              </pre>
            </div>
            <figcaption className="sheet-label mt-3 text-ink-3">
              A ten-page local capture: provider detection, pages written, and the files it
              reports.
            </figcaption>
          </figure>

          <div className="lg:pt-12">
            <div className="border-l-2 border-match pl-5">
              <p className="sheet-label text-match">Capture</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                The tool tells you what it found.
              </h3>
              <p className="sheet-body mt-4 text-ink-2">
                Provider detection, page counts, skipped URLs and warnings stay visible while
                the capture runs — nothing is inferred after the fact.
              </p>
            </div>
            <ul className="mt-8 divide-y divide-rule border-y border-rule">
              <li className="py-4">
                <span className="sheet-label text-ink-3">01</span>
                <p className="mt-2 text-sm text-ink">Paste a docs URL</p>
              </li>
              <li className="py-4">
                <span className="sheet-label text-ink-3">02</span>
                <p className="mt-2 text-sm text-ink">Confirm scope and provider</p>
              </li>
              <li className="py-4">
                <span className="sheet-label text-ink-3">03</span>
                <p className="mt-2 text-sm text-ink">Open the local corpus</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <p className="sheet-label text-match">Inspect and export</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
              The library keeps the work reusable.
            </h3>
            <p className="sheet-body mt-4 text-ink-2">
              Every page keeps its source URL and a SHA-256 content hash, so a citation can be
              checked later. The same files feed the search index, a RAG pipeline or a PDF
              reader.
            </p>
            <code className="mt-6 block border border-rule bg-bond px-4 py-3 text-xs leading-relaxed text-ink">
              ~/.docharvest/docs/&lt;domain&gt;/
            </code>
          </div>
          <figure className="order-1 lg:order-2">
            <div className="overflow-hidden border border-rule-strong bg-bond">
              <div className="border-b border-rule px-4 py-3 font-mono text-xs text-ink-2">
                output tree, 20-page capture
              </div>
              <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed text-ink-2">
                {OUTPUT_TREE}
              </pre>
              <div className="border-t border-rule px-4 pt-3 font-mono text-[0.7rem] text-ink-3">
                one page's frontmatter
              </div>
              <pre className="overflow-x-auto px-4 pb-4 pt-2 font-mono text-xs leading-relaxed text-ink-2">
                {FRONTMATTER}
              </pre>
            </div>
            <figcaption className="sheet-label mt-3 text-ink-3">
              The five frontmatter fields are source URL, title, crawl date, content hash and
              site version.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export default ProductWalkthrough;
