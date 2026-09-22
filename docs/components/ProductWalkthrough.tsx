import Image from 'next/image';
import React from 'react';

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function ProductWalkthrough() {
  return (
    <section id="walkthrough" className="border-b border-rule-strong bg-bond-2 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="sheet-label text-match">Product walkthrough</p>
          <h2 className="sheet-head mt-4 text-ink">See the capture before you install it.</h2>
          <p className="sheet-body mt-4 text-ink-2">These are real desktop surfaces from the shipped GUI. The browser showcase explains the same flow without pretending to be the application.</p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <figure>
            <div className="overflow-hidden border border-rule-strong bg-bond">
              <Image
                src={`${ASSET_BASE}/assets/capture_studio.png`}
                alt="DocHarvest Capture Studio showing provider detection, download progress, and live capture logs"
                width={1024}
                height={576}
                className="h-auto w-full"
                unoptimized
              />
            </div>
            <figcaption className="sheet-label mt-3 text-ink-3">Capture Studio: detection, progress, and emitted files in one view.</figcaption>
          </figure>

          <div className="lg:pt-12">
            <div className="border-l-2 border-match pl-5">
              <p className="sheet-label text-match">Capture</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">The tool tells you what it found.</h3>
              <p className="sheet-body mt-4 text-ink-2">Provider detection, page counts, skipped URLs, and warnings remain visible while the capture runs.</p>
            </div>
            <ul className="mt-8 divide-y divide-rule border-y border-rule">
              <li className="py-4"><span className="sheet-label text-ink-3">01</span><p className="mt-2 text-sm text-ink">Paste a docs URL</p></li>
              <li className="py-4"><span className="sheet-label text-ink-3">02</span><p className="mt-2 text-sm text-ink">Confirm scope and provider</p></li>
              <li className="py-4"><span className="sheet-label text-ink-3">03</span><p className="mt-2 text-sm text-ink">Open the local corpus</p></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <p className="sheet-label text-match">Inspect and export</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">The library keeps the work reusable.</h3>
            <p className="sheet-body mt-4 text-ink-2">Search captured domains, open their folders, compare snapshots, and send the same files to a RAG pipeline or a PDF reader.</p>
            <code className="mt-6 block border border-rule bg-bond px-4 py-3 text-xs leading-relaxed text-ink">~/.gitbook-downloader/docs/&lt;domain&gt;/</code>
          </div>
          <figure className="order-1 lg:order-2">
            <div className="overflow-hidden border border-rule-strong bg-bond">
              <Image
                src={`${ASSET_BASE}/assets/document_library.png`}
                alt="DocHarvest Document Library showing captured domains, providers, pages, and export actions"
                width={1024}
                height={576}
                className="h-auto w-full"
                unoptimized
              />
            </div>
            <figcaption className="sheet-label mt-3 text-ink-3">Document Library: one place to search, open, diff, and export captures.</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export default ProductWalkthrough;
