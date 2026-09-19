'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy, Terminal, Bot, Zap, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { IndexSheet } from './IndexSheet';
import { STATS } from '../lib/stats';
import type { IndexData } from '../lib/indexData';

/**
 * Line 00 — The Masthead / Hero.
 *
 * Designed with anti-slop developer-tool aesthetics:
 * - High-clarity headline (< 2 lines) & value proposition
 * - Interactive multi-command switchboard (CLI, FastMCP, uvx, RAG)
 * - Four canonical proof metrics
 * - Live index specimen beside it
 */

interface MastheadProps {
  onOpenInstallModal: () => void;
  indexData: IndexData;
}

const COMMAND_TABS = [
  {
    id: 'cli',
    label: 'CLI Capture',
    cmd: 'docharvest capture https://docs.openalgo.in/v/v2.0 --rag --pdf',
    desc: 'Downloads, strips noise, emits book.md, llms.txt & SQLite search.db',
  },
  {
    id: 'mcp',
    label: 'FastMCP v2',
    cmd: 'uvx gitbook-downloader mcp',
    desc: 'Runs standard stdio MCP server for Cursor, Claude, Codex & 14+ IDEs',
  },
  {
    id: 'skill',
    label: 'Agent Skill',
    cmd: 'gitbook-dl skill install docharvest -o .agents/skills',
    desc: '1-click universal skill injection for autonomous coding harnesses',
  },
  {
    id: 'search',
    label: 'Local Search',
    cmd: 'docharvest search "OAuth PKCE token refresh" --limit 5',
    desc: 'Sub-15ms BM25 ranked full-text search across all local docsets',
  },
];

export function Masthead({ onOpenInstallModal, indexData }: MastheadProps) {
  const [activeTab, setActiveTab] = useState(COMMAND_TABS[0]);
  const [copied, setCopied] = useState(false);

  const copyCommand = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const figures = [
    { label: 'Token Reduction', value: `~${STATS.reductionPct}% fewer tokens`, sub: '35k+ noise stripped' },
    { label: 'Capture Throughput', value: `${STATS.pagesCaptured} pages · ${STATS.captureTimeSec} s`, sub: `~${STATS.speedPagesPerSec} pages/sec` },
    { label: 'Protocol Tools', value: `${STATS.mcpTools} FastMCP v2 tools`, sub: '14+ agent harnesses' },
    { label: 'Test Suite', value: `${STATS.testsPassing} tests passing`, sub: '100% verified offline' },
  ];

  return (
    <section id="top" data-sheet-line="00" className="scroll-mt-16 border-b border-rule-strong">
      <div className="grid grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:py-20">
        <div className="lg:col-span-6">
          <div className="flex items-center gap-2">
            <span className="sheet-label text-match font-semibold">00 — THE COMPILER</span>
            <span className="sheet-num border border-rule bg-bond-2 px-2 py-0.5 text-[10px] text-ink-3">
              FastMCP v2 · SQLite FTS5 · MIT
            </span>
          </div>

          <h1 className="sheet-display mt-4 text-ink">
            Turn Any Documentation Site into Clean Markdown for AI Coding Agents.
          </h1>

          <p className="sheet-body mt-5 max-w-[65ch] text-[15px] leading-relaxed">
            DocHarvest crawls, parses, and compiles web docs into unified Markdown,{' '}
            <code className="sheet-num text-ink font-mono text-[13px]">llms.txt</code>, offline SQLite FTS5 BM25 search,
            and 12 FastMCP tools for Claude Code, Cursor, and 14+ agent harnesses with ~83% token reduction.
          </p>

          {/* Interactive Command Switchboard */}
          <div className="mt-8 border border-rule-strong bg-bond-2">
            <div
              role="tablist"
              aria-label="Quickstart execution modes"
              className="flex border-b border-rule overflow-x-auto"
            >
              {COMMAND_TABS.map((tab) => {
                const isActive = tab.id === activeTab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveTab(tab);
                      setCopied(false);
                    }}
                    className={`sheet-label cursor-pointer px-3.5 py-2 text-[11px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-match ${
                      isActive
                        ? 'border-b-2 border-match bg-bond text-ink font-semibold'
                        : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="sheet-num w-6 shrink-0 text-right text-match">$</span>
                  <code className="sheet-num min-w-0 flex-1 break-all text-xs text-ink">
                    {activeTab.cmd}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => copyCommand(activeTab.cmd)}
                  aria-label="Copy capture command"
                  className="sheet-num inline-flex shrink-0 cursor-pointer items-center gap-1.5 bg-bond border border-rule px-2.5 py-1 text-[11px] text-ink transition-colors hover:border-match focus-visible:outline-2 focus-visible:outline-match"
                >
                  {copied ? (
                    <>
                      <Check aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                      <span className="text-match">copied</span>
                    </>
                  ) : (
                    <>
                      <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                      <span>copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="sheet-label mt-2 text-[10px] text-ink-3">
                {activeTab.desc}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              onClick={onOpenInstallModal}
              className="sheet-num cursor-pointer bg-match px-4 py-2.5 text-xs font-semibold text-bond transition-colors hover:bg-match-deep focus-visible:outline-2 focus-visible:outline-match"
            >
              Install in 30 seconds
            </button>
            <a
              href="https://github.com/RohannShetty/gitbook-downloader"
              target="_blank"
              rel="noreferrer"
              className="sheet-label inline-flex cursor-pointer items-center gap-1.5 border border-rule bg-bond-2 px-3.5 py-2 text-ink-2 transition-colors hover:border-rule-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              Repository
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
            </a>
          </div>

          <p className="sheet-label mt-3 text-[11px]">
            100% Free &amp; MIT · No account · No API key · Zero cloud telemetry
          </p>

          {/* Verified metrics grid */}
          <ul role="list" className="mt-8 grid grid-cols-2 border-t border-rule">
            {figures.map((fig) => (
              <li key={fig.label} className="border-b border-rule py-3 pr-4 odd:border-r">
                <span className="sheet-label text-[10px] block">{fig.label}</span>
                <span className="sheet-num text-sm text-ink font-medium mt-0.5 block">{fig.value}</span>
                <span className="sheet-num text-[11px] text-ink-3">{fig.sub}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Live index specimen */}
        <div className="lg:col-span-6">
          <div className="flex items-center justify-between">
            <p className="sheet-label">01 — LIVE INDEX SPECIMEN · FIRST 16 ROWS</p>
            <span className="sheet-num text-[11px] text-match">Press Enter to copy path:line</span>
          </div>
          <div className="sheet-unfurl mt-3 border border-rule bg-bond p-4">
            <IndexSheet rows={indexData.rows} mode="specimen" provenance={indexData.provenance} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Masthead;
