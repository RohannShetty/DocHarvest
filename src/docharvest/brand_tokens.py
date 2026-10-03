"""GENERATED FILE - DO NOT EDIT.

Source: brand/tokens.json   Regenerate: node scripts/sync-brand-tokens.mjs
tests/test_brand_tokens.py fails if this file and the source disagree.
"""

from __future__ import annotations

#: Every corner in the brand is square.
RADIUS: str = "0px"

#: The two families the whole product is set in. A terminal or a native window
#: without them installed falls through the stack to the platform UI font rather
#: than rendering in a different voice.
FONTS: dict[str, tuple[str, ...]] = {
    "sans": (
        "Archivo",
        "ui-sans-serif",
        "system-ui",
        "sans-serif",
    ),
    "mono": (
        "Geist Mono",
        "ui-monospace",
        "SFMono-Regular",
        "Roboto Mono",
        "Menlo",
        "Monaco",
        "Consolas",
        "monospace",
    ),
}

#: Brand primitives per mode. "dark" is the default world; "light" is a real
#: second palette, not an inversion of the first.
TOKENS: dict[str, dict[str, str]] = {
    "dark": {
        "bond": "#09090B",
        "bond-2": "#101013",
        "bond-3": "#18181B",
        "rule": "#27272A",
        "rule-strong": "#3F3F46",
        "rule-subtle": "#1F1F23",
        "ink": "#F4F4F5",
        "ink-2": "#A1A1AA",
        "ink-3": "#8A8A93",
        "match": "#F59E0B",
        "match-deep": "#D97706",
        "match-subtle": "rgba(245, 158, 11, 0.08)",
        "alert": "#EF4444",
        "ok": "#34D399",
        "paper": "#FAFAFA",
    },
    "light": {
        "bond": "#FBFBFA",
        "bond-2": "#F4F4F5",
        "bond-3": "#ECECEF",
        "rule": "#E4E4E7",
        "rule-strong": "#A1A1AA",
        "rule-subtle": "#EDEDF0",
        "ink": "#18181B",
        "ink-2": "#52525B",
        "ink-3": "#6B6B74",
        "match": "#B45309",
        "match-deep": "#92400E",
        "match-subtle": "rgba(180, 83, 9, 0.06)",
        "alert": "#B91C1C",
        "ok": "#047857",
        "paper": "#FAFAFA",
    },
}


def token(name: str, mode: str = "dark") -> str:
    """Return one brand primitive: token("bond") or token("match", "light")."""
    try:
        return TOKENS[mode][name]
    except KeyError as exc:  # pragma: no cover - a typo at a call site
        raise KeyError(
            f"unknown brand token {name!r} for mode {mode!r}; "
            f"known modes: {sorted(TOKENS)}, known tokens: {sorted(TOKENS[mode])}"
        ) from exc


def font_stack(kind: str) -> str:
    """Return a CSS font stack for FONTS ("sans" or "mono")."""
    try:
        families = FONTS[kind]
    except KeyError as exc:  # pragma: no cover - a typo at a call site
        raise KeyError(
            f"unknown font stack {kind!r}; known stacks: {sorted(FONTS)}"
        ) from exc
    return ", ".join(f'"{name}"' if " " in name else name for name in families)
