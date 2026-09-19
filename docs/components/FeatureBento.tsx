'use client';

import React from 'react';
import { Bot, Database, FileText, Zap, CheckCircle2 } from 'lucide-react';
import { STATS } from '../lib/stats';

/**
 * The 4 Core Architectural Pillars of DocHarvest.
 * Asymmetric Bento Grid layout with glassmorphic cards, clear value-props, and architectural guarantees.
 */
export function FeatureBento() {
  return (
    <section
      id="pillars"
      aria-label="Core Capabilities"
      className="scroll-mt-16 border-t border-rule-strong bg-bond px-6 py-20 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="sheet-label text-match">ARCHITECTURAL FOUNDATION</p>
            <h2 className="sheet-head mt-2 text-ink">
              Four Pillars Built for Autonomous AI Coding Agents
            </h2>
          </div>
          <span className="sheet-num text-[12px] text-match font-medium">
            100% Local · FastMCP v2 · SQLite FTS5
          </span>
        </div>

        <p className="sheet-body mt-4 max-w-[68ch] text-ink-2 leading-relaxed">
          DocHarvest is an engineered documentation compiler, offline search index,
          and Model Context Protocol server built specifically for AI coding agents.
        </p>

        {/* Bento Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-12">
          {/* Card 1: FastMCP v2 Server (Col span 7) */}
          <div className="group flex flex-col justify-between border border-rule-strong bg-gradient-to-b from-bond-2 to-bond-2/70 p-7 transition-all duration-200 hover:border-match/60 shadow-sm md:col-span-7">
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 border border-rule bg-bond px-3 py-1">
                  <Bot aria-hidden="true" className="h-4 w-4 text-match" />
                  <span className="sheet-label text-ink">FastMCP v2 Protocol Surface</span>
                </div>
                <span className="sheet-num text-[11px] text-match font-semibold">12 Tools over stdio</span>
              </div>

              <h3 className="sheet-head mt-5 text-[21px] text-ink group-hover:text-match transition-colors">
                Native Model Context Protocol Server
              </h3>
              <p className="sheet-body mt-2.5 text-[14px] text-ink-2 leading-relaxed">
                Exposes tools like <code className="sheet-num text-ink font-mono text-xs bg-bond px-1 py-0.5 border border-rule">download_docs</code>,{' '}
                <code className="sheet-num text-ink font-mono text-xs bg-bond px-1 py-0.5 border border-rule">search_docs</code>, and{' '}
                <code className="sheet-num text-ink font-mono text-xs bg-bond px-1 py-0.5 border border-rule">read_doc</code> directly over stdio. Autonomous agents
                can query docs in real time with AST-bounded sections that never break mid-block.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px] sheet-num text-ink-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-match shrink-0" />
                  <span>14+ Agent Harnesses Supported</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-match shrink-0" />
                  <span>AST-bounded Section Extraction</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-match shrink-0" />
                  <span>Zero-delay stdio IPC transport</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-match shrink-0" />
                  <span>Built-in Prompt &amp; Resource URIs</span>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-rule pt-4">
              <code className="sheet-num text-[11px] text-ink-3 block truncate font-mono">
                uvx gitbook-downloader mcp · stdio transport
              </code>
            </div>
          </div>

          {/* Card 2: 83% Token Optimization (Col span 5) */}
          <div className="group flex flex-col justify-between border border-rule-strong bg-gradient-to-b from-bond-2 to-bond-2/70 p-7 transition-all duration-200 hover:border-match/60 shadow-sm md:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 border border-rule bg-bond px-3 py-1">
                  <Zap aria-hidden="true" className="h-4 w-4 text-match" />
                  <span className="sheet-label text-ink">Context Economy</span>
                </div>
                <span className="sheet-num text-[11px] text-match font-semibold">~83% Token Reduction</span>
              </div>

              <h3 className="sheet-head mt-5 text-[21px] text-ink group-hover:text-match transition-colors">
                Zero HTML &amp; JSX Bloat
              </h3>
              <p className="sheet-body mt-2.5 text-[14px] text-ink-2 leading-relaxed">
                Raw HTML dumps waste over 80% of context on cookie banners, navigation menus, and client hydration scripts.
                DocHarvest isolates pure semantic Markdown so your model never hallucinates on web noise.
              </p>

              <div className="mt-5 border border-rule bg-bond p-3.5">
                <div className="flex items-baseline justify-between sheet-num text-[12px]">
                  <span className="text-ink-3">Raw Scraper:</span>
                  <span className="text-alert font-medium font-mono">42,480 tokens</span>
                </div>
                <div className="flex items-baseline justify-between sheet-num text-[12px] mt-1.5">
                  <span className="text-match font-semibold">DocHarvest:</span>
                  <span className="text-match font-bold font-mono">7,240 tokens (−83%)</span>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-rule pt-4">
              <span className="sheet-label text-[11px] text-ink-3">35,240+ wasted tokens stripped per snapshot</span>
            </div>
          </div>

          {/* Card 3: Offline SQLite FTS5 & Concept Graph (Col span 5) */}
          <div className="group flex flex-col justify-between border border-rule-strong bg-gradient-to-b from-bond-2 to-bond-2/70 p-7 transition-all duration-200 hover:border-match/60 shadow-sm md:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 border border-rule bg-bond px-3 py-1">
                  <Database aria-hidden="true" className="h-4 w-4 text-match" />
                  <span className="sheet-label text-ink">Offline Search Index</span>
                </div>
                <span className="sheet-num text-[11px] text-ink-3">BM25 Ranking</span>
              </div>

              <h3 className="sheet-head mt-5 text-[21px] text-ink group-hover:text-match transition-colors">
                SQLite FTS5 &amp; Semantic Graph
              </h3>
              <p className="sheet-body mt-2.5 text-[14px] text-ink-2 leading-relaxed">
                Full-text BM25 search across all captured sites in <code className="sheet-num text-ink font-mono text-xs bg-bond px-1 py-0.5 border border-rule">search.db</code>.
                Plus a recursive concept graph linking functions, endpoints, and code blocks with 1-hop associations.
              </p>

              <ul className="mt-5 space-y-2 sheet-num text-[12px] text-ink-2">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-match shrink-0" />
                  <span>Sub-15ms BM25 full-text keyword queries</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-match shrink-0" />
                  <span>AST topic &amp; entity graph extraction</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-match shrink-0" />
                  <span>Zero cloud database or API key requirements</span>
                </li>
              </ul>
            </div>

            <div className="mt-7 border-t border-rule pt-4">
              <code className="sheet-num text-[11px] text-ink-3 block truncate font-mono">
                ~/.gitbook-downloader/search.db (WAL mode)
              </code>
            </div>
          </div>

          {/* Card 4: Universal Multi-Output Compiler (Col span 7) */}
          <div className="group flex flex-col justify-between border border-rule-strong bg-gradient-to-b from-bond-2 to-bond-2/70 p-7 transition-all duration-200 hover:border-match/60 shadow-sm md:col-span-7">
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 border border-rule bg-bond px-3 py-1">
                  <FileText aria-hidden="true" className="h-4 w-4 text-match" />
                  <span className="sheet-label text-ink">Multi-Format Compiler</span>
                </div>
                <span className="sheet-num text-[11px] text-match font-semibold">5 Output Formats</span>
              </div>

              <h3 className="sheet-head mt-5 text-[21px] text-ink group-hover:text-match transition-colors">
                One Run Emits All Artifacts
              </h3>
              <p className="sheet-body mt-2.5 text-[14px] text-ink-2 leading-relaxed">
                A single CLI or MCP command automatically generates structured outputs tailored for human reading,
                vector RAG stores, LLM context ingestion, and offline documentation handbooks.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="border border-rule bg-bond p-3 text-center transition-colors hover:border-match/40">
                  <span className="sheet-num text-[13px] font-semibold text-ink block font-mono">docs.md</span>
                  <span className="sheet-label text-[9px] text-ink-3 mt-1 block">Unified Book</span>
                </div>
                <div className="border border-rule bg-bond p-3 text-center transition-colors hover:border-match/40">
                  <span className="sheet-num text-[13px] font-semibold text-ink block font-mono">llms.txt</span>
                  <span className="sheet-label text-[9px] text-ink-3 mt-1 block">LLM Manifest</span>
                </div>
                <div className="border border-rule bg-bond p-3 text-center transition-colors hover:border-match/40">
                  <span className="sheet-num text-[13px] font-semibold text-ink block font-mono">_rag.jsonl</span>
                  <span className="sheet-label text-[9px] text-ink-3 mt-1 block">Chunked Vector</span>
                </div>
                <div className="border border-rule bg-bond p-3 text-center transition-colors hover:border-match/40">
                  <span className="sheet-num text-[13px] font-semibold text-ink block font-mono">handbook.pdf</span>
                  <span className="sheet-label text-[9px] text-ink-3 mt-1 block">Offline PDF</span>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-rule pt-4">
              <span className="sheet-label text-[11px] text-ink-3">Automatic SemVer Snapshots &amp; Version Diffing included</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureBento;
