import React from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Capture',
    body: 'Give DocHarvest a documentation URL. It detects the platform, stays inside the documentation path, and handles client-rendered sites when you opt into rendering.',
    command: 'docharvest capture <url> --scope /docs',
  },
  {
    number: '02',
    title: 'Compile',
    body: 'The engine writes page files with source URLs and content hashes, then builds a book, an llms.txt manifest, search records, and optional exports.',
    command: 'pages/  book.md  llms.txt  search.db',
  },
  {
    number: '03',
    title: 'Use anywhere',
    body: 'Read the files locally, search the corpus, open a PDF, load RAG JSONL, or connect an MCP client to the same library.',
    command: 'docharvest mcp',
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-rule-strong bg-bond-2 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="sheet-label text-match">How it works</p>
          <h2 className="sheet-head mt-4 text-ink">One capture, several useful destinations.</h2>
          <p className="sheet-body mt-4 text-ink-2">The product has one job: make documentation easier for people and agents to trust.</p>
        </div>

        <ol className="mt-12 divide-y divide-rule-strong border-y border-rule-strong">
          {STEPS.map((step) => (
            <li key={step.number} className="grid gap-5 py-7 md:grid-cols-[5rem_minmax(0,0.7fr)_minmax(240px,0.8fr)] md:items-start md:gap-8">
              <span className="sheet-num text-sm font-semibold text-match">{step.number}</span>
              <h3 className="text-2xl font-semibold tracking-tight text-ink">{step.title}</h3>
              <div>
                <p className="sheet-body text-ink-2">{step.body}</p>
                <code className="mt-4 block break-words border-l-2 border-match pl-3 text-xs leading-relaxed text-ink">{step.command}</code>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
