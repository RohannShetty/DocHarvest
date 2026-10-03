"""The drawn-asset contract.

``brand/tokens.json`` is the source of truth for colour and type; it is generated
into the stylesheets (``scripts/sync-brand-tokens.mjs``) and into every drawn
asset (``scripts/build-brand-kit.mjs``):

    assets/logo.svg                        tile mark (README, avatars)
    assets/logo-icon.svg                   bare glyph
    docs/app/icon.svg                      website favicon
    docs/public/assets/*.svg               the website's copies
    docs/public/assets/social-preview.svg  the GitHub social card
    brand/brand-kit.svg                    the identity board

The failure this file exists to prevent is specific and already happened: the
mark in the README was a hand-drawn cyan/indigo/emerald gradient with rounded
corners and a glow, while the website favicon carried the real zinc-and-amber
glyph. Two logos, one product. So the guards are:

* every asset is reproducible from the tokens (no hand-edited copies),
* no asset names a colour outside the token palette,
* the mark is the geometry in docs/brand/BRAND.md §3.2 - flat, square, one amber.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]
TOKENS = REPO / "brand" / "tokens.json"
GENERATOR = REPO / "scripts" / "build-brand-kit.mjs"

LOGO = REPO / "assets" / "logo.svg"
LOGO_ICON = REPO / "assets" / "logo-icon.svg"
FAVICON = REPO / "docs" / "app" / "icon.svg"
PUBLIC = REPO / "docs" / "public" / "assets"
SOCIAL = PUBLIC / "social-preview.svg"
BRAND_KIT = REPO / "brand" / "brand-kit.svg"

GENERATED_ASSETS = [LOGO, LOGO_ICON, FAVICON, PUBLIC / "logo.svg", PUBLIC / "logo-icon.svg", SOCIAL, BRAND_KIT]

# The mark's geometry table (docs/brand/BRAND.md §3.2).
MARK_PAGE_RECT = re.compile(
    r'<rect x="100" y="142" width="170" height="228" rx="30" fill="none" '
    r'stroke="(?P<page>[^"]+)" stroke-width="26"/>'
)
MARK_CHEVRON = 'd="M288 206 L344 256 L288 306"'
MARK_CURSOR = '<line x1="374" y1="306" x2="412" y2="306"'

HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}")


def load_tokens() -> dict:
    return json.loads(TOKENS.read_text(encoding="utf-8"))


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


# --------------------------------------------------------------------------
# the assets exist and are generated
# --------------------------------------------------------------------------


@pytest.mark.parametrize("path", GENERATED_ASSETS, ids=lambda p: p.name)
def test_every_drawn_asset_exists(path: Path) -> None:
    assert path.exists(), f"{path.relative_to(REPO)} was never generated"


@pytest.mark.parametrize("path", GENERATED_ASSETS, ids=lambda p: p.name)
def test_every_drawn_asset_is_marked_generated(path: Path) -> None:
    assert "scripts/build-brand-kit.mjs" in read(path), (
        f"{path.relative_to(REPO)} does not say it came from the generator"
    )


def test_assets_are_reproducible_from_the_tokens() -> None:
    """`node scripts/build-brand-kit.mjs --check` is the authoritative drift test."""
    if shutil.which("node") is None:
        pytest.skip("node is unavailable, cannot regenerate")
    result = subprocess.run(
        ["node", str(GENERATOR), "--check"],
        cwd=REPO,
        capture_output=True,
        text=True,
        timeout=120,
    )
    assert result.returncode == 0, (
        "the drawn brand assets are stale - run `node scripts/build-brand-kit.mjs`\n"
        f"{result.stdout}{result.stderr}"
    )


# --------------------------------------------------------------------------
# the mark is the mark
# --------------------------------------------------------------------------


@pytest.mark.parametrize("path", [LOGO, LOGO_ICON, FAVICON, PUBLIC / "logo.svg", PUBLIC / "logo-icon.svg"], ids=lambda p: str(p.relative_to(REPO)))
def test_mark_uses_the_documented_geometry(path: Path) -> None:
    """The glyph in BRAND.md §3.2, not a redrawn approximation of it."""
    svg = read(path)
    assert MARK_PAGE_RECT.search(svg), f"{path.name}: the page is not the documented rect"
    assert MARK_CHEVRON in svg, f"{path.name}: the prompt is not the documented chevron"
    assert MARK_CURSOR in svg, f"{path.name}: the prompt cursor is missing"


def test_the_two_marks_are_identical_across_surfaces() -> None:
    """One mark: the README's, the favicon's and the website's must be the same file."""
    assert read(LOGO) == read(FAVICON) == read(PUBLIC / "logo.svg")
    assert read(LOGO_ICON) == read(PUBLIC / "logo-icon.svg")


def test_the_bare_glyph_has_no_tile() -> None:
    """logo-icon.svg is the glyph alone; the tile belongs to logo.svg."""
    assert 'rx="104"' not in read(LOGO_ICON)


@pytest.mark.parametrize("path", GENERATED_ASSETS, ids=lambda p: p.name)
def test_no_asset_uses_a_gradient(path: Path) -> None:
    """The brand is flat. A gradient is the exact drift that produced two logos."""
    svg = read(path)
    assert "<linearGradient" not in svg, f"{path.name} reintroduced a gradient"
    assert "<radialGradient" not in svg, f"{path.name} reintroduced a gradient"
    assert "filter=" not in svg, f"{path.name} reintroduced a glow filter"


@pytest.mark.parametrize("path", GENERATED_ASSETS, ids=lambda p: p.name)
def test_no_asset_uses_a_colour_outside_the_palette(path: Path) -> None:
    tokens = load_tokens()
    allowed = {
        value.upper()
        for mode in tokens["primitives"].values()
        for name, value in mode.items()
        if name not in {"match-subtle"}  # rgba(), parsed by the generator, not a hex
    }
    offenders = sorted(
        {hexvalue.upper() for hexvalue in HEX_RE.findall(read(path))} - allowed
    )
    assert not offenders, (
        f"{path.relative_to(REPO)} uses colour(s) outside brand/tokens.json: "
        f"{', '.join(offenders)}"
    )


def test_the_prompt_is_the_only_amber_in_the_mark() -> None:
    """One accent per composition: in the bare glyph, amber is the prompt only."""
    tokens = load_tokens()
    amber = tokens["primitives"]["dark"]["match"]
    svg = read(LOGO_ICON)
    amber_lines = [line for line in svg.splitlines() if amber in line]
    assert len(amber_lines) == 2, (
        "the mark's amber belongs to the chevron and the cursor only, "
        f"found {len(amber_lines)} amber elements"
    )
    assert any(MARK_CHEVRON in line for line in amber_lines)
    assert any(MARK_CURSOR in line for line in amber_lines)


# --------------------------------------------------------------------------
# the board and the card
# --------------------------------------------------------------------------


def test_brand_kit_is_a_nine_panel_sheet() -> None:
    """The identity board: a 3x3 grid on the bond, one idea per panel."""
    svg = read(BRAND_KIT)
    assert svg.startswith("<svg")
    assert 'viewBox="0 0 2400 1800"' in svg
    # Nine panels, numbered, each named.
    for number, title in [
        ("01", "mark"),
        ("02", "construction"),
        ("03", "surface"),
        ("04", "essence"),
        ("05", "colour"),
        ("06", "type"),
        ("07", "physical"),
        ("08", "image direction"),
        ("09", "system detail"),
    ]:
        assert f"{number} {title.upper()}" in svg, f"panel {number} ({title}) is missing"


def test_social_card_states_the_package_version() -> None:
    """The card is regenerated from pyproject, so it cannot advertise a dead version."""
    pyproject = (REPO / "pyproject.toml").read_text(encoding="utf-8")
    version = re.search(r'^version\s*=\s*"([^"]+)"', pyproject, re.M)
    assert version, "pyproject.toml has no [project] version"
    assert f"v{version.group(1)}" in read(SOCIAL)


def test_social_card_is_the_documented_1280x640() -> None:
    assert 'viewBox="0 0 1280 640"' in read(SOCIAL)


def test_social_headline_clears_the_terminal_panel() -> None:
    """The claim sits left of the terminal card at 668px and must not run under it.

    The card is rendered by GitHub with whatever font is installed, so the
    headline is measured with a generous per-character advance rather than
    trusting Archivo's own metrics.
    """
    svg = read(SOCIAL)
    panel = re.search(
        r'<rect x="(\d+)" y="150" width="\d+" height="\d+" fill="'
        + load_tokens()["primitives"]["dark"]["bond-2"]
        + r'"',
        svg,
    )
    assert panel, "the terminal panel is missing from the card"
    panel_left = int(panel.group(1))

    headline = [
        m
        for m in re.finditer(
            r'<text x="(\d+)" y="\d+" font-family="[^"]*sans[^"]*" font-size="(\d+)"'
            r' font-weight="700"[^>]*>(.*?)</text>',
            svg,
            re.S,
        )
        # The headline is the block of display type starting at x=64.
        if int(m.group(1)) == 64
    ]
    assert headline, "the card has no display headline"

    for match in headline:
        size, content = match.group(2), match.group(3)
        # ~0.62em per character is a wide upper bound for a bold grotesque.
        width = int(size) * 0.62 * len(re.sub(r"<[^>]+>", "", content))
        assert width <= panel_left - 64 - 24, (
            f"headline line {content!r} is ~{int(width)}px wide and runs under the "
            f"terminal panel at x={panel_left}"
        )


def test_documented_palettes_match_the_tokens() -> None:
    """The website's direction contract must quote the palette that actually ships.

    It restates the palette in prose inside the page markup, and it drifted from
    brand/tokens.json before this guard existed.
    """
    dark = load_tokens()["primitives"]["dark"]
    layout = (REPO / "docs" / "app" / "layout.tsx").read_text(encoding="utf-8")
    for name in ("bond", "rule", "ink", "ink-2", "ink-3", "match"):
        assert dark[name] in layout, (
            f"the website's direction contract no longer quotes --{name} ({dark[name]})"
        )


def test_local_design_notes_match_the_tokens_when_present() -> None:
    """DESIGN.md is gitignored (local notes), so only check it when it exists.

    Asserting on an untracked file makes a test pass in a working copy and fail
    in CI, which is the failure mode this file was written to prevent.
    """
    design = REPO / "DESIGN.md"
    if not design.exists():
        pytest.skip("DESIGN.md is gitignored local scratch; nothing to check")
    dark = load_tokens()["primitives"]["dark"]
    text = design.read_text(encoding="utf-8")
    for name in ("bond", "bond-2", "rule", "rule-strong", "ink", "ink-2", "ink-3", "match"):
        assert f'"{dark[name]}"' in text, (
            f"DESIGN.md no longer quotes --{name} ({dark[name]})"
        )
