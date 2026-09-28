"""CLI contracts for MCP client installation."""
from __future__ import annotations

import json
from pathlib import Path

from docharvest.cli import main


def test_init_dry_run_does_not_write_and_uses_docharvest_mcp(tmp_path: Path, monkeypatch, capsys) -> None:
    monkeypatch.chdir(tmp_path)

    assert main(["init", "--client", "cursor", "--dry-run"]) == 0
    output = capsys.readouterr().out

    assert "Would write:" in output
    assert '"command": "docharvest"' in output
    assert '"args": [' in output
    assert '"mcp"' in output
    assert not (tmp_path / ".cursor" / "mcp.json").exists()


def test_init_writes_atomically_and_preserves_existing_json(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.chdir(tmp_path)
    config = tmp_path / ".cursor" / "mcp.json"
    config.parent.mkdir()
    config.write_text(json.dumps({"mcpServers": {"other": {"command": "other"}}}), encoding="utf-8")

    assert main(["init", "--client", "cursor"]) == 0
    data = json.loads(config.read_text(encoding="utf-8"))
    assert data["mcpServers"]["other"]["command"] == "other"
    assert data["mcpServers"]["docharvest"]["command"] == "docharvest"


def test_init_prints_ui_deeplink(capsys) -> None:
    assert main(["init", "--client", "trae", "--dry-run"]) == 0
    assert capsys.readouterr().out.startswith("trae://mcp-import?config=")
