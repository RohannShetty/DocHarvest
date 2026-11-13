"""Spike 028: one-command MCP installer (JSON family)."""

from __future__ import annotations

import json

import pytest

from docharvest import cli, mcpinstall


def _read(path):
    return path.read_text(encoding="utf-8")


def test_dry_run_writes_nothing(tmp_path, capsys):
    target = tmp_path / "mcp.json"

    rc = cli.main(["setup", "--client", "cursor", "--path", str(target)])

    assert rc == 0
    assert not target.exists()
    out = capsys.readouterr().out
    assert "Would write" in out
    assert '"command": "docharvest"' in out
    assert '"args": [' in out


def test_apply_writes_parseable_entry(tmp_path):
    target = tmp_path / "mcp.json"

    rc = cli.main(["setup", "--client", "cursor", "--path", str(target), "--apply"])

    assert rc == 0
    data = json.loads(_read(target))
    entry = data["mcpServers"]["docharvest"]
    assert entry["command"] == "docharvest"
    assert entry["args"] == ["mcp"]


def test_vscode_uses_servers_key_and_stdio_type(tmp_path):
    target = tmp_path / "mcp.json"

    rc = cli.main(["setup", "--client", "vscode", "--path", str(target), "--apply"])

    assert rc == 0
    entry = json.loads(_read(target))["servers"]["docharvest"]
    assert entry["type"] == "stdio"
    assert entry["args"] == ["mcp"]


def test_conflict_requires_force_and_leaves_file_untouched(tmp_path, capsys):
    target = tmp_path / "mcp.json"
    original = '{\n  "mcpServers": {\n    "docharvest": {\n      "command": "old"\n    }\n  }\n}\n'
    target.write_text(original, encoding="utf-8")

    rc = cli.main(["setup", "--client", "cursor", "--path", str(target), "--apply"])

    assert rc == 1
    assert _read(target) == original
    assert "already registered" in capsys.readouterr().err

    rc = cli.main(
        ["setup", "--client", "cursor", "--path", str(target), "--apply", "--force"]
    )
    assert rc == 0
    assert json.loads(_read(target))["mcpServers"]["docharvest"]["command"] == "docharvest"


def test_corrupt_config_is_never_rewritten(tmp_path, capsys):
    target = tmp_path / "mcp.json"
    original = '{ "mcpServers": { broken'
    target.write_text(original, encoding="utf-8")

    rc = cli.main(["setup", "--client", "cursor", "--path", str(target), "--apply"])

    assert rc == 1
    assert _read(target) == original
    assert "not valid JSON" in capsys.readouterr().err


def test_verification_failure_restores_original(tmp_path, monkeypatch):
    target = tmp_path / "mcp.json"
    original = '{"mcpServers": {}}\n'
    target.write_text(original, encoding="utf-8")

    prepared = mcpinstall.plan("cursor", path=target)
    monkeypatch.setattr(mcpinstall, "verify", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("boom")))

    with pytest.raises(RuntimeError):
        mcpinstall.apply(prepared)
    assert target.read_text(encoding="utf-8") == original


def test_auto_detection_is_report_only(tmp_path, monkeypatch, capsys):
    config = tmp_path / ".cursor" / "mcp.json"
    config.parent.mkdir(parents=True)
    config.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(
        mcpinstall, "detect", lambda **k: {"cursor": config, "vscode": None}
    )

    rc = cli.main(["setup", "--client", "auto"])

    assert rc == 0
    out = capsys.readouterr().out
    assert "cursor:" in out
    assert "report-only" in out


def test_path_table_covers_five_clients():
    for client in mcpinstall.FAMILY_A_CLIENTS:
        path = mcpinstall.client_path(client, home="/home/u", cwd="/work", platform="linux")
        assert str(path).endswith((".json",))
