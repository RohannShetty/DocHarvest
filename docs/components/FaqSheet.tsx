'use client';

import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { FAQ_ITEMS } from '../data/showcaseData';

/**
 * Line 08 — the FAQ.
 *
 * The five answers exactly as `FAQ_ITEMS` holds them: this same array is the
 * JSON-LD `FAQPage` source, so the visible text and the structured data must not
 * drift. Ruled accordion, `aria-expanded` / `aria-controls` intact.
 */
export function FaqSheet() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      data-sheet-line="08"
      className="scroll-mt-16 border-t border-rule-strong bg-bond px-6 py-20 lg:px-12"
    >
      <div className="mx-auto max-w-3xl">
        <p className="sheet-label text-match">08 — THE FAQ</p>
        <h2 className="sheet-head mt-4 text-ink">Answered, on the record.</h2>
        <p className="sheet-body mt-3 max-w-[65ch] text-ink-2 leading-relaxed">
          Common architectural and implementation questions regarding DocHarvest compilation,
          FastMCP v2 integration, token economy, and local indexing guarantees.
        </p>

        <div className="mt-10 border-t border-rule-strong">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.q} className="border-b border-rule transition-colors">
                <button
                  id={`faq-button-${index}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-content-${index}`}
                  className="flex w-full cursor-pointer items-baseline justify-between gap-6 py-4.5 text-left focus-visible:outline-2 focus-visible:outline-match group"
                >
                  <span className={`sheet-term text-[15px] transition-colors ${isOpen ? 'text-match font-semibold' : 'text-ink group-hover:text-match'}`}>
                    {item.q}
                  </span>
                  {isOpen ? (
                    <Minus aria-hidden="true" className="h-4 w-4 shrink-0 text-match" />
                  ) : (
                    <Plus aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-3 group-hover:text-ink" />
                  )}
                </button>

                {isOpen && (
                  <div
                    id={`faq-content-${index}`}
                    role="region"
                    aria-labelledby={`faq-button-${index}`}
                  >
                    <p className="sheet-body pb-6 pr-8 text-[14px] text-ink-2 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FaqSheet;
