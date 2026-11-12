'use client';

import React, { useId, useRef, useState } from 'react';

/**
 * The four ways to run the same corpus, as a tab set rather than four stacked
 * rows: one command on screen at a time, keyboard-reachable, and each tab links
 * to the section that explains it in depth.
 */
export const WORKFLOW_PATHS = [
  {
    id: 'cli',
    label: 'CLI',
    title: 'Repeatable captures',
    body: 'Flags, presets, path scopes, and output modes for scripts and local development. This is the surface the other three call.',
    command: 'docharvest capture https://docs.example.com --output both',
    href: '#outputs',
    linkLabel: 'See what it writes',
  },
  {
    id: 'gui',
    label: 'Desktop GUI',
    title: 'Visual control',
    body: 'Capture Studio runs the same engine: paste a URL, confirm the detected framework and scope, then watch pages land while it works.',
    command: 'docharvest gui',
    href: '#walkthrough',
    linkLabel: 'See the two screens',
  },
  {
    id: 'mcp',
    label: 'MCP server',
    title: 'Agent-led lookup',
    body: 'Twelve tools over stdio: capture, search, read, diff, export, and graph queries. The agent asks; the library answers from disk.',
    command: 'docharvest mcp',
    href: '#integrations',
    linkLabel: 'See the client config',
  },
  {
    id: 'skill',
    label: 'Agent skill',
    title: 'Guided retrieval',
    body: 'For harnesses that read skill files instead of MCP. The bundled skill tells the agent when to search the local corpus first.',
    command: 'docharvest skill install docharvest -o .agents/skills',
    href: '#integrations',
    linkLabel: 'See the skill setup',
  },
] as const;

export function WorkflowPaths() {
  const [activeId, setActiveId] = useState<string>(WORKFLOW_PATHS[0].id);
  const baseId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = WORKFLOW_PATHS.find((path) => path.id === activeId) ?? WORKFLOW_PATHS[0];

  const focusTab = (id: string) => {
    setActiveId(id);
    tabRefs.current[id]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const index = WORKFLOW_PATHS.findIndex((path) => path.id === activeId);
    if (index === -1) return;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % WORKFLOW_PATHS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + WORKFLOW_PATHS.length) % WORKFLOW_PATHS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = WORKFLOW_PATHS.length - 1;
    else return;
    event.preventDefault();
    focusTab(WORKFLOW_PATHS[next].id);
  };

  return (
    <section id="workflows" className="border-b border-rule bg-bond-2">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <p className="sheet-label text-match">02 — Workflows</p>
            <h2 className="sheet-head mt-4 text-ink">The same corpus, four ways in.</h2>
            <p className="sheet-body mt-5 max-w-[40ch]">
              Pick the surface that matches the task. Whichever you choose, the files and the
              library stay in one place.
            </p>
          </div>

          <div className="min-w-0">
            <div role="tablist" aria-label="Workflows" className="flex flex-wrap gap-2 border-b border-rule-strong pb-3">
              {WORKFLOW_PATHS.map((path) => {
                const selected = path.id === activeId;
                return (
                  <button
                    key={path.id}
                    ref={(node) => {
                      tabRefs.current[path.id] = node;
                    }}
                    id={`${baseId}-tab-${path.id}`}
                    role="tab"
                    type="button"
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel-${path.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveId(path.id)}
                    onKeyDown={onKeyDown}
                    className={
                      'sheet-label min-h-11 cursor-pointer px-3 transition-colors focus-visible:outline-2 focus-visible:outline-match ' +
                      (selected ? 'bg-match text-bond' : 'text-ink-3 hover:text-ink')
                    }
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
              className="pt-6 focus-visible:outline-2 focus-visible:outline-match"
            >
              <h3 className="text-xl font-semibold tracking-tight text-ink">{active.title}</h3>
              <p className="sheet-body mt-3">{active.body}</p>
              <code className="mt-5 block break-words border-l-2 border-match pl-3 text-xs leading-relaxed text-ink">
                {active.command}
              </code>
              <a
                href={active.href}
                className="sheet-label mt-5 inline-flex min-h-11 cursor-pointer items-center text-match transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
              >
                {active.linkLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkflowPaths;
