'use client';

import React, { useState } from 'react';
import { Bot, BookOpen, GitCompare, Check, Copy, Sparkles, Terminal } from 'lucide-react';

/**
 * Line 06 — The Workflows.
 *
 * Three key personas, three commands, and the exact files that land on disk.
 */

const WORKFLOWS = [
  {
    id: 'rag',
    icon: Bot,
    persona: 'AI & RAG Engineers',
    badge: 'Vector Embeddings',
    command: 'docharvest capture https://docs.openalgo.in/v/v2.0 --rag',
    lands: 'exports/docs.openalgo.in_rag.jsonl',
    desc: 'Pre-chunked semantic JSONL with token allocations, SHA-256 hashes, and canonical headings ready for vector ingestion (Pinecone, Qdrant, Chroma).',
  },
  {
    id: 'offline',
    icon: BookOpen,
    persona: 'Offline Researchers & Devs',
    badge: 'Self-Contained PDF',
    command: 'docharvest capture https://docs.openalgo.in/v/v2.0 --pdf',
    lands: 'exports/docs.openalgo.in_handbook.pdf + pages/',
    desc: 'Pure-Python styled PDF handbook with clickable table of contents and full local Markdown page tree readable completely offline with 0 network.',
  },
  {
    id: 'devops',
    icon: GitCompare,
    persona: 'DevOps & Archival Teams',
    badge: 'SemVer Snapshots',
    command: 'docharvest capture <url> && docharvest diff <domain> v1.0.0 v1.1.0',
    lands: 'versions/ snapshots + unified diff report',
    desc: 'SemVer-based snapshot engine tracking documentation drift, API deprecations, and breaking schema changes over time on a cron schedule you control.',
  },
];

export function Workflows() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard?.writeText(cmd).catch(() => undefined);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section
      id="workflows"
      data-sheet-line="06"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="sheet-label">06 — THE WORKFLOWS</p>
            <h2 className="sheet-head mt-2 text-ink">Three Workflows. Three Canonical Commands.</h2>
          </div>
          <span className="sheet-num text-[12px] text-ink-3">
            RAG Ingestion · Offline PDF · Version Diff
          </span>
        </div>

        <p className="sheet-body mt-4 max-w-[68ch]">
          Whether you are preparing training data for vector retrieval, archiving documentation for flights,
          or auditing API drift across versions: one deterministic command produces the verified artifact.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {WORKFLOWS.map((workflow, index) => {
            const Icon = workflow.icon;
            const isCopied = copiedIndex === index;
            return (
              <div
                key={workflow.id}
                className="flex flex-col justify-between border border-rule-strong bg-bond-2 p-5 transition-all hover:border-match/60"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 border border-rule bg-bond px-2 py-1">
                      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                      <span className="sheet-label text-[10px] text-ink">{workflow.badge}</span>
                    </div>
                  </div>

                  <h3 className="sheet-head mt-4 text-[16px] text-ink">
                    {workflow.persona}
                  </h3>

                  <div className="mt-4 border border-rule bg-bond p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <code className="sheet-num break-all text-[11px] text-ink">
                        {workflow.command}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyCommand(workflow.command, index)}
                        aria-label={`Copy command for ${workflow.persona}`}
                        className="inline-flex shrink-0 cursor-pointer items-center p-1 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
                      >
                        {isCopied ? (
                          <Check aria-hidden="true" className="h-3.5 w-3.5 text-match" />
                        ) : (
                          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="sheet-body mt-4 text-[13px] leading-relaxed">
                    {workflow.desc}
                  </p>
                </div>

                <div className="mt-6 border-t border-rule pt-3">
                  <span className="sheet-label text-[10px] block text-ink-3">Lands on disk:</span>
                  <code className="sheet-num mt-1 block truncate text-[11px] text-match">
                    {workflow.lands}
                  </code>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Workflows;
