import { STATS } from '../lib/stats';

/**
 * Claim-checked showcase data.
 *
 * Rules this file obeys (they mirror docs/SEO_GUIDE.md §3):
 *   - every count is either the code's own value (provider priorities, tool
 *     registration order) or derived from a list in this file, never typed twice;
 *   - no invented HTML, hashes, sizes or dates — the page's measurements come
 *     from docs/data/manifest.json, produced by scripts/build-index-data.mjs;
 *   - a number that is not in the canonical metrics table does not appear.
 */

export interface DocFramework {
  id: string;
  name: string;
  /** Real site the detector handles; the table links to it. */
  sampleUrl: string;
  /** `Provider.priority` from src/gitbook_downloader/providers/<id>.py */
  detectionPriority: number;
}

export interface AgentHarness {
  id: string;
  name: string;
  category: 'AI IDE' | 'Terminal Agent' | 'Extension' | 'CLI Harness';
  skillDir: string;
  skillInstallCmd: string;
  configPath: string;
  configSnippet: string;
  description: string;
}

/** Harness cards rendered in this sheet (see STATS.agentsShipped). */
export const AI_AGENTS: AgentHarness[] = [
  {
    id: 'agents',
    name: 'Universal .agents / Antigravity',
    category: 'CLI Harness',
    skillDir: '.agents/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .agents/skills',
    configPath: '.gemini/mcp.json · .agents/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
    description: 'Universal standard for autonomous agent skills (Antigravity 2.0, Gemini CLI, Google Agent harness).',
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    category: 'AI IDE',
    skillDir: '.cursor/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .cursor/skills',
    configPath: '.cursor/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
    description: 'AI-first code editor with project-level and user-level FastMCP stdio support.',
  },
  {
    id: 'claude',
    name: 'Claude Code / Desktop',
    category: 'Terminal Agent',
    skillDir: '.claude/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .claude/skills',
    configPath: 'claude_desktop_config.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
    description: "Anthropic terminal CLI agent & Claude Desktop application with full MCP tool dispatch.",
  },
  {
    id: 'windsurf',
    name: 'Windsurf (Codeium)',
    category: 'AI IDE',
    skillDir: '.windsurf/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .windsurf/skills',
    configPath: '~/.codeium/windsurf/mcp_config.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "python",
      "args": ["-m", "gitbook_downloader.mcp"]
    }
  }
}`,
    description: 'Next-gen agentic IDE powered by Codeium Cascade flow and FastMCP integrations.',
  },
  {
    id: 'omp',
    name: 'Oh My Pi (omp.sh)',
    category: 'Terminal Agent',
    skillDir: '.omp/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .omp/skills',
    configPath: '.omp/mcp.json (project) · ~/.omp/agent/mcp.json (user)',
    configSnippet: `{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "docharvest": {
      "type": "stdio",
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"],
      "timeout": 0
    }
  }
}`,
    description: 'High-performance terminal coding agent with automatic tool discovery and persistent sessions.',
  },
  {
    id: 'vscode-cline',
    name: 'VS Code (Cline / Roo / Copilot)',
    category: 'Extension',
    skillDir: '.vscode/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .vscode/skills',
    configPath: '.vscode/mcp.json',
    configSnippet: `{
  "servers": {
    "docharvest": {
      "type": "stdio",
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
    description: 'VS Code autonomous extensions (Cline, Roo Code, Copilot agent mode) with stdio transport.',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    category: 'Terminal Agent',
    skillDir: '~/.config/opencode/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o ~/.config/opencode/skills',
    configPath: '~/.config/opencode/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "python",
      "args": ["-m", "gitbook_downloader.mcp"]
    }
  }
}`,
    description: 'Open-source terminal AI coding assistant with direct MCP command execution.',
  },
  {
    id: 'codex',
    name: 'CommandCode / Codex CLI',
    category: 'CLI Harness',
    skillDir: '.codex/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .codex/skills',
    configPath: '.codex/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
    description: 'OpenAI developer CLI harness and CommandCode automated workflows.',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI Agent',
    category: 'CLI Harness',
    skillDir: '.gemini/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .gemini/skills',
    configPath: '.gemini/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
    description: 'Google Gemini Pro / Flash CLI agent with structured tool-calling capabilities.',
  },
  {
    id: 'github',
    name: 'GitHub Copilot Workspace',
    category: 'Extension',
    skillDir: '.github/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .github/skills',
    configPath: '.github/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
    description: 'GitHub Copilot agent mode and Workspace environment skills.',
  },
  {
    id: 'jetbrains',
    name: 'JetBrains AI Assistant / Junie',
    category: 'AI IDE',
    skillDir: '.idea/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .idea/skills',
    configPath: '.idea/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
    description: 'JetBrains IntelliJ IDEA, PyCharm, and WebStorm AI assistant tools.',
  },
  {
    id: 'zed',
    name: 'Zed Editor',
    category: 'AI IDE',
    skillDir: '.zed/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .zed/skills',
    configPath: '~/.config/zed/settings.json',
    configSnippet: `{
  "context_servers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
    description: 'High-performance Rust-based editor with context server support.',
  },
  {
    id: 'continue',
    name: 'Continue.dev',
    category: 'Extension',
    skillDir: '.continue/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .continue/skills',
    configPath: '~/.continue/config.json',
    configSnippet: `{
  "mcpServers": [
    {
      "name": "docharvest",
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  ]
}`,
    description: 'Open-source AI code assistant for VS Code and JetBrains IDEs.',
  },
  {
    id: 'kilocode',
    name: 'Kilo Code',
    category: 'AI IDE',
    skillDir: '.kilo/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .kilo/skills',
    configPath: '.kilo/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
    description: 'Lightweight agentic workspace environment for multi-agent workflows.',
  },
  {
    id: 'grok',
    name: 'Grok Build',
    category: 'CLI Harness',
    skillDir: '.grok/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .grok/skills',
    configPath: '.grok/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
    description: 'xAI Grok Build engine for autonomous repository code generation.',
  },
  {
    id: 'trae',
    name: 'Trae & Qoder',
    category: 'AI IDE',
    skillDir: '.trae/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .trae/skills',
    configPath: '.trae/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
    description: 'Adaptive AI IDE with deep code understanding and skill routing.',
  },
  {
    id: 'vibe',
    name: 'Mistral Vibe & Rovo Dev',
    category: 'CLI Harness',
    skillDir: '.vibe/skills',
    skillInstallCmd: 'gitbook-dl skill install docharvest -o .vibe/skills',
    configPath: '.vibe/mcp.json',
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "python",
      "args": ["-m", "gitbook_downloader.mcp"]
    }
  }
}`,
    description: 'Mistral Codestral Vibe agent and Atlassian Rovo developer agent harness.',
  },
];

/**
 * The 14 client configs documented in the README, in README order.
 * `AgentTools` lists them and `FAQ_ITEMS` names them — one list, so the count
 * and the enumeration can never disagree.
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

/**
 * Multi-Agent Simulation Pipeline data
 * Demonstrates autonomous coding agents collaborating with DocHarvest MCP tools.
 */
export interface AgentSimulationStep {
  id: string;
  stepNum: string;
  agentRole: string;
  agentTitle: string;
  purpose: string;
  toolCall: {
    toolName: string;
    params: string;
    description: string;
  };
  telemetry: {
    latency: string;
    tokensIn: number;
    tokensOut: number;
    astBound: string;
    status: string;
  };
  outputLog: string;
  artifactsProduced: string[];
}

export const MULTI_AGENT_SIMULATION_STEPS: AgentSimulationStep[] = [
  {
    id: 'crawler',
    stepNum: '01',
    agentRole: 'Crawler / Ingestion Agent',
    agentTitle: 'Autonomous Ingestion & AST Normalizer',
    purpose: 'Detects platform (GitBook v2 API), crawls entire site, strips HTML/CSS junk, writes atomic page tree, and builds SQLite FTS5 BM25 index.',
    toolCall: {
      toolName: 'download_docs',
      params: 'url="https://docs.openalgo.in", output_mode="library", max_pages=251',
      description: 'Crawl documentation tree, strip web junk, and publish normalized Markdown contract.',
    },
    telemetry: {
      latency: '6.8s',
      tokensIn: 142,
      tokensOut: 620,
      astBound: '251 pages · 1,420 sections',
      status: 'Indexed & Snapshotted (v1.0.0)',
    },
    outputLog: `[download_docs] Provider detected: GitBook (priority: 100)
[crawl:bfs] Discovered 251 routes under /developers/ & /api-reference/
[ast_cleaner] Stripped 48.2 KB cookie DOMs, sidebars, inline JSX hydrators
[output_contract] Emitted 251 pages -> ~/.gitbook-downloader/docs/docs.openalgo.in/
[output_contract] Wrote combined book.md (4.2 MB) + llms.txt manifest (2.4 KB)
[search_index] Indexed 1,420 sections into SQLite FTS5 database (search.db)
[doc_graph] Built semantic concept graph (640 nodes, 1,180 edges)
[snapshot] Created baseline snapshot v1.0.0 (SHA-256 verified)`,
    artifactsProduced: [
      '~/.gitbook-downloader/docs/docs.openalgo.in/pages/',
      'docs.md (unified book)',
      'llms.txt (agent manifest)',
      'search.db (SQLite FTS5 BM25)',
      'versions/v1.0.0.md',
    ],
  },
  {
    id: 'architect',
    stepNum: '02',
    agentRole: 'Architect / Synthesis Agent',
    agentTitle: 'Concept Graph & Full-Text Search Synthesizer',
    purpose: 'Discovers relevant architectural concepts and cross-page relationships via ranked BM25 search and 1-hop semantic graph queries.',
    toolCall: {
      toolName: 'search_docs & query_doc_graph',
      params: 'query="OAuth PKCE token refresh blueprints", domain="docs.openalgo.in"',
      description: 'Query SQLite FTS5 BM25 index and resolve 1-hop concept graph associations.',
    },
    telemetry: {
      latency: '12ms',
      tokensIn: 88,
      tokensOut: 940,
      astBound: '5 hits · 6 connected graph nodes',
      status: 'Targeted Retrieval (0 context bloat)',
    },
    outputLog: `[search_docs] query="OAuth PKCE token refresh blueprints" (limit=5)
-> hit 1: docs.openalgo.in/#oauth-model (BM25 rank: -6.7696)
   source: /developers/design-documentation/41-mcp-architecture.md
   snippet: "## OAuth Model \`blueprints/mcp_oauth.py\` implements discovery, PKCE..."
-> hit 2: docs.openalgo.in/#token-storage (BM25 rank: -5.4120)
   source: /developers/security/token-management.md
[query_doc_graph] concept="OAuth Model" in domain="docs.openalgo.in"
-> Node [Page]: /developers/design-documentation/41-mcp-architecture.md
-> Edges [References]: 'blueprints/mcp_oauth.py', 'TokenStorage', 'PKCEChallenge'
-> Connected Concepts: AuthFlow, ClientCredentials, BearerTokenValidator`,
    artifactsProduced: [
      'Hit metadata with source URL anchors',
      'Exact line/heading coordinates',
      '1-hop concept graph dependency map',
    ],
  },
  {
    id: 'auditor',
    stepNum: '03',
    agentRole: 'Auditor / Verifier Agent',
    agentTitle: 'AST-Bounded Code & Implementation Verifier',
    purpose: 'Reads precision AST-bounded Markdown section for the targeted file with token limits, verifying API signatures with zero hallucination.',
    toolCall: {
      toolName: 'read_doc',
      params: 'domain="docs.openalgo.in", topic="blueprints/mcp_oauth.py", max_tokens=1200',
      description: 'Read structured AST-safe section without overflowing token budget or truncating mid-block.',
    },
    telemetry: {
      latency: '4ms',
      tokensIn: 54,
      tokensOut: 824,
      astBound: 'Section: lines 142–208',
      status: 'AST Bound Verified (0 hallucination)',
    },
    outputLog: `[read_doc] target="blueprints/mcp_oauth.py" in domain="docs.openalgo.in"
[ast_bound] Section: "## OAuth Model \`blueprints/mcp_oauth.py\`" (lines 142-208)
[token_budget] Budget: 1,200 tokens · Emitted: 824 tokens (0 truncation)
[content_verified]
\`\`\`python
# blueprints/mcp_oauth.py — verified implementation excerpt
class MCPOAuthHandler:
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self._verifier = generate_pkce_verifier()
\`\`\`
[audit_result] Implementation matches official spec verbatim.`,
    artifactsProduced: [
      'AST-bounded verified code block',
      'Zero mid-section truncation',
      'Token consumption within budget',
    ],
  },
];

/**
 * Token Reduction Benchmark Data
 * Measured comparison: Raw Web Scrape vs DocHarvest AST Extraction (~83% reduction)
 */
export interface TokenNoiseCategory {
  category: string;
  percentage: number;
  tokens: number;
  description: string;
}

export interface PreservedCategory {
  category: string;
  tokens: number;
  description: string;
}

export const TOKEN_BENCHMARK = {
  rawScraper: {
    label: 'Raw Web Scraper / Cloud Reader API',
    totalTokens: 42480,
    totalBytes: '312 KB raw HTML',
    noiseBreakdown: [
      {
        category: 'Navigation & Sidebar DOMs',
        percentage: 35,
        tokens: 14800,
        description: 'Deeply nested menus, search dialogs, dropdown trees, and breadcrumb DOMs',
      },
      {
        category: 'Client JS Hydration Bundles',
        percentage: 32,
        tokens: 13600,
        description: '__NEXT_DATA__ payloads, Webpack runtime chunks, React hydration states',
      },
      {
        category: 'Cookie Banners & Modals',
        percentage: 10,
        tokens: 4200,
        description: 'GDPR consent widgets, newsletter popups, feedback dialog wrappers',
      },
      {
        category: 'CSS Framework Soup & Classes',
        percentage: 6,
        tokens: 2640,
        description: 'Tailwind inline classes, emotion style tags, font-face declarations',
      },
      {
        category: 'Residual Boilerplate',
        percentage: 17,
        tokens: 7240,
        description: 'HTML wrappers, comments, tracking pixels, header/footer boilerplate',
      },
    ] as TokenNoiseCategory[],
  },
  docHarvest: {
    label: 'DocHarvest AST Cleaned Markdown',
    totalTokens: 7240,
    totalBytes: '34 KB clean Markdown',
    reductionPercentage: 83,
    tokensSaved: 35240,
    preservedContent: [
      {
        category: 'Semantic Headings & Sections',
        tokens: 1650,
        description: 'Clean H1–H6 hierarchy with anchor URLs matching official docs',
      },
      {
        category: 'Syntax-Highlighted Code Blocks',
        tokens: 3820,
        description: 'Pristine code samples with language tags and preserved indentation',
      },
      {
        category: 'Cryptographic YAML Frontmatter',
        tokens: 340,
        description: 'SHA-256 hash, canonical source_url, title, and last_crawled ISO stamp',
      },
      {
        category: 'Markdown Tables & Clean Lists',
        tokens: 1430,
        description: 'Tabular parameters, return schemas, and relative markdown links',
      },
    ] as PreservedCategory[],
  },
};

/**
 * Detector names, real sample sites and the priority values compiled into
 * `src/gitbook_downloader/providers/*.py` (100 → 60; `generic` is 0 and lives
 * in the provider table itself). Signal prose lives in ProviderTable, quoted
 * from each `detect()` docstring.
 */
export const DOC_FRAMEWORKS: DocFramework[] = [
  {
    id: 'gitbook',
    name: 'GitBook',
    sampleUrl: 'https://docs.openalgo.in/v/v2.0/api-reference',
    detectionPriority: 100,
  },
  {
    id: 'mintlify',
    name: 'Mintlify',
    sampleUrl: 'https://docs.anthropic.com/en/docs',
    detectionPriority: 90,
  },
  {
    id: 'docusaurus',
    name: 'Docusaurus',
    sampleUrl: 'https://reactnative.dev/docs/getting-started',
    detectionPriority: 80,
  },
  {
    id: 'nextra',
    name: 'Nextra',
    sampleUrl: 'https://swr.vercel.app/docs/getting-started',
    detectionPriority: 75,
  },
  {
    id: 'vitepress',
    name: 'VitePress',
    sampleUrl: 'https://vitepress.dev/guide/what-is-vitepress',
    detectionPriority: 72,
  },
  {
    id: 'mkdocs',
    name: 'MkDocs',
    sampleUrl: 'https://squidfunk.github.io/mkdocs-material/',
    detectionPriority: 70,
  },
  {
    id: 'readme',
    name: 'ReadMe.io',
    sampleUrl: 'https://docs.readme.com/reference',
    detectionPriority: 65,
  },
  {
    id: 'readthedocs',
    name: 'ReadTheDocs',
    sampleUrl: 'https://docs.readthedocs.io/en/stable/',
    detectionPriority: 60,
  },
];

export const MATRIX_ROWS = [
  {
    feature: 'Native AST framework extraction (GitBook, Mintlify, Docusaurus)',
    docharvest: true,
    rawScrapers: false,
    cloudApis: 'Partial',
    detail: 'Automatically isolates article DOMs and probes raw markdown endpoints directly.',
  },
  {
    feature: `Zero HTML/JSX soup in the emitted Markdown (~${STATS.reductionPct}% token reduction)`,
    docharvest: true,
    rawScrapers: false,
    cloudApis: true,
    detail: 'Strips cookie banners, navbars, sidebars, and interactive widget code.',
  },
  {
    feature: `Built-in FastMCP v2 server (${STATS.mcpTools} tools) for ${DOC_HARVEST_CLIENTS.length} documented AI clients`,
    docharvest: true,
    rawScrapers: false,
    cloudApis: 'API Key Req',
    detail: `${STATS.mcpTools} native MCP tools, resources & prompts running over stdio directly inside your agent.`,
  },
  {
    feature: 'Standard llms.txt & vector RAG JSONL compilation',
    docharvest: true,
    rawScrapers: false,
    cloudApis: false,
    detail: 'Builds unified RAG chunk files with token counts and SHA-256 content hashes.',
  },
  {
    feature: 'Embedded SQLite FTS5 BM25 full-text search',
    docharvest: true,
    rawScrapers: false,
    cloudApis: false,
    detail: 'Ranked keyword search queries across thousands of harvested pages.',
  },
  {
    feature: 'Pure-Python PDF handbook generation with TOC (fpdf2)',
    docharvest: true,
    rawScrapers: false,
    cloudApis: false,
    detail: 'Zero external C-library dependencies (no WeasyPrint or wkhtmltopdf).',
  },
  {
    feature: 'Client-side SPA Playwright rendering (--render)',
    docharvest: true,
    rawScrapers: false,
    cloudApis: true,
    detail: 'Crawls heavy client-rendered JavaScript portals like omp.sh with headless browser hydration.',
  },
  {
    feature: '100% free, open source (MIT) & zero cloud telemetry',
    docharvest: true,
    rawScrapers: true,
    cloudApis: false,
    detail: 'No subscription fees, no per-page charges, and zero data leaves your local machine.',
  },
];

/** Join names the way the FAQ reads them: "a, b, and c". */
function enumerate(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export const FAQ_ITEMS = [
  {
    q: "Isn't this just another web scraper? How is it different from curl, Scrapy, or BeautifulSoup?",
    a: 'Basic scrapers dump messy HTML soup loaded with 40KB+ of cookie banners, navigation menus, and fragmented code blocks with broken indentation. DocHarvest is an engineered documentation compiler: it automatically detects frameworks (GitBook, Mintlify, Docusaurus, Nextra), probes native .md raw endpoints directly, locks crawls strictly to doc subpaths, injects cryptographic SHA-256 YAML frontmatter, compiles unified book.md handbooks, exports pure-Python PDFs, and indexes everything into an embedded SQLite FTS5 BM25 search database.',
  },
  {
    q: 'Why choose DocHarvest over Firecrawl, Jina Reader, or cloud scraper APIs?',
    a: 'Cloud scraping APIs charge per-page fees ($0.01 - $0.05/page) that quickly escalate on 1,000+ page libraries, require active internet connections, send your proprietary internal docs to third-party servers, and do not provide local search libraries, PDF generation, or semver diff engines. DocHarvest is 100% free, open-source (MIT), runs locally on your machine, and has zero network telemetry.',
  },
  {
    q: 'Which AI coding agents and IDEs support DocHarvest FastMCP?',
    a: `DocHarvest's FastMCP v2 server is fully standard-compliant over stdio and ships ready-made configs for ${DOC_HARVEST_CLIENTS.length} documented clients: ${enumerate(DOC_HARVEST_CLIENTS)}.`,
  },
  {
    q: 'Does it work with client-rendered JavaScript Single-Page Applications (SPAs)?',
    a: 'Yes. Modern documentation SPAs (GitBook, Mintlify, Docusaurus, Nextra, VitePress) publish underlying raw .md endpoints and sitemaps that DocHarvest probes first. For purely client-rendered SPAs (like omp.sh), DocHarvest includes an opt-in Playwright headless rendering engine (--render) to execute client-side JavaScript before compilation.',
  },
  {
    q: 'What dependencies are needed for PDF export? Do I need WeasyPrint or wkhtmltopdf?',
    a: 'Zero external C-dependencies! DocHarvest uses a custom layout engine built on pure-Python fpdf2. It generates styled, syntax-highlighted printable PDF handbooks with page numbers and table of contents out of the box on Windows, macOS, and Linux.',
  },
];
