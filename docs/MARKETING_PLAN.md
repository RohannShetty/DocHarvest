# DocHarvest — Multi-Channel Developer Marketing & Skill Distribution Plan
## Strategy, Post Copy, Registry Submissions & Ecosystem Integrations

**Product:** DocHarvest (`gitbook-downloader`)  
**Version:** 11.0.10  
**Target Audience:** AI Engineers, Agent Developers, RAG Builders, Technical Writers, Offline Developers  
**Author:** Marketing & Developer Relations Lead  
**Last Updated:** September 2026  

---

## 1. Executive Marketing Thesis & Positioning

### 1.1 The Core Problem & Value Proposition
Developers building with coding agents (Cursor, Claude Code, Windsurf) and RAG pipelines face a universal pain point: **raw web pages are 80–85% noise**. Cloud scraping services charge per page, inject tracking scripts and sidebars into prompt context, and fail in offline environments.

**DocHarvest's Value Proposition**:
> *"DocHarvest is a 100% local, MIT-licensed documentation compiler that transforms any technical documentation portal into noise-free, LLM-ready markdown, vector RAG JSONL, and offline PDFs — reducing token overhead by ~83% with cryptographic SHA-256 provenance."*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POSITIONING ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│   What Cloud Scrapers Do:            What DocHarvest Does:                  │
│   • Per-page cloud billing           • 100% Local & Free (MIT)              │
│   • 85% HTML noise in context        • ~83% Token Reduction via AST parser  │
│   • Generic text dumps               • Structured 4-Part Output Contract    │
│   • Slow HTTP round-trips            • 673 pages in 18.2s (~37 pages/sec)   │
│   • Non-verifiable citations         • SHA-256 Frontmatter Provenance       │
│   • Single-agent locked              • Universal Skill for 14+ Agent IDEs   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 The Two-Layer Keyword & Positioning Strategy
- **Discovery Layer (SEO/Tags)**: Utilize search queries developers use (`documentation scraper`, `gitbook scraper`, `mintlify downloader`, `docusaurus scraper`).
- **Positioning Layer (Copy/Brand)**: Always self-identify as a **Documentation Compiler & Harvester** ("Compiles docs into LLM knowledge bases; replaces expensive cloud scrapers").

---

## 2. Launch Timeline & Orchestration Roadmap

```
Week 1: Foundations            Week 2: Community Launch         Week 3: Framework Growth         Week 4: Content Flywheel
┌──────────────────────┐       ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
│ • Agent Registries   │ ────> │ • Show HN Launch     │ ─────> │ • LangChain Loader   │ ─────> │ • Technical Deepdive │
│ • Skill Hubs PRs     │       │ • Reddit Subreddits  │        │ • LlamaIndex Plugin  │        │ • Token Calculator   │
│ • PyPI / GitHub SEO  │       │ • X/Twitter Thread   │        │ • crewAI Integration │        │ • Doc Hub Ecosystem  │
└──────────────────────┘       └──────────────────────┘        └──────────────────────┘        └──────────────────────┘
```

---

## 3. Phase 1: Agent Registries & Skill Hub Submissions

### 3.1 Cursor Directory (`cursor.directory`) Submission

**Title:** DocHarvest — Local Documentation Harvester & MCP Server  
**Category:** Documentation / Context / RAG  
**Command:** `docharvest skill install docharvest -o .cursor/skills`  

**Listing Content:**
```markdown
# DocHarvest Cursor Skill

Harvest any documentation site (GitBook, Mintlify, Docusaurus, VitePress, ReadMe, ReadTheDocs, MkDocs) into local, noise-free Markdown with full-text search and semantic concept graphs.

### Features:
- 🚀 Ultra-fast: Compiles 673 pages in 18.2s into `.cursor/` or `~/.gitbook-downloader/`
- 🎯 ~83% Token Reduction: Strips navbars, ads, cookie modals, and tracking scripts
- 🔍 SQLite FTS5 BM25 search across all harvested documentation
- 📊 DocGraph semantic concept exploration for prerequisite and API discovery
- 🔒 Cryptographic SHA-256 provenance in YAML frontmatter

### Quick Setup:
1. `pip install gitbook-downloader`
2. `docharvest skill install docharvest -o .cursor/skills`
3. Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "docharvest": {
      "command": "docharvest",
      "args": ["mcp"]
    }
  }
}
```
```

---

### 3.2 Anthropic Claude Skills & MCP Registry (`modelcontextprotocol/servers`)

**PR Target:** `modelcontextprotocol/servers` / `awesome-mcp-servers`  
**Server Name:** `docharvest` (`gitbook-downloader`)  
**Transport:** `stdio` (FastMCP v2)  

**Pull Request Description:**
```markdown
### Add DocHarvest MCP Server

**Repository:** https://github.com/RohannShetty/DocHarvest
**Package:** `pip install gitbook-downloader` (or `uvx gitbook-downloader mcp`)  
**License:** MIT  

DocHarvest provides 12 MCP tools for downloading, searching, reading, diffing, and exploring technical documentation portals locally.

- **12 FastMCP Tools:** `download_docs`, `search_docs`, `find_docs`, `read_doc`, `get_doc`, `list_domains`, `query_doc_graph`, `get_related_concepts`, `diff_versions`, `list_versions`, `export_docs`, `get_changelog`.
- **MCP Resources:** `docs://{domain}/book`, `docs://{domain}/manifest`.
- **MCP Prompts:** `prompt://search-docset`, `prompt://summarize-library`.
- **Zero Configuration:** Bundled FastMCP SDK works out-of-the-box with `uvx gitbook-downloader mcp`.
```

---

### 3.3 GitHub Metadata & Discoverability Configuration

Apply via GitHub CLI:
```bash
gh repo edit RohannShetty/DocHarvest \
  --description "Turn any documentation site into LLM-ready Markdown, RAG JSONL, llms.txt & offline PDFs. 12-tool FastMCP server, zero-config CLI, desktop GUI. 100% local & MIT." \
  --homepage "https://rohannshetty.github.io/DocHarvest/" \
  --add-topic "rag" \
  --add-topic "llms-txt" \
  --add-topic "documentation-compiler" \
  --add-topic "documentation-scraper" \
  --add-topic "mcp-server" \
  --add-topic "ai-agents" \
  --add-topic "offline-docs" \
  --add-topic "pdf-generator" \
  --add-topic "gitbook" \
  --add-topic "mintlify" \
  --add-topic "docusaurus" \
  --add-topic "vitepress" \
  --add-topic "readme-io" \
  --add-topic "nextra" \
  --add-topic "local-ai" \
  --add-topic "vector-database" \
  --add-topic "sqlite-fts5" \
  --add-topic "fpdf2" \
  --add-topic "cli" \
  --add-topic "desktop-app"
```

---

## 4. Phase 2: Developer Community Launch Playbooks

### 4.1 Hacker News — Show HN Launch

**Title:** `Show HN: DocHarvest – Turn any doc site into clean LLM markdown, RAG JSONL and offline books`  
**URL:** `https://github.com/RohannShetty/DocHarvest` (or self-post text)

**Body Text:**
```markdown
Hi HN! I built DocHarvest (pip install gitbook-downloader) because I was tired of watching my coding agents ingest 85% boilerplate HTML when trying to read documentation.

### The Problem
When you ask an agent (Cursor, Claude Code, Windsurf) to read a documentation portal, it usually downloads raw web pages. Navbars, footer links, cookie consents, SVG icons, and search modals consume up to 85% of your context window before a single API signature arrives. Cloud scraping APIs charge per page, add network latency, and lose code block hierarchy.

### What DocHarvest Does
DocHarvest is a 100% local, MIT-licensed documentation compiler with zero external service dependencies:

1. **Auto-Detects 8 Platforms**: GitBook, Mintlify, Docusaurus, Nextra, VitePress, MkDocs, ReadMe, and ReadTheDocs (plus fallback for generic HTML / SPAs).
2. **~83% Token Reduction**: Strips DOM noise and extracts pristine markdown with AST-safe token bounding.
3. **Four-Part Output Contract**: Every capture yields a modular `pages/` tree, a consolidated `book.md` with hierarchical TOC, an `llms.txt` manifest, and search index records.
4. **Local SQLite FTS5 Search & Semantic Graph**: BM25 full-text search and concept dependency graph (`query_doc_graph`) to traverse API relationships with zero network requests.
5. **Native FastMCP v2 Server (12 Tools)**: Direct stdio integration for Claude Code, Cursor, Windsurf, VS Code, and Oh My Pi.
6. **Universal Agent Skill (`SKILL.md`)**: 1-command installer (`docharvest skill install docharvest -o <dir>`) that equips 14+ agent harnesses with automated retrieval intelligence.
7. **Pure-Python PDF Studio & RAG JSONL**: Generates publication-grade PDF handbooks and tokenized vector datasets locally via `fpdf2` with zero C-dependencies.

### Benchmark
On our reference capture of the OpenAlgo docs portal (673 pages):
- **Wall-clock time:** 18.2 seconds (~37 pages/sec with 8 parallel workers)
- **Token reduction:** 82.8% vs raw HTML responses
- **Disk footprint:** 100% local SQLite WAL & Markdown files with SHA-256 provenance

### Try It in 30 Seconds:
```bash
pip install gitbook-downloader
docharvest capture https://docs.openalgo.in/ --rag --pdf
```

Or connect it to Claude Desktop / Cursor:
```bash
uvx gitbook-downloader mcp
```

Repository: https://github.com/RohannShetty/DocHarvest
Showcase & Docs: https://rohannshetty.github.io/DocHarvest/

I'd love to hear your feedback on framework support, AST chunking, or agent integration patterns!
```

---

### 4.2 Reddit Launch Playbook

#### A. `r/LocalLLaMA` Post
**Title:** `[Project] DocHarvest: Local, noise-free doc compiler for AI agents & RAG (83% token reduction, FastMCP, SQLite FTS5, 100% offline)`  
**Flairs:** `Resource / Tool`, `Open Source`  
**Angle:** Emphasize local execution, zero cloud costs, token budget savings for local models (Llama 3.1, Mistral, Qwen 2.5), and SQLite FTS5 indexing.

**Post Draft:**
```markdown
Hey r/LocalLLaMA,

When running 8B or 70B models locally, context windows are precious and inference speed depends heavily on prompt length. Feeding raw web pages with HTML headers, sidebars, and tracking wrappers burns thousands of unnecessary tokens.

I built **DocHarvest** (`gitbook-downloader`) — a 100% local, zero-telemetry tool that compiles whole documentation sites into clean markdown, vector JSONL, and SQLite FTS5 indexes.

**Why it's useful for Local LLMs:**
- **~83% Token Reduction**: AST DOM cleaning strips out everything except the actual technical content.
- **SQLite FTS5 BM25 Engine**: Instant local keyword search (<2ms) so you don't even need to embed millions of vectors for simple lookups.
- **FastMCP v2 Server (12 Tools)**: Plug it straight into Claude Desktop, Cursor, or your local agent harness via stdio.
- **SHA-256 Provenance**: Every page frontmatter carries a real SHA-256 hash of the content to prevent hallucinated references.
- **Zero Cloud / Zero API Keys**: Runs locally on your machine via Python or standalone `.exe`.

Reference benchmark: Captured 673 pages in 18.2 seconds with parallel worker threads.

GitHub: https://github.com/RohannShetty/DocHarvest
Install: `pip install gitbook-downloader` or `uvx gitbook-downloader --gui`
```

---

#### B. `r/programming` Post
**Title:** `DocHarvest: Compiling web documentation into structured offline markdown and SQLite FTS5 search`  
**Angle:** Technical architecture, concurrency (`DomainLock`, SQLite WAL mode), pure-Python PDF generation, and DOM parsing internals.

---

### 4.3 X / Twitter Launch Thread (Technical Breakdown)

**Tweet 1 (Hook & Hero Video/Image):**
> Coding agents don’t read docs — they read web pages.
> 
> Sidebars, cookie modals, and footer scripts make up ~85% of a raw page's bytes before an API fact arrives.
> 
> Introducing **DocHarvest**: Turn any docs site into clean LLM markdown, RAG JSONL & offline books in 1 command.
> 
> 100% Local & MIT 🧵👇
> [Attach: `assets/capture_studio.png`]

**Tweet 2 (The Benchmark & Token Savings):**
> 📊 The Numbers:
> 
> In our reference benchmark on 673 documentation pages:
> ⚡ Ingested in 18.2s (~37 pages/sec)
> 🎯 82.8% token reduction vs raw HTML
> 🔍 Sub-2ms full-text search via embedded SQLite FTS5 BM25
> 
> Zero cloud scrapers. Zero per-page API bills.

**Tweet 3 (FastMCP v2 & 14 IDEs):**
> 🔌 Native FastMCP v2 Server:
> 
> DocHarvest exposes 12 MCP tools over stdio (`download_docs`, `search_docs`, `read_doc`, `query_doc_graph`...).
> 
> Ready out-of-the-box for 14 AI clients:
> • Cursor
> • Claude Code & Desktop
> • Windsurf
> • VS Code
> • Oh My Pi & more!

**Tweet 4 (Universal Agent Skill):**
> 🧠 Universal Agent Skill (`SKILL.md`):
> 
> Tools are great, but agents need reasoning.
> 
> The bundled `docharvest` skill teaches LLMs the exact two-stage lookup workflow to prevent hallucinated API calls:
> `docharvest skill install docharvest -o .cursor/skills`

**Tweet 5 (Four-Part Output Contract):**
> 📦 Every capture outputs a standardized 4-part contract:
> 1. `pages/`: Modular markdown files with SHA-256 YAML frontmatter
> 2. `book.md`: Single comprehensive handbook with TOC
> 3. `llms.txt`: Standardized discovery manifest
> 4. `exports/`: Tokenized RAG JSONL & printable PDF handbooks

**Tweet 6 (CTA & Links):**
> Try it in 30 seconds:
> 
> `pip install gitbook-downloader`
> `docharvest capture https://docs.openalgo.in/ --rag --pdf`
> 
> ⭐ Star on GitHub: https://github.com/RohannShetty/DocHarvest
> 🌐 Showcase & Docs: https://rohannshetty.github.io/DocHarvest/

---

## 5. Phase 3: AI Framework Connectors & Integrations

### 5.1 LangChain Integration (`langchain-community`)

Create community Document Loader PR: `DocHarvestLoader`

```python
from typing import Iterator, List, Optional
from langchain_core.document_loaders import BaseLoader
from langchain_core.documents import Document
from gitbook_downloader.api import capture, CaptureOptions
from gitbook_downloader.storage import StorageManager

class DocHarvestLoader(BaseLoader):
    """Load documentation using DocHarvest compiler with ~83% token reduction."""
    
    def __init__(
        self,
        url: str,
        max_pages: Optional[int] = None,
        path_scope: Optional[List[str]] = None,
        workers: int = 8,
    ):
        self.url = url
        self.options = CaptureOptions(
            max_pages=max_pages,
            path_scope=tuple(path_scope or []),
            workers=workers,
            output_mode="library",
        )
        self.storage = StorageManager()

    def lazy_load(self) -> Iterator[Document]:
        result = capture(self.url, options=self.options)
        domain = result.source_url.split("//")[-1].split("/")[0]
        pages = self.storage.get_pages(domain)
        
        for page in pages:
            yield Document(
                page_content=page.content,
                metadata={
                    "source": page.url,
                    "title": page.title,
                    "domain": domain,
                    "content_hash": page.content_hash,
                }
            )
```

---

### 5.2 LlamaIndex Integration (`llama-index-readers-docharvest`)

Create reader plugin: `DocHarvestReader`

```python
from typing import List, Optional
from llama_index.core.readers.base import BaseReader
from llama_index.core.schema import Document
from gitbook_downloader.api import capture, CaptureOptions
from gitbook_downloader.storage import StorageManager

class DocHarvestReader(BaseReader):
    """LlamaIndex Reader for compiling documentation portals locally."""

    def load_data(
        self,
        url: str,
        max_pages: Optional[int] = None,
        path_scope: Optional[List[str]] = None,
    ) -> List[Document]:
        options = CaptureOptions(
            max_pages=max_pages,
            path_scope=tuple(path_scope or []),
            output_mode="library",
        )
        result = capture(url, options=options)
        storage = StorageManager()
        domain = result.source_url.split("//")[-1].split("/")[0]
        pages = storage.get_pages(domain)

        return [
            Document(
                text=p.content,
                doc_id=p.content_hash,
                extra_info={"url": p.url, "title": p.title, "domain": domain},
            )
            for p in pages
        ]
```

---

### 5.3 crewAI & AutoGen Tool Integrations

```python
# crewAI Tool Definition
from crewai.tools import tool
from gitbook_downloader.search import SearchIndex

@tool("Search Local Documentation")
def search_local_docs(query: str, domain: str = None) -> str:
    """Search harvested documentation using SQLite FTS5 BM25 search."""
    index = SearchIndex()
    hits = index.search(query, domain=domain, limit=5)
    return "\n\n".join([f"### {h.title} ({h.url})\n{h.snippet}" for h in hits])
```

---

## 6. Phase 4: Developer Content Flywheel & SEO Growth Engine

### 6.1 Technical Blog Series (Content Pipeline)

| Article Title | Target Keyword | Distribution Channel |
| :--- | :--- | :--- |
| **"Why 85% of Web Scraping for LLMs is Broken (and How AST Cleaning Fixes It)"** | `llm web scraper token efficiency` | dev.to, Medium, HackerNoon |
| **"Building a Zero-Cloud Documentation Agent with FastMCP and Cursor"** | `cursor mcp documentation server` | Cursor Community, Substack |
| **"How We Captured 673 Docs Pages in 18 Seconds with Zero C-Dependencies"** | `python documentation crawler` | Python Weekly, PyCoder's |
| **"From Docs to Vector RAG: Deterministic Markdown Ingestion in Python"** | `rag markdown ingestion pipeline` | Towards Data Science |

---

### 6.2 Interactive Token Economy Calculator
Embed an interactive token savings calculator on `docs/` showcase:
- **Input**: Number of documentation pages (e.g. 500) & lookups per day (e.g. 100).
- **Calculation**:
  - Raw HTML tokens: `500 * 35,000 = 17.5M tokens ($52.50/day on Claude 3.5 Sonnet)`
  - DocHarvest compiled tokens: `500 * 1,300 = 650K tokens ($1.95/day)`
  - **Net Annual Savings:** **$18,450 / year in LLM API bills**.

---

## 7. Metrics & KPIs Tracking Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LAUNCH KPI TARGETS                               │
├────────────────────────────────┬───────────────────┬────────────────────────┤
│ Metric                         │ 30-Day Target     │ 90-Day Target          │
├────────────────────────────────┼───────────────────┼────────────────────────┤
│ GitHub Stars                   │ 1,000+            │ 3,500+                 │
│ PyPI Monthly Downloads         │ 5,000+            │ 25,000+                │
│ FastMCP Active Installs        │ 1,500+            │ 7,500+                 │
│ Framework Ecosystem PRs        │ 3 merged          │ 6 merged               │
│ Cursor / Claude Skill Installs │ 2,000+            │ 10,000+                │
└────────────────────────────────┴───────────────────┴────────────────────────┘
```

---
*Plan created and maintained by the DocHarvest Growth & Developer Relations Team.*
