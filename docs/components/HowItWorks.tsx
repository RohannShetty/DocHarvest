import React from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Capture',
    body: 'Give DocHarvest a documentation URL. It identifies the framework, stays inside the docs path, and follows same-domain links. Client-rendered pages are a flag away.',
    command: 'docharvest capture https://docs.example.com --scope /docs',
    lands: 'Fetches each page and keeps its source URL.',
  },
  {
    number: '02',
    title: 'Compile',
    body: 'Every page is written as Markdown with its source URL and a content hash. The capture then assembles the book, the llms.txt manifest, and the search index.',
    command: 'pages/  book.md  llms.txt  search.db',
    lands: 'The page tree, one combined file, and a SQLite FTS5 index.',
  },
  {
    number: '03',
    title: 'Use it',
    body: 'Read the files, search the corpus, export a PDF or RAG JSONL, or hand the same library to an agent over MCP. One capture feeds all four.',
    command: 'docharvest search "token refresh"',
    lands: 'Ranked hits with the file and line each answer came from.',
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-rule">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-[46ch]">
          <p className="sheet-label text-match">01 — How it works</p>
          <h2 className="sheet-head mt-4 text-ink">One capture, three steps.</h2>
          <p className="sheet-body mt-4">
            Capture once. The same directory serves a person reading a page, a search query, and an
            agent asking for context.
          </p>
        </div>

        <ol className="mt-12 border-t border-rule-strong">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="grid gap-4 border-b border-rule py-8 md:grid-cols-[4rem_minmax(0,0.55fr)_minmax(0,0.9fr)] md:gap-8"
            >
              <span className="sheet-num text-sm font-semibold text-match">{step.number}</span>
              <h3 className="text-xl font-semibold tracking-tight text-ink">{step.title}</h3>
              <div className="min-w-0">
                <p className="sheet-body">{step.body}</p>
                <code className="mt-4 block break-words border-l-2 border-match pl-3 text-xs leading-relaxed text-ink">
                  {step.command}
                </code>
                <p className="sheet-label mt-3 text-ink-3">{step.lands}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
