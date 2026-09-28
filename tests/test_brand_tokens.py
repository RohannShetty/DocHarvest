"""The brand-token contract.

`brand/tokens.json` is the single source of truth for colour and type. It is
generated into one stylesheet per surface:

    docs/app/brand-tokens.css              -> the website (Next.js, Tailwind v4)
    frontend/src/styles/brand-tokens.css   -> the desktop GUI (Vite, Tailwind v3)

Both surfaces must consume those files rather than naming colours of their own,
which is the whole point of the exercise: before this existed the website spoke
`--bond/--rule/--ink/--match` while the GUI spoke shadcn's slate defaults, so the
product and its documentation never looked like the same thing.

A failure here means the two surfaces have started to drift apart again.
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
GENERATOR = REPO / "scripts" / "sync-brand-tokens.mjs"

WEBSITE_CSS = REPO / "docs" / "app" / "brand-tokens.css"
WEBSITE_GLOBALS = REPO / "docs" / "app" / "globals.css"
WEBSITE_LAYOUT = REPO / "docs" / "app" / "layout.tsx"

GUI_CSS = REPO / "frontend" / "src" / "styles" / "brand-tokens.css"
GUI_INDEX_CSS = REPO / "frontend" / "src" / "index.css"
GUI_INDEX_HTML = REPO / "frontend" / "index.html"
GUI_SRC = REPO / "frontend" / "src"
GUI_TAILWIND = REPO / "frontend" / "tailwind.config.js"
GUI_PACKAGE = REPO / "frontend" / "package.json"
GUI_FALLBACK_TS = GUI_SRC / "lib" / "brand.ts"

# Files allowed to mention a raw colour literal:
#   - the generated stylesheets and the token source itself
#   - lib/brand.ts, which carries the last-resort fallbacks for canvas surfaces
RAW_COLOUR_ALLOWED = {
    "brand-tokens.css",
    "tokens.json",
    "brand.ts",
}

# Overlay scrims are a platform convention (every modal needs one) rather than a
# brand colour, so they are the single carve-out.
SCRIM_RE = re.compile(r"\bbg-black/(?:40|50|60|70|75|80|90)\b")

PALETTE_UTILITY_RE = re.compile(
    r"\b(?:text|bg|border|ring|ring-offset|from|to|via|fill|stroke|divide|outline|"
    r"decoration|shadow|placeholder|caret|accent)"
    r"-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|"
    r"teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)"
    r"-\d{2,3}\b"
)


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def load_tokens() -> dict:
    return json.loads(TOKENS.read_text(encoding="utf-8"))


def parse_vars(css: str, selector: str) -> dict[str, str]:
    """Pull `--name: value;` declarations out of one selector block."""
    match = re.search(
        re.escape(selector) + r"\s*\{(?P<body>[^}]*)\}", css, re.S
    )
    if not match:
        return {}
    return {
        name: value.strip()
        for name, value in re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", match.group("body"))
    }


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    digits = value.lstrip("#")
    if len(digits) == 3:
        digits = "".join(c * 2 for c in digits)
    return tuple(int(digits[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def hsl_triplet_to_rgb(triplet: str) -> tuple[int, int, int]:
    h, s, l = (float(part.rstrip("%")) for part in triplet.split())
    s_n, l_n = s / 100, l / 100
    c = (1 - abs(2 * l_n - 1)) * s_n
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l_n - c / 2
    seg = int(h // 60) % 6
    rgb = [(c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x)][seg]
    return tuple(min(255, max(0, round((v + m) * 255))) for v in rgb)  # type: ignore[return-value]


def resolve(token_name: str, mode: str, tokens: dict) -> str:
    spec = tokens["shadcn"][token_name]
    if isinstance(spec, dict):
        return spec[mode]
    return tokens["primitives"][mode][spec]


def gui_files() -> list[Path]:
    out = []
    for path in GUI_SRC.rglob("*"):
        if not path.is_file() or path.suffix not in {".tsx", ".ts", ".css", ".html"}:
            continue
        if "node_modules" in path.parts:
            continue
        out.append(path)
    out.append(GUI_INDEX_HTML)
    return out


# --------------------------------------------------------------------------
# the token source itself
# --------------------------------------------------------------------------

def test_token_source_is_well_formed() -> None:
    tokens = load_tokens()
    dark, light = tokens["primitives"]["dark"], tokens["primitives"]["light"]
    assert set(dark) == set(light), "dark and light must define the same primitives"
    assert tokens["radius"] == "0px", "the brand is square-cornered: radius must be 0px"
    for mode, primitives in (("dark", dark), ("light", light)):
        for name, value in primitives.items():
            assert re.fullmatch(r"#[0-9A-Fa-f]{6}|rgba?\([^)]+\)", value), (
                f"{mode}.{name} = {value!r} is neither a hex nor an rgba() colour"
            )


def test_every_semantic_variable_resolves_per_mode() -> None:
    tokens = load_tokens()
    semantic = [k for k in tokens["shadcn"] if not k.startswith("$")]
    assert {"background", "foreground", "border", "primary", "ring"} <= set(semantic)
    for name in semantic:
        for mode in ("dark", "light"):
            assert re.fullmatch(r"#[0-9A-Fa-f]{6}", resolve(name, mode, tokens)), (
                f"shadcn.{name} does not resolve to a hex colour in {mode}"
            )


# --------------------------------------------------------------------------
# the generated stylesheets
# --------------------------------------------------------------------------

def test_both_stylesheets_are_generated() -> None:
    assert WEBSITE_CSS.exists(), "the website stylesheet was never generated"
    assert GUI_CSS.exists(), "the GUI stylesheet was never generated"
    for path in (WEBSITE_CSS, GUI_CSS):
        assert "GENERATED FILE" in path.read_text(encoding="utf-8")


def test_generated_stylesheets_are_up_to_date() -> None:
    """`node scripts/sync-brand-tokens.mjs --check` is the authoritative drift test."""
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
        f"brand tokens are stale - run `node scripts/sync-brand-tokens.mjs`\n{result.stdout}{result.stderr}"
    )


def test_website_stylesheet_carries_the_primitives() -> None:
    tokens = load_tokens()
    css = WEBSITE_CSS.read_text(encoding="utf-8")
    for mode, selector in (("dark", ":root"), ("light", ".light")):
        declared = parse_vars(css, selector)
        for name, value in tokens["primitives"][mode].items():
            assert declared.get(f"--{name}") == value, f"{selector} --{name} drifted"


def test_gui_stylesheet_carries_primitives_and_semantics() -> None:
    tokens = load_tokens()
    css = GUI_CSS.read_text(encoding="utf-8")

    # primitives, per mode
    for mode, selector in (("dark", ".dark"), ("light", ".light")):
        declared = parse_vars(css, selector)
        for name, value in tokens["primitives"][mode].items():
            assert declared.get(f"--{name}") == value, f"GUI {selector} --{name} drifted"

    # semantic layer, as HSL triplets that resolve back to the exact brand colour
    for mode, selector in (("dark", ".dark"), ("light", ".light")):
        declared = parse_vars(css, selector)
        for name in (k for k in tokens["shadcn"] if not k.startswith("$")):
            triplet = declared.get(f"--{name}")
            assert triplet, f"GUI {selector} is missing --{name}"
            assert re.fullmatch(r"[\d.]+ [\d.]+% [\d.]+%", triplet), (
                f"GUI --{name} must be an HSL triplet (for bg-primary/10 to work), got {triplet!r}"
            )
            expected = hex_to_rgb(resolve(name, mode, tokens))
            actual = hsl_triplet_to_rgb(triplet)
            assert actual == expected, (
                f"GUI {selector} --{name} renders {actual} but the brand value is {expected}"
            )


def test_surfaces_declare_identical_primitive_values() -> None:
    """The same token name must mean the same colour on both surfaces."""
    site = WEBSITE_CSS.read_text(encoding="utf-8")
    gui = GUI_CSS.read_text(encoding="utf-8")
    for mode, site_sel, gui_sel in (("dark", ":root", ".dark"), ("light", ".light", ".light")):
        site_vars = parse_vars(site, site_sel)
        gui_vars = parse_vars(gui, gui_sel)
        for name, value in site_vars.items():
            if name == "--radius":
                continue
            assert gui_vars.get(name) == value, (
                f"{mode}: {name} is {value} on the website but {gui_vars.get(name)} in the GUI"
            )


# --------------------------------------------------------------------------
# the surfaces consume them
# --------------------------------------------------------------------------

def test_website_imports_the_generated_stylesheet() -> None:
    css = WEBSITE_GLOBALS.read_text(encoding="utf-8")
    assert '@import "./brand-tokens.css"' in css, "the website stopped importing the tokens"
    assert not re.search(r"^\s*--bond:", css, re.M), (
        "globals.css declares brand colours inline again - they belong in brand/tokens.json"
    )


def test_gui_imports_the_generated_stylesheet() -> None:
    css = GUI_INDEX_CSS.read_text(encoding="utf-8")
    assert '@import "./styles/brand-tokens.css"' in css or '@import "./brand-tokens.css"' in css, (
        "the GUI stopped importing the generated tokens"
    )
    assert not re.search(r"^\s*--background:", css, re.M), (
        "index.css declares shadcn variables inline again - the generator owns them"
    )


def test_gui_tailwind_reads_tokens_with_alpha_support() -> None:
    config = GUI_TAILWIND.read_text(encoding="utf-8")
    assert "--background" in config and "--primary" in config
    # Without <alpha-value> Tailwind v3 silently drops the opacity half of
    # `bg-primary/10`, which makes translucent surfaces render opaque.
    assert "<alpha-value>" in config, (
        "token colours need `hsl(var(--x) / <alpha-value>)` or `/10` opacity is ignored"
    )
    for retired in ("cyan:", "emerald:"):
        assert retired not in config, f"the off-brand palette entry {retired!r} came back"


def test_gui_offers_no_decorative_palette() -> None:
    """Components must name a role (primary/success/muted), never a hue."""
    offenders: list[str] = []
    for path in gui_files():
        if path.name in RAW_COLOUR_ALLOWED:
            continue
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for match in PALETTE_UTILITY_RE.finditer(line):
                offenders.append(f"{path.relative_to(REPO)}:{lineno}: {match.group(0)}")
    assert not offenders, (
        "hard-coded palette colours are back in the GUI - use the semantic tokens "
        "(primary/success/destructive/muted/border) instead:\n  " + "\n  ".join(offenders[:25])
    )


def test_gui_keeps_raw_hex_out_of_components() -> None:
    offenders: list[str] = []
    for path in gui_files():
        if path.name in RAW_COLOUR_ALLOWED:
            continue
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if SCRIM_RE.search(line):
                continue
            match = re.search(r"#[0-9a-fA-F]{6}", line)
            if match is None:
                continue
            offenders.append(f"{path.relative_to(REPO)}:{lineno}: {match.group(0)}")
    assert not offenders, (
        "raw hex colours in GUI components - read them from the tokens instead:\n  "
        + "\n  ".join(offenders[:25])
    )


def test_gui_has_no_decoration_below_11px() -> None:
    """The website's floor is 12px; compact chips may go to 11px, never below."""
    smallest = 99
    for path in gui_files():
        for match in re.finditer(r"text-\[(\d+)px\]", path.read_text(encoding="utf-8")):
            smallest = min(smallest, int(match.group(1)))
    assert smallest >= 11, f"the GUI sets type at {smallest}px, below the 11px floor"


# --------------------------------------------------------------------------
# typography is shared too
# --------------------------------------------------------------------------

def test_both_surfaces_set_type_in_the_same_two_families() -> None:
    tokens = load_tokens()
    sans, mono = tokens["fonts"]["sans"][0], tokens["fonts"]["mono"][0]

    site = WEBSITE_LAYOUT.read_text(encoding="utf-8")
    assert sans in site and "Geist_Mono" in site, (
        f"the website no longer loads {sans} + Geist Mono"
    )

    gui_pkg = json.loads(GUI_PACKAGE.read_text(encoding="utf-8"))
    deps = {**gui_pkg.get("dependencies", {}), **gui_pkg.get("devDependencies", {})}
    assert "@fontsource-variable/archivo" in deps, "the GUI no longer bundles Archivo"
    assert "@fontsource-variable/geist-mono" in deps, "the GUI no longer bundles Geist Mono"

    html = GUI_INDEX_HTML.read_text(encoding="utf-8")
    assert "fonts.googleapis.com" not in html, (
        "the desktop GUI must not fetch fonts from a CDN - it has to render offline"
    )
