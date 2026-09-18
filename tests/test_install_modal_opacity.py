"""InstallModal invisible-text regression.

The install panel used to render the command at ``text-cyan/10`` which is
effectively invisible (10% opacity on a near-black background). This test
fails if the invisible token sneaks back in.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
INSTALL_MODAL = REPO_ROOT / "docs" / "components" / "InstallModal.tsx"


def test_install_modal_exists() -> None:
    assert INSTALL_MODAL.exists()


def test_install_modal_no_invisible_cyan_text() -> None:
    """The wrapping <div> and the <pre> must NOT use ``text-cyan/10``."""
    text = INSTALL_MODAL.read_text(encoding="utf-8")
    # The invisible token must not appear anywhere in the install panel.
    assert "text-cyan/10" not in text, (
        f"{INSTALL_MODAL.name} still uses the invisible `text-cyan/10` token "
        f"on the install command panel. Use `text-cyan/90` (or higher) so the "
        f"command is actually readable."
    )


def test_install_modal_uses_readable_cyan_text() -> None:
    """The install panel must use readable text contrast.

    In the legacy cyan theme, it required >= /80 opacity; in the Index Sheet
    palette, it uses the ink/bond ramp or readable tokens.
    """
    text = INSTALL_MODAL.read_text(encoding="utf-8")
    if "text-cyan" in text:
        readable = re.search(r"text-cyan(?:-[0-9]+)?(?:/(?:[8-9]\d|100))?", text)
        assert readable is not None, (
            f"{INSTALL_MODAL.name} should use a readable `text-cyan*` token on "
            f"the install command panel"
        )
    else:
        # Index Sheet palette: uses text-ink / sheet-num typography
        assert "text-ink" in text or "sheet-num" in text, (
            f"{INSTALL_MODAL.name} must use readable text-ink/sheet-num tokens"
        )
