'use client';

import React, { useId, useMemo, useState } from 'react';
import type { CaptureProvenance, IndexProvenance, IndexRow } from '../lib/indexData';
import { isoDate } from '../lib/indexData';

/**
 * The index sheet — the page's signature surface.
 *
 * Every visible row is a verbatim line of Markdown DocHarvest emitted, with the
 * file it came from and the line it sits on. Typing filters the sheet, ↑/↓ walk
 * the rows, Enter copies `path:line`, and amber marks only the matched term and
 * the active row. Two instances live on the page (the masthead specimen and the
 * full index); each keeps its own local filter state.
 */

const SPECIMEN_ROWS = 16;

interface IndexSheetProps {
  rows: IndexRow[];
  mode: 'specimen' | 'full';
  provenance: IndexProvenance;
}

type Entry =
  | { kind: 'plate'; capture: CaptureProvenance }
  | { kind: 'row'; row: IndexRow; option: number };

/** Wrap every occurrence of `needle` in an amber <mark>; amber is the only mark. */
function highlight(text: string, needle: string): React.ReactNode {
  if (!needle) return text;
  const haystack = text.toLowerCase();
  const target = needle.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let at = haystack.indexOf(target, cursor);
  let key = 0;

  while (at !== -1) {
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <mark key={key++} className="bg-match/20 text-match font-semibold px-0.5">
        {text.slice(at, at + target.length)}
      </mark>,
    );
    cursor = at + target.length;
    at = haystack.indexOf(target, cursor);
  }

  if (parts.length === 0) return text;
  parts.push(text.slice(cursor));
  return parts;
}

export function IndexSheet({ rows, mode, provenance }: IndexSheetProps) {
  const listId = useId().replace(/:/g, '');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.context.toLowerCase().includes(needle) ||
        row.path.toLowerCase().includes(needle) ||
        row.term.toLowerCase().includes(needle),
    );
  }, [rows, needle]);

  const visible = useMemo(
    () => (mode === 'specimen' ? filtered.slice(0, SPECIMEN_ROWS) : filtered),
    [filtered, mode],
  );

  const entries = useMemo<Entry[]>(() => {
    if (mode === 'specimen') {
      return visible.map((row, option) => ({ kind: 'row', row, option }));
    }
    const built: Entry[] = [];
    let option = 0;
    for (const capture of provenance.captures) {
      const groupRows = visible.filter((row) => row.source === capture.id);
      if (groupRows.length === 0) continue;
      built.push({ kind: 'plate', capture });
      for (const row of groupRows) {
        built.push({ kind: 'row', row, option: option++ });
      }
    }
    return built;
  }, [mode, provenance.captures, visible]);

  const optionCount = entries.reduce((count, entry) => (entry.kind === 'row' ? count + 1 : count), 0);
  const activeEntry = entries.find((entry) => entry.kind === 'row' && entry.option === activeIndex);
  const activeDescendant = activeEntry && activeEntry.kind === 'row' ? `${listId}-opt-${activeEntry.option}` : undefined;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (optionCount === 0) return;
      setActiveIndex((previous) => {
        const next = event.key === 'ArrowDown' ? previous + 1 : previous - 1;
        return Math.max(0, Math.min(optionCount - 1, next));
      });
      return;
    }
    if (event.key === 'Enter' && activeEntry && activeEntry.kind === 'row') {
      event.preventDefault();
      const citation = `${activeEntry.row.path}:${activeEntry.row.line}`;
      navigator.clipboard?.writeText(citation).catch(() => undefined);
      setCopied(citation);
    }
  };

  const pages = provenance.captures.reduce((sum, capture) => sum + capture.pages, 0);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 border-b border-rule-strong pb-2.5">
        <span className="sheet-label shrink-0 text-ink-3 tracking-wider">FILTER:</span>
        <input
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={activeDescendant}
          aria-label="Filter the index"
          placeholder="Filter the index…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setCopied(null);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-match"
        />
        {copied && (
          <span className="sheet-label shrink-0 text-match font-mono font-medium" aria-live="polite">
            copied {copied}
          </span>
        )}
      </div>

      <p className="sheet-label py-2 text-ink-3" aria-live="polite" aria-atomic="true">
        {visible.length} of {rows.length} rows · {provenance.captures.length} captures · {pages} pages
      </p>

      {visible.length === 0 ? (
        <p className="sheet-body border-t border-rule py-6 text-ink-2">
          No line contains &ldquo;{query}&rdquo;. The index holds every emitted line, not a summary of them.
        </p>
      ) : (
        <div className={mode === 'specimen' ? 'max-h-[420px] overflow-y-auto border-t border-rule' : 'border-t border-rule'}>
          <ul id={listId} role="listbox" aria-label="Index rows">
            {entries.map((entry, index) => {
              if (entry.kind === 'plate') {
                return (
                  <li
                    key={`plate-${entry.capture.id}`}
                    role="presentation"
                    className="sheet-label mt-4 flex flex-wrap items-baseline gap-x-2 border-b border-rule-strong py-2 text-ink-3"
                  >
                    <span className="text-ink font-mono font-medium">{entry.capture.id}</span>
                    <span>
                      · {entry.capture.pages} pages · captured {isoDate(entry.capture.captured)} · provider{' '}
                      <span className="text-ink font-mono">{entry.capture.provider}</span>
                    </span>
                  </li>
                );
              }

              const row = entry.row;
              const isActive = entry.option === activeIndex;

              return (
                <li
                  key={`${row.source}-${row.path}-${row.line}-${row.term}-${index}`}
                  id={`${listId}-opt-${entry.option}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveIndex(entry.option);
                    const citation = `${row.path}:${row.line}`;
                    navigator.clipboard?.writeText(citation).catch(() => undefined);
                    setCopied(citation);
                  }}
                  className={`relative flex cursor-pointer items-start gap-3 border-b border-rule/60 py-2.5 pl-3 pr-2 text-[13px] text-ink transition-colors before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-match before:opacity-0 before:content-[''] hover:before:opacity-100 hover:bg-bond-2/60 ${
                    isActive ? 'before:opacity-100 bg-bond-2/80 font-medium' : ''
                  }`}
                >
                  <span
                    className={`sheet-num w-10 shrink-0 text-right font-mono ${
                      isActive ? 'text-match font-bold' : 'text-ink-3'
                    }`}
                  >
                    {row.line}
                  </span>
                  <span className="min-w-0 flex-1 break-words leading-relaxed">
                    <span className="sheet-num text-ink-3 font-mono [overflow-wrap:anywhere]">
                      {highlight(row.path, needle)}:{row.line}
                    </span>{' '}
                    <span className="font-sans text-ink">{highlight(row.context, needle)}</span>{' '}
                    <span className="sheet-label text-[10px] text-ink-3 font-mono ml-1">{row.source}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default IndexSheet;
