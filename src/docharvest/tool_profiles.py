"""Named MCP tool profiles for controlling schema size at startup."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class ToolProfile:
    """A named set of MCP tools exposed by one server process."""

    name: str
    enabled_tools: tuple[str, ...]


MINIMAL_TOOLS = (
    "download_docs",
    "search_docs",
    "list_domains",
    "find_docs",
    "read_doc",
)

FULL_TOOLS = (
    *MINIMAL_TOOLS,
    "get_doc",
    "diff_versions",
    "list_versions",
    "export_docs",
    "get_changelog",
    "query_doc_graph",
    "get_related_concepts",
)

PROFILES = {
    "minimal": ToolProfile("minimal", MINIMAL_TOOLS),
    "full": ToolProfile("full", FULL_TOOLS),
}


def get_profile(name: str) -> ToolProfile:
    """Return a named profile, rejecting unknown names instead of guessing."""
    try:
        return PROFILES[name]
    except KeyError as exc:
        available = ", ".join(sorted(PROFILES))
        raise ValueError(f"Unknown tool profile {name!r}; choose one of: {available}") from exc


def disabled_tools(profile: ToolProfile, registered: Iterable[str]) -> tuple[str, ...]:
    """Return registered tools not enabled by *profile*, in registration order."""
    enabled = set(profile.enabled_tools)
    return tuple(name for name in registered if name not in enabled)
