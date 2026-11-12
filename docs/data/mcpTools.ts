/**
 * The MCP surface, mirrored from `src/docharvest/mcp/server.py`.
 *
 * Twelve `@mcp.tool` registrations, two resources, two prompts. This list is
 * the only place the showcase counts them, so the section copy and the table
 * cannot disagree. `tests/test_docs_mcp_surface.py` checks the mirror.
 */

export interface McpTool {
  name: string;
  /** One line, plain verbs — what an agent gets back. */
  summary: string;
}

export const MCP_TOOLS: McpTool[] = [
  { name: 'download_docs', summary: 'Capture a documentation site into the local library.' },
  { name: 'search_docs', summary: 'Search captured pages with SQLite FTS5; returns ranked hits with source paths.' },
  { name: 'find_docs', summary: 'Find a captured library by name, topic, or partial URL.' },
  { name: 'read_doc', summary: 'Read one page or heading-scoped section by path.' },
  { name: 'get_doc', summary: 'Read the combined book for a domain, optionally at a snapshot.' },
  { name: 'list_domains', summary: 'List every domain in the library with page counts.' },
  { name: 'list_versions', summary: 'List the snapshots recorded for a domain.' },
  { name: 'diff_versions', summary: 'Unified diff between two snapshots.' },
  { name: 'get_changelog', summary: 'Changelog assembled from the domain\u2019s version diffs.' },
  { name: 'export_docs', summary: 'Export Markdown, a RAG JSONL, or a PDF handbook.' },
  { name: 'query_doc_graph', summary: 'Query the concept graph built from headings, code, and endpoints.' },
  { name: 'get_related_concepts', summary: 'Concepts connected to one graph node.' },
];

export const MCP_RESOURCES: { uri: string; summary: string }[] = [
  { uri: 'docs://{domain}/book', summary: 'The combined Markdown book as a resource.' },
  { uri: 'docs://{domain}/manifest', summary: 'The llms.txt manifest as a resource.' },
];

export const MCP_PROMPTS: { name: string; summary: string }[] = [
  { name: 'search_docset', summary: 'Ask a captured docset a question, with retrieval steps inlined.' },
  { name: 'summarize_library', summary: 'Summarize what the library holds before answering.' },
];
