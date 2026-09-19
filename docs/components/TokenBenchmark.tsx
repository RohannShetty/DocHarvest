'use client';

import React, { useState } from 'react';
import { TOKEN_BENCHMARK } from '../data/showcaseData';
import { STATS } from '../lib/stats';
import { ShieldCheck, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export function TokenBenchmark() {
  const [activeView, setActiveView] = useState<'comparison' | 'noiseBreakdown' | 'preservedContent'>('comparison');
  const { rawScraper, docHarvest } = TOKEN_BENCHMARK;

  return (
    <div className="mt-12 border-t border-rule-strong pt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="sheet-label text-match">TOKEN ECONOMY &amp; BENCHMARK</p>
          <h3 className="sheet-head mt-2 text-ink">
            ~{STATS.reductionPct}% Token Reduction. Zero HTML/JSX Soup.
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="sheet-num text-[12px] text-match font-semibold font-mono">
            {docHarvest.tokensSaved.toLocaleString()} tokens saved per capture set
          </span>
        </div>
      </div>

      <p className="sheet-body mt-3 max-w-[68ch] text-ink-2">
        Raw HTML scrapers and cloud reader APIs waste over 80% of your model&rsquo;s context window on cookie banners,
        navigation sidebars, and client hydration scripts. DocHarvest extracts clean, AST-isolated Markdown
        so your agent only reads what matters.
      </p>

      {/* Visual comparison bar */}
      <div className="mt-8 border border-rule-strong bg-bond-2 p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Raw Scraper Bar */}
          <div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="sheet-term text-[13px] text-ink font-medium">{rawScraper.label}</span>
                <span className="sheet-num text-[11px] text-ink-3 font-mono">({rawScraper.totalBytes})</span>
              </div>
              <span className="sheet-num text-[13px] text-ink-2 font-medium font-mono">
                {rawScraper.totalTokens.toLocaleString()} tokens (100%)
              </span>
            </div>
            {/* Visual multi-segmented bar representing noise breakdown */}
            <div className="mt-2.5 flex h-4 w-full border border-rule overflow-hidden">
              <div
                style={{ width: '35%' }}
                className="h-full bg-zinc-700 transition-all"
                title="Navigation & Sidebar DOMs (35%)"
              />
              <div
                style={{ width: '32%' }}
                className="h-full bg-zinc-600 transition-all"
                title="Client JS Hydration Bundles (32%)"
              />
              <div
                style={{ width: '10%' }}
                className="h-full bg-zinc-500 transition-all"
                title="Cookie Banners & Modals (10%)"
              />
              <div
                style={{ width: '6%' }}
                className="h-full bg-zinc-400 transition-all"
                title="CSS Classes & Style Tags (6%)"
              />
              <div
                style={{ width: '17%' }}
                className="h-full bg-zinc-300 transition-all"
                title="Residual Boilerplate & Actual Content (17%)"
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 text-[10px] text-ink-3 sheet-num">
              <span>■ 35% Nav/Sidebar</span>
              <span>■ 32% Hydration JS</span>
              <span>■ 10% Cookie Modals</span>
              <span>■ 6% CSS Soup</span>
              <span>■ 17% Content</span>
            </div>
          </div>

          {/* DocHarvest Bar */}
          <div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="sheet-term text-[13px] text-match font-medium">{docHarvest.label}</span>
                <span className="sheet-num text-[11px] text-match/80 font-mono">({docHarvest.totalBytes})</span>
              </div>
              <span className="sheet-num text-[13px] text-match font-semibold font-mono">
                {docHarvest.totalTokens.toLocaleString()} tokens (~{100 - docHarvest.reductionPercentage}% of raw)
              </span>
            </div>
            <div className="mt-2.5 flex h-4 w-full border border-rule overflow-hidden bg-bond">
              <div
                style={{ width: `${100 - docHarvest.reductionPercentage}%` }}
                className="h-full bg-match transition-all"
                title="AST Clean Markdown (17.1%)"
              />
              <div
                style={{ width: `${docHarvest.reductionPercentage}%` }}
                className="h-full bg-bond-2 transition-all flex items-center justify-center border-l border-rule"
              >
                <span className="sheet-label text-[9px] text-match truncate px-1 font-semibold">
                  83% NOISE ELIMINATED
                </span>
              </div>
            </div>
            <p className="mt-1.5 sheet-label text-[10px] text-match">
              ✓ 100% Pure Semantic Markdown · 0 Web Garbage · Zero Hallucination Risk
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-rule pt-6 sm:grid-cols-4">
          <div>
            <span className="sheet-label text-[10px] text-ink-3">Token Savings</span>
            <p className="sheet-num mt-1 text-[20px] font-bold text-ink font-mono">
              ~{STATS.reductionPct}%
            </p>
            <p className="sheet-num text-[11px] text-ink-3 font-mono">82.8% measured</p>
          </div>
          <div>
            <span className="sheet-label text-[10px] text-ink-3">Tokens Stripped</span>
            <p className="sheet-num mt-1 text-[20px] font-bold text-match font-mono">
              {docHarvest.tokensSaved.toLocaleString()}
            </p>
            <p className="sheet-num text-[11px] text-ink-3">per doc snapshot</p>
          </div>
          <div>
            <span className="sheet-label text-[10px] text-ink-3">Byte Reduction</span>
            <p className="sheet-num mt-1 text-[20px] font-bold text-ink font-mono">
              312 KB → 34 KB
            </p>
            <p className="sheet-num text-[11px] text-ink-3 font-mono">89.1% smaller</p>
          </div>
          <div>
            <span className="sheet-label text-[10px] text-ink-3">Context Window Cost</span>
            <p className="sheet-num mt-1 text-[20px] font-bold text-match font-mono">
              $0.00
            </p>
            <p className="sheet-num text-[11px] text-ink-3">100% local FTS5 index</p>
          </div>
        </div>

        {/* Sub-view tab navigation for detailed breakdown */}
        <div
          role="tablist"
          aria-label="Benchmark details view"
          className="mt-8 flex border-b border-rule"
        >
          <button
            type="button"
            role="tab"
            id="tab-view-comparison"
            aria-selected={activeView === 'comparison'}
            aria-controls="panel-view-comparison"
            onClick={() => setActiveView('comparison')}
            className={`sheet-label cursor-pointer border-r border-rule px-4 py-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-match ${
              activeView === 'comparison' ? 'bg-bond text-match border-t-2 border-t-match font-semibold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Overview &amp; Agent Impact
          </button>
          <button
            type="button"
            role="tab"
            id="tab-view-noise"
            aria-selected={activeView === 'noiseBreakdown'}
            aria-controls="panel-view-noise"
            onClick={() => setActiveView('noiseBreakdown')}
            className={`sheet-label cursor-pointer border-r border-rule px-4 py-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-match ${
              activeView === 'noiseBreakdown' ? 'bg-bond text-match border-t-2 border-t-match font-semibold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Stripped Noise Breakdown (35,240 tokens)
          </button>
          <button
            type="button"
            role="tab"
            id="tab-view-preserved"
            aria-selected={activeView === 'preservedContent'}
            aria-controls="panel-view-preserved"
            onClick={() => setActiveView('preservedContent')}
            className={`sheet-label cursor-pointer border-r border-rule px-4 py-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-match ${
              activeView === 'preservedContent' ? 'bg-bond text-match border-t-2 border-t-match font-semibold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Preserved Semantics (7,240 tokens)
          </button>
        </div>

        {/* Tabpanel 1: Overview */}
        {activeView === 'comparison' && (
          <div
            role="tabpanel"
            id="panel-view-comparison"
            aria-labelledby="tab-view-comparison"
            tabIndex={0}
            className="mt-6 space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-rule bg-bond p-4">
                <div className="flex items-center gap-2 text-alert">
                  <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                  <span className="sheet-term text-[13px] font-semibold text-ink">What Raw Scrapers Hand Your Agent</span>
                </div>
                <ul className="mt-3 space-y-2 sheet-body text-[12px] text-ink-2">
                  <li className="flex items-start gap-2">
                    <span className="text-alert font-mono">✗</span>
                    <span>Massive cookie &amp; consent banners that mislead LLM attention mechanisms.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-alert font-mono">✗</span>
                    <span>40KB+ of client hydration bundles (<code className="sheet-num text-ink font-mono text-xs bg-bond-2 px-1 py-0.5 border border-rule">__NEXT_DATA__</code>) filling context limits.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-alert font-mono">✗</span>
                    <span>Broken code block indentation and missing syntax language identifiers.</span>
                  </li>
                </ul>
              </div>

              <div className="border border-rule bg-bond p-4">
                <div className="flex items-center gap-2 text-match">
                  <CheckCircle aria-hidden="true" className="h-4 w-4" />
                  <span className="sheet-term text-[13px] font-semibold text-ink">What DocHarvest FastMCP Delivers</span>
                </div>
                <ul className="mt-3 space-y-2 sheet-body text-[12px] text-ink-2">
                  <li className="flex items-start gap-2">
                    <span className="text-match font-mono">✓</span>
                    <span>Isolated article AST with cryptographic SHA-256 YAML frontmatter.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-match font-mono">✓</span>
                    <span>Exact heading hierarchy, relative cross-links, and clean tables.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-match font-mono">✓</span>
                    <span>Structure-aware <code className="sheet-num text-ink font-mono text-xs bg-bond-2 px-1 py-0.5 border border-rule">read_doc</code> section bounding that never breaks mid-block.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tabpanel 2: Noise Breakdown Table */}
        {activeView === 'noiseBreakdown' && (
          <div
            role="tabpanel"
            id="panel-view-noise"
            aria-labelledby="tab-view-noise"
            tabIndex={0}
            className="mt-6 overflow-x-auto"
          >
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Detailed breakdown of stripped noise categories and token savings</caption>
              <thead>
                <tr className="border-b border-rule-strong">
                  <th scope="col" className="sheet-label py-2 pr-4 font-medium text-ink">Noise Category</th>
                  <th scope="col" className="sheet-label py-2 pr-4 font-medium text-ink">Share</th>
                  <th scope="col" className="sheet-label py-2 pr-4 font-medium text-ink">Tokens Wasted</th>
                  <th scope="col" className="sheet-label py-2 font-medium text-ink">Impact Description</th>
                </tr>
              </thead>
              <tbody>
                {rawScraper.noiseBreakdown.map((item) => (
                  <tr key={item.category} className="border-b border-rule hover:bg-bond/30 transition-colors">
                    <th scope="row" className="sheet-term py-2.5 pr-4 text-[13px] font-normal text-ink">
                      {item.category}
                    </th>
                    <td className="sheet-num py-2.5 pr-4 text-[13px] text-ink-2 font-mono">
                      {item.percentage}%
                    </td>
                    <td className="sheet-num py-2.5 pr-4 text-[13px] text-alert font-medium font-mono">
                      −{item.tokens.toLocaleString()} tokens
                    </td>
                    <td className="sheet-body py-2.5 text-[12px] text-ink-2">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabpanel 3: Preserved Semantics Table */}
        {activeView === 'preservedContent' && (
          <div
            role="tabpanel"
            id="panel-view-preserved"
            aria-labelledby="tab-view-preserved"
            tabIndex={0}
            className="mt-6 overflow-x-auto"
          >
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Detailed breakdown of preserved semantic markdown structures</caption>
              <thead>
                <tr className="border-b border-rule-strong">
                  <th scope="col" className="sheet-label py-2 pr-4 font-medium text-ink">Semantic Structure</th>
                  <th scope="col" className="sheet-label py-2 pr-4 font-medium text-ink">Token Allocation</th>
                  <th scope="col" className="sheet-label py-2 font-medium text-ink">Compiler Guarantee</th>
                </tr>
              </thead>
              <tbody>
                {docHarvest.preservedContent.map((item) => (
                  <tr key={item.category} className="border-b border-rule hover:bg-bond/30 transition-colors">
                    <th scope="row" className="sheet-term py-2.5 pr-4 text-[13px] font-normal text-ink">
                      {item.category}
                    </th>
                    <td className="sheet-num py-2.5 pr-4 text-[13px] text-match font-medium font-mono">
                      {item.tokens.toLocaleString()} tokens
                    </td>
                    <td className="sheet-body py-2.5 text-[12px] text-ink-2">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TokenBenchmark;
