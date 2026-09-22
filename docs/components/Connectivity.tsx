import React from 'react';
import { PRODUCT_FACTS, STATS } from '../lib/stats';

const CONFIGS = [
  {
    label: 'MCP client',
    title: 'Connect a client over stdio',
    path: '.cursor/mcp.json or claude_desktop_config.json',
    code: '{\n  "mcpServers": {\n    "docharvest": {\n      "command": "uvx",\n      "args": ["gitbook-downloader", "mcp"]\n    }\n  }\n}',
  },
  {
    label: 'Agent Skill',
    title: 'Install the retrieval instructions',
    path: '.agents/skills, .cursor/skills, or .claude/skills',
    code: 'docharvest skill install docharvest -o .agents/skills',
  },
  {
    label: 'Local consumer',
    title: 'Use the files directly',
    path: `${PRODUCT_FACTS.libraryRoot}/docs/<domain>/`,
    code: 'pages/\nbook.md\nllms.txt\nsearch.db\nversions/',
  },
] as const;

export function Connectivity() {
  return (
    <section id="integrations" className="border-b border-rule-strong bg-bond-2 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div>
            <p className="sheet-label text-match">Connectivity</p>
            <h2 className="sheet-head mt-4 max-w-[12ch] text-ink">One local source for people and tools.</h2>
            <p className="sheet-body mt-5 max-w-[40ch] text-ink-2">The capture does not disappear into a hosted dashboard. It stays in the library you can inspect, copy, index, or expose through MCP.</p>
            <p className="sheet-label mt-8 text-ink-3">{STATS.mcpTools} tools · {PRODUCT_FACTS.mcpResources} resources · {PRODUCT_FACTS.mcpPrompts} prompts</p>
          </div>

          <div className="space-y-3">
            {CONFIGS.map((config) => (
              <details key={config.label} className="group border border-rule-strong bg-bond">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left marker:hidden hover:bg-bond-2 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="sheet-label text-match">{config.label}</span>
                    <span className="mt-1 block text-base font-semibold text-ink">{config.title}</span>
                  </span>
                  <span aria-hidden="true" className="sheet-num text-xl text-ink-3 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="border-t border-rule px-4 py-4">
                  <p className="sheet-label text-ink-3">{config.path}</p>
                  <pre className="mt-3 overflow-x-auto border border-rule bg-bond-2 p-4 text-xs leading-relaxed text-ink"><code>{config.code}</code></pre>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Connectivity;
