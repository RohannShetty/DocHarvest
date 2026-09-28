"""Contracts for the local promotion handoff package."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_promotion_package_is_sourced_and_owner_run() -> None:
    text = (ROOT / "docs" / "PROMOTION_PACKAGE.md").read_text(encoding="utf-8")

    assert "checkout-only" in text
    assert "GROWTH_AUDIT.md" in text
    assert "https://github.com/upstash/context7" in text
    assert "uv run python benchmarks/run.py" in text
    assert "owner-run" in text.lower()


def test_tool_profile_document_matches_cli_contract() -> None:
    text = (ROOT / "docs" / "TOOL_PROFILES.md").read_text(encoding="utf-8")

    assert "docharvest mcp" in text
    assert "docharvest mcp --profile full" in text
    assert "search_docs(max_tokens=...)" in text
    assert "Unknown profile names fail closed" in text
