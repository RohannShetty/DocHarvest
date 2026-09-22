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
 * - High-clarity 2-line headline & concise <20-word subtext
 * - Interactive multi-command switchboard (CLI, FastMCP, Agent Skill, Local Search)
 * - Four canonical proof metrics
 * - Live interactive index specimen beside it
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
    desc: 'Captures the site, then emits book.md, llms.txt, and SQLite search.db',
  },
  {
    id: 'mcp',
    label: 'FastMCP v2',
    cmd: 'docharvest mcp',
    desc: 'Runs the stdio server for Cursor, Claude, Codex, and other MCP clients',
  },
  {
    id: 'skill',
    label: 'Agent Skill',
    cmd: 'docharvest skill install docharvest -o .agents/skills',
    desc: 'Installs the bundled skill into an agent discovery root',
  },
  {
    id: 'search',
    label: 'Local Search',
    cmd: 'docharvest search "OAuth PKCE token refresh" --limit 5',
    desc: 'Searches local docsets with SQLite FTS5 BM25 ranking',
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
    { label: 'Token Reduction', value: `~${STATS.reductionPct}% fewer tokens`, sub: '35,240 tokens saved in reference benchmark' },
    { label: 'Capture Throughput', value: `${STATS.pagesCaptured} pages · ${STATS.captureTimeSec} s`, sub: `~${STATS.speedPagesPerSec} pages/sec` },
    { label: 'Protocol Tools', value: `${STATS.mcpTools} FastMCP v2 tools`, sub: `${STATS.harnesses} documented MCP clients` },
    { label: 'Test Suite', value: `${STATS.testsPassing} tests passing`, sub: 'root suite, 2026-09-16' },
  ];

  return (
    <section id="top" data-sheet-line="00" className="scroll-mt-16 border-b border-rule-strong bg-bond">
      <div className="grid grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:py-16">
        {/* Left column: Value Proposition & Command Switcher */}
        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="sheet-label text-match font-semibold tracking-[0.14em]">00 — THE COMPILER</span>
              <span className="sheet-num border border-rule bg-bond-2 px-2 py-0.5 text-[10px] text-ink-3">
                FastMCP v2 · SQLite FTS5 · MIT
              </span>
            </div>

            <h1 className="sheet-display mt-4 text-ink">
              Turn Any Documentation Site into Clean Markdown for AI Coding Agents.
            </h1>

            <p className="sheet-body mt-5 max-w-[60ch] text-[15px] text-ink-2 leading-relaxed">
              DocHarvest crawls, parses, and compiles web docs into unified Markdown,{' '}
              <code className="sheet-num text-ink font-mono text-[13px] bg-bond-2 px-1 py-0.5 border border-rule">llms.txt</code>,
              and 12 FastMCP tools with ~83% token reduction.
            </p>

            {/* Interactive Command Switchboard */}
            <div className="mt-7 border border-rule-strong bg-bond-2 shadow-sm">
              <div
                role="tablist"
                aria-label="Quickstart execution modes"
                className="flex border-b border-rule overflow-x-auto bg-bond"
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
                          ? 'border-b-2 border-match bg-bond-2 text-ink font-semibold'
                          : 'text-ink-3 hover:text-ink hover:bg-bond-2/50'
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
                    <span className="sheet-num w-5 shrink-0 text-right text-match select-none">$</span>
                    <code className="sheet-num min-w-0 flex-1 break-all text-xs text-ink font-mono">
                      {activeTab.cmd}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCommand(activeTab.cmd)}
                    aria-label="Copy capture command"
                    className="sheet-num inline-flex shrink-0 cursor-pointer items-center gap-1.5 bg-bond border border-rule px-2.5 py-1 text-[11px] text-ink transition-all hover:border-match active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-match"
                  >
                    {copied ? (
                      <>
                        <Check aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                        <span className="text-match font-medium">copied</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
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
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <button
                onClick={onOpenInstallModal}
                className="sheet-num cursor-pointer bg-match px-4 py-2.5 text-xs font-semibold text-bond transition-all hover:bg-match-deep active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-match"
              >
                Install in 30 seconds
              </button>
              <a
                href="https://github.com/RohannShetty/gitbook-downloader"
                target="_blank"
                rel="noreferrer"
                className="sheet-label inline-flex cursor-pointer items-center gap-1.5 border border-rule bg-bond-2 px-3.5 py-2 text-ink-2 transition-all hover:border-rule-strong hover:text-ink active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-match"
              >
                Repository
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
              </a>
            </div>

            <p className="sheet-label mt-3 text-[11px] text-ink-3">
              100% Free &amp; MIT · No account · No API key · Zero cloud telemetry
            </p>
          </div>

          {/* Verified metrics grid */}
          <ul role="list" className="mt-8 grid grid-cols-2 border-t border-rule bg-bond-2/30">
            {figures.map((fig) => (
              <li key={fig.label} className="border-b border-rule py-3 px-3 odd:border-r">
                <span className="sheet-label text-[10px] block text-ink-3">{fig.label}</span>
                <span className="sheet-num text-sm text-ink font-medium mt-0.5 block">{fig.value}</span>
                <span className="sheet-num text-[11px] text-ink-3">{fig.sub}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: Live index specimen */}
        <div className="flex flex-col lg:col-span-6">
          <div className="flex items-center justify-between">
            <p className="sheet-label text-ink-2">01 — LIVE INDEX SPECIMEN · FIRST 16 ROWS</p>
            <span className="sheet-num text-[11px] text-match">Press Enter to copy path:line</span>
          </div>
          <div className="sheet-unfurl mt-3 border border-rule-strong bg-bond-2 p-4 shadow-sm flex-1">
            <IndexSheet rows={indexData.rows} mode="specimen" provenance={indexData.provenance} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Masthead;
