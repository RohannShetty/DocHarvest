---
name: docharvest
description: "Harvest documentation sites into local, searchable, LLM-ready markdown through the DocHarvest (gitbook-downloader) MCP server. Use when the user asks to download, crawl, or refresh a documentation site; to search, read, or quote docs that must come from the local library instead of the web; to diff or changelog doc versions; or to export docs to markdown, RAG JSONL, llms.txt, or PDF. Drives download_docs -> search_docs/read_doc -> export_docs, with the `docharvest` CLI as fallback when the MCP server is not connected."
metadata:
  argument-hint: "[doc-url | search query]"
---

# DocHarvest

Local documentation harvester exposed over MCP as the `docharvest` server
(tool surface: `download_docs`, `search_docs`, `list_domains`, `find_docs`,
`read_doc`, `get_doc`, `diff_versions`, `list_versions`, `export_docs`,
`get_changelog`, `query_doc_graph`, `get_related_concepts`).

## Before you call anything

1. Prefer `list_domains` / `find_docs` first — the library may already hold the
   docset. Re-capturing a large site is minutes of network work.
2. Domains are bare hosts without `www.` (e.g. `docs.openalgo.in`). Library
   root: `~/.gitbook-downloader/docs/<domain>/`.
3. Captures write to the local library. Pass `output_mode="library"` unless the
   user explicitly wants a project-local `<domain>-docs/` directory.
4. If none of the tools above appear in your tool list, the MCP server is not
   connected. Fall back to the CLI (`docharvest capture <url>`,
   `gitbook-dl search "<query>"`, `gitbook-dl list`) and tell the user to run
   `/mcp reload` after `./.omp/mcp.json` changes.

## Workflow

1. `download_docs(url=..., output_mode="library")` — auto-detects the platform,
   crawls, writes page tree + `docs.md` + `llms.txt`, snapshots the previous
   version, and re-indexes FTS5. Report `pages_captured`, `warnings`,
   `library_path`. A large corpus can take minutes; the MCP entry should set
   `"timeout": 0` so the client does not abort mid-crawl, and `max_pages` caps
   the crawl when only a slice is wanted.
2. `search_docs(query, domain=...)` — cheapest retrieval; BM25 over sections
   with `title`/`url`/`snippet`. Escaped for punctuation (e.g. `2.0.2.2`).
   Hits carry the page's real `source_url` plus a section anchor, so they can
   be opened, quoted or re-fetched.
3. `read_doc(domain, topic=...)` or `read_doc(domain, path=...)` — bounded,
   structure-aware section reads; raise `max_tokens` only when the snippet is
   clearly truncated. A topic that names a heading returns that section first;
   `path=` is the exact-page form when the book is unavailable.
4. `query_doc_graph` / `get_related_concepts` — 1-hop neighbourhoods when the
   user asks how concepts connect instead of what a page says. The graph walks
   the whole page tree, so nested pages are included.
5. Versions: `list_versions` -> `diff_versions(domain, v1, v2)` -> `get_changelog`.
   A re-capture of unchanged content keeps the existing version id rather than
   minting a new one.
6. Exports: `export_docs(domain, format="markdown"|"jsonl"|"pdf")`.

Never invent a URL: capture exactly what the user named, and say so when the
library has no matching domain.
