"""Canonical on-disk locations for DocHarvest.

One module decides where the library lives, so the storage manager, the search
index and the configuration loader cannot drift apart.

**Why the migration exists.** The 11.1.1 release renamed the distribution from
``gitbook-downloader`` to ``docharvest``, and the library directory moved with
it (``~/.gitbook-downloader/`` → ``~/.docharvest/``). Every capture, snapshot,
PDF and the SQLite search index live in that directory, so an upgrade that
simply started using a new path would look exactly like data loss.
:func:`migrate_legacy_library` moves an existing library across once, merging
into the new directory and never overwriting anything that is already there.

Renaming is deliberate, not an accident to be papered over: there is no
compatibility layer reading the old path or the old environment variable. The
migration is one-way and idempotent — it runs at most once per process, and a
second run finds nothing left to move.
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

#: Directory name used by this version, and the one it replaced.
LIBRARY_DIR_NAME = ".docharvest"
LEGACY_LIBRARY_DIR_NAME = ".gitbook-downloader"

#: Environment variable overriding the library root (tests, sandboxed installs).
ENV_HOME = "DOCHARVEST_HOME"
_LEGACY_ENV_HOME = "GITBOOK_DOWNLOADER_HOME"

CONFIG_FILE_NAME = "config.toml"
PROJECT_CONFIG_FILE_NAME = "docharvest.toml"

# Migration runs at most once per process; tests reset this to exercise it.
_MIGRATION_ATTEMPTED = False

_LEGACY_ENV_WARNED = False


def _home() -> Path:
    """Home directory, resolved at call time so tests can patch it."""
    return Path.home()


def legacy_library_root() -> Path:
    """The pre-rename library directory (``~/.gitbook-downloader``)."""
    return _home() / LEGACY_LIBRARY_DIR_NAME


def library_root(*, create: bool = False) -> Path:
    """Return the library root.

    Args:
        create: create the directory (``parents=True``) if it is missing, after
            first moving a library left behind by the pre-rename package. Callers
            that are about to write pass this; read-only callers do not, so that
            merely reporting the path never touches the filesystem.
    """
    env = os.environ.get(ENV_HOME)
    if env:
        root = Path(env).expanduser()
        if create:
            root.mkdir(parents=True, exist_ok=True)
        return root

    _warn_about_legacy_env_var()
    if create:
        migrate_legacy_library()  # bring an old library across before creating
        root = _home() / LIBRARY_DIR_NAME
        root.mkdir(parents=True, exist_ok=True)
        return root
    return _home() / LIBRARY_DIR_NAME


def _warn_about_legacy_env_var() -> None:
    """Tell a user whose override is now ignored, instead of silently moving on.

    Not a compatibility layer: the old variable is *not* honoured. A silent
    ignore is the worst option, because their library would appear to have been
    abandoned while it is still sitting under the old path.
    """
    global _LEGACY_ENV_WARNED
    if _LEGACY_ENV_WARNED or not os.environ.get(_LEGACY_ENV_HOME):
        return
    _LEGACY_ENV_WARNED = True
    print(
        f"[docharvest] {_LEGACY_ENV_HOME} is set but no longer read — the variable "
        f"is now {ENV_HOME}. Unset the old one (or set {ENV_HOME}) to silence this.",
        file=sys.stderr,
    )


def _holds_a_library(path: Path) -> bool:
    """True when ``path`` contains real captures.

    Deliberately keyed on captured domains, not on the presence of the directory
    or its search index: the index creates ``search.db`` the first time anything
    looks at it, and an empty index next to zero captures is a shell, not a
    library. Treating that shell as "already migrated" is precisely how a real
    library gets stranded at the old path.
    """
    docs = path / "docs"
    return docs.is_dir() and any(docs.iterdir())


def migrate_legacy_library() -> Path | None:
    """Move a pre-rename library into the new location. Returns the new root.

    Returns ``None`` when there is nothing to do, which is the normal case for a
    fresh install and for every run after the first.
    """
    global _MIGRATION_ATTEMPTED
    if _MIGRATION_ATTEMPTED:
        return None
    _MIGRATION_ATTEMPTED = True

    if os.environ.get(ENV_HOME):
        return None  # an explicit override means the user owns the layout

    legacy = legacy_library_root()
    if not legacy.is_dir():
        return None

    target = _home() / LIBRARY_DIR_NAME
    if _holds_a_library(target):
        # Both locations hold captures. Guessing which one the user wants is
        # worse than leaving both alone and saying so.
        print(
            f"[docharvest] both {target} and {legacy} hold captured docs; leaving "
            f"both in place. Move what you need, then delete the one you don't.",
            file=sys.stderr,
        )
        return None

    try:
        target.mkdir(parents=True, exist_ok=True)
        # An index inside a library with no captures is empty by construction —
        # every row comes from a captured page. Drop it so the populated legacy
        # index can take its place instead of being skipped as a conflict.
        index = target / "search.db"
        if index.is_file():
            index.unlink()
    except OSError as exc:
        print(f"[docharvest] could not prepare {target}: {exc}", file=sys.stderr)
        return None

    moved: list[str] = []
    skipped: list[str] = []
    try:
        for child in sorted(legacy.iterdir()):
            destination = target / child.name
            if destination.exists():
                skipped.append(child.name)
                continue
            shutil.move(str(child), str(destination))
            moved.append(child.name)
        if not any(legacy.iterdir()):
            legacy.rmdir()
    except OSError as exc:
        print(
            f"[docharvest] could not finish moving the previous library "
            f"({legacy} -> {target}): {exc}. Existing files were left in place; "
            f"move them manually to use them.",
            file=sys.stderr,
        )
        return None

    if moved:
        print(
            f"[docharvest] moved the library from {legacy} to {target} "
            f"({', '.join(moved)}) — the package was renamed from "
            f"gitbook-downloader, and your captures came with it.",
            file=sys.stderr,
        )
    if skipped:
        print(
            f"[docharvest] left {', '.join(skipped)} at {legacy} because the new "
            f"location already has them. Re-run a capture for those domains to "
            f"rebuild the index from the stored docs.",
            file=sys.stderr,
        )
    return target


def global_config_path() -> Path:
    """``~/.docharvest/config.toml`` (or ``$DOCHARVEST_HOME/config.toml``)."""
    return library_root() / CONFIG_FILE_NAME


def project_config_path() -> Path:
    """``./docharvest.toml`` — the per-project configuration file."""
    return Path(f"./{PROJECT_CONFIG_FILE_NAME}")
