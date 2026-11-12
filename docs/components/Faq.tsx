import React from 'react';
import { FAQ_ITEMS } from '../data/showcaseData';

export function Faq() {
  return (
    <section id="faq" className="border-b border-rule">
      <div className="mx-auto w-full max-w-[860px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-[62ch]">
          <p className="sheet-label text-match">09 — Questions</p>
          <h2 className="sheet-head mt-4 text-ink">Things people ask first.</h2>
        </div>

        <div className="mt-10 divide-y divide-rule border-y border-rule-strong">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-base font-medium text-ink marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span aria-hidden="true" className="sheet-num shrink-0 text-xl font-normal text-match transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="sheet-body max-w-[72ch] pb-5 pr-8">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Faq;
