'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { AI_AGENTS, DOC_HARVEST_CLIENTS } from '../data/showcaseData';

/**
 * Line 04 — the agents.
 *
 * The MCP surface exactly as registered, the two resources and two prompts, the
 * documented client configs, and one transcript line quoted from the stdio
 * verification record. The tool count, the client count and the harness count
 * are each read from their own source, so the three numbers can never merge into
 * one claim.
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
  const [copied, setCopied] = useState(false);
  const cursor = AI_AGENTS.find((agent) => agent.id === 'cursor') ?? AI_AGENTS[0];

  const copyConfig = () => {
    navigator.clipboard?.writeText(cursor.configSnippet).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="agents"
      data-sheet-line="04"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label">04 — THE AGENTS</p>
        <h2 className="sheet-head mt-4 text-ink">{MCP_TOOLS.length} tools over stdio.</h2>
        <p className="sheet-body mt-4 max-w-[68ch]">
          The FastMCP v2 server speaks standard Model Context Protocol over stdio. Every tool below is
          registered in this order.
        </p>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse text-left">
          <caption className="sr-only">MCP tool and its purpose, in registration order</caption>
          <tbody>
            {MCP_TOOLS.map((tool) => (
              <tr key={tool.name} className="border-b border-rule">
                <th scope="row" className="sheet-num w-56 py-2 pr-6 text-left text-[13px] font-normal text-ink">
                  {tool.name}
                </th>
                <td className="sheet-body py-2 text-[13px]">{tool.purpose}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-6 border-t border-rule-strong pt-4 md:grid-cols-2">
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

        {/* Two counts that must never read as one: README configs, sheet harnesses. */}
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="sheet-label">{DOC_HARVEST_CLIENTS.length} documented client configs</p>
            <ul className="mt-3">
              {DOC_HARVEST_CLIENTS.map((client) => (
                <li key={client} className="border-b border-rule py-1.5 text-[13px] text-ink-2">
                  {client}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <p className="sheet-label">one real config snippet</p>
              <span className="sheet-num text-[11px] text-ink-3">{cursor.configPath}</span>
            </div>
            <pre className="mt-3 max-h-[300px] overflow-auto text-[12px] leading-relaxed">
              {cursor.configSnippet}
            </pre>
            <button
              onClick={copyConfig}
              aria-label="Copy MCP configuration"
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-ink-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-match"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="sheet-label">{copied ? 'copied' : 'copy json'}</span>
            </button>
          </div>
        </div>

        <div className="mt-12">
          <p className="sheet-label">
            {AI_AGENTS.length} harness cards in this sheet
          </p>
          <ul className="mt-3 grid gap-x-8 md:grid-cols-2">
            {AI_AGENTS.map((agent) => (
              <li key={agent.id} className="flex flex-wrap items-baseline gap-x-3 border-b border-rule py-2">
                <span className="sheet-term text-[13px] text-ink">{agent.name}</span>
                <span className="sheet-label">{agent.category}</span>
                <span className="sheet-num ml-auto text-[11px] text-ink-3">{agent.configPath}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12">
          <p className="sheet-label mb-2">one stdio session, quoted</p>
          <pre className="overflow-auto text-[12px] leading-relaxed">{TRANSCRIPT}</pre>
          <p className="sheet-label mt-2">
            Transcript from a real stdio session (local-artifacts/docharvest-mcp-omp-verification.md,
            2026-09-16)
          </p>
        </div>
      </div>
    </section>
  );
}

export default AgentTools;
