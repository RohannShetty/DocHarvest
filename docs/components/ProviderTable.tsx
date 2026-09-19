import React from 'react';
import { DOC_FRAMEWORKS } from '../data/showcaseData';
import { MANIFEST, formatBytes } from '../lib/indexData';

/**
 * Line 03 — the providers.
 *
 * Detection order and priorities are the code's own values
 * (`src/gitbook_downloader/providers/*.py`); each signal line is that detector's
 * own docstring prose. The before/after row is the one measured pair the
 * generator could fetch, and it prints only what it measured.
 */

/** Verbatim from each provider's `detect()` docstring, in priority order. */
const SIGNALS: Record<string, string> = {
  gitbook:
    'gitbook.net in any asset URL within the first 5 000 chars of HTML; window.__gitbook in a <script> tag; <meta name="generator" content="…gitbook…">.',
  mintlify:
    'window.__MINTLIFY / __mintlify in JavaScript or HTML; <meta name="generator" content="…Mintlify…">; Mintlify CDN references (cdn.mintlify.com, mintlify.app, mintlify-assets); id="__mintlify" or data-mintlify attributes; scripts loading mint.json.',
  docusaurus:
    '<meta name="docusaurus"> in <head>; CSS class theme-doc-markdown; the docusaurus-theme- substring in any class or attribute.',
  nextra:
    '<meta name="generator" content="Nextra…">; class names containing nextra-content, nextra-body or nextra-; Nextra indicators inside the __NEXT_DATA__ payload.',
  vitepress:
    '<meta name="generator" content="VitePress…">; window.__VP_HASH_MAP__ or __VP_SITE_DATA__; the standard classes VPContent, VPDoc, vp-doc; VitePress script chunks.',
  mkdocs:
    '<meta name="generator" content="mkdocs…">; Material markers data-md-component, md-content, data-md-color-primary, md-main; a reference to search/search_index.json.',
  readme:
    '<meta name="generator" content="ReadMe…">; readme.io / readme.com asset references; the elements hub-container, hub-header, hub-reference, rm-article, rm-markdown; window.__README_METRICS__.',
  readthedocs:
    'Sphinx/docutils hallmarks: sphinxsidebar, class="document"; an RTD asset or embed reference inside a <script> or <link>; Sphinx div.body together with an explicit footer credit.',
  generic: 'Always returns True — this is the catch-all fallback.',
};

const FALLBACK_ROW = {
  id: 'generic',
  name: 'Generic HTML / SPA',
  detectionPriority: 0,
  sampleUrl: 'https://omp.sh/docs',
};

export function ProviderTable() {
  const rows = [...DOC_FRAMEWORKS, FALLBACK_ROW].sort(
    (a, b) => b.detectionPriority - a.detectionPriority,
  );

  const measured = MANIFEST.captures.find((capture) => capture.rawHtml && capture.emitted);

  return (
    <section
      id="platforms"
      data-sheet-line="03"
      className="scroll-mt-16 border-t border-rule-strong bg-bond px-6 py-20 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label text-match">03 — THE PROVIDERS</p>
        <h2 className="sheet-head mt-4 text-ink">
          {rows.length - 1} detectors, one fallback.
        </h2>
        <p className="sheet-body mt-4 max-w-[68ch] text-ink-2 leading-relaxed">
          Detection runs in priority order, highest first; each detector reads the page&rsquo;s own
          markers.
        </p>

        <div className="mt-10 overflow-x-auto border border-rule-strong bg-gradient-to-b from-bond-2 to-bond-2/70 shadow-sm">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">provider, priority, signal and sample site per detector</caption>
            <thead>
              <tr className="border-b border-rule-strong bg-bond">
                <th scope="col" className="sheet-label py-3.5 px-4 font-medium text-ink">
                  provider
                </th>
                <th scope="col" className="sheet-label py-3.5 px-4 font-medium text-ink">
                  priority
                </th>
                <th scope="col" className="sheet-label py-3.5 px-4 font-medium text-ink">
                  signal
                </th>
                <th scope="col" className="sheet-label py-3.5 px-4 font-medium text-ink">
                  sample site
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-rule align-top hover:bg-bond/30 transition-colors">
                  <th scope="row" className="sheet-num py-3.5 px-4 text-left font-mono font-medium text-[13px] text-ink">
                    {row.name}
                  </th>
                  <td className="sheet-num py-3.5 px-4 text-[13px] text-match font-mono font-medium">{row.detectionPriority}</td>
                  <td className="sheet-body py-3.5 px-4 text-[13px] text-ink-2 leading-relaxed">{SIGNALS[row.id]}</td>
                  <td className="sheet-num py-3.5 px-4 text-[13px] text-ink-3">
                    <a
                      href={row.sampleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="cursor-pointer font-mono underline-offset-4 transition-colors hover:text-match hover:underline focus-visible:outline-2 focus-visible:outline-match"
                    >
                      {row.sampleUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 border-t border-rule-strong pt-8">
          <p className="sheet-label text-match">one measured page</p>
          {measured && measured.rawHtml && measured.emitted ? (
            <div className="sheet-num mt-3 grid gap-2 text-[13px] text-ink-2 border border-rule-strong bg-bond-2 p-5 font-mono shadow-sm">
              <p>
                raw HTML <span className="text-alert font-semibold">{formatBytes(measured.rawHtml.bytes)}</span> ·{' '}
                <span className="text-ink">{measured.rawHtml.url}</span>
              </p>
              <p>
                emitted Markdown <span className="text-match font-semibold">{formatBytes(measured.emitted.bytes)}</span> ·{' '}
                <span className="text-ink">{measured.emitted.path}</span>
              </p>
              <p className="sheet-label pt-2 text-ink-3">command: docharvest capture {measured.sourceUrl}</p>
            </div>
          ) : (
            <p className="sheet-body mt-3 text-[13px] text-ink-3">
              Raw-page comparison unavailable in this build.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProviderTable;
