'use client';

import React from 'react';
import { Moon, Star, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { GithubIcon } from './Icons';
import { VERSION } from '../lib/version';

/**
 * The sheet's sticky head.
 *
 * Typeset wordmark, the seven section anchors as mono caps, the star count, the
 * theme toggle and one primary action. Amber is reserved for the primary action
 * here; every other control stays in the zinc ramp.
 */

const NAV = [
  { href: '#index', label: 'THE INDEX' },
  { href: '#contract', label: 'THE MANIFEST' },
  { href: '#platforms', label: 'PROVIDERS' },
  { href: '#agents', label: 'AGENTS' },
  { href: '#matrix', label: 'COMPARISON' },
  { href: '#workflows', label: 'WORKFLOWS' },
  { href: '#releases', label: 'RELEASES' },
];

/** The rail is lg-only, so every line gets a control on small screens. */
const COMPACT_NAV = [...NAV, { href: '#faq', label: 'FAQ' }, { href: '#colophon', label: 'COLOPHON' }];

interface HeaderProps {
  stars?: number;
  onOpenInstallModal: () => void;
}

export function Header({ stars, onOpenInstallModal }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const nextThemeLabel = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-bond">
      <div className="flex h-14 items-center justify-between gap-6 px-6 lg:px-12">
        <a
          href="#top"
          className="flex shrink-0 cursor-pointer items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-match"
        >
          <span className="sheet-term text-base font-semibold text-ink">DocHarvest</span>
          <span className="sheet-num text-[11px] text-ink-3">v{VERSION}</span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="sheet-label cursor-pointer transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <a
            href="https://github.com/RohannShetty/gitbook-downloader"
            target="_blank"
            rel="noreferrer"
            className="sheet-num inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            {stars !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3" />
                {stars}
              </span>
            )}
          </a>

          <button
            onClick={toggleTheme}
            title={nextThemeLabel}
            aria-label={nextThemeLabel}
            className="inline-flex cursor-pointer items-center text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={onOpenInstallModal}
            className="sheet-num cursor-pointer bg-match px-3 py-1.5 text-[12px] font-semibold text-bond transition-colors hover:bg-match-deep focus-visible:outline-2 focus-visible:outline-match"
          >
            Install
          </button>
        </div>
      </div>

      <nav aria-label="Sections (compact)" className="border-t border-rule lg:hidden">
        <ul className="flex gap-5 overflow-x-auto px-6 py-2">
          {COMPACT_NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="sheet-label block cursor-pointer whitespace-nowrap transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
