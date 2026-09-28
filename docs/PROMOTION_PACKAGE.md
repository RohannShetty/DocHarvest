# DocHarvest promotion package

Status: **checkout-only preparation**. This file contains copy and owner-run verification steps; it does not publish to GitHub, registries, directories, social networks, or sponsors.

## Positioning

> Context7 covers the libraries everyone uses; DocHarvest covers documentation that is not in anyone's catalogue — and gives you an offline copy you own.

Short description:

> Compile any public documentation site into deterministic local Markdown, `llms.txt`, `llms-full.txt`, searchable FTS5 records, versioned snapshots, RAG JSONL, and offline books. No API key, account, hosted backend, or telemetry.

Do not describe DocHarvest as a login/CAPTCHA bypass, an internet-scale crawler, or a hosted freshness service.

## Sourced comparison

| Capability | DocHarvest | Context7 | Firecrawl | Ref Tools |
|---|---|---|---|---|
| Local corpus on the user's disk | Yes — `~/.docharvest/docs/` | No — hosted catalogue/service | Hosted API by default | Hosted service/tooling |
| Offline reads after capture | Yes | Not the primary workflow | Not the primary workflow | Not the primary workflow |
| API key required for the local capture path | No | Service configuration varies | Hosted API requires account/API configuration | Service configuration varies |
| Versioned snapshots and diffs | Yes | Not the documented core contract | Not the documented core contract | Not the documented core contract |
| Default retrieval | SQLite FTS5 BM25 | Service retrieval | Hosted extraction/search | Agentic retrieval |

Sources: [GROWTH_AUDIT.md §2.2](../GROWTH_AUDIT.md), [Context7 repository](https://github.com/upstash/context7), [Firecrawl repository](https://github.com/firecrawl/firecrawl), [Ref Tools MCP](https://github.com/ref-tools/ref-tools-mcp). Cells marked as capability distinctions are based on the cited project documentation, not a benchmark claim.

## Reproducible evidence

The README's `673 pages / 18.2 seconds / ~83%` row is a reference measurement, not a guarantee. Before publishing a new number:

```bash
uv run pytest tests/ -q --tb=short --timeout=120
uv run python benchmarks/run.py --dataset fixtures
```

Only copy values emitted by the benchmark command into launch copy. Record the dataset id, corpus hash, commit, Python version, and machine in the accompanying result.

Recorded local fixture result (`fixture-v1`, corpus hash `f6ea24a7b9ea2ec2322515eedd154b21bb18f481be9c7515adb65cc5a9778130`, `k=2`):

| Dataset | Hit@k | MRR | Answer-containment@k |
|---|---:|---:|---:|
| fixture-v1 | 1.0 | 1.0 | 1.0 |

## Directory submission data

- Name: `DocHarvest`
- Package: `docharvest`
- MCP registry id: `io.github.RohannShetty/docharvest`
- Repository: `https://github.com/RohannShetty/DocHarvest`
- Homepage: `https://rohannshetty.github.io/DocHarvest/`
- Install: `pip install docharvest` or `uvx docharvest mcp`
- License: MIT
- Runtime contract: local filesystem, stdio by default, zero telemetry
- Owner action: submit to the official MCP Registry, Glama, Smithery, mcp.so, and `punkpeye/awesome-mcp-servers`; record each resulting URL in the external checklist.

## Launch copy drafts

### Show HN / Reddit technical post

**Title:** DocHarvest: compile any docs portal into a local, versioned corpus for agents

**Body:** Documentation is often either a hosted retrieval dependency or a pile of noisy HTML. DocHarvest captures public GitBook, Mintlify, Docusaurus, VitePress, MkDocs, ReadMe, ReadTheDocs, and generic documentation sites into deterministic Markdown with SHA-256 frontmatter, a page tree, `book.md`, `llms.txt`, `llms-full.txt`, SQLite FTS5 search, snapshots, and diffs. The CLI and bundled skill work without API keys or telemetry; the MCP server is optional. The local benchmark command publishes the exact dataset hash and environment with every measurement.

Owner-run before publishing: attach the final demo recording, replace any benchmark sentence with the current `benchmarks/run.py` output, and link the public capture artifact.

### Technical article opening

> More context is not automatically better context. DocHarvest treats documentation capture as compilation: discover the site, remove presentation boilerplate, preserve page provenance, hash the result, and retrieve only the bounded section an agent needs.

Use the existing `marketing/DEVTO_HASHNODE_ARTICLE.md` as the long-form draft after reconciling its numbers with the benchmark output.

## Sponsor placement

Keep a small GitHub Sponsors section **below** the primary install, output, and MCP documentation. Do not imply sponsorship, fundraising totals, or a sponsor relationship until the owner enables the GitHub Sponsors profile.

## Translation templates

Translate only after the English README and benchmark values are stable. Preserve command names, file names, URLs, tool names, and the local-first/security statements exactly.

- `README.zh-CN.md`: Chinese translation of the Overview, 30-Second Start, Output Contract, and CLI sections.
- `README.ja.md`: Japanese translation of the same sections.

Native review is required before either file is linked from the main README.

## Owner-run completion record

Use `docs/GROWTH_EXTERNAL_CHECKLIST.md` for each external action. An item is not complete because copy exists here: it requires an owner command, a reachable result URL or screenshot, and a dated record.
