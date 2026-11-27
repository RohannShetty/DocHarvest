# DocHarvest — Canonical Identity, Stable Addressing, and Brand Alignment Plan

> **File**: `CANONICAL_IDENTITY_PLAN.md`  
> **Status**: Approved for Implementation  
> **Target Version**: v11.6.0  
> **Primary Goals**: Elevate User Experience (UX), Developer Experience (DX), and Agent Experience (AX) by establishing unified canonical identity invariants and eliminating naming drift across DocHarvest, with zero breaking changes to existing public contracts.

---

## 1. Architectural Invariants & Guarantees

Every entity in DocHarvest must adhere to the four invariants of canonical identity:

1. **Uniqueness**: Every distinct entity maps to exactly one identifier without colliding or overwriting other entities.
2. **Determinism & Stability**: An entity’s identifier is immutable across crawl runs, re-indexing, sorting orders, and representations when its source identity has not changed.
3. **Format Normalization**: Trailing slashes, scheme prefixes, casing, ports, and query parameters resolve to a single canonical representation, preventing addressing desynchronization.
4. **Round-Trip Addressability**: An identifier returned by discovery or search can be handed directly to retrieval tools (`read_doc`, `load_page`, `query_doc_graph`) to resolve that exact artifact without secondary heuristics.

---

## 2. Phase-by-Phase Implementation Roadmap

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASED IMPLEMENTATION PIPELINE                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Phase 0: Brand & Naming Alignment (docharvest vs gitbook-dl)            │
│ Phase 1: Canonical Domain Resolution (canonical_domain)                 │
│ Phase 2: Deterministic, Query-Aware Page Identifiers & Manifest Sync    │
│ Phase 3: Collision-Free Section Identity in SQLite Search Index (FTS5)  │
│ Phase 4: Concept Graph ID Addressing & Disambiguation (DocGraph)        │
│ Phase 5: Seed Version Materialization & Normalized Semver Tags          │
│ Phase 6: Code-Fence Aware Markdown Chunking (splitter.py)               │
│ Phase 7: Robust Delimiter Matching on Windows CRLF (api.py)             │
│ Phase 8: Verification & Regression Test Suite                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 0: Brand & Naming Alignment (`docharvest` vs `gitbook-dl`)

- **Objective**: Ensure that `docharvest` is the primary executable and name in all user-facing CLI messages, help text, docstrings, and examples, while maintaining `gitbook-dl` purely as a backward-compatibility script alias in `pyproject.toml`.
- **Files to Modify**:
  - `src/docharvest/cli.py`:
    - Update module docstring (L3–L14) to feature `docharvest`.
    - L73: Update fallback message from `"gitbook-dl capture <url>"` to `"docharvest capture <url>"`.
    - L368: Update empty library message from `"gitbook-dl capture <url>"` to `"docharvest capture <url>"`.
    - L502: Update config project message from `"gitbook-dl config init --project"` to `"docharvest config init --project"`.
    - L651 & L680: Update skill installation examples from `"gitbook-dl skill install"` to `"docharvest skill install"`.
    - L949: Update comment to reference `docharvest`.
  - `tests/test_shell_cli.py`:
    - L131: Update assertion to `assert "docharvest capture" in err` (or accept either).
  - `AGENTS.md`:
    - Update Quick Start command examples from `gitbook-dl` to `docharvest`.
- **Invariants Preserved**:
  - `[project.scripts]` in `pyproject.toml` keeps `gitbook-dl = "docharvest.cli:main"` so existing user environments and shell scripts continue to run seamlessly.

---

### Phase 1: Canonical Domain Resolution (`canonical_domain`)

- **Objective**: Ensure that any domain input—whether passed as a full URL (`https://docs.stripe.com/api`), with trailing slashes (`docs.stripe.com/`), with `www.` prefixes (`www.docs.stripe.com`), with uppercase characters (`DOCS.STRIPE.COM`), or with ports (`localhost:3000`)—resolves to a single canonical domain string.
- **Files to Modify**:
  - `src/docharvest/providers/base.py`:
    - Implement `canonical_domain(raw: str) -> str`:
      ```python
      def canonical_domain(raw: str) -> str:
          text = str(raw or "").strip()
          if not text:
              return ""
          if "://" in text:
              p = urlparse(text)
              netloc = p.netloc or p.path.split("/")[0]
          else:
              netloc = text.split("/")[0]
          # Strip www. prefix, lowercase hostname, preserve custom port
          netloc = strip_www_prefix(netloc).lower()
          # Normalize standard ports
          if netloc.endswith(":80"):
              netloc = netloc[:-3]
          elif netloc.endswith(":443"):
              netloc = netloc[:-4]
          return netloc
      ```
  - `src/docharvest/storage/manager.py`:
    - Wrap `domain` parameter in `canonical_domain` across `_domain_dir`, `metadata_path`, `latest_path`, `pages_dir`, `versions_dir`, `domain_exists`, `save_doc`, `load_doc`, `get_metadata`, `delete_domain`.
  - `src/docharvest/search/index.py`:
    - Wrap `domain` parameter in `canonical_domain` in `index_domain`, `search` (filter `WHERE pages_meta.domain = ?`), `remove_domain`, and `rename_domain`.
  - `src/docharvest/mcp/server.py`:
    - Wrap `domain` in `canonical_domain` across all MCP tool endpoints: `read_doc`, `get_doc`, `diff_versions`, `list_versions`, `export_docs`, `get_changelog`, `query_doc_graph`, `get_related_concepts`, `docs://{domain}/book`, `docs://{domain}/manifest`.
  - `src/docharvest/cli.py`:
    - Wrap domain arguments in `cmd_history`, `cmd_diff`, `cmd_search`.
- **Verification**:
  - `docharvest history https://docs.example.com` works identically to `docharvest history docs.example.com`.
  - MCP `read_doc(domain="https://docs.example.com")` finds the library entry.

---

### Phase 2: Deterministic, Query-Aware Page Identifiers & Manifest Sync

- **Objective**: Prevent page collision when URLs differ by query parameters (e.g. `?page=1` vs `?page=2`), eliminate arbitrary counter-based filenames (`docs-2.md`), and ensure `llms.txt` manifest links match disk artifacts 1:1.
- **Files to Modify**:
  - `src/docharvest/output_contract.py`:
    - Update `page_relpath(url: str) -> str`:
      - Extract query string `urlparse(url).query`.
      - If query is present, normalize query parameters (sort keys), compute a short deterministic slug or hash (e.g. `__q_page_2` or `__q_a1b2c3d4`), and append before `.md`.
      - E.g.: `https://example.com/docs?page=2` -> `docs__q_page_2.md`.
    - In `write_page_tree`:
      - Build mapping `page_to_relpath: dict[str, str]` using the deterministic `page_relpath`.
      - Use deterministic candidate paths and record the exact written path.
    - In `build_manifest`:
      - Use the deterministic `page_relpath` so that `llms.txt` entries `- [Title](pages/{page_relpath(page.url)}): {page.url}` link directly to the correct files.
  - `src/docharvest/storage/manager.py`:
    - Enhance `load_page(domain, relpath)`:
      - If `relpath` is a full URL or contains query parameters, resolve it via `page_relpath(relpath)` before checking disk.
      - Support direct lookup by relative path, stem, or source URL.
  - `src/docharvest/mcp/server.py`:
    - In `read_doc`: pass `path` through `_storage.load_page` which now handles full URLs, relative paths, and query-parameter slugs.
- **Verification**:
  - Capturing a site with `?page=1` and `?page=2` produces distinct deterministic files and distinct working links in `llms.txt`.
  - Calling `mcp.read_doc(domain, path="https://example.com/docs?page=2")` loads the exact content.

---

### Phase 3: Collision-Free Section Identity in SQLite Search Index (FTS5)

- **Objective**: Eliminate silent deletion and loss of content caused by duplicate heading collisions on `UNIQUE(url, section_heading)`.
- **Files to Modify**:
  - `src/docharvest/search/index.py`:
    - In `_page_tree_rows` and `_book_rows`:
      - Track occurrences of each heading slug per page/document:
        ```python
        slug_counts: dict[str, int] = {}
        for heading, content in self._parse_sections(body):
            base_slug = _section_slug(heading)
            count = slug_counts.get(base_slug, 0) + 1
            slug_counts[base_slug] = count
            anchor_slug = base_slug if count == 1 else f"{base_slug}__{count}"
            section_url = f"{page_url}#{anchor_slug}"
            rows.append((section_url, heading or page_title or page_url, heading or "", content[:100000]))
        ```
      - In `_book_rows`: when `domain_url` is provided, anchor sections using chapter prefixes if available, or ordinal slug disambiguation, preventing all identical headings (e.g. `## Installation`) across the book from colliding onto a single row.
- **Verification**:
  - Indexing a markdown document with two `## Configuration` sections retains BOTH sections in `pages_meta` and `pages_fts`.
  - Searches for terms inside both the first and second section return valid hits.

---

### Phase 4: Concept Graph ID Addressing & Disambiguation (`DocGraph`)

- **Objective**: Enable direct querying and navigation by canonical node ID (`page::path`, `heading::path::slug`, `endpoint::method_path`) and eliminate duplicate edge merging.
- **Files to Modify**:
  - `src/docharvest/search/graph.py`:
    - In `DocGraph.query`:
      - Add direct ID matching:
        ```python
        query_clean = query_text.strip().lower()
        for node in self.nodes.values():
            if node.id.lower() == query_clean:
                score += 50 # Exact ID match gets top priority
            elif query_clean in node.id.lower():
                score += 20
        ```
    - In `build_graph_from_pages`:
      - Disambiguate duplicate headings on the same page using occurrence counters: `h_id = f"heading::{rel}::{base_slug}" if count == 1 else f"heading::{rel}::{base_slug}__{count}"`.
      - For endpoints: in `GraphNode.metadata`, record all referencing files in `metadata["referenced_in"] = [file_path, ...]`.
- **Verification**:
  - `query_doc_graph(domain, "endpoint::GET_/api/users")` returns the endpoint node with score > 50.
  - Duplicate headings generate distinct nodes and valid edges without duplicates.

---

### Phase 5: Seed Version Materialization & Normalized Semver Tags

- **Objective**: Ensure that the initial documentation capture (version `1.0.0`) exists on disk as a snapshot file, eliminating diff failures and 100% false addition diffs.
- **Files to Modify**:
  - `src/docharvest/storage/manager.py`:
    - In `save_doc`:
      - When creating a fresh domain with version `1.0.0` or `v1.0.0`, write `versions/v1.0.0.md` containing the initial content.
      - Standardize version naming: ensure `"latest_version": "v1.0.0"` and `"versions": [{"version": "v1.0.0", ...}]` consistently carry the `"v"` prefix.
    - In `load_doc_version(domain, version)`:
      - Normalize version prefix (`v` stripped or added).
      - If `versions/v{version}.md` does not exist, check if `version` matches `latest_version` or `"1.0.0"` and fall back to `docs.md`.
  - `src/docharvest/storage/versioning.py`:
    - In `diff`: Ensure `v1` and `v2` resolve seamlessly through `get_version_content`, which now falls back to `docs.md` if the initial snapshot is requested.
  - `src/docharvest/gui/bridge.py`:
    - In `diff_snapshots`: Replace `or ""` fallback with accurate content retrieval from `load_doc_version` or `load_doc`.
- **Verification**:
  - Capturing a site, editing one line, and snapshotting yields a diff showing exactly 1 line added/changed, not the entire document.
  - `mcp.diff_versions(domain, "1.0.0", "v1.0.1")` succeeds without `VersioningError`.

---

### Phase 6: Code-Fence Aware Markdown Chunking (`splitter.py`)

- **Objective**: Prevent markdown splitting inside code blocks containing comments (`# comment`).
- **Files to Modify**:
  - `src/docharvest/splitter.py`:
    - In `split_markdown`:
      - Normalize line endings (`\r\n` -> `\n`).
      - Parse line-by-line while tracking `in_code_block = not in_code_block` when encountering lines starting with ```` ``` ```` or `~~~`.
      - Only partition sections on `\n#` when `not in_code_block`.
- **Verification**:
  - Splitting a document containing a 500-line Python/Bash code block with comments preserves the code block intact within a single chunk or cleanly splits only on top-level headings.

---

### Phase 7: Robust Delimiter Matching on Windows CRLF (`api.py`)

- **Objective**: Ensure that multi-page captures never collapse into a single page on Windows systems with CRLF line endings.
- **Files to Modify**:
  - `src/docharvest/api.py`:
    - In `_parse_pages_from_text`:
      - Update regex from `r"(?:^|\n\n)---\n\n(?=Source:\s*https?://)"` to `r"(?:^|\r?\n\r?\n)---\r?\n\r?\n(?=Source:\s*https?://)"`.
      - Normalize line endings of page parts before extracting title and content.
- **Verification**:
  - Running `_parse_pages_from_text` on CRLF-formatted multi-page text returns all individual pages with correct titles and URLs.

---

### Phase 8: Verification & Regression Test Suite

- **Objective**: Add unit tests for every fixed condition and verify the existing test suite.
- **Tests to Add/Update**:
  - `tests/test_canonical_identity.py`:
    - `test_canonical_domain_normalization()`
    - `test_query_string_page_relpath_and_manifest_sync()`
    - `test_search_index_duplicate_headings_no_overwrite()`
    - `test_doc_graph_query_by_exact_node_id()`
    - `test_initial_version_diff_and_materialization()`
    - `test_splitter_preserves_code_blocks_with_comments()`
    - `test_crlf_page_delimiter_parsing()`
  - Verify existing tests in `tests/test_shell_cli.py`, `tests/test_naming_drift.py`, `tests/test_doc_graph.py`, `tests/test_engine_url_identity.py`.

---

## 3. Impact Assessment Across UX, DX, and AX

| Metric | Before Plan | After Plan |
|---|---|---|
| **UX (Users)** | • Passing URLs to `docharvest history` gave "Domain not found"<br>• Diffing initial version showed 100% false additions<br>• Confusing `gitbook-dl` messages in errors | • Any URL/domain format resolves instantly<br>• Diffs accurately show true line modifications<br>• Unified, clean `docharvest` CLI branding |
| **DX (Developers)** | • Non-deterministic file numbers (`docs-2.md`) created churn<br>• Missing version files broke test fixtures<br>• Inconsistent `v` prefixes across metadata | • Deterministic URL-to-path bijections<br>• All version states backed by disk artifacts<br>• Zero broken tests; robust contracts |
| **AX (AI Agents)** | • LLMs sending full URLs to `read_doc` failed<br>• Querying `query_doc_graph` with Node IDs gave 0 matches<br>• Search index silently erased secondary sections<br>• `llms.txt` manifest had desynced links | • Agents can pass canonical URLs or paths to `read_doc`<br>• Exact graph ID lookup succeeds with priority<br>• 100% of sections searchable in FTS5<br>• 1:1 round-trip guarantee between `llms.txt` and disk |

---

## 4. Execution Readiness

This plan is self-contained, adheres strictly to the existing public facade (`api.CaptureOptions`, `api.CaptureResult`), preserves the `gitbook-dl` alias in `pyproject.toml`, and requires no new external dependencies.
