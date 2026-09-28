"""The library directory rename, and the migration that protects existing data.

The 11.1.1 release renamed the distribution from ``gitbook-downloader`` to
``docharvest`` and moved the library from ``~/.gitbook-downloader/`` to
``~/.docharvest/``. Every capture, snapshot, PDF and the search index live in
that directory, so "start using the new path" would have looked exactly like
data loss. These tests pin the behaviour that prevents it:

* an existing library is moved across **once**, contents intact;
* a half-created new directory (which the search index creates on first use) does
  not cause the old library to be stranded;
* nothing that already exists in the new location is ever overwritten;
* an explicit ``DOCHARVEST_HOME`` means the user owns the layout — no migration;
* the migration is idempotent.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from docharvest import paths


@pytest.fixture()
def fake_home(tmp_path, monkeypatch):
    """A throwaway home directory, with the env override cleared."""
    home = tmp_path / "home"
    home.mkdir()
    monkeypatch.setattr(Path, "home", staticmethod(lambda: home))
    monkeypatch.delenv(paths.ENV_HOME, raising=False)
    monkeypatch.delenv(paths._LEGACY_ENV_HOME, raising=False)
    monkeypatch.setattr(paths, "_MIGRATION_ATTEMPTED", False)
    monkeypatch.setattr(paths, "_LEGACY_ENV_WARNED", False)
    return home


def _populate_library(root: Path, domain: str = "docs.example.com") -> None:
    """Create a library that looks like a real one: a capture plus the index."""
    (root / "docs" / domain / "pages").mkdir(parents=True)
    (root / "docs" / domain / "docs.md").write_text("# Captured\n", encoding="utf-8")
    (root / "docs" / domain / "pages" / "intro.md").write_text("intro", encoding="utf-8")
    (root / "search.db").write_text("fts5", encoding="utf-8")
    (root / "locks").mkdir()


def test_library_root_names_the_new_directory(fake_home) -> None:
    assert paths.library_root() == fake_home / ".docharvest"
    assert paths.legacy_library_root() == fake_home / ".gitbook-downloader"


def test_read_only_root_lookup_does_not_touch_the_filesystem(fake_home) -> None:
    """Reporting the path must not create directories or migrate anything."""
    paths.library_root()
    assert not (fake_home / ".docharvest").exists()
    assert not (fake_home / ".gitbook-downloader").exists()


def test_create_makes_the_library(fake_home) -> None:
    root = paths.library_root(create=True)
    assert root.is_dir()


def test_existing_library_is_migrated_with_its_contents(fake_home) -> None:
    legacy = paths.legacy_library_root()
    _populate_library(legacy)

    root = paths.library_root(create=True)

    assert root == fake_home / ".docharvest"
    assert (root / "docs" / "docs.example.com" / "pages" / "intro.md").is_file()
    assert (root / "search.db").read_text(encoding="utf-8") == "fts5"
    assert not legacy.exists(), "the old directory should be gone once it is empty"


def test_migration_is_not_fooled_by_an_empty_new_directory(fake_home) -> None:
    """The search index creates the new root on first use, before any capture.

    A naive "does the new directory exist?" check would treat that empty shell as
    an already-migrated library and leave the real one behind, which is the exact
    data-loss bug this guard exists for.
    """
    legacy = paths.legacy_library_root()
    _populate_library(legacy)
    (fake_home / ".docharvest").mkdir()  # empty shell, as the index would leave it

    root = paths.library_root(create=True)

    assert (root / "docs" / "docs.example.com" / "docs.md").is_file()
    assert (root / "search.db").is_file()
    assert not legacy.exists()


def test_migration_does_not_overwrite_conflicting_children(fake_home) -> None:
    """A child that already exists in the new location wins; the rest still move."""
    _populate_library(paths.legacy_library_root())
    current = fake_home / ".docharvest"
    (current / "locks").mkdir(parents=True)
    mine = current / "locks" / "mine.lock"
    mine.write_text("held by a running capture", encoding="utf-8")

    paths.library_root(create=True)

    assert mine.read_text(encoding="utf-8") == "held by a running capture"
    assert (current / "docs" / "docs.example.com" / "docs.md").is_file()
    assert (current / "search.db").is_file()


def test_empty_index_shell_does_not_block_the_migration(fake_home) -> None:
    """A freshly created search.db is a cache with nothing in it, not a library.

    This is the real-world upgrade path: something touches the search index first
    (which creates the file), and only then does the library get used. Keying the
    decision on that file would strand the entire library one directory over.
    """
    legacy = paths.legacy_library_root()
    _populate_library(legacy)
    shell = fake_home / ".docharvest"
    shell.mkdir()
    (shell / "search.db").write_text("", encoding="utf-8")  # empty index, no captures

    root = paths.library_root(create=True)

    assert (root / "docs" / "docs.example.com" / "docs.md").is_file()
    assert (root / "search.db").read_text(encoding="utf-8") == "fts5", (
        "the populated index should have replaced the empty shell"
    )
    assert not legacy.exists()


def test_migration_leaves_a_real_new_library_alone(fake_home, capsys) -> None:
    _populate_library(paths.legacy_library_root())
    _populate_library(fake_home / ".docharvest", domain="new.example.com")

    paths.library_root(create=True)

    assert (fake_home / ".docharvest" / "docs" / "new.example.com").is_dir()
    assert (fake_home / ".gitbook-downloader").is_dir(), (
        "with two populated libraries the tool must not guess which one wins"
    )


def test_env_override_wins_and_skips_migration(fake_home, monkeypatch, tmp_path) -> None:
    _populate_library(paths.legacy_library_root())
    custom = tmp_path / "custom-library"
    monkeypatch.setenv(paths.ENV_HOME, str(custom))

    root = paths.library_root(create=True)

    assert root == custom and custom.is_dir()
    assert (paths.legacy_library_root() / "search.db").is_file(), (
        "an explicit override means the user manages the layout"
    )


def test_migration_runs_once(fake_home) -> None:
    _populate_library(paths.legacy_library_root())

    assert paths.migrate_legacy_library() == fake_home / ".docharvest"
    assert paths.migrate_legacy_library() is None


def test_nothing_to_migrate_on_a_fresh_machine(fake_home) -> None:
    assert paths.migrate_legacy_library() is None
    assert paths.library_root(create=True).is_dir()


def test_config_paths_use_the_new_names(fake_home) -> None:
    assert paths.global_config_path() == fake_home / ".docharvest" / "config.toml"
    assert paths.project_config_path().name == "docharvest.toml"
    assert paths.project_config_path().name != "gitbook-downloader.toml"


def test_legacy_env_var_is_reported_but_not_honoured(fake_home, monkeypatch, capsys) -> None:
    """Silently ignoring the old variable would look like an abandoned library."""
    monkeypatch.setenv(paths._LEGACY_ENV_HOME, str(fake_home / "elsewhere"))

    root = paths.library_root()

    assert root == fake_home / ".docharvest"
    assert paths._LEGACY_ENV_HOME in capsys.readouterr().err
