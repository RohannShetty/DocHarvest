'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';
import { GithubIcon, LinkedinIcon, XIcon } from './Icons';
import { VERSION } from '../lib/version';

/**
 * Line 09 — the colophon.
 *
 * Imprint only: version, licence, author, links that already existed, and a way
 * back to the top of the sheet. No boxes, no badges.
 */

const AUTHOR_LINKS = [
  { href: 'https://github.com/RohannShetty', label: 'GitHub', Icon: GithubIcon },
  { href: 'https://www.linkedin.com/in/rohan-shettyy/', label: 'LinkedIn', Icon: LinkedinIcon },
  { href: 'https://x.com/rohan__shetty', label: 'X', Icon: XIcon },
  { href: 'mailto:shettyrohan2@gmail.com', label: 'Mail', Icon: null },
];

export function Colophon() {
  return (
    <section
      id="colophon"
      data-sheet-line="09"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-12 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label">09 — COLOPHON</p>

        <dl className="mt-6 grid gap-y-3 border-t border-rule-strong pt-6 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <dt className="sheet-label">build</dt>
            <dd className="sheet-num text-ink">DocHarvest v{VERSION}</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <dt className="sheet-label">licence</dt>
            <dd className="sheet-num text-ink">MIT · $0</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <dt className="sheet-label">author</dt>
            <dd className="sheet-num text-ink">Rohan Shetty</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <dt className="sheet-label">copyright</dt>
            <dd className="sheet-num text-ink">© {new Date().getFullYear()}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-6">
          {AUTHOR_LINKS.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer"
              className="sheet-label inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
              {label}
            </a>
          ))}

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="sheet-label ml-auto inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            Back to top
            <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Colophon;
