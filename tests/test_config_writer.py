"""Config writer tests — `save_config_values`.

The GUI Preferences screen writes back to a user's config file, so the writer
must round-trip through `load_full_config`, keep comments and unrelated tables,
and never emit a duplicate key that the loader would then resolve in the wrong
order.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from docharvest.utils.config import load_full_config, save_config_values


def write_toml(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_creates_file_and_defaults_table(tmp_path: Path) -> None:
    dest = tmp_path / "config.toml"

    written = save_config_values({"workers": 9, "render": True}, path=dest)

    assert Path(written) == dest.resolve()
    assert read(dest) == "[defaults]\nworkers = 9\nrender = true\n"

    cfg = load_full_config(global_path=dest, project_path=tmp_path / "absent.toml")
    assert cfg.values["workers"] == 9
    assert cfg.values["render"] is True


def test_updates_in_place_and_keeps_comments(tmp_path: Path) -> None:
    dest = write_toml(
        tmp_path / "config.toml",
        """\
# my careful notes
[defaults]
workers = 3      # tuned by hand
timeout = 12.5

[presets.slow]
url = "https://example.com/docs"
max_pages = 10
""",
    )

    save_config_values({"workers": 8}, path=dest)

    text = read(dest)
    assert "# my careful notes" in text
    assert "timeout = 12.5" in text
    assert "[presets.slow]" in text
    assert "workers = 8" in text
    assert text.count("workers") == 1, "a second copy would shadow the edited value"

    cfg = load_full_config(global_path=dest, project_path=tmp_path / "absent.toml")
    assert cfg.values["workers"] == 8
    assert cfg.values["timeout"] == 12.5
    assert cfg.presets["slow"]["max_pages"] == 10


def test_updates_legacy_section_where_the_key_lives(tmp_path: Path) -> None:
    """A legacy `[download]` key must be edited there, not duplicated."""
    dest = write_toml(
        tmp_path / "config.toml",
        """\
[defaults]
snapshot = false

[download]
workers = 2
""",
    )

    save_config_values({"workers": 16}, path=dest)

    text = read(dest)
    assert text.count("workers") == 1
    assert "[download]" in text

    cfg = load_full_config(global_path=dest, project_path=tmp_path / "absent.toml")
    assert cfg.values["workers"] == 16
    assert cfg.values["snapshot"] is False


def test_writes_lists_and_keeps_scalars(tmp_path: Path) -> None:
    dest = tmp_path / "config.toml"

    save_config_values(
        {
            "path_scope": ["/docs/", "/api/"],
            "exclude_paths": [],
            "max_pages": 0,
            "min_content_chars": 80,
        },
        path=dest,
    )

    cfg = load_full_config(global_path=dest, project_path=tmp_path / "absent.toml")
    assert cfg.values["path_scope"] == ["/docs/", "/api/"]
    assert cfg.values["exclude_paths"] == []
    assert cfg.values["max_pages"] == 0
    assert cfg.values["min_content_chars"] == 80


def test_skips_none_values(tmp_path: Path) -> None:
    dest = tmp_path / "config.toml"

    save_config_values({"workers": None, "timeout": 5}, path=dest)

    text = read(dest)
    assert "workers" not in text
    assert "timeout = 5" in text


@pytest.mark.parametrize("key", ["bad key", "with.dot", "", "semi;colon"])
def test_rejects_invalid_keys(tmp_path: Path, key: str) -> None:
    dest = tmp_path / "config.toml"

    with pytest.raises(ValueError):
        save_config_values({key: 1}, path=dest)

    assert not dest.exists(), "a rejected key must not create the file"


def test_rejects_unsupported_value_type(tmp_path: Path) -> None:
    dest = tmp_path / "config.toml"

    with pytest.raises(TypeError):
        save_config_values({"workers": {"nested": 1}}, path=dest)

    assert not dest.exists(), "an unsupported value must not create the file"


def test_escapes_quotes_and_backslashes(tmp_path: Path) -> None:
    dest = tmp_path / "config.toml"

    save_config_values({"local_dir": 'C:\\docs\\"quoted"'}, path=dest)

    cfg = load_full_config(global_path=dest, project_path=tmp_path / "absent.toml")
    assert cfg.values["local_dir"] == 'C:\\docs\\"quoted"'
