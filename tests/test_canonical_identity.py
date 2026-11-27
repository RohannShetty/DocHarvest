"""Tests for Canonical Identity, Stable Addressing, and Brand Alignment.

Covers Phases 1 through 8 from CANONICAL_IDENTITY_PLAN.md:
- Phase 1: Canonical domain resolution across storage, search, versions, MCP, CLI.
- Phase 2: Deterministic, query-aware page identifiers and manifest sync.
- Phase 3: Collision-free section identity in SearchIndex.
- Phase 4: Concept graph ID addressing and disambiguation.
- Phase 5: Seed version materialization and normalized semver tags.
- Phase 6: Code-fence aware markdown chunking.
- Phase 7: CRLF delimiter matching on Windows.
- Phase 8: Full regression coverage.
"""

from __future__ import annotations

from pathlib import Path
import pytest

from docharvest.providers.base import canonical_domain
from docharvest.storage.manager import StorageManager
from docharvest.search.index import SearchIndex
from docharvest.storage.versioning import VersionManager
from docharvest.mcp import server as mcp_server


# ── Phase 1: Canonical Domain Resolution ────────────────────────────────


def test_canonical_domain_resolution_contract():
    assert canonical_domain("https://docs.stripe.com/api") == "docs.stripe.com"
    assert canonical_domain("http://docs.stripe.com/") == "docs.stripe.com"
    assert canonical_domain("docs.stripe.com/") == "docs.stripe.com"
    assert canonical_domain("www.docs.stripe.com") == "docs.stripe.com"
    assert canonical_domain("DOCS.STRIPE.COM") == "docs.stripe.com"
    assert canonical_domain("localhost:3000") == "localhost:3000"
    assert canonical_domain("http://localhost:80/docs") == "localhost"
    assert canonical_domain("https://example.com:443/docs") == "example.com"
    assert canonical_domain("") == ""


def test_storage_manager_canonical_domain_integration(tmp_path):
    storage = StorageManager(base_dir=tmp_path)
    # Save using a full URL with scheme, path, trailing slash, uppercase
    storage.save_doc(
        domain="HTTPS://DOCS.EXAMPLE.COM/API/",
        content="# Example Docs\n\nContent here.",
        title="Example API",
    )

    # All path helpers resolve to the canonical domain directory
    canon_dir = tmp_path / "docs" / "docs.example.com"
    assert canon_dir.exists()
    assert (canon_dir / "docs.md").exists()

    # Query using different shapes
    assert storage.domain_exists("docs.example.com") is True
    assert storage.domain_exists("https://docs.example.com/sub") is True
    assert storage.domain_exists("WWW.DOCS.EXAMPLE.COM") is True

    # Loading doc via varied domain inputs succeeds
    doc = storage.load_doc("https://docs.example.com")
    assert "# Example Docs" in doc

    meta = storage.get_metadata("HTTP://DOCS.EXAMPLE.COM/")
    assert meta.get("title") == "Example API"


def test_search_index_canonical_domain_integration(tmp_path):
    index = SearchIndex(base_dir=tmp_path)
    index.index_domain(
        domain="HTTPS://DOCS.EXAMPLE.COM/API/",
        docs_content="# Authentication\n\nIntroductory content about authentication and tokens.",
        domain_url="https://docs.example.com/api",
    )

    # Search with plain domain
    hits = index.search("authentication", domain="docs.example.com")
    assert len(hits) == 1
    assert hits[0]["domain"] == "docs.example.com"

    # Search with full URL as domain filter
    hits_url = index.search("authentication", domain="https://docs.example.com/overview")
    assert len(hits_url) == 1
    assert hits_url[0]["domain"] == "docs.example.com"


def test_mcp_server_canonical_domain_integration(tmp_path, monkeypatch):
    storage = StorageManager(base_dir=tmp_path)
    storage.save_doc(
        domain="docs.example.com",
        content="# MCP Docs\n\nFull MCP documentation content.",
        title="MCP Example",
    )
    monkeypatch.setattr(mcp_server, "_storage", storage)

    res = mcp_server._get_doc_blocking("https://docs.example.com/api", None)
    assert "error" not in res
    assert "docs.example.com" in res.get("domain", "")
    assert "# MCP Docs" in res.get("preview", "")

    read_res = mcp_server._read_doc_blocking("https://docs.example.com/api", None, None, 2000, None)
    assert "error" not in read_res
    assert "# MCP Docs" in read_res.get("content", "")


# ── Phase 2: Deterministic, Query-Aware Page Identifiers & Manifest Sync ──

from docharvest.output_contract import CapturedPage, page_relpath, write_page_tree, build_manifest


def test_query_aware_page_relpath():
    # Basic path without query
    assert page_relpath("https://example.com/docs") == "docs.md"
    assert page_relpath("https://example.com/api/v1/auth") == "api/v1/auth.md"

    # With query parameter
    rel1 = page_relpath("https://example.com/docs?page=2")
    assert rel1 == "docs__q_page_2.md"

    # Query param order invariance
    rel_ab = page_relpath("https://example.com/docs?b=1&a=2")
    rel_ba = page_relpath("https://example.com/docs?a=2&b=1")
    assert rel_ab == rel_ba
    assert "a_2" in rel_ab and "b_1" in rel_ab

    # Root with query
    assert page_relpath("https://example.com/?view=compact") == "index__q_view_compact.md"


def test_manifest_and_storage_sync_with_query_pages(tmp_path, monkeypatch):
    storage = StorageManager(base_dir=tmp_path)
    domain = "api.example.com"
    domain_dir = storage._domain_dir(domain)
    pages_dir = domain_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)

    page1 = CapturedPage(
        url="https://api.example.com/items?page=1",
        title="Items Page 1",
        content="# Items Page 1\nContent 1",
    )
    page2 = CapturedPage(
        url="https://api.example.com/items?page=2",
        title="Items Page 2",
        content="# Items Page 2\nContent 2",
    )

    written_paths, _ = write_page_tree(domain_dir, [page1, page2], crawl_date="2026-11-22T00:00:00Z")
    written_names = {p.name for p in written_paths}
    assert "items__q_page_1.md" in written_names
    assert "items__q_page_2.md" in written_names
    # No arbitrary -2 collision suffixes!
    assert "items-2.md" not in written_names

    manifest = build_manifest(
        [page1, page2],
        site_title="Items API",
        source_url="https://api.example.com/items",
        provider="generic",
        crawl_date="2026-11-22T00:00:00Z",
    )
    assert "[Items Page 1](pages/items__q_page_1.md): https://api.example.com/items?page=1" in manifest
    assert "[Items Page 2](pages/items__q_page_2.md): https://api.example.com/items?page=2" in manifest

    # StorageManager.load_page resolution
    # By relpath
    assert storage.load_page(domain, "items__q_page_2.md") is not None
    # By pages/ prefix
    assert storage.load_page(domain, "pages/items__q_page_2.md") is not None
    # By full URL
    page2_content = storage.load_page(domain, "https://api.example.com/items?page=2")
    assert page2_content is not None
    assert "Content 2" in page2_content

    # MCP read_doc resolution
    monkeypatch.setattr(mcp_server, "_storage", storage)
    mcp_res = mcp_server._read_doc_blocking(domain, "https://api.example.com/items?page=2", None, 2000, None)
    assert mcp_res.get("found") is True
    assert "Content 2" in mcp_res.get("content", "")


# ── Phase 3: Collision-Free Section Identity in SearchIndex ─────────────


def test_search_index_duplicate_headings_retention(tmp_path):
    index = SearchIndex(base_dir=tmp_path)
    book_content = (
        "# Main Title\n\n"
        "## Configuration\nFirst config block specifying alpha_setting = 111.\n\n"
        "## Other Section\nMiddle content.\n\n"
        "## Configuration\nSecond config block specifying beta_setting = 222.\n"
    )

    index.index_domain(
        domain="docs.dup.com",
        docs_content=book_content,
        domain_url="https://docs.dup.com",
    )

    # Search for content from BOTH duplicate sections
    hits1 = index.search("alpha_setting", domain="docs.dup.com")
    assert len(hits1) == 1
    assert "alpha_setting" in hits1[0]["snippet"]
    assert "#configuration" in hits1[0]["url"]
    assert "__2" not in hits1[0]["url"]

    hits2 = index.search("beta_setting", domain="docs.dup.com")
    assert len(hits2) == 1
    assert "beta_setting" in hits2[0]["snippet"]
    assert "#configuration__2" in hits2[0]["url"]

    # Verify both rows exist in pages_meta
    from docharvest.search.index import _get_connection

    with _get_connection(index.base_dir) as conn:
        rows = conn.execute(
            "SELECT url, section_heading FROM pages_meta WHERE domain = 'docs.dup.com' AND section_heading = 'Configuration'"
        ).fetchall()
        assert len(rows) == 2
        urls = {r[0] for r in rows}
        assert "https://docs.dup.com#configuration" in urls
        assert "https://docs.dup.com#configuration__2" in urls


# ── Phase 4: Concept Graph ID Addressing & Disambiguation ───────────────

from docharvest.search.graph import build_graph_from_pages


def test_doc_graph_id_addressing_and_disambiguation(tmp_path):
    pages_dir = tmp_path / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    (pages_dir / "api").mkdir(parents=True, exist_ok=True)

    page1 = (
        "---\nsource_url: https://docs.example.com/api/auth\ntitle: Auth API\n---\n"
        "# Auth API\n\n"
        "## Token Management\nManage API tokens.\n\n"
        "POST /api/v1/tokens\nCreate a new token.\n\n"
        "## Configuration\nFirst configuration block.\n\n"
        "## Configuration\nSecond configuration block.\n"
    )
    (pages_dir / "api" / "auth.md").write_text(page1, encoding="utf-8")

    page2 = (
        "---\nsource_url: https://docs.example.com/api/users\ntitle: Users API\n---\n"
        "# Users API\n\n"
        "POST /api/v1/tokens\nAlso mentions creating a token.\n"
    )
    (pages_dir / "api" / "users.md").write_text(page2, encoding="utf-8")

    graph = build_graph_from_pages("docs.example.com", pages_dir)

    # 1. Direct ID matching in query
    heading_id = "heading::api/auth::token-management"
    res = graph.query(heading_id)
    assert len(res["results"]) > 0
    assert res["results"][0]["id"] == heading_id

    page_id = "page::api/auth"
    res_page = graph.query(page_id)
    assert len(res_page["results"]) > 0
    assert res_page["results"][0]["id"] == page_id

    # 2. get_related_concepts with exact node ID
    related = graph.get_related_concepts(page_id)
    assert len(related["primary_matches"]) > 0
    assert related["primary_matches"][0]["id"] == page_id
    assert len(related["related_graph_nodes"]) > 0

    # 3. Duplicate headings disambiguated
    assert "heading::api/auth::configuration" in graph.nodes
    assert "heading::api/auth::configuration__2" in graph.nodes

    # 4. Endpoint referenced_in metadata tracks all referencing files
    ep_id = "endpoint::POST_/api/v1/tokens"
    assert ep_id in graph.nodes
    ep_node = graph.nodes[ep_id]
    refs = ep_node.metadata.get("referenced_in", [])
    assert "api/auth.md" in refs
    assert "api/users.md" in refs


# ── Phase 5: Seed Version Materialization & Normalized Semver ───────────


def test_seed_version_materialization_and_diff(tmp_path):
    storage = StorageManager(base_dir=tmp_path)
    domain = "seed.example.com"
    initial_content = "# Seed Docs\n\nIntro line.\nUnchanged line.\n"

    # Save initial version
    storage.save_doc(domain, initial_content, title="Seed API")

    # 1. load_doc_version works with both 'v1.0.0' and '1.0.0'
    assert storage.load_doc_version(domain, "v1.0.0") == initial_content
    assert storage.load_doc_version(domain, "1.0.0") == initial_content

    # 2. Snapshot and update to next version
    versioning = VersionManager(storage)
    v1_id = versioning.snapshot(domain)  # snapshots initial_content as v1.0.1
    assert v1_id == "v1.0.1"

    v2_content = "# Seed Docs\n\nIntro line.\nUnchanged line.\nAdded feature line.\n"
    storage.save_doc(domain, v2_content)
    v2_id = versioning.snapshot(domain)  # snapshots v2_content as v1.0.2
    assert v2_id == "v1.0.2"

    # Diffing 1.0.0 (seed) against v1.0.2 accurately produces diff
    diff_result = versioning.diff(domain, "v1.0.0", "v1.0.2")
    assert "+Added feature line." in diff_result
    # The unchanged lines must NOT be marked with '+' (which happens if diffing against empty)
    assert not any(line.startswith("+Unchanged line.") for line in diff_result.splitlines())

    # Works with un-prefixed "1.0.0" as well
    diff_unprefixed = versioning.diff(domain, "1.0.0", "v1.0.2")
    assert "+Added feature line." in diff_unprefixed

    # Bridge diff_snapshots does not diff against empty string
    from docharvest.gui.bridge import ApiBridge
    bridge = ApiBridge(storage_manager=storage)
    bridge_diff = bridge.diff_snapshots(domain, "1.0.0", "v1.0.2")
    assert bridge_diff.get("lines_added") == 1
    assert bridge_diff.get("lines_removed") == 0


def test_legacy_seed_version_fallback(tmp_path):
    storage = StorageManager(base_dir=tmp_path)
    domain = "legacy.example.com"
    content = "# Legacy Docs\n\nLegacy content."

    # Simulate legacy entry where only docs.md exists and no versions/ files
    domain_dir = storage.ensure_domain_dir(domain)
    (domain_dir / "docs.md").write_text(content, encoding="utf-8")

    # load_doc_version for v1.0.0 falls back to docs.md
    assert storage.load_doc_version(domain, "v1.0.0") == content
    assert storage.load_doc_version(domain, "1.0.0") == content


# ── Phase 6: Code-Fence Aware Markdown Chunking ─────────────────────────

from docharvest.splitter import split_markdown, extract_topic_context


def test_code_fence_aware_splitter(tmp_path):
    input_file = tmp_path / "code_doc.md"
    content = (
        "# Section 1: Setup\n\n"
        "Here is the setup script:\n\n"
        "```python\n"
        "# Configure application\n"
        "def setup():\n"
        "    # Set default port\n"
        "    port = 8080\n"
        "    return port\n"
        "```\n\n"
        "# Section 2: Verification\n\n"
        "Now verify the service is running.\n"
    )
    input_file.write_text(content, encoding="utf-8")
    out_dir = tmp_path / "chunks"

    # Split with a tiny max_mb to force chunking at every valid section
    chunks = split_markdown(str(input_file), output_dir=str(out_dir), max_mb=0.0001)

    # Must produce chunks without breaking the python code block
    chunk_files = [out_dir / fn for fn, _ in chunks]
    for cf in chunk_files:
        text = cf.read_text(encoding="utf-8")
        # If a chunk opens a python fence, it must close it within the same chunk
        if "```python" in text:
            assert text.count("```") % 2 == 0
            assert "# Configure application" in text
            assert "# Set default port" in text

    # extract_topic_context must not split code block
    extracted = extract_topic_context(content, topic="Section 1", max_tokens=1000)
    assert "```python" in extracted
    assert extracted.count("```") % 2 == 0
    assert "# Configure application" in extracted


# ── Phase 7: Robust Delimiter Matching on Windows CRLF ──────────────────

from docharvest.api import _parse_pages_from_text


def test_windows_crlf_page_delimiter_parsing():
    crlf_text = (
        "Source: https://docs.example.com/intro\r\n\r\n"
        "# Introduction\r\n\r\n"
        "Welcome to the intro page.\r\n\r\n"
        "---\r\n\r\n"
        "Source: https://docs.example.com/quickstart\r\n\r\n"
        "# Quickstart\r\n\r\n"
        "Steps to get started.\r\n"
    )

    pages = _parse_pages_from_text(crlf_text, fallback_url="https://docs.example.com")
    assert len(pages) == 2
    assert pages[0]["url"] == "https://docs.example.com/intro"
    assert pages[0]["title"] == "Introduction"
    assert "Welcome to the intro page." in pages[0]["content"]

    assert pages[1]["url"] == "https://docs.example.com/quickstart"
    assert pages[1]["title"] == "Quickstart"
    assert "Steps to get started." in pages[1]["content"]
