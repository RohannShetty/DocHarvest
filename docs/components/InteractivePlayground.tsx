'use client';

import React, { useState } from 'react';
import { Terminal, Check, Copy, CheckCircle2 } from 'lucide-react';

interface SampleSite {
  id: string;
  name: string;
  url: string;
  provider: string;
  priority: number;
  rawSize: string;
  cleanSize: string;
  tokenSavings: string;
  pagesSample: number;
  emittedFiles: string[];
}

const SAMPLE_SITES: SampleSite[] = [
  {
    id: 'gitbook',
    name: 'GitBook (OpenAlgo)',
    url: 'https://docs.openalgo.in/v/v2.0',
    provider: 'GitBook API v2',
    priority: 100,
    rawSize: '312 KB (HTML)',
    cleanSize: '34 KB (Markdown)',
    tokenSavings: '83% fewer tokens',
    pagesSample: 251,
    emittedFiles: ['pages/developers/mcp.md', 'docs.md', 'llms.txt', 'search.db'],
  },
  {
    id: 'mintlify',
    name: 'Mintlify (Anthropic)',
    url: 'https://docs.anthropic.com/en/docs',
    provider: 'Mintlify Direct MD',
    priority: 90,
    rawSize: '480 KB (HTML)',
    cleanSize: '58 KB (Markdown)',
    tokenSavings: '87% fewer tokens',
    pagesSample: 180,
    emittedFiles: ['pages/prompt-engineering.md', 'docs.md', 'llms.txt', 'search.db'],
  },
  {
    id: 'docusaurus',
    name: 'Docusaurus (React Native)',
    url: 'https://reactnative.dev/docs/getting-started',
    provider: 'Docusaurus AST',
    priority: 80,
    rawSize: '520 KB (HTML)',
    cleanSize: '64 KB (Markdown)',
    tokenSavings: '85% fewer tokens',
    pagesSample: 220,
    emittedFiles: ['pages/components/view.md', 'docs.md', 'llms.txt', 'search.db'],
  },
  {
    id: 'vitepress',
    name: 'VitePress (Vite Docs)',
    url: 'https://vitepress.dev/guide/what-is-vitepress',
    provider: 'VitePress Static Data',
    priority: 72,
    rawSize: '290 KB (HTML)',
    cleanSize: '38 KB (Markdown)',
    tokenSavings: '84% fewer tokens',
    pagesSample: 95,
    emittedFiles: ['pages/guide/markdown.md', 'docs.md', 'llms.txt', 'search.db'],
  },
  {
    id: 'mkdocs',
    name: 'MkDocs (Material for MkDocs)',
    url: 'https://squidfunk.github.io/mkdocs-material/',
    provider: 'MkDocs Material Index',
    priority: 70,
    rawSize: '380 KB (HTML)',
    cleanSize: '46 KB (Markdown)',
    tokenSavings: '86% fewer tokens',
    pagesSample: 140,
    emittedFiles: ['pages/reference/code-blocks.md', 'docs.md', 'llms.txt', 'search.db'],
  },
];

export function InteractivePlayground() {
  const [selectedSite, setSelectedSite] = useState<SampleSite>(SAMPLE_SITES[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const activeUrl = customUrl.trim() || selectedSite.url;
  const captureCmd = `docharvest capture ${activeUrl} --rag --pdf`;

  const copyCommand = () => {
    navigator.clipboard?.writeText(captureCmd).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="playground"
      aria-label="Interactive Capture Playground"
      className="scroll-mt-16 border-t border-rule-strong bg-bond px-6 py-20 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="sheet-label text-match">INTERACTIVE STUDIO</p>
            <h2 className="sheet-head mt-2 text-ink">
              Try It Live: Pick a Documentation Site
            </h2>
          </div>
          <span className="sheet-num text-[12px] text-ink-3">
            Real-time provider routing simulation
          </span>
        </div>

        <p className="sheet-body mt-4 max-w-[68ch] text-ink-2 leading-relaxed">
          Select a sample documentation portal or enter your own doc URL. See how DocHarvest detects
          the framework, isolates raw markdown endpoints, eliminates HTML noise, and outputs structured corpora.
        </p>

        {/* Preset site picker pills */}
        <div
          role="group"
          aria-label="Sample documentation platforms"
          className="mt-8 flex flex-wrap gap-2 border-b border-rule pb-4"
        >
          {SAMPLE_SITES.map((site) => {
            const isSelected = selectedSite.id === site.id && !customUrl;
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => {
                  setSelectedSite(site);
                  setCustomUrl('');
                }}
                className={`sheet-label cursor-pointer px-4 py-2 transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-match ${
                  isSelected
                    ? 'bg-match text-bond font-semibold'
                    : 'border border-rule bg-bond-2 text-ink-2 hover:border-rule-strong hover:text-ink'
                }`}
              >
                {site.name}
              </button>
            );
          })}
        </div>

        {/* Custom URL Input Bar */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center border border-rule-strong bg-bond-2 p-3.5 shadow-sm">
          <span className="sheet-label shrink-0 text-ink-3 tracking-wider">TARGET URL:</span>
          <input
            type="url"
            aria-label="Enter documentation URL"
            placeholder="or type any custom doc URL (e.g. https://docs.example.com)..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-match"
          />
          {customUrl && (
            <button
              type="button"
              onClick={() => setCustomUrl('')}
              className="sheet-label shrink-0 cursor-pointer text-ink-3 hover:text-ink px-2.5 py-1 bg-bond border border-rule"
            >
              Reset
            </button>
          )}
        </div>

        {/* Real-time Telemetry & Output Simulation Card */}
        <div className="mt-6 border border-rule-strong bg-gradient-to-b from-bond-2 to-bond-2/70 p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Command & Pipeline */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2">
                <span className="sheet-num bg-match px-2 py-0.5 text-[10px] font-bold text-bond">
                  DETECTED
                </span>
                <span className="sheet-term text-[15px] font-semibold text-ink">
                  {selectedSite.provider} (Priority {selectedSite.priority})
                </span>
              </div>

              <div className="mt-4 border border-rule bg-bond p-4">
                <div className="flex items-center justify-between">
                  <span className="sheet-label flex items-center gap-1.5 text-ink">
                    <Terminal aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                    CLI Capture Command
                  </span>
                  <button
                    type="button"
                    onClick={copyCommand}
                    aria-label="Copy generated capture command"
                    className="sheet-label inline-flex cursor-pointer items-center gap-1 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
                  >
                    {copied ? (
                      <>
                        <Check aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                        <span className="text-match font-medium">copied</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                        <span>copy</span>
                      </>
                    )}
                  </button>
                </div>
                <code className="sheet-num mt-2.5 block break-all text-[12px] text-ink font-mono">
                  {captureCmd}
                </code>
              </div>

              {/* FastMCP tool call equivalent */}
              <div className="mt-4 border border-rule bg-bond p-4">
                <span className="sheet-label text-ink-3 block mb-1.5">FastMCP v2 Equivalent:</span>
                <code className="sheet-num text-[11px] text-match block font-mono">
                  {`mcp.call_tool("download_docs", { url: "${activeUrl}", max_pages: ${selectedSite.pagesSample} })`}
                </code>
              </div>
            </div>

            {/* Right: Metrics & Emitted Files */}
            <div className="border-t border-rule pt-4 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <span className="sheet-label text-match">Measured Extraction Impact</span>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-rule pt-3 sheet-num">
                <div>
                  <span className="sheet-label text-[10px] text-ink-3">Raw Web Size</span>
                  <p className="text-[13px] text-alert font-mono font-medium">{selectedSite.rawSize}</p>
                </div>
                <div>
                  <span className="sheet-label text-[10px] text-ink-3">Clean Markdown</span>
                  <p className="text-[13px] text-match font-mono font-bold">{selectedSite.cleanSize}</p>
                </div>
                <div className="col-span-2">
                  <span className="sheet-label text-[10px] text-ink-3">Context Efficiency</span>
                  <p className="text-[13px] text-match font-semibold">
                    ✓ {selectedSite.tokenSavings}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-rule pt-3">
                <span className="sheet-label text-[10px] text-ink-3 block mb-2">Emitted Corpora:</span>
                <ul className="space-y-1 sheet-num text-[11px] text-ink-2">
                  {selectedSite.emittedFiles.map((file) => (
                    <li key={file} className="flex items-center gap-1.5">
                      <CheckCircle2 aria-hidden="true" className="h-3 w-3 text-match shrink-0" />
                      <span className="truncate font-mono">{file}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InteractivePlayground;
