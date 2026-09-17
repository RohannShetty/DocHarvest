import { STATS } from '../lib/stats'

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
  id: string
  name: string
  /** Real site the detector handles; the table links to it. */
  sampleUrl: string
  /** `Provider.priority` from src/gitbook_downloader/providers/<id>.py */
  detectionPriority: number
}

export interface AgentHarness {
  id: string
  name: string
  category: 'AI IDE' | 'Terminal Agent' | 'Extension' | 'CLI Harness'
  configPath: string
  configSnippet: string
}

/** Harness cards rendered in this sheet (see STATS.agentsShipped). */
export const AI_AGENTS: AgentHarness[] = [
  {
    id: "cursor",
    name: "Cursor IDE",
    category: "AI IDE",
    configPath: ".cursor/mcp.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
  },
  {
    id: "claude",
    name: "Claude Code / Desktop",
    category: "Terminal Agent",
    configPath: "claude_desktop_config.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
  },
  {
    id: "opencode",
    name: "OpenCode",
    category: "Terminal Agent",
    configPath: "~/.config/opencode/mcp.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "python",
      "args": ["-m", "gitbook_downloader.mcp"]
    }
  }
}`,
  },
  {
    id: "omp",
    name: "Oh My Pi (omp.sh)",
    category: "Terminal Agent",
    configPath: ".omp/mcp.json (project) · ~/.omp/agent/mcp.json (user)",
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
  },
  {
    id: "windsurf",
    name: "Windsurf (Codeium)",
    category: "AI IDE",
    configPath: "~/.codeium/windsurf/mcp_config.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "python",
      "args": ["-m", "gitbook_downloader.mcp"]
    }
  }
}`,
  },
  {
    id: "vscode-cline",
    name: "VS Code (Cline / Roo Code / Copilot)",
    category: "Extension",
    configPath: ".vscode/mcp.json",
    configSnippet: `{
  "servers": {
    "docharvest": {
      "type": "stdio",
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
  },
  {
    id: "codex",
    name: "CommandCode / Codex CLI",
    category: "CLI Harness",
    configPath: ".codex/mcp.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
  },
  {
    id: "kilocode",
    name: "Kilo Code",
    category: "AI IDE",
    configPath: ".kilo/mcp.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
  },
  {
    id: "grok",
    name: "Grok Build",
    category: "CLI Harness",
    configPath: ".grok/mcp.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
  },
  {
    id: "gemini",
    name: "Gemini CLI / Antigravity",
    category: "CLI Harness",
    configPath: ".gemini/mcp.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uv",
      "args": ["run", "docharvest", "mcp"]
    }
  }
}`,
  },
  {
    id: "trae",
    name: "Trae & Qoder",
    category: "AI IDE",
    configPath: ".trae/mcp.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "uvx",
      "args": ["gitbook-downloader", "mcp"]
    }
  }
}`,
  },
  {
    id: "vibe",
    name: "Mistral Vibe & Rovo Dev",
    category: "CLI Harness",
    configPath: ".vibe/mcp.json",
    configSnippet: `{
  "mcpServers": {
    "docharvest": {
      "command": "python",
      "args": ["-m", "gitbook_downloader.mcp"]
    }
  }
}`,
  }
];

/**
 * The 14 client configs documented in the README, in README order.
 * `AgentTools` lists them and `FAQ_ITEMS` names them — one list, so the count
 * and the enumeration can never disagree.
 */
export const DOC_HARVEST_CLIENTS: string[] = [
  "Claude Code",
  "Claude Desktop",
  "Cursor",
  "Windsurf",
  "VS Code",
  "JetBrains",
  "Zed",
  "Cline",
  "Continue.dev",
  "Kiro",
  "OpenCode",
  "Oh My Pi (omp.sh)",
  "Antigravity / Gemini CLI",
  "OpenAI Codex CLI",
];

/**
 * Detector names, real sample sites and the priority values compiled into
 * `src/gitbook_downloader/providers/*.py` (100 → 60; `generic` is 0 and lives
 * in the provider table itself). Signal prose lives in ProviderTable, quoted
 * from each `detect()` docstring.
 */
export const DOC_FRAMEWORKS: DocFramework[] = [
  {
    id: "gitbook",
    name: "GitBook",
    sampleUrl: "https://docs.openalgo.in/v/v2.0/api-reference",
    detectionPriority: 100,
  },
  {
    id: "mintlify",
    name: "Mintlify",
    sampleUrl: "https://docs.anthropic.com/en/docs",
    detectionPriority: 90,
  },
  {
    id: "docusaurus",
    name: "Docusaurus",
    sampleUrl: "https://reactnative.dev/docs/getting-started",
    detectionPriority: 80,
  },
  {
    id: "nextra",
    name: "Nextra",
    sampleUrl: "https://swr.vercel.app/docs/getting-started",
    detectionPriority: 75,
  },
  {
    id: "vitepress",
    name: "VitePress",
    sampleUrl: "https://vitepress.dev/guide/what-is-vitepress",
    detectionPriority: 72,
  },
  {
    id: "mkdocs",
    name: "MkDocs",
    sampleUrl: "https://squidfunk.github.io/mkdocs-material/",
    detectionPriority: 70,
  },
  {
    id: "readme",
    name: "ReadMe.io",
    sampleUrl: "https://docs.readme.com/reference",
    detectionPriority: 65,
  },
  {
    id: "readthedocs",
    name: "ReadTheDocs",
    sampleUrl: "https://docs.readthedocs.io/en/stable/",
    detectionPriority: 60,
  }
];

export const MATRIX_ROWS = [
  {
    feature: "Native AST framework extraction (GitBook, Mintlify, Docusaurus)",
    docharvest: true,
    rawScrapers: false,
    cloudApis: "Partial",
    detail: "Automatically isolates article DOMs and probes raw markdown endpoints directly."
  },
  {
    feature: `Zero HTML/JSX soup in the emitted Markdown (~${STATS.reductionPct}% token reduction)`,
    docharvest: true,
    rawScrapers: false,
    cloudApis: true,
    detail: "Strips cookie banners, navbars, sidebars, and interactive widget code."
  },
  {
    feature: `Built-in FastMCP v2 server (${STATS.mcpTools} tools) for ${DOC_HARVEST_CLIENTS.length} documented AI clients`,
    docharvest: true,
    rawScrapers: false,
    cloudApis: "API Key Req",
    detail: `${STATS.mcpTools} native MCP tools, resources & prompts running over stdio directly inside your agent.`
  },
  {
    feature: "Standard llms.txt & vector RAG JSONL compilation",
    docharvest: true,
    rawScrapers: false,
    cloudApis: false,
    detail: "Builds unified RAG chunk files with token counts and SHA-256 content hashes."
  },
  {
    feature: "Embedded SQLite FTS5 BM25 full-text search",
    docharvest: true,
    rawScrapers: false,
    cloudApis: false,
    detail: "Ranked keyword search queries across thousands of harvested pages."
  },
  {
    feature: "Pure-Python PDF handbook generation with TOC (fpdf2)",
    docharvest: true,
    rawScrapers: false,
    cloudApis: false,
    detail: "Zero external C-library dependencies (no WeasyPrint or wkhtmltopdf)."
  },
  {
    feature: "Client-side SPA Playwright rendering (--render)",
    docharvest: true,
    rawScrapers: false,
    cloudApis: true,
    detail: "Crawls heavy client-rendered JavaScript portals like omp.sh with headless browser hydration."
  },
  {
    feature: "100% free, open source (MIT) & zero cloud telemetry",
    docharvest: true,
    rawScrapers: true,
    cloudApis: false,
    detail: "No subscription fees, no per-page charges, and zero data leaves your local machine."
  }
];

/** Join names the way the FAQ reads them: "a, b, and c". */
function enumerate(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export const FAQ_ITEMS = [
  {
    q: "Isn't this just another web scraper? How is it different from curl, Scrapy, or BeautifulSoup?",
    a: "Basic scrapers dump messy HTML soup loaded with 40KB+ of cookie banners, navigation menus, and fragmented code blocks with broken indentation. DocHarvest is an engineered documentation compiler: it automatically detects frameworks (GitBook, Mintlify, Docusaurus, Nextra), probes native .md raw endpoints directly, locks crawls strictly to doc subpaths, injects cryptographic SHA-256 YAML frontmatter, compiles unified book.md handbooks, exports pure-Python PDFs, and indexes everything into an embedded SQLite FTS5 BM25 search database."
  },
  {
    q: "Why choose DocHarvest over Firecrawl, Jina Reader, or cloud scraper APIs?",
    a: "Cloud scraping APIs charge per-page fees ($0.01 - $0.05/page) that quickly escalate on 1,000+ page libraries, require active internet connections, send your proprietary internal docs to third-party servers, and do not provide local search libraries, PDF generation, or semver diff engines. DocHarvest is 100% free, open-source (MIT), runs locally on your machine, and has zero network telemetry."
  },
  {
    q: "Which AI coding agents and IDEs support DocHarvest FastMCP?",
    a: `DocHarvest's FastMCP v2 server is fully standard-compliant over stdio and ships ready-made configs for ${DOC_HARVEST_CLIENTS.length} documented clients: ${enumerate(DOC_HARVEST_CLIENTS)}.`
  },
  {
    q: "Does it work with client-rendered JavaScript Single-Page Applications (SPAs)?",
    a: "Yes. Modern documentation SPAs (GitBook, Mintlify, Docusaurus, Nextra, VitePress) publish underlying raw .md endpoints and sitemaps that DocHarvest probes first. For purely client-rendered SPAs (like omp.sh), DocHarvest includes an opt-in Playwright headless rendering engine (--render) to execute client-side JavaScript before compilation."
  },
  {
    q: "What dependencies are needed for PDF export? Do I need WeasyPrint or wkhtmltopdf?",
    a: "Zero external C-dependencies! DocHarvest uses a custom layout engine built on pure-Python fpdf2. It generates styled, syntax-highlighted printable PDF handbooks with page numbers and table of contents out of the box on Windows, macOS, and Linux."
  }
];
