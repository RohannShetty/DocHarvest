"""ApiBridge configuration surface — `get_config` / `save_config`.

Backs the GUI Preferences screen. The tests redirect both config locations into
a temp dir so they never read or write the real `~/.docharvest/config.toml`.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from docharvest.gui.bridge import ApiBridge
from docharvest.utils import config as config_module


@pytest.fixture()
def bridge(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> ApiBridge:
    monkeypatch.setattr(config_module, "GLOBAL_CONFIG_PATH", str(tmp_path / "global.toml"))
    monkeypatch.setattr(config_module, "PROJECT_CONFIG_PATH", str(tmp_path / "project.toml"))
    return ApiBridge()


def test_get_config_reports_paths_and_values(bridge: ApiBridge, tmp_path: Path) -> None:
    res = bridge.get_config()

    assert res["success"] is True
    assert res["values"]["workers"] == config_module.DEFAULTS["workers"]
    assert res["sources"] == [], "no config file exists yet"

    labels = {entry["label"]: entry for entry in res["paths"]}
    assert labels["global"]["path"] == str(tmp_path / "global.toml")
    assert labels["global"]["exists"] is False
    assert labels["project"]["exists"] is False


def test_save_config_writes_global_file_and_reloads(bridge: ApiBridge, tmp_path: Path) -> None:
    res = bridge.save_config({"workers": 7, "path_scope": ["/docs/"], "snapshot": False})

    assert res["success"] is True
    assert res["path"] == str((tmp_path / "global.toml").resolve())
    assert res["values"]["workers"] == 7
    assert res["values"]["path_scope"] == ["/docs/"]
    assert res["values"]["snapshot"] is False

    assert (tmp_path / "global.toml").is_file()
    labels = {entry["label"]: entry for entry in res["paths"]}
    assert labels["global"]["exists"] is True


def test_save_config_project_scope_targets_project_file(bridge: ApiBridge, tmp_path: Path) -> None:
    res = bridge.save_config({"timeout": 5}, scope="project")

    assert res["success"] is True
    assert res["path"] == str((tmp_path / "project.toml").resolve())
    assert (tmp_path / "project.toml").is_file()
    assert not (tmp_path / "global.toml").exists()


def test_save_config_rejects_unknown_keys(bridge: ApiBridge, tmp_path: Path) -> None:
    res = bridge.save_config({"not_a_key": 1})

    assert res["success"] is False
    assert "not_a_key" in res["error"]
    assert not (tmp_path / "global.toml").exists()


def test_save_config_rejects_unknown_scope(bridge: ApiBridge, tmp_path: Path) -> None:
    res = bridge.save_config({"workers": 3}, scope="nowhere")

    assert res["success"] is False
    assert "nowhere" in res["error"]
    assert not (tmp_path / "global.toml").exists()
