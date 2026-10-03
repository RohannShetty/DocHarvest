"""The TUI's binding of the shared brand tokens.

Every value here is read from :mod:`docharvest.brand_tokens`, which is
generated from ``brand/tokens.json`` — the same source the website and the
desktop GUI read. This module only decides *which* primitive plays *which*
role for Textual; it never names a colour of its own.

======================  ==========  ==========================================
role                     token       what it carries
======================  ==========  ==========================================
canvas                   bond        app background (dark: #09090B, the default)
surface                  bond-3      raised panels, tables (dark)
panel                    bond-2      wells between canvas and surface
hairline                 rule        every 1px border
hairline-strong          rule-strong section cuts, table heads
accent                   match       THE one accent: primary action, active tab
                                   marker, focus ring, progress fill, matches
prose ink                ink         body text / headings
muted ink                ink-2       secondary labels
faint ink                ink-3       hints, timestamps, line numbers
danger (semantic only)   alert       errors and destructive confirms
success (semantic only)  ok          diff "added", a finished capture
mono font                mono        every number, path, command, count
prose font               sans        labels, descriptions, buttons
======================  ==========  ==========================================

Discipline rules enforced here:

* Amber appears ONLY where this module puts it — never as body text, never as
  decoration. Green/red appear ONLY as diff/error semantics.
* Numerals, paths, URLs, table data, keycaps: the mono stack. Labels,
  descriptions and buttons: the sans stack.
* Flat surfaces + hairlines only. No gradients, no glow, no emoji icons.
"""

from __future__ import annotations

from textual.theme import Theme

from ..brand_tokens import font_stack, token

# ── Roles, resolved per mode from the generated brand tokens ────────────────

CANVAS_DARK = token("bond")          # the canvas
CANVAS_LIGHT = token("bond", "light")
SURFACE_DARK = token("bond-3")       # raised panels / tables
SURFACE_LIGHT = token("paper", "light")
PANEL_DARK = token("bond-2")         # wells between canvas and surface
PANEL_LIGHT = token("bond-2", "light")

HAIRLINE_DARK = token("rule")
HAIRLINE_LIGHT = token("rule", "light")
HAIRLINE_STRONG_DARK = token("rule-strong")
HAIRLINE_STRONG_LIGHT = token("rule-strong", "light")

INK_HI_DARK = token("ink")
INK_HI_LIGHT = token("ink", "light")
INK_MUTED_DARK = token("ink-2")
INK_MUTED_LIGHT = token("ink-2", "light")
INK_FAINT_DARK = token("ink-3")
INK_FAINT_LIGHT = token("ink-3", "light")

ACCENT = token("match")             # the one accent
ACCENT_STRONG = token("match", "light")  # same hue, AA-safe on the light canvas
ON_ACCENT = token("bond")
ON_ACCENT_LIGHT = token("paper", "light")

DANGER_DARK = token("alert")
DANGER_LIGHT = token("alert", "light")
SUCCESS_DARK = token("ok")
SUCCESS_LIGHT = token("ok", "light")


MONO_STACK = font_stack("mono")
PROSE_STACK = font_stack("sans")

#: Theme names. They carry the product, not the retired `gitbook-dl` alias:
#: a user who reads a theme name in a config file should see DocHarvest.
DARK_THEME_NAME = "docharvest-dark"
LIGHT_THEME_NAME = "docharvest-light"


# ── Textual themes ───────────────────────────────────────────────────────

DARK_THEME = Theme(
    name=DARK_THEME_NAME,
    dark=True,
    primary=ACCENT,
    secondary=INK_MUTED_DARK,
    accent=ACCENT,
    foreground=INK_HI_DARK,
    background=CANVAS_DARK,
    surface=SURFACE_DARK,
    panel=PANEL_DARK,
    boost=HAIRLINE_DARK,
    success=SUCCESS_DARK,
    warning=ACCENT,
    error=DANGER_DARK,
    variables={
        "hairline": HAIRLINE_DARK,
        "hairline-strong": HAIRLINE_STRONG_DARK,
        "ink-muted": INK_MUTED_DARK,
        "ink-faint": INK_FAINT_DARK,
        "raised": SURFACE_DARK,
        "on-accent": ON_ACCENT,
        "mono-font": MONO_STACK,
        "prose-font": PROSE_STACK,
    },
)

LIGHT_THEME = Theme(
    name=LIGHT_THEME_NAME,
    dark=False,
    primary=ACCENT_STRONG,
    secondary=INK_MUTED_LIGHT,
    accent=ACCENT_STRONG,
    foreground=INK_HI_LIGHT,
    background=CANVAS_LIGHT,
    surface=SURFACE_LIGHT,
    panel=PANEL_LIGHT,
    boost=HAIRLINE_LIGHT,
    success=SUCCESS_LIGHT,
    warning=ACCENT_STRONG,
    error=DANGER_LIGHT,
    variables={
        "hairline": HAIRLINE_LIGHT,
        "hairline-strong": HAIRLINE_STRONG_LIGHT,
        "ink-muted": INK_MUTED_LIGHT,
        "ink-faint": INK_FAINT_LIGHT,
        "raised": SURFACE_LIGHT,
        "on-accent": ON_ACCENT_LIGHT,
        "mono-font": MONO_STACK,
        "prose-font": PROSE_STACK,
    },
)

THEMES = (DARK_THEME, LIGHT_THEME)
DEFAULT_THEME = DARK_THEME_NAME


#: Parse-time fallbacks. App stylesheets are parsed BEFORE any theme is
#: applied, so every custom variable referenced in styles.tcss must exist
#: even under the stock textual theme. Values here mirror the dark theme; an
#: active theme overrides them per mode.
BASE_TOKENS = {
    "hairline": HAIRLINE_DARK,
    "hairline-strong": HAIRLINE_STRONG_DARK,
    "ink-muted": INK_MUTED_DARK,
    "ink-faint": INK_FAINT_DARK,
    "raised": SURFACE_DARK,
    "on-accent": ON_ACCENT,
    "mono-font": MONO_STACK,
    "prose-font": PROSE_STACK,
}


def register_and_apply(app) -> None:
    """Register both themes on *app* and apply the default (dark first)."""
    for theme in THEMES:
        app.register_theme(theme)
    if app.theme not in {t.name for t in THEMES}:
        app.theme = DEFAULT_THEME


# ── Formatting helpers shared by screens (mono/tabular discipline) ───────


def format_size(size_bytes: int) -> str:
    """Human size, stable column width: ``812 B`` / ``1.2 MB``."""
    value = float(size_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            if unit == "B":
                return f"{int(value)} B"
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} GB"


def format_count(n: int) -> str:
    """Right-alignable numeral grouping: ``12,406``."""
    return f"{n:,}"
