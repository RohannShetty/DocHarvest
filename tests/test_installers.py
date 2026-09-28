"""Tests for MCP config-family serializers and install links."""
from __future__ import annotations

import json

import pytest

from docharvest.installers import (
    ServerSpec,
    build_deeplink,
    get_client,
    render_config,
)


def test_family_a_preserves_unrelated_json_servers() -> None:
    client = get_client("cursor")
    rendered = render_config(
        client,
        ServerSpec(),
        '{"mcpServers": {"other": {"command": "other"}}, "setting": true}',
    )

    data = json.loads(rendered)
    assert data["setting"] is True
    assert data["mcpServers"]["other"]["command"] == "other"
    assert data["mcpServers"]["docharvest"] == {"command": "docharvest", "args": ["mcp"]}


def test_family_a_prime_uses_array_command_and_type() -> None:
    client = get_client("kilo-code")
    data = json.loads(render_config(client, ServerSpec()))

    registration = data["mcp"]["docharvest"]
    assert registration == {"type": "local", "command": ["docharvest", "mcp"]}
    assert "args" not in registration


def test_toml_and_yaml_families_emit_expected_shapes() -> None:
    toml = render_config(get_client("codex"), ServerSpec())
    yaml = render_config(get_client("goose"), ServerSpec())

    assert "[mcp_servers.docharvest]" in toml
    assert 'command = "docharvest"' in toml
    assert "extensions:" in yaml
    assert "  docharvest:" in yaml
    assert "type: stdio" in yaml


def test_duplicate_text_configs_require_force_to_replace() -> None:
    existing_toml = '[mcp_servers.docharvest]\ncommand = "old"\n'
    existing_yaml = "extensions:\n  docharvest:\n    name: old\n"

    with pytest.raises(ValueError, match="already registered"):
        render_config(get_client("codex"), ServerSpec(), existing_toml)
    with pytest.raises(ValueError, match="already registered"):
        render_config(get_client("goose"), ServerSpec(), existing_yaml)

    assert 'command = "docharvest"' in render_config(
        get_client("codex"), ServerSpec(), existing_toml, force=True
    )
    assert "name: docharvest" in render_config(
        get_client("goose"), ServerSpec(), existing_yaml, force=True
    )


def test_deeplink_is_encoded_and_contains_no_environment_secret() -> None:
    link = build_deeplink("trae", ServerSpec(env={"TOKEN": "do-not-leak"}))

    assert link.startswith("trae://mcp-import?config=")
    assert "do-not-leak" not in link
    assert "TOKEN" not in link


def test_unknown_clients_fail_closed() -> None:
    with pytest.raises(ValueError, match="Unsupported MCP client"):
        get_client("not-a-real-client")
