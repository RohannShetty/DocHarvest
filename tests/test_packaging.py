"""Packaging guard: every non-Python asset in the package must be declared.

setuptools ships only ``.py`` files plus whatever ``tool.setuptools.package-data``
names. A data file that is not declared is therefore **silently absent** from the
wheel and the sdist, and the failure surfaces only at runtime for pip/uvx users:

- ``gui/web/`` (the prebuilt desktop UI, 62 files) → ``docharvest gui`` exits 1
  with "GUI web assets not found".
- ``tui/styles.tcss`` (``CSS_PATH``) → ``docharvest tui`` cannot load its theme.
- ``skills/*/SKILL.md`` → ``docharvest skill install`` has nothing to install.

Both the GUI and the TUI shipped broken in every release up to and including
11.0.7 because those files were never declared (only the PyInstaller build added
them explicitly, which is why the standalone executable worked). These tests
compare what is on disk against what is declared, so the gap cannot reopen.
"""

from __future__ import annotations

import fnmatch
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_DIR = REPO_ROOT / "src" / "gitbook_downloader"
PYPROJECT = REPO_ROOT / "pyproject.toml"

#: Build/byte-code directories that never belong in a distribution.
_EXCLUDED_PARTS = {"__pycache__"}


def _declared_patterns() -> list[str]:
    """Return the ``package-data`` globs declared for this package."""
    text = PYPROJECT.read_text(encoding="utf-8")
    try:
        import tomllib
    except ModuleNotFoundError:  # pragma: no cover - Python 3.10 only
        # Minimal fallback so the guard still runs on 3.10 (tomllib is 3.11+).
        table = re.search(
            r"\[tool\.setuptools\.package-data\](.*?)(?:\n\[|\Z)", text, re.S
        )
        assert table, "tool.setuptools.package-data table not found"
        entry = re.search(r"gitbook_downloader\s*=\s*\[(.*?)\]", table.group(1), re.S)
        assert entry, "gitbook_downloader package-data entry not found"
        return re.findall(r'"([^"]+)"', entry.group(1))

    data = tomllib.loads(text)
    return list(data["tool"]["setuptools"]["package-data"]["gitbook_downloader"])


def _data_files() -> list[Path]:
    """Every shippable (non-``.py``) file under the package, package-relative."""
    found: list[Path] = []
    for path in PACKAGE_DIR.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix == ".py":
            continue
        if _EXCLUDED_PARTS.intersection(path.parts):
            continue
        found.append(path.relative_to(PACKAGE_DIR))
    return sorted(found)


def test_package_data_patterns_are_declared():
    patterns = _declared_patterns()
    assert patterns, "no package-data patterns declared for gitbook_downloader"
    assert any(p.endswith("SKILL.md") for p in patterns), (
        "the bundled skill must stay declared"
    )


def test_every_package_data_file_is_declared():
    """Nothing on disk may be missing from the declared patterns."""
    patterns = _declared_patterns()
    uncovered = [
        rel.as_posix()
        for rel in _data_files()
        if not any(fnmatch.fnmatchcase(rel.as_posix(), pat) for pat in patterns)
    ]

    assert not uncovered, (
        "these data files exist under src/gitbook_downloader but match no "
        "tool.setuptools.package-data pattern, so they will NOT ship in the "
        f"wheel or sdist: {uncovered}"
    )


def test_declared_patterns_match_real_files():
    """A declared pattern that matches nothing is dead config.

    ``py.typed`` was declared for several releases while the file did not exist,
    so the declaration was inert. Catch that direction too.
    """
    files = [rel.as_posix() for rel in _data_files()]
    dead = [
        pat
        for pat in _declared_patterns()
        if not any(fnmatch.fnmatchcase(f, pat) for f in files)
    ]

    assert not dead, (
        f"declared package-data pattern(s) match no file on disk: {dead}"
    )


@pytest.mark.parametrize(
    "required",
    [
        "gui/web/index.html",
        "tui/styles.tcss",
        "skills/docharvest/SKILL.md",
        "py.typed",
    ],
)
def test_runtime_assets_exist_in_the_source_package(required: str):
    """The assets the installed app loads at runtime must be present at all."""
    assert (PACKAGE_DIR / required).is_file(), f"missing runtime asset: {required}"


def test_gui_web_assets_are_complete():
    """The desktop UI needs its bundle, not just the HTML shell."""
    assets = PACKAGE_DIR / "gui" / "web" / "assets"
    assert assets.is_dir(), "gui/web/assets directory is missing"
    assert list(assets.glob("*.js")), "no compiled JavaScript in gui/web/assets"
