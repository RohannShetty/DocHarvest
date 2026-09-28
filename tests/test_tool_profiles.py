"""Contract tests for MCP tool-schema profiles."""

from __future__ import annotations

import pytest

from docharvest.tool_profiles import disabled_tools, get_profile


ALL_TOOLS = (
    "download_docs",
    "search_docs",
    "list_domains",
    "find_docs",
    "read_doc",
    "get_doc",
    "diff_versions",
    "list_versions",
    "export_docs",
    "get_changelog",
    "query_doc_graph",
    "get_related_concepts",
)


def test_minimal_profile_is_smaller_and_keeps_core_retrieval() -> None:
    profile = get_profile("minimal")

    assert len(profile.enabled_tools) < len(ALL_TOOLS)
    assert {"download_docs", "search_docs", "read_doc"} <= set(profile.enabled_tools)
    assert "export_docs" not in profile.enabled_tools


def test_full_profile_preserves_all_named_tools() -> None:
    assert get_profile("full").enabled_tools == ALL_TOOLS


def test_disabled_tools_preserves_registration_order() -> None:
    profile = get_profile("minimal")

    assert disabled_tools(profile, ALL_TOOLS) == (
        "get_doc",
        "diff_versions",
        "list_versions",
        "export_docs",
        "get_changelog",
        "query_doc_graph",
        "get_related_concepts",
    )


def test_unknown_profile_fails_closed() -> None:
    with pytest.raises(ValueError, match="Unknown tool profile"):
        get_profile("everything")
