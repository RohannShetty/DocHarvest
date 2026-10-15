import React from 'react';
import { DOC_FRAMEWORKS } from '../data/showcaseData';
import { PRODUCT_FACTS } from '../lib/stats';

export function SupportedPlatforms() {
  return (
    <section id="platforms" className="border-b border-rule-strong bg-bond px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="sheet-label text-match">Universal Extraction</p>
          <h2 className="sheet-head mt-4 text-ink">Scrape & compile any site. Keep the content.</h2>
          <p className="sheet-body mt-4 text-ink-2">DocHarvest crawls and compiles any technical website, API documentation portal, developer hub, blog, or single-page app (SPA). Specialized native detectors extract pristine AST markdown directly, with a universal engine fallback for all other sites.</p>
        </div>

        <div className="mt-10 overflow-x-auto border-y border-rule-strong">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">DocHarvest universal scraper and platform extraction engines</caption>
            <thead>
              <tr className="border-b border-rule-strong">
                <th scope="col" className="sheet-label py-4 pr-6 text-ink-3">Platform / Engine</th>
                <th scope="col" className="sheet-label py-4 pr-6 text-ink-3">Extraction Strategy</th>
                <th scope="col" className="sheet-label py-4 text-ink-3">Example Sites</th>
              </tr>
            </thead>
            <tbody>
              {DOC_FRAMEWORKS.map((framework) => (
                <tr key={framework.id} className="border-b border-rule last:border-b-0">
                  <th scope="row" className="py-4 pr-6 text-sm font-semibold text-ink">{framework.name}</th>
                  <td className="sheet-num py-4 pr-6 text-sm text-match">Native AST Probing (P{framework.detectionPriority})</td>
                  <td className="py-4 text-sm text-ink-2"><a href={framework.sampleUrl} target="_blank" rel="noreferrer" className="break-all underline decoration-rule-strong underline-offset-4 hover:text-match">{framework.sampleUrl}</a></td>
                </tr>
              ))}
              <tr className="bg-bond-2">
                <th scope="row" className="py-4 pr-6 text-sm font-semibold text-ink">Any Custom Website / SPA</th>
                <td className="sheet-num py-4 pr-6 text-sm text-match">Universal DOM Traversal + Headless Engine</td>
                <td className="py-4 text-sm text-ink-2">Any domain, web portal, API doc, or client-rendered SPA</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="sheet-label mt-5 text-ink-3">Works with any URL out of the box — {PRODUCT_FACTS.dedicatedProviders} native detectors plus universal scraping engine.</p>
      </div>
    </section>
  );
}

export default SupportedPlatforms;
