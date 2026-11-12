'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { GithubIcon } from './Icons';
import { VERSION } from '../lib/version';

/**
 * The sticky head.
 *
 * Wordmark, the five section anchors, Docs and GitHub as outbound links, the
 * theme toggle, and the Install action. The anchors also carry the current
 * section: an IntersectionObserver marks the one in view with aria-current and
 * a rule under the label, so the head says where you are instead of only where
 * you can go.
 */

const NAV = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#outputs', label: 'Outputs' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#workflows', label: 'Workflows' },
];

const DOCS_URL = 'https://github.com/RohannShetty/DocHarvest#readme';
const GITHUB_URL = 'https://github.com/RohannShetty/DocHarvest';

interface HeaderProps {
  onOpenInstallModal: () => void;
}

function useActiveSection(): string {
  const [active, setActive] = React.useState<string>('');

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = NAV.map((item) => document.getElementById(item.href.slice(1))).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive('#' + visible.target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return active;
}

export function Header({ onOpenInstallModal }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const active = useActiveSection();
  const nextThemeLabel = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-bond">
      <div className="mx-auto flex min-h-16 w-full max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
        <a
          href="#product"
          className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 focus-visible:outline-2 focus-visible:outline-match"
        >
          <span className="sheet-term text-base font-bold tracking-tight text-ink">DocHarvest</span>
          <span className="sheet-num text-[11px] font-medium text-match">v{VERSION}</span>
        </a>

        {/* Five labels plus two outbound links need the full row; below that
            the compact scrolling row carries the anchors. */}
        <nav
          aria-label="Sections"
          className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex"
        >
          {NAV.map((item) => {
            const isActive = active === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'location' : undefined}
                className={
                  'sheet-label cursor-pointer whitespace-nowrap border-b-2 py-5 transition-colors focus-visible:outline-2 focus-visible:outline-match ' +
                  (isActive
                    ? 'border-match text-ink'
                    : 'border-transparent text-ink-3 hover:text-ink')
                }
              >
                {item.label}
              </a>
            );
          })}
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="sheet-label cursor-pointer whitespace-nowrap border-b-2 border-transparent py-5 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            Docs
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="sheet-num inline-flex min-h-11 items-center gap-2 px-1 text-xs text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
          >
            <GithubIcon aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
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
            className="sheet-num inline-flex min-h-11 cursor-pointer items-center bg-match px-4 text-[12px] font-semibold text-bond transition-colors hover:bg-match-deep focus-visible:outline-2 focus-visible:outline-match"
          >
            Install
          </button>
        </div>
      </div>

      <nav
        aria-label="Sections (compact)"
        className="nav-fade relative border-t border-rule bg-bond-2 lg:hidden"
      >
        <ul className="flex gap-4 overflow-x-auto px-5 py-1 pr-10 sm:px-8">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active === item.href ? 'location' : undefined}
                className={
                  'sheet-label block min-h-11 cursor-pointer whitespace-nowrap py-4 transition-colors focus-visible:outline-2 focus-visible:outline-match ' +
                  (active === item.href ? 'text-ink' : 'text-ink-3 hover:text-ink')
                }
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="sheet-label block min-h-11 cursor-pointer whitespace-nowrap py-4 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              Docs
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
