'use client';

import React from 'react';
import { MultiAgentSimulation } from './MultiAgentSimulation';
import { TokenBenchmark } from './TokenBenchmark';
import { AgentSkillSwitcher } from './AgentSkillSwitcher';

/**
 * Line 04 — the agents.
 *
 * FastMCP v2 server spec, autonomous multi-agent simulation,
 * ~83% token reduction benchmark, universal 14+ agent harness switcher,
 * 12 stdio tools, 2 resources, 2 prompts, and verified transcript.
 */

/** Registration order in `src/gitbook_downloader/mcp/server.py`. */
const MCP_TOOLS: { name: string; purpose: string }[] = [
  { name: 'download_docs', purpose: 'Download documentation from a URL and write the output contract.' },
  { name: 'search_docs', purpose: 'Full-text search across downloaded documentation (SQLite FTS5, BM25).' },
  { name: 'list_domains', purpose: 'List all downloaded documentation domains with their metadata.' },
  { name: 'find_docs', purpose: 'Resolve a library or framework name to indexed domains in the library.' },
  { name: 'read_doc', purpose: 'Read a page or topic section with AST-safe token bounding.' },
  { name: 'get_doc', purpose: 'Get the compiled documentation content for a domain.' },
  { name: 'diff_versions', purpose: 'Show the unified diff between two versions of a domain.' },
  { name: 'list_versions', purpose: 'List all available versions for a domain.' },
  { name: 'export_docs', purpose: 'Export a docset in a different format (markdown, jsonl, rag, pdf).' },
  { name: 'get_changelog', purpose: 'Auto-generate a changelog from all version diffs of a domain.' },
  { name: 'query_doc_graph', purpose: 'Query the semantic entity and concept graph for a domain.' },
  { name: 'get_related_concepts', purpose: 'Retrieve semantic associations and connected entities for a concept.' },
];

const MCP_RESOURCES = ['docs://{domain}/book', 'docs://{domain}/manifest'];
const MCP_PROMPTS = ['search_docset', 'summarize_library'];

const TRANSCRIPT = `| \`search_docs("OAuth", limit=5)\` | ≥5 hits with \`url\`/\`title\`/\`section_heading\`/\`snippet\`/\`rank\`; top rank −6.7696 |

indexed hit url   : https://docs.openalgo.in/#oauth-model
true page source  : https://docs.openalgo.in/developers/design-documentation/41-mcp-architecture
snippet needle    : "## OAuth Model \`blueprints/mcp_oauth.py\` implements discovery, protected-resource metadata,"
in local page file: True
GROUND-TRUTH MATCH: True    (page URL)`;

export function AgentTools() {
  return (
    <section
      id="agents"
      data-sheet-line="04"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label">04 — THE AGENTS</p>
        <h2 className="sheet-head mt-4 text-ink">
          {MCP_TOOLS.length} Tools Over FastMCP v2. Universal Agent Skills.
        </h2>
        <p className="sheet-body mt-4 max-w-[68ch]">
          DocHarvest speaks standard Model Context Protocol over stdio and ships a universal,
          harness-neutral agent skill. Autonomous coding agents use it to crawl, index, query,
          and verify documentation with zero hallucination and zero token waste.
        </p>

        {/* 1. Interactive Multi-Agent Simulation */}
        <MultiAgentSimulation />

        {/* 2. ~83% Token Reduction Benchmark */}
        <TokenBenchmark />

        {/* 3. Universal 14+ Agent Harness Switcher */}
        <AgentSkillSwitcher />

        {/* 4. MCP Tools Registration Table */}
        <div className="mt-14 border-t border-rule-strong pt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <p className="sheet-label">PROTOCOL SPECIFICATION</p>
              <h3 className="sheet-head mt-2 text-ink">
                FastMCP v2 Tool Surface
              </h3>
            </div>
            <p className="sheet-num text-[12px] text-ink-3">
              Registration order in src/gitbook_downloader/mcp/server.py
            </p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">MCP tool and its purpose, in registration order</caption>
              <thead>
                <tr className="border-b border-rule-strong">
                  <th scope="col" className="sheet-label py-2 pr-6 font-medium">Tool Name</th>
                  <th scope="col" className="sheet-label py-2 font-medium">Purpose &amp; AST Guarantee</th>
                </tr>
              </thead>
              <tbody>
                {MCP_TOOLS.map((tool) => (
                  <tr key={tool.name} className="border-b border-rule">
                    <th scope="row" className="sheet-num w-60 py-2.5 pr-6 text-left text-[13px] font-normal text-ink">
                      {tool.name}
                    </th>
                    <td className="sheet-body py-2.5 text-[13px]">{tool.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resources and Prompts */}
          <div className="mt-8 grid gap-6 border-t border-rule pt-4 md:grid-cols-2">
            <div>
              <p className="sheet-label">resources</p>
              <ul className="mt-2">
                {MCP_RESOURCES.map((resource) => (
                  <li key={resource} className="sheet-num border-b border-rule py-1.5 text-[13px] text-ink-2">
                    {resource}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="sheet-label">prompts</p>
              <ul className="mt-2">
                {MCP_PROMPTS.map((prompt) => (
                  <li key={prompt} className="sheet-num border-b border-rule py-1.5 text-[13px] text-ink-2">
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quoted Stdio Session Transcript */}
          <div className="mt-10 border-t border-rule pt-6">
            <div className="flex items-baseline justify-between mb-2">
              <p className="sheet-label">one stdio session, quoted</p>
              <span className="sheet-num text-[11px] text-ink-3">local-artifacts/docharvest-mcp-omp-verification.md</span>
            </div>
            <pre className="overflow-auto text-[12px] leading-relaxed font-mono">{TRANSCRIPT}</pre>
            <p className="sheet-label mt-2">
              Verbatim output from real stdio session recording (2026-09-16)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AgentTools;
