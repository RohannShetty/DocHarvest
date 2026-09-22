import React from 'react';

const PATHS = [
  {
    id: 'cli',
    label: 'CLI',
    title: 'For repeatable captures',
    body: 'Use flags, presets, scopes, and output modes in scripts or local development.',
    command: 'docharvest capture https://docs.example.com --output both',
    href: '#install',
  },
  {
    id: 'gui',
    label: 'Desktop GUI',
    title: 'For visual control',
    body: 'Open Capture Studio, watch progress, browse the library, and export without a terminal.',
    command: 'docharvest gui',
    href: '#walkthrough',
  },
  {
    id: 'mcp',
    label: 'MCP server',
    title: 'For agent-led lookup',
    body: 'Expose capture, search, reading, export, graph, and version tools over standard stdio.',
    command: 'docharvest mcp',
    href: '#integrations',
  },
  {
    id: 'skill',
    label: 'Agent Skill',
    title: 'For guided retrieval',
    body: 'Install the bundled skill so an agent can reuse local docs before starting another capture.',
    command: 'docharvest skill install docharvest -o .agents/skills',
    href: '#integrations',
  },
] as const;

export function WorkflowPaths() {
  return (
    <section id="workflows" className="border-b border-rule-strong bg-bond px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="sheet-label text-match">Choose your workflow</p>
            <h2 className="sheet-head mt-4 max-w-[12ch] text-ink">The same corpus, four ways in.</h2>
            <p className="sheet-body mt-5 max-w-[38ch] text-ink-2">Start with the surface that matches the task. The files and library remain the same.</p>
          </div>

          <div className="divide-y divide-rule-strong border-y border-rule-strong">
            {PATHS.map((path) => (
              <a key={path.id} href={path.href} className="group grid gap-4 py-6 transition-colors hover:bg-bond-2 md:grid-cols-[9rem_minmax(0,1fr)_minmax(220px,0.8fr)] md:items-start md:gap-6">
                <div>
                  <p className="sheet-label text-match">{path.label}</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-match">{path.title}</h3>
                </div>
                <p className="sheet-body text-ink-2">{path.body}</p>
                <code className="break-words border-l-2 border-rule pl-3 text-xs leading-relaxed text-ink-2 group-hover:border-match group-hover:text-ink">{path.command}</code>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkflowPaths;
