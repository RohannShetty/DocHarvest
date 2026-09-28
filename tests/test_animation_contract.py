"""Animation contract regression for the showcase.

Every `animate-*` class used in `docs/components/*.tsx` must resolve to
something that actually animates. Tailwind v4 only emits utilities it knows
about, and `tailwindcss-animate` ships `animate-in` / `fade-in` — **not**
`animate-fadeIn`. A custom class therefore needs an explicit `@keyframes` and
`.animate-<name>` rule in `docs/app/globals.css`.

This guards the bug that shipped for several releases: the Index Sheet
redesign removed the hero's tab panels (the only user of `animate-fadeIn`)
but `InstallModal.tsx` kept the class, so the install modal had a dead
entrance animation and nothing failed. A class that resolves to nothing is
silent; a test that asserts the keyframe exists is not.
"""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
COMPONENTS = REPO_ROOT / "docs" / "components"
GLOBALS_CSS = REPO_ROOT / "docs" / "app" / "globals.css"

#: Classes Tailwind core / tailwindcss-animate define for us. Anything else
#: used in a component must be declared in globals.css.
FRAMEWORK_ANIMATIONS = {
    "spin",
    "ping",
    "pulse",
    "bounce",
    "in",
    "out",
}

ANIMATE_RE = re.compile(r"\banimate-([A-Za-z][A-Za-z0-9_-]*)")


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _custom_animations_used() -> dict[str, set[str]]:
    """Map each non-framework `animate-*` class to the files using it."""
    used: dict[str, set[str]] = {}
    for path in sorted(COMPONENTS.glob("*.tsx")):
        for name in ANIMATE_RE.findall(_read_text(path)):
            if name in FRAMEWORK_ANIMATIONS:
                continue
            used.setdefault(name, set()).add(path.name)
    return used


def test_globals_css_declares_every_custom_animation() -> None:
    text = _read_text(GLOBALS_CSS)
    used = _custom_animations_used()

    missing = []
    for name, files in sorted(used.items()):
        if f"@keyframes {name}" not in text:
            missing.append(f"@keyframes {name} (used by {', '.join(sorted(files))})")
        if f".animate-{name}" not in text:
            missing.append(f".animate-{name} utility (used by {', '.join(sorted(files))})")

    assert not missing, (
        "custom animation(s) used in docs/components have no definition in "
        f"docs/app/globals.css — they render as no-ops: {missing}"
    )


def test_install_modal_fade_in_is_backed_by_the_keyframe() -> None:
    """The install modal is the surviving user of `animate-fadeIn`."""
    modal = COMPONENTS / "InstallModal.tsx"
    assert modal.exists(), f"missing component: {modal}"
    assert "animate-fadeIn" in _read_text(modal), (
        "InstallModal.tsx should keep its entrance animation class; if the "
        "modal animation was deliberately removed, delete the class here and "
        "the keyframe in globals.css together"
    )
