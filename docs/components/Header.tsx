'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { GithubIcon } from './Icons';
import { VERSION } from '../lib/version';

/**
 * The sheet's sticky head.
 *
 * Typeset wordmark, section anchors as mono caps, GitHub star count,
 * theme toggle, and primary Install action.
 */

const NAV = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#outputs', label: 'Outputs' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#workflows', label: 'Workflows' },
  { href: '#platforms', label: 'Platforms' },
  { href: '#faq', label: 'FAQ' },
];

/** Mobile compact nav */
const COMPACT_NAV = NAV;

interface HeaderProps {
  stars?: number;
  onOpenInstallModal: () => void;
}

export function Header({ onOpenInstallModal }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const nextThemeLabel = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-bond transition-colors duration-200">
      <div className="flex min-h-16 items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <a
          href="#product"
          className="group flex shrink-0 cursor-pointer items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-match"
        >
          <span className="sheet-term text-base font-bold tracking-tight text-ink transition-colors group-hover:text-match">
            DocHarvest
          </span>
          <span className="sheet-num text-[11px] font-medium text-match">v{VERSION}</span>
        </a>

        <nav aria-label="Sections" className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex xl:gap-5">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="sheet-label whitespace-nowrap text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href="https://github.com/RohannShetty/gitbook-downloader"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="sheet-num inline-flex min-h-11 items-center gap-2 text-xs text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            <GithubIcon aria-hidden="true" className="h-4 w-4" />
            <span className="hidden xl:inline">GitHub</span>
          </a>

          <button
            onClick={toggleTheme}
            title={nextThemeLabel}
            aria-label={nextThemeLabel}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-ink-3 transition-colors hover:bg-bond-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            {theme === 'dark' ? (
              <Sun aria-hidden="true" className="h-4 w-4 text-match" />
            ) : (
              <Moon aria-hidden="true" className="h-4 w-4 text-match" />
            )}
          </button>

          <button
            onClick={onOpenInstallModal}
            className="sheet-num inline-flex min-h-11 items-center cursor-pointer bg-match px-4 text-[12px] font-semibold text-bond transition-all hover:bg-match-deep active:translate-y-px focus-visible:outline-2 focus-visible:outline-match"
          >
            Install
          </button>
        </div>
      </div>

      <nav aria-label="Sections (compact)" className="border-t border-rule lg:hidden bg-bond-2/60">
        <ul className="flex gap-4 overflow-x-auto px-6 py-2">
          {COMPACT_NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="sheet-label block cursor-pointer whitespace-nowrap text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
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
