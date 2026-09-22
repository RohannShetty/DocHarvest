import React from 'react';
import { FAQ_ITEMS } from '../data/showcaseData';

export function Faq() {
  return (
    <section id="faq" className="border-b border-rule-strong bg-bond px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-4xl">
        <p className="sheet-label text-match">FAQ</p>
        <h2 className="sheet-head mt-4 text-ink">Before you capture a site.</h2>
        <p className="sheet-body mt-4 max-w-[62ch] text-ink-2">Short answers about access, privacy, output scope, and agent connections.</p>

        <div className="mt-10 divide-y divide-rule border-y border-rule-strong">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-lg font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span aria-hidden="true" className="sheet-num shrink-0 text-xl font-normal text-match transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="sheet-body mt-4 max-w-[72ch] pr-8 text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Faq;
