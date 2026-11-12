/**
 * Showcase data. Plain copy only.
 *
 * Rules this file obeys:
 *   - counts are the code's own values (`Provider.priority`, MCP registrations)
 *     or derived from a list declared here — never typed twice;
 *   - no invented benchmark, telemetry, or customer number appears anywhere in
 *     this file; measurements come from `docs/lib/stats.ts` (generated) or from
 *     `docs/data/manifest.json` (measured on disk);
 *   - naming is `docharvest` / DocHarvest. `gitbook-dl` survives only as a CLI
 *     alias and is never the name in an instruction.
 */

export interface DocFramework {
  id: string;
  name: string;
  /** Real site the detector handles; the table links to it. */
  sampleUrl: string;
  /** `Provider.priority` from src/docharvest/providers/<id>.py */
  detectionPriority: number;
  /** What the dedicated reader actually does, in one clause. */
  approach: string;
}

export const DOC_FRAMEWORKS: DocFramework[] = [
  {
    id: 'gitbook',
    name: 'GitBook',
    sampleUrl: 'https://docs.openalgo.in/v/v2.0/api-reference',
    detectionPriority: 100,
    approach: 'Reads the GitBook content API and its version list.',
  },
  {
    id: 'mintlify',
    name: 'Mintlify',
    sampleUrl: 'https://docs.anthropic.com/en/docs',
    detectionPriority: 90,
    approach: 'Reads the MDX source behind each page.',
  },
  {
    id: 'docusaurus',
    name: 'Docusaurus',
    sampleUrl: 'https://reactnative.dev/docs/getting-started',
    detectionPriority: 80,
    approach: 'Reads docs routes and the sidebar ordering.',
  },
  {
    id: 'nextra',
    name: 'Nextra',
    sampleUrl: 'https://swr.vercel.app/docs/getting-started',
    detectionPriority: 75,
    approach: 'Follows the `_meta` navigation to each page.',
  },
  {
    id: 'vitepress',
    name: 'VitePress',
    sampleUrl: 'https://vitepress.dev/guide/what-is-vitepress',
    detectionPriority: 72,
    approach: 'Reads the Markdown source and sidebar config.',
  },
  {
    id: 'mkdocs',
    name: 'MkDocs',
    sampleUrl: 'https://squidfunk.github.io/mkdocs-material/',
    detectionPriority: 70,
    approach: 'Follows `mkdocs.yml` navigation and Markdown sources.',
  },
  {
    id: 'readme',
    name: 'ReadMe.io',
    sampleUrl: 'https://docs.readme.com/reference',
    detectionPriority: 65,
    approach: 'Reads the documentation JSON payload per page.',
  },
  {
    id: 'readthedocs',
    name: 'ReadTheDocs',
    sampleUrl: 'https://docs.readthedocs.io/en/stable/',
    detectionPriority: 60,
    approach: 'Reads the `_sources` tree and version selector.',
  },
];

/**
 * Client configs documented in the README, in README order.
 * `Connectivity` prints this list; nothing else keeps its own copy.
 */
export const DOC_HARVEST_CLIENTS: string[] = [
  'Claude Code',
  'Claude Desktop',
  'Cursor',
  'Windsurf',
  'VS Code',
  'JetBrains',
  'Zed',
  'Cline',
  'Continue.dev',
  'Kiro',
  'OpenCode',
  'Oh My Pi (omp.sh)',
  'Antigravity / Gemini CLI',
  'OpenAI Codex CLI',
];

/** The three ways an agent or a program can read a captured corpus. */
export const CONNECT_PATHS = [
  {
    id: 'mcp',
    label: 'MCP client',
    title: 'Point an MCP client at the local server',
    detail:
      'docharvest mcp speaks MCP over stdio. Add one entry to the client config; the 12 tools and 2 resources below appear as soon as it connects.',
    language: 'json',
    code: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["docharvest", "mcp"]
    }
  }
}`,
    note: 'The same JSON works for the 14 clients listed below; only the file path changes.',
  },
  {
    id: 'skill',
    label: 'Agent skill',
    title: 'Install the bundled skill instead',
    detail:
      'If the harness reads skill files rather than MCP, write the bundled skill into its directory. The skill documents the same commands.',
    language: 'bash',
    code: 'docharvest skill install docharvest -o .cursor/skills',
    note: 'Available skills are listed by `docharvest skill list`.',
  },
  {
    id: 'files',
    label: 'Files on disk',
    title: 'Read the corpus with no server at all',
    detail:
      'Everything is a plain file under the library root, so a script or a RAG pipeline can read it directly.',
    language: 'python',
    code: `from pathlib import Path

root = Path.home() / ".docharvest" / "docs" / "docs.example.com"
book = (root / "docs.md").read_text(encoding="utf-8")`,
    note: 'The page tree, book, manifest, and search index carry the same content.',
  },
] as const;

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What does DocHarvest actually do?',
    answer:
      'It captures one documentation site into a local directory: a Markdown file per page, a combined book, an llms.txt manifest, a SQLite full-text index, and optional JSONL and PDF exports. It runs on your machine and writes nothing anywhere else.',
  },
  {
    question: 'How is this different from a cloud reader API?',
    answer:
      'A hosted reader charges per page and holds your content on its servers. DocHarvest fetches the pages itself, and the output stays in ~/.docharvest/docs/<domain>/. There is no account, no quota, and no upload step.',
  },
  {
    question: 'Which sites are supported?',
    answer:
      'Eight dedicated readers cover GitBook, Mintlify, Docusaurus, Nextra, VitePress, MkDocs, ReadMe.io, and ReadTheDocs. Any other site falls back to the generic crawler, which follows same-domain links and extracts the main content. Client-rendered pages need the optional --render flag (Playwright); without it you get the server-rendered HTML.',
  },
  {
    question: 'How do coding agents use the captured docs?',
    answer:
      'Run docharvest mcp and the agent gets 12 tools (capture, search, read, diff, export, graph queries), 2 resources, and 2 prompts over stdio. The README documents config paths for 14 clients. Or install the bundled skill file instead of an MCP server.',
  },
  {
    question: 'Does it send telemetry, or get past logins and CAPTCHAs?',
    answer:
      'No. There is no telemetry and no login, paywall, or CAPTCHA bypass: it fetches pages the same way a browser would without credentials. Captures are subject to the source site’s terms and robots rules, which is why the tool is meant for documentation you are allowed to read and keep.',
  },
];
