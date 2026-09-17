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
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label">03 — THE PROVIDERS</p>
        <h2 className="sheet-head mt-4 text-ink">
          {rows.length - 1} detectors, one fallback.
        </h2>
        <p className="sheet-body mt-4 max-w-[68ch]">
          Detection runs in priority order, highest first; each detector reads the page&rsquo;s own
          markers.
        </p>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse text-left">
          <caption className="sr-only">provider, priority, signal and sample site per detector</caption>
          <thead>
            <tr className="border-y border-rule-strong">
              <th scope="col" className="sheet-label py-2 pr-4 font-medium">
                provider
              </th>
              <th scope="col" className="sheet-label py-2 pr-4 font-medium">
                priority
              </th>
              <th scope="col" className="sheet-label py-2 pr-4 font-medium">
                signal
              </th>
              <th scope="col" className="sheet-label py-2 font-medium">
                sample site
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-rule align-top">
                <td className="sheet-num py-3 pr-4 text-[13px] text-ink">{row.name}</td>
                <td className="sheet-num py-3 pr-4 text-[13px] text-ink-2">{row.detectionPriority}</td>
                <td className="sheet-body py-3 pr-4 text-[13px]">{SIGNALS[row.id]}</td>
                <td className="sheet-num py-3 text-[13px] text-ink-3">
                  <a
                    href={row.sampleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-match"
                  >
                    {row.sampleUrl.replace(/^https?:\/\//, '')}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <div className="mt-10 border-t border-rule-strong pt-4">
          <p className="sheet-label">one measured page</p>
          {measured && measured.rawHtml && measured.emitted ? (
            <div className="sheet-num mt-3 grid gap-1 text-[13px] text-ink-2">
              <p>
                raw HTML <span className="text-ink">{formatBytes(measured.rawHtml.bytes)}</span> ·{' '}
                {measured.rawHtml.url}
              </p>
              <p>
                emitted Markdown <span className="text-ink">{formatBytes(measured.emitted.bytes)}</span> ·{' '}
                {measured.emitted.path}
              </p>
              <p className="sheet-label pt-2">command: docharvest capture {measured.sourceUrl}</p>
            </div>
          ) : (
            <p className="sheet-body mt-3 text-[13px]">
              Raw-page comparison unavailable in this build.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProviderTable;
