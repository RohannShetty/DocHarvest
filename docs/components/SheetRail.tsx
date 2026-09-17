'use client';

import React, { useEffect, useState } from 'react';

/**
 * The sheet rail — the margin numbering of the whole page.
 *
 * Ten numbered lines (00–09) run down the left margin at `lg` and up; the line
 * currently crossing the middle band of the viewport is the only amber thing in
 * the rail, and it carries `aria-current`. Tracking is a single
 * IntersectionObserver over `section[data-sheet-line]` — no scroll listener and
 * no animation frame loop.
 */

interface SheetLine {
  id: string;
  num: string;
  label: string;
}

export const SHEET_LINES: SheetLine[] = [
  { id: 'top', num: '00', label: 'Masthead' },
  { id: 'index', num: '01', label: 'The index' },
  { id: 'contract', num: '02', label: 'The manifest' },
  { id: 'platforms', num: '03', label: 'The providers' },
  { id: 'agents', num: '04', label: 'The agents' },
  { id: 'matrix', num: '05', label: 'The comparison' },
  { id: 'workflows', num: '06', label: 'The workflows' },
  { id: 'releases', num: '07', label: 'Releases' },
  { id: 'faq', num: '08', label: 'The FAQ' },
  { id: 'colophon', num: '09', label: 'Colophon' },
];

export function SheetRail() {
  const [activeId, setActiveId] = useState<string>(SHEET_LINES[0].id);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('section[data-sheet-line]'),
    );
    if (sections.length === 0) return;

    const intersecting = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) intersecting.add(id);
          else intersecting.delete(id);
        }
        // The band is 5% of the viewport tall, so usually one line crosses it;
        // document order breaks the tie when two do.
        const current = sections.find((section) => intersecting.has(section.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Sheet contents"
      className="fixed bottom-0 left-0 top-0 z-30 hidden w-14 flex-col justify-center gap-px border-r border-rule bg-bond lg:flex"
    >
      {SHEET_LINES.map((line) => {
        const isActive = line.id === activeId;
        return (
          <a
            key={line.id}
            href={`#${line.id}`}
            aria-label={`${line.num} — ${line.label}`}
            aria-current={isActive ? 'true' : undefined}
            className={`sheet-num flex cursor-pointer items-center py-1.5 pl-3 text-[11px] tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-match ${
              isActive ? 'text-match' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {line.num}
          </a>
        );
      })}
    </nav>
  );
}

export default SheetRail;
