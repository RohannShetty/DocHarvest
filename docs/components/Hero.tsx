'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { IndexSheet } from './IndexSheet';
import type { IndexData } from '../lib/indexData';

interface HeroProps {
  onOpenInstallModal: () => void;
  indexData: IndexData;
}

type CommandTab = 'mcp' | 'skill' | 'cli';

const COMMANDS: Record<CommandTab, { label: string; command: string; hint: string }> = {
  mcp: {
    label: 'Universal FastMCP',
    command: 'uvx docharvest mcp',
    hint: 'Add to Claude Desktop, Cursor, or Cline. 12 tools, zero cloud dependencies.',
  },
  skill: {
    label: 'Agent Skill',
    command: 'docharvest skill install docharvest -o .agents/skills',
    hint: 'Installs universal retrieval instructions across 14+ agent harnesses.',
  },
  cli: {
    label: 'CLI Capture',
    command: 'docharvest capture https://docs.openalgo.in/v/v2.0 --rag --pdf',
    hint: 'Compiles pages/, docs.md, llms.txt, and SQLite FTS5 search index.',
  },
};

export function Hero({ onOpenInstallModal, indexData }: HeroProps) {
  const [activeTab, setActiveTab] = useState<CommandTab>('mcp');
  const [copied, setCopied] = useState(false);

  const active = COMMANDS[activeTab];

  const copyCommand = async (cmd: string) => {
    let didCopy = false;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(cmd);
        didCopy = true;
      }
    } catch {
      // Fallback
    }

    if (!didCopy) {
      const textarea = document.createElement('textarea');
      textarea.value = cmd;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      didCopy = document.execCommand('copy');
      textarea.remove();
    }

    setCopied(didCopy);
    if (didCopy) window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="product" className="border-b border-rule bg-bond px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(440px,1.1fr)] lg:items-end lg:gap-16">
        <div className="min-w-0">
          <p className="sheet-label text-match tracking-wide">Universal Documentation Engine for AI Agents</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Clean, structured docs. Zero cloud lock-in.
          </h1>
          <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-ink-2">
            DocHarvest crawls developer portals and compiles pristine, token-dense Markdown, SQLite BM25 search, and FastMCP tools directly on your local machine.
          </p>

          <div className="mt-8 rounded-none border border-rule-strong bg-bond-2 p-4">
            <div className="flex gap-2 border-b border-rule pb-3">
              {(Object.keys(COMMANDS) as CommandTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setCopied(false);
                  }}
                  className={`sheet-label cursor-pointer px-3 py-1.5 transition-colors ${
                    activeTab === tab
                      ? 'bg-match text-bond font-bold'
                      : 'text-ink-3 hover:text-ink hover:bg-bond'
                  }`}
                >
                  {COMMANDS[tab].label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <code className="min-w-0 flex-1 break-all font-mono text-sm leading-relaxed text-ink">
                {active.command}
              </code>
              <button
                type="button"
                onClick={() => copyCommand(active.command)}
                aria-label={`Copy ${active.label} command`}
                className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 border border-rule bg-bond px-3 text-xs font-semibold text-ink-2 transition-colors hover:border-match hover:text-match active:translate-y-px"
              >
                {copied ? <Check aria-hidden="true" className="h-4 w-4 text-match" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="sheet-label mt-3 text-ink-3">{active.hint}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="inline-flex min-h-11 items-center gap-2 bg-match px-5 text-sm font-semibold text-bond transition-colors hover:bg-match-deep active:translate-y-px"
            >
              Get Started / Install
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </button>
            <a
              href="https://github.com/RohannShetty/DocHarvest"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 border border-rule px-5 text-sm font-semibold text-ink-2 transition-colors hover:border-ink-2 hover:text-ink active:translate-y-px"
            >
              View on GitHub
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="min-w-0 border border-rule-strong bg-bond-2 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4 border-b border-rule pb-3">
            <div>
              <p className="sheet-label text-match">Live capture specimen</p>
              <p className="mt-1 text-sm font-semibold text-ink">The output starts as a source-backed index.</p>
            </div>
            <span className="sheet-num text-xs text-ink-3">{indexData.provenance.totalRows} rows</span>
          </div>
          <div className="mt-4">
            <IndexSheet rows={indexData.rows.slice(0, 14)} mode="specimen" provenance={indexData.provenance} />
          </div>
          <p className="sheet-label mt-4 text-ink-3">Rows are read from committed capture data, not a mock terminal.</p>
        </div>
      </div>
    </section>
  );
}

export default Hero;
