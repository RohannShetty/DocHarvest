import React from 'react';
import { DOC_FRAMEWORKS } from '../data/showcaseData';
import { PRODUCT_FACTS } from '../lib/stats';

export function SupportedPlatforms() {
  return (
    <section id="platforms" className="border-b border-rule-strong bg-bond px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="sheet-label text-match">Supported platforms</p>
          <h2 className="sheet-head mt-4 text-ink">Detect the platform. Keep the content.</h2>
          <p className="sheet-body mt-4 text-ink-2">Dedicated detectors handle the documentation systems most teams publish with. A generic provider remains available for custom portals and SPAs.</p>
        </div>

        <div className="mt-10 overflow-x-auto border-y border-rule-strong">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">DocHarvest dedicated documentation platform detectors</caption>
            <thead>
              <tr className="border-b border-rule-strong">
                <th scope="col" className="sheet-label py-4 pr-6 text-ink-3">Detector</th>
                <th scope="col" className="sheet-label py-4 pr-6 text-ink-3">Priority</th>
                <th scope="col" className="sheet-label py-4 text-ink-3">Reference site</th>
              </tr>
            </thead>
            <tbody>
              {DOC_FRAMEWORKS.map((framework) => (
                <tr key={framework.id} className="border-b border-rule last:border-b-0">
                  <th scope="row" className="py-4 pr-6 text-sm font-semibold text-ink">{framework.name}</th>
                  <td className="sheet-num py-4 pr-6 text-sm text-match">{framework.detectionPriority}</td>
                  <td className="py-4 text-sm text-ink-2"><a href={framework.sampleUrl} target="_blank" rel="noreferrer" className="break-all underline decoration-rule-strong underline-offset-4 hover:text-match">{framework.sampleUrl}</a></td>
                </tr>
              ))}
              <tr className="bg-bond-2">
                <th scope="row" className="py-4 pr-6 text-sm font-semibold text-ink">Generic HTML and SPA</th>
                <td className="sheet-num py-4 pr-6 text-sm text-match">0</td>
                <td className="py-4 text-sm text-ink-2">Fallback for portals without a dedicated detector</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="sheet-label mt-5 text-ink-3">{PRODUCT_FACTS.dedicatedProviders} dedicated detectors plus a generic fallback. Detection is automatic.</p>
      </div>
    </section>
  );
}

export default SupportedPlatforms;
