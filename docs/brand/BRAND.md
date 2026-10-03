# DocHarvest — Brand Guidelines

Version 3.0 · 2026-10-03
Applies to: README, GitHub social preview, TUI/CLI output styling, website, badges,
**and the desktop GUI** (React + Vite + shadcn/ui).

> **Where the values live.** Every colour and font in this document is defined once
> in `brand/tokens.json` and generated into every surface:
>
> | Command | Effect |
> |---|---|
> | `node scripts/sync-brand-tokens.mjs` | writes `docs/app/brand-tokens.css` (website), `frontend/src/styles/brand-tokens.css` (GUI) and `src/docharvest/brand_tokens.py` (CLI / TUI / window chrome) |
> | `node scripts/build-brand-kit.mjs` | draws `assets/logo.svg`, `assets/logo-icon.svg`, `docs/app/icon.svg`, the `docs/public/assets/` copies, `docs/public/assets/social-preview.svg` and `brand/brand-kit.svg` |
> | `… --check` | exits 1 if any generated file is stale (both run in CI) |
> | `pytest tests/test_brand_tokens.py tests/test_brand_assets.py` | fails if a surface stops using the tokens, hard-codes a palette colour, draws a second logo, or the surfaces disagree |
>
> Change a value in `brand/tokens.json`, run both generators, and the website,
> the desktop GUI, the TUI, the README mark, the favicon and the social card all
> move together. Never hand-edit a generated file, and never write a colour
> literal into a component or an asset.

> **The board.** `brand/brand-kit.svg` is the identity board — mark, construction,
> product surface, essence, colour, type, physical application, image direction
> and system detail on one 3×3 sheet. It is generated, so it cannot disagree
> with the product it documents.

---

## 1. Brand essence

**One sentence:** the shortest path from "docs URL" to "my LLM knows this product."

**Personality:** precise · fast · invisible-smart · honest · open-source-friendly.

**Visual idea:** a document flowing into a terminal prompt. Docs go in one side;
something your LLM can read comes out the other. Everything else — near-black
canvas, hairline borders, one amber accent — exists to keep that idea quiet and clear.

---

## 2. Naming & casing

| Context | Form | Example |
|---|---|---|
| Package, import, library dir | `docharvest` (lowercase, mono) | `pip install docharvest` |
| Command | `docharvest` (mono) | `docharvest capture <url>` |
| Legacy alias | `gitbook-dl` (mono, kept working) | `gitbook-dl capture <url>` |
| Formal prose | **DocHarvest** | "DocHarvest is a free, MIT-licensed documentation compiler…" |

The distribution, the import path, the command and the on-disk library all say
`docharvest`. `gitbook-dl` is an alias that still resolves so older scripts keep
working; it is not a product name and must not appear in new documentation.
Never use "GitBook Downloader™" or "GBD".

---

## 3. Logo

### 3.1 Concept

A **page** (rounded rectangle with two text lines) sits left; a **terminal prompt**
(chevron `❯` + cursor underscore) sits right. The page is zinc — the input. The
prompt is amber — the tool and the result. One mark, one story: *docs become a
prompt-ready corpus.*

### 3.2 Geometry spec (redrawable as SVG, 512×512 grid)

Tile (app-icon version only):

| Element | Value |
|---|---|
| Canvas | 512 × 512 |
| Tile rect | x=16, y=16, w=480, h=480, rx=104, fill `#09090b` |
| Tile border | same rect inset 1.5, stroke `#27272a`, width 3 |

Glyph (shared by both versions):

| Element | Geometry | Style |
|---|---|---|
| Page outline | rect x=100, y=142, w=170, h=228, rx=30 | stroke `#d4d4d8`, width 26, no fill |
| Text line 1 | line (148,214) → (222,214) | stroke `#52525b`, width 20, round caps |
| Text line 2 | line (148,270) → (222,270) | stroke `#52525b`, width 20, round caps |
| Prompt chevron | path M288,206 L344,256 L288,306 | stroke `#f59e0b`, width 28, round caps + joins, no fill |
| Prompt cursor | line (374,306) → (412,306) | stroke `#f59e0b`, width 28, round cap |

Proportions to preserve if redrawing: page height ≈ 45% of canvas; chevron apex
touches the page's optical midline (y=256); gap between page and chevron ≈ one
stroke width; cursor baseline aligns with chevron's lower vertex.

### 3.3 Files

Both marks are drawn by `scripts/build-brand-kit.mjs` from the table above and
the token palette — never by hand.

| File | Use |
|---|---|
| `assets/logo.svg` | Primary mark: glyph on dark tile. README, avatars, OG images, app icons. |
| `assets/logo-icon.svg` | Bare glyph, transparent. Inline in UI, places that already have a container. |
| `docs/app/icon.svg` | The favicon — byte-identical to `assets/logo.svg`. |

### 3.4 Clear space & minimum sizes

- **Clear space:** ≥ 25% of the mark's width on all sides. Nothing enters that box.
- **Minimum sizes:** tile mark 16 px (favicon); bare glyph 20 px; lockup height 24 px.
- Below 32 px, always use the tile version — the dark tile keeps the glyph legible.

### 3.5 Wordmark rule

The wordmark is **typeset, never baked into SVG**: `DocHarvest` in
Archivo SemiBold, sitting right of the icon at ~55% of icon height, zinc ink.
No custom lettering exists; don't create any.

---

## 4. Color

Near-black canvas, zinc ramp for everything structural, **one** amber accent.
Amber appears at most once per visual composition (see §7).

Token names are the real ones from `brand/tokens.json` — the interface calls them
`--bond`, `--rule`, `--ink`, `--match`, and every surface speaks that vocabulary.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bond` | `#09090B` | `#FBFBFA` | Page/app background — the canvas |
| `--bond-2` | `#101013` | `#F4F4F5` | Cards, code blocks, panels sitting on the canvas |
| `--bond-3` | `#18181B` | `#ECECEF` | Raised/hover surfaces, label backgrounds |
| `--rule` | `#27272A` | `#E4E4E7` | **Hairline borders, always 1px**, dividers |
| `--rule-strong` | `#3F3F46` | `#A1A1AA` | Secondary borders, disabled states, diagram strokes |
| `--rule-subtle` | `#1F1F23` | `#EDEDF0` | Internal dividers inside a panel |
| `--ink` | `#F4F4F5` | `#18181B` | Headings and primary text |
| `--ink-2` | `#A1A1AA` | `#52525B` | Secondary body text, captions, metadata |
| `--ink-3` | `#8A8A93` | `#6B6B74` | Tertiary text, disabled labels |
| `--match` | `#F59E0B` | `#B45309` | **THE accent:** prompt glyph, ✓ checks, one badge per row, links, hover |
| `--match-deep` | `#D97706` | `#92400E` | Hover/pressed state of an amber element |
| `--match-subtle` | `rgba(245,158,11,.08)` | `rgba(180,83,9,.06)` | Tinted amber background behind a single badge or row |
| `--alert` | `#EF4444` | `#B91C1C` | Errors and destructive actions **only** |
| `--paper` | `#FAFAFA` | `#FAFAFA` | Hero text on dark, text on an amber fill |

Rules:

1. Amber is a signal, not a decoration. If removing it doesn't lose meaning, remove it.
2. Never apply a gradient to amber. Never glow it. Never outline text with it.
3. No purple, no blue, no multi-hue palettes. The zinc ramp does all the quiet work.
   Icons are zinc — an icon does not get its own colour.
4. On light surfaces invert the ramp exactly as the table above does; keep amber-600
   for contrast. Prefer dark surfaces where there's a choice.

### 4.1 Status colours (application surfaces only)

A tool that runs jobs needs to tell "working", "finished" and "failed" apart, and
a single accent cannot express three states. The desktop app therefore carries
one extra semantic token:

| Token | Dark | Light | Meaning |
|---|---|---|---|
| `--ok` | `#34D399` | `#047857` | A capture finished, a check passed |
| `--match` (above) | `#F59E0B` | `#B45309` | Working, waiting, needs you |
| `--alert` (above) | `#EF4444` | `#B91C1C` | Failed, blocked |

Scope: this is a **status layer, not a palette**. It never appears in marketing
surfaces (README, social cards, the website hero, badges) and never as
decoration. Where a view is only conveying "good/bad", use words and icons —
the colour is a reinforcement, not the message.

---

## 5. Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| Prose, headings | **Archivo** | 400 / 500 / 600 / 700 | Sentence case headings. No ALL CAPS except tiny labels. |
| Code, commands, numerals, badges | **Geist Mono** | 400 / 500 / 600 | Every command, path, and stat is mono. Always. |

Both surfaces load the same two families: the website through `next/font`
(self-hosted), the desktop GUI through `@fontsource-variable/*` (bundled — the
app must render identically with no network).

Fallback stacks (generated into `--font-sans` / `--font-mono`):

- Sans: `Archivo, ui-sans-serif, system-ui, sans-serif`
- Mono: `Geist Mono, ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, Consolas, monospace`

Numerals: enable tabular figures wherever numbers sit next to each other —
`font-variant-numeric: tabular-nums`. Numbers align in columns or they're wrong.
(The GUI sets this on every `font-mono` element.)

Scale (web/README/GUI): hero 48–56 px · h2 32 px · h3 20 px · body 16 px ·
caption 13 px. Line-height 1.5 body, 1.06 display, 1.15 headings.
Max prose measure ~72 characters.

**Minimum sizes.** No label, badge, caption or chip falls below **12 px**, in
either surface. Compact chips inside dense rows may go to 11 px; nothing is
smaller. Long headlines get `line-height` ≥ 1.05, never tighter.

---

## 6. Surfaces

Three surfaces ship from this repo. They are the same product, so they share the
tokens above rather than inventing their own.

| Surface | Stack | Consumes |
|---|---|---|
| Website (`docs/`) | Next.js static export, Tailwind **v4** | `docs/app/brand-tokens.css`, mapped into `@theme inline` |
| Desktop GUI (`frontend/`) | React + Vite, Tailwind **v3**, **shadcn/ui** on Radix | `frontend/src/styles/brand-tokens.css` |
| CLI / TUI (Python) | Textual + Rich | `docharvest.brand_tokens` (generated) |

The Python module is generated from the same JSON, so the TUI cannot hold a
private copy of the palette the way it used to. `tui/theme.py` decides only
*which* primitive plays *which* role (`CANVAS_DARK = token("bond")`,
`ACCENT = token("match")`, `MONO_STACK = font_stack("mono")`); the PyWebView
window backdrop reads `token("bond")` so the native chrome matches the canvas
painted inside it.

### 6.1 Desktop GUI rules

The app reads the tokens through shadcn/ui's semantic variables, which the
generator derives from the brand primitives (`--background` = `--bond`,
`--primary` = `--match`, `--border` = `--rule`, …). Components therefore never
name a colour themselves.

1. **Components use roles, not hues.** `text-primary`, `bg-muted`,
   `border-border`, `text-success`, `text-destructive`. Never `text-cyan-400`,
   `bg-amber-500/20`, `border-slate-200`, or a raw `#hex`. A component that
   needs a new role gets a new token, not a colour.
2. **Square corners.** `--radius: 0px` everywhere, matching the website.
3. **Flat surfaces.** Depth is a 1px hairline (`--rule`) and a slightly lighter
   fill (`--bond-2`). No glassmorphism, no `backdrop-blur`, no drop shadows on
   cards, no coloured glow. The only allowed overlay darkening is the standard
   modal scrim.
4. **One accent per composition.** A row with an amber badge does not also get
   an amber icon and an amber link. Status colours (§4.1) are the only other
   colours in play.
5. **Motion is functional.** 150–200 ms ease-out for entrances, a 1px lift on
   hover, `scale(0.98)` on press. Nothing pulses, spins or shimmers to look busy.
6. **Focus is visible.** Every interactive primitive keeps a `--ring` focus ring;
   never remove it to make something look tidier.

---

## 7. Badges

Style: **`flat-square` only**. Compact, hairline-adjacent, reads like a status row
instead of a carnival banner.

Recipe: `labelColor=18181b` on every badge; message colour from the zinc ramp;
**exactly one amber badge per row** — currently the license badge.

Fixed order: license → python → platform → PyPI.

```
https://img.shields.io/badge/license-MIT-f59e0b?style=flat-square&labelColor=18181b
https://img.shields.io/badge/python-3.10%2B-3f3f46?style=flat-square&labelColor=18181b
https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-3f3f46?style=flat-square&labelColor=18181b
https://img.shields.io/badge/PyPI-DocHarvest-f59e0b?style=flat-square&labelColor=18181b
```

The test-count badge is **generated** by `docs/scripts/sync-stats.mjs` and is the
only badge allowed to carry a number that changes. Never hand-type a metric.

Never: stars/downloads counters until the numbers are real and stable,
`for-the-badge`, `plastic`, `social` styles, or more than one amber badge per row.

---

## 8. Voice

Plain-spoken. Short sentences. Show the command, then the result.

**Words to use:** capture, docs, Markdown, LLM-ready, one command, library, snapshot, detect.
**Words to avoid:** scrape, crawl-jargon, enterprise-speak, hype adjectives
("blazing", "supercharge", "effortless", "revolutionary").

Three hard rules:

1. **Show the command.** Any feature claim within reach of a terminal gets a
   copy-pasteable command next to it.
2. **Capability claims only.** Say what the tool does; never invent a number,
   benchmark, star count, or testimonial. If we haven't measured it, we don't
   publish it. (Past marketing material fabricated these. Never again.)
3. **Layman-readable.** A developer who has never crawled a site should understand
   every sentence on first read.

---

## 9. Do / Don't

**Do**

- Keep compositions mostly empty; let the amber element be the only loud thing.
- Use hairline 1px `--rule` borders for every card, table, panel and terminal block.
- Pair every claim with a runnable command in Geist Mono.
- Keep the mark geometric and flat — it must survive 16 px.
- Use snapshots/screenshots of the real TUI or the real GUI when showing the product.
- Add a token to `brand/tokens.json` and regenerate when a surface needs a new
  colour; the guard tests will keep every surface honest.

**Don't**

- Don't recolor the mark, add shadows, gradients, bevels, or perspectives to it.
- Don't place the bare glyph on light backgrounds — use the tile version.
- Don't rotate, stretch, or animate the mark (a 150 ms fade is the only allowed motion).
- Don't publish metrics, benchmarks, quotes, or star counts we didn't earn.
- Don't use purple/blue defaults or rainbow badge rows.
- Don't give every icon in a list its own colour.
- Don't fake depth with blur, glass or glow — in the app or on the site.
- Don't write "scrape" in user-facing copy — the tool *captures*.

---

## 10. Asset inventory & export

Every file below is **generated** by `node scripts/build-brand-kit.mjs` from
`brand/tokens.json` and the geometry table in §3.2. Edit the generator, not the
file — `--check` runs in CI and `tests/test_brand_assets.py` fails if one of them
is hand-edited, uses a colour outside the palette, or grows a gradient.

| Asset | Notes |
|---|---|
| `assets/logo.svg` | 512×512 tile mark — README, avatars, app icons |
| `assets/logo-icon.svg` | Bare glyph, transparent, tight viewBox — inline UI |
| `docs/app/icon.svg` | Website favicon (the tile mark, byte-identical to `logo.svg`) |
| `docs/public/assets/logo.svg`, `logo-icon.svg` | The website's copies of the two marks |
| `assets/social-preview.svg`, `docs/public/assets/social-preview.svg` | 1280×640 social card, version read from `pyproject.toml` |
| `brand/brand-kit.svg` | 2400×1800 identity board, 3×3 |
| `brand/brand-kit.png` | Raster of the board — drop-in for a deck. **Manual export** (see below) |
| `assets/social-preview.png` | 1280×640 raster of the card — what GitHub actually uploads. **Manual export** |

**PNG export.** The SVGs are the source; the PNGs are exports of them and are not
regenerated by `--check`. Re-export after changing the SVG: open it in a browser
at native size and screenshot 1:1, or
`resvg --width 2400 --height 1800 brand/brand-kit.svg brand/brand-kit.png`. Install
Archivo and Geist Mono locally first for faithful rendering; the fallbacks are
defined but approximate.

> **Owner step, still open:** upload `assets/social-preview.png` in the repo's
> Settings → Social preview. Until that is done, every X/Slack/Discord share
> renders whatever GitHub guesses. The card itself no longer advertises a dead
> version — the generator reads it from `pyproject.toml`.
