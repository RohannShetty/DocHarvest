'use client';

import React, { useId, useRef, useState } from 'react';
import { CONNECT_PATHS } from '../data/showcaseData';
import { MCP_PROMPTS, MCP_RESOURCES, MCP_TOOLS } from '../data/mcpTools';
import { PRODUCT_FACTS } from '../lib/stats';

export function Connectivity() {
  const [activeId, setActiveId] = useState<(typeof CONNECT_PATHS)[number]['id']>('mcp');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();
  const active = CONNECT_PATHS.find((path) => path.id === activeId) ?? CONNECT_PATHS[0];
  const activeIndex = CONNECT_PATHS.findIndex((path) => path.id === active.id);

  function move(delta: number) {
    const next = (activeIndex + delta + CONNECT_PATHS.length) % CONNECT_PATHS.length;
    setActiveId(CONNECT_PATHS[next].id);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveId(CONNECT_PATHS[0].id);
      tabRefs.current[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = CONNECT_PATHS.length - 1;
      setActiveId(CONNECT_PATHS[last].id);
      tabRefs.current[last]?.focus();
    }
  }

  return (
    <section id="integrations" className="border-b border-rule">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-[62ch]">
          <p className="sheet-label text-match">05 — Integrations</p>
          <h2 className="sheet-head mt-4 text-ink">Three ways to hand an agent the corpus.</h2>
          <p className="sheet-body mt-4">
            The same corpus serves an MCP client, a skill-reading agent, or a plain script. Nothing is uploaded:
            every route reads the folder under{' '}
            <code className="bg-bond-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">{PRODUCT_FACTS.libraryRoot}</code>.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
          <div className="divide-y divide-rule border-y border-rule-strong">
            <p className="sheet-label py-3 text-ink-3">{MCP_TOOLS.length} MCP tools</p>
            <ul className="py-1 font-mono text-xs leading-relaxed text-ink-2">
              {MCP_TOOLS.map((tool) => (
                <li key={tool.name} className="py-0.5">
                  {tool.name}
                </li>
              ))}
            </ul>
            <p className="sheet-label py-3 text-ink-3">
              {MCP_RESOURCES.length} resources · {MCP_PROMPTS.length} prompts
            </p>
          </div>

          <div>
            <div role="tablist" aria-label="Integration paths" onKeyDown={onKeyDown} className="flex flex-wrap gap-px border border-rule-strong bg-rule-strong">
              {CONNECT_PATHS.map((path, index) => {
                const selected = path.id === active.id;
                return (
                  <button
                    key={path.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${path.id}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel-${path.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveId(path.id)}
                    className={`min-h-11 flex-1 cursor-pointer px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match ${
                      selected ? 'bg-match text-bond' : 'bg-bond text-ink-2 hover:bg-bond-2 hover:text-ink'
                    }`}
                  >
                    {path.label}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`${baseId}-panel-${active.id}`}
              aria-labelledby={`${baseId}-tab-${active.id}`}
              tabIndex={0}
              className="border border-t-0 border-rule-strong bg-bond px-4 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match"
            >
              <h3 className="text-lg font-semibold tracking-tight text-ink">{active.title}</h3>
              <p className="sheet-body mt-2 max-w-[58ch]">{active.detail}</p>
              <pre className="mt-4 overflow-x-auto border border-rule bg-bond-2 p-4 font-mono text-xs leading-relaxed text-ink">
                <code>{active.code}</code>
              </pre>
              <p className="sheet-label mt-3 text-ink-3">{active.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Connectivity;
