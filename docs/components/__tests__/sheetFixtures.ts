import type { DocHarvestGithubData } from '../../lib/github';
import type { IndexProvenance, IndexRow, Manifest } from '../../lib/indexData';

/** Shared fixtures for the sheet's suites — one shape, three consumers. */

export const INDEX_PROVENANCE: IndexProvenance = {
  generated: '2026-09-17T00:00:00.000Z',
  generator: 'docs/scripts/build-index-data.mjs',
  captures: [
    {
      id: 'pi.dev',
      sourceUrl: 'https://pi.dev/docs/latest',
      provider: 'generic',
      captured: '2026-09-02T18:27:35Z',
      pages: 14,
      rows: 3,
    },
  ],
  terms: ['OAuth', 'provider'],
  totalRows: 3,
  note: 'contexts are verbatim lines from emitted Markdown',
};

export const INDEX_ROWS: IndexRow[] = [
  {
    term: 'OAuth',
    source: 'pi.dev',
    path: 'pages/docs/latest/providers.md',
    line: 214,
    title: 'Providers',
    context: 'Pi supports subscription providers via OAuth and API key providers.',
  },
  {
    term: 'OAuth',
    source: 'pi.dev',
    path: 'pages/docs/latest/settings.md',
    line: 12,
    title: 'Settings',
    context: 'Configure the token refresh window for OAuth sessions in the auth file.',
  },
  {
    term: 'provider',
    source: 'pi.dev',
    path: 'pages/docs/latest/models.md',
    line: 40,
    title: 'Models',
    context: 'Every provider ships a catalog that can be refreshed offline.',
  },
];

export const MANIFEST_FIXTURE: Manifest = {
  generated: '2026-09-17T00:00:00.000Z',
  generator: 'docs/scripts/build-index-data.mjs',
  note: 'byte counts are measured on disk',
  captures: [
    {
      id: 'pi.dev',
      sourceUrl: 'https://pi.dev/docs/latest',
      provider: 'generic',
      captured: '2026-09-02T18:27:35Z',
      title: 'Pi Documentation',
      declaredPages: 5,
      pages: 14,
      bytes: { 'book.md': 69595, 'llms.txt': 727, pages: 199254, total: 269576 },
      outputs: [
        { path: 'pages/', bytes: 199254, pages: 14 },
        { path: 'book.md', bytes: 69595, libraryName: 'docs.md' },
        { path: 'llms.txt', bytes: 727 },
        { path: 'metadata.json', bytes: null },
        { path: 'versions/', bytes: null },
        { path: 'exports/pi.dev_rag.jsonl', bytes: null },
        { path: 'exports/pi.dev_handbook.pdf', bytes: null },
      ],
      rawHtml: { url: 'https://pi.dev/docs/latest', bytes: 56227 },
      emitted: { path: 'docs/latest.md', bytes: 3905 },
      plates: {
        book: { file: 'book.md', excerpt: '# Pi Documentation\n\n> Source: https://pi.dev/docs/latest' },
        llms: { file: 'llms.txt', excerpt: '# Pi Documentation\n\n> Markdown capture of https://pi.dev/docs/latest' },
        page: {
          file: 'docs/latest/providers.md',
          excerpt: '---\nsource_url: "https://pi.dev/docs/latest/providers"\n---\n\n# Providers',
        },
        rag: null,
      },
    },
  ],
};

export const GITHUB_FIXTURE: DocHarvestGithubData = {
  stats: { stars: 128, forks: 16, openIssues: 0, watchers: 128, updatedAt: '2026-09-16T00:00:00Z' },
  latestRelease: {
    tag: 'v11.1.0',
    name: 'DocHarvest v11.1.0',
    publishedAt: '2026-09-19',
    body: '## Highlights\n\n- Native FastMCP v2 server with resources and prompts over stdio.',
    htmlUrl: 'https://github.com/RohannShetty/gitbook-downloader/releases/tag/v11.1.0',
    assets: [
      {
        name: 'docharvest-windows-latest.exe',
        size: 34500000,
        downloadCount: 520,
        browserDownloadUrl:
          'https://github.com/RohannShetty/gitbook-downloader/releases/download/v11.0.10/docharvest-windows-latest.exe',
        os: 'windows',
      },
      {
        name: 'docharvest-ubuntu-latest',
        size: null,
        downloadCount: null,
        browserDownloadUrl:
          'https://github.com/RohannShetty/gitbook-downloader/releases/download/v11.0.10/docharvest-ubuntu-latest',
        os: 'linux',
      },
    ],
  },
  recentCommits: [
    {
      sha: '8c61e9e',
      message: 'docs: rebuild the showcase as the index sheet',
      date: '2026-09-16',
      author: 'Rohan Shetty',
      url: 'https://github.com/RohannShetty/gitbook-downloader/commit/8c61e9e',
    },
  ],
  fetchedAt: '2026-09-17T00:00:00.000Z',
};
