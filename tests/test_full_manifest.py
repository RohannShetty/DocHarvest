"""Contract tests for the full LLM manifest artifact."""

from __future__ import annotations

from docharvest.output_contract import CapturedPage, build_full_manifest, content_hash, publish


def _pages() -> list[CapturedPage]:
    return [
        CapturedPage(
            url="https://docs.example.com/z",
            title="Zed",
            content="# Zed\n\nLast page.",
        ),
        CapturedPage(
            url="https://docs.example.com/a",
            title="Alpha",
            content="# Alpha\n\nFirst page.",
        ),
    ]


def test_full_manifest_is_complete_ordered_and_hash_pinned() -> None:
    pages = _pages()
    manifest = build_full_manifest(
        list(reversed(pages)),
        site_title="Example Docs",
        source_url="https://docs.example.com/",
        provider="generic",
        crawl_date="2026-09-28T00:00:00Z",
    )

    assert manifest.index("Source: https://docs.example.com/a") < manifest.index(
        "Source: https://docs.example.com/z"
    )
    assert "First page." in manifest and "Last page." in manifest
    alpha_hash = content_hash("# Alpha\n\nFirst page.")
    assert f"Content hash: {alpha_hash}" in manifest
    assert "Pages: 2" in manifest


def test_publish_writes_full_manifest_for_local_and_library_outputs(tmp_path) -> None:
    local = tmp_path / "local"
    library = tmp_path / "library"

    outcome = publish(
        _pages(),
        domain="docs.example.com",
        source_url="https://docs.example.com/",
        provider="generic",
        output_mode="both",
        local_dir=local,
        library_dir=library,
    )

    assert outcome.full_manifest_file == local / "llms-full.txt"
    assert (local / "llms-full.txt").read_text(encoding="utf-8") == (
        library / "llms-full.txt"
    ).read_text(encoding="utf-8")
