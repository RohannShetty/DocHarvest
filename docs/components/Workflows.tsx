import React from 'react';

/**
 * Line 06 — the workflows.
 *
 * Three readers of the same command, told as three ruled rows: who, the command
 * they run, and what lands on disk.
 */

const WORKFLOWS = [
  {
    persona: 'AI & RAG engineers',
    command: 'docharvest capture <url> --rag',
    lands: 'exports/<domain>_rag.jsonl — tokenized chunks with SHA-256 frontmatter, ready for a vector store.',
  },
  {
    persona: 'Offline researchers & software engineers',
    command: 'docharvest capture <url> --pdf',
    lands: 'exports/<domain>_handbook.pdf plus the local pages/ tree, readable with no network at all.',
  },
  {
    persona: 'DevOps & archival teams',
    command: 'docharvest capture <url> && docharvest diff <domain> <v1> <v2>',
    lands: 'versions/ snapshots and a unified diff between any two of them, on a schedule you own.',
  },
];

export function Workflows() {
  return (
    <section
      id="workflows"
      data-sheet-line="06"
      className="scroll-mt-16 border-t border-rule-strong px-6 py-16 lg:px-12"
    >
      <div className="mx-auto max-w-6xl">
        <p className="sheet-label">06 — THE WORKFLOWS</p>
        <h2 className="sheet-head mt-4 text-ink">Three people, three commands.</h2>

        <dl className="mt-10 border-t border-rule-strong">
          {WORKFLOWS.map((workflow) => (
            <div
              key={workflow.persona}
              className="grid gap-2 border-b border-rule py-5 lg:grid-cols-12 lg:gap-6"
            >
              <dt className="sheet-term text-[13px] text-ink lg:col-span-4">{workflow.persona}</dt>
              <dd className="lg:col-span-8">
                <p className="sheet-num text-[13px] text-ink">{workflow.command}</p>
                <p className="sheet-body mt-2 text-[13px]">{workflow.lands}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default Workflows;
