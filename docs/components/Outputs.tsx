import React from 'react';
import { PRODUCT_FACTS } from '../lib/stats';

const OUTPUTS = [
  { file: 'pages/', use: 'One Markdown file per captured page', source: 'source_url + content_hash frontmatter' },
  { file: `${PRODUCT_FACTS.localBookFile} / ${PRODUCT_FACTS.libraryBookFile}`, use: 'One combined handbook with a table of contents', source: 'local output / global library' },
  { file: 'llms.txt', use: 'A compact index for AI discovery', source: 'captured titles, paths, and source URLs' },
  { file: 'search.db', use: 'SQLite FTS5 BM25 search index', source: 'page and heading records' },
  { file: 'exports/*_rag.jsonl', use: 'Chunked records for vector stores', source: 'metadata, headings, and hashes' },
  { file: 'exports/*_handbook.pdf', use: 'Printable offline handbook', source: 'pure-Python fpdf2 export' },
  { file: 'versions/v*.md', use: 'Semver snapshots for change review', source: 'unified diff and changelog inputs' },
] as const;

export function Outputs() {
  return (
    <section id="outputs" className="border-b border-rule-strong bg-bond px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div>
            <p className="sheet-label text-match">Outputs</p>
            <h2 className="sheet-head mt-4 max-w-[11ch] text-ink">A capture is a folder, not a black box.</h2>
            <p className="sheet-body mt-5 max-w-[38ch] text-ink-2">Every artifact has a filename, a consumer, and enough provenance to inspect what happened.</p>
          </div>

          <div className="overflow-x-auto border-y border-rule-strong">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">DocHarvest output artifacts</caption>
              <thead>
                <tr className="border-b border-rule-strong">
                  <th scope="col" className="sheet-label py-4 pr-4 text-ink-3">Artifact</th>
                  <th scope="col" className="sheet-label py-4 pr-4 text-ink-3">Use</th>
                  <th scope="col" className="sheet-label py-4 text-ink-3">Evidence inside</th>
                </tr>
              </thead>
              <tbody>
                {OUTPUTS.map((output) => (
                  <tr key={output.file} className="border-b border-rule last:border-b-0">
                    <th scope="row" className="py-4 pr-4 align-top font-mono text-sm font-medium text-match">{output.file}</th>
                    <td className="sheet-body py-4 pr-4 align-top text-sm text-ink">{output.use}</td>
                    <td className="sheet-body py-4 align-top text-sm text-ink-2">{output.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Outputs;
