import React from 'react';
import { DOC_FRAMEWORKS } from '../data/showcaseData';

export function SupportedPlatforms() {
  return (
    <section id="platforms" className="border-b border-rule bg-bond-2">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-[62ch]">
          <p className="sheet-label text-match">06 — Supported sites</p>
          <h2 className="sheet-head mt-4 text-ink">Eight readers, one fallback.</h2>
          <p className="sheet-body mt-4">
            Each dedicated reader knows where that generator keeps its content and navigation, so it can skip the
            rendered page and read the source. Everything else goes through the generic crawler, which follows
            same-domain links and extracts the main content of each page.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto border-y border-rule-strong">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">Dedicated readers and the checked-in sample URL for each</caption>
            <thead>
              <tr className="border-b border-rule-strong">
                <th scope="col" className="sheet-label py-4 pr-6 text-ink-3">Generator</th>
                <th scope="col" className="sheet-label py-4 pr-6 text-ink-3">What the reader does</th>
                <th scope="col" className="sheet-label py-4 text-ink-3">Sample site</th>
              </tr>
            </thead>
            <tbody>
              {DOC_FRAMEWORKS.map((framework) => (
                <tr key={framework.id} className="border-b border-rule last:border-b-0">
                  <th scope="row" className="py-4 pr-6 align-top text-sm font-semibold text-ink">{framework.name}</th>
                  <td className="sheet-body py-4 pr-6 align-top text-sm">{framework.approach}</td>
                  <td className="py-4 align-top font-mono text-xs">
                    <a
                      href={framework.sampleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block min-h-11 break-all py-1 text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-match focus-visible:outline-2 focus-visible:outline-match"
                    >
                      {framework.sampleUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-4 pr-6 align-top text-sm font-semibold text-ink">Anything else</th>
                <td className="sheet-body py-4 pr-6 align-top text-sm">
                  Generic crawler: same-domain links, main content per page. Client-rendered pages need the optional
                  <code className="ml-1 bg-bond px-1 py-0.5 font-mono text-[0.85em] text-ink">--render</code> flag.
                </td>
                <td className="py-4 align-top font-mono text-xs text-ink-2">any URL you are allowed to read</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="sheet-label mt-5 text-ink-3">
          Priorities and reader code live in <span className="text-ink-2">src/docharvest/providers/</span>.
        </p>
      </div>
    </section>
  );
}

export default SupportedPlatforms;
