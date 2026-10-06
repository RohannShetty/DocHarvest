# DocHarvest v11.3.0

**🧭 Brand System: one brand, generated everywhere**

No feature change. This release exists because the product and its documentation

had quietly become four different brands, and a brand kit drawn by hand would

only have documented the drift.

### ✨ Features & Capabilities

- **`brand/brand-kit.svg`** — the identity board: mark, construction, product
  surface, essence, colour, type, physical application, image direction and
  system detail on one generated 3×3 sheet. It is drawn from `brand/tokens.json`,
  so it cannot disagree with the product it documents.

- **`scripts/build-brand-kit.mjs`** — draws every asset from the tokens and the
  geometry table in `docs/brand/BRAND.md` §3.2: `assets/logo.svg`,
  `assets/logo-icon.svg`, `docs/app/icon.svg`, the `docs/public/assets/` copies,
  and `assets/social-preview.svg` (version read from `pyproject.toml`). Runs with
  `--check` in CI.

- **`src/docharvest/brand_tokens.py`** — generated from the same JSON for the
  surfaces that have no CSS: the CLI/TUI and the PyWebView window chrome.

- **`tests/test_brand_assets.py`** — 41 guards over the drawn assets: the mark is
  the documented geometry, the two marks are byte-identical across surfaces, no
  asset uses a colour outside the palette, no asset grows a gradient or glow,
  and the social card's headline cannot run under its terminal panel.

- **OpenSpec SDD integration** — spec-driven development workflows via
  `@fission-ai/openspec` added to the repository. Includes `openspec/` project
  structure, slash command adapters and skills for Antigravity, Claude Code,
  Cursor, Gemini CLI, GitHub Copilot, Codex, OpenCode, and Oh My Pi. Documented
  in `AGENTS.md`. Run `npx @fission-ai/openspec list` for active changes.

- **The social card was off-brand.** `assets/social-preview.svg` still used
  Inter + JetBrains Mono, a gradient headline, emerald/pink terminal output and
  rounded corners — none of it in the brand. It is now set in Archivo + Geist
  Mono on the bond, with one amber, square corners, and the package version read
  from `pyproject.toml` so it cannot advertise a dead release.

- **The TUI ran a private palette.** `tui/theme.py` hand-copied the colours and
  had drifted from the tokens (`#111113` vs `#101013`, `#71717a` vs `#8A8A93`,
  `#f85149`/`#3fb950` vs the brand's `#EF4444`/`#34D399`) and set type in Inter
  and JetBrains Mono instead of Archivo and Geist Mono. It now reads the
  generated module and names only roles.

- **The window flashed the wrong colour.** The PyWebView chrome was hard-coded to
  `#090d16`, an off-brand navy; the native backdrop is now `token("bond")`.

- **The TUI carried the retired name.** Theme names `gb-dark`/`gb-light` and the
  app class `GitbookDownloaderApp` still said `gitbook`. They are now
  `docharvest-dark`/`docharvest-light` and `DocHarvestApp` (no shim). The
  `gitbook-dl` command alias is unchanged and still resolves.


### 🐛 Bug Fixes & Hardening

- **Two logos, one product.** `assets/logo.svg` — the mark the README ships — was
  still the old hand-drawn cyan/indigo/emerald gradient with a rounded tile and a
  glow, while `docs/app/icon.svg` carried the real zinc-and-amber glyph. The
  README, the avatars and the favicon were visibly different brands. Both marks
  are now drawn from one geometry table.

- **Test count re-synced.** Published test badge updated to 929 passing
  (regenerated via `node docs/scripts/sync-stats.mjs --run`).
> The `gitbook-dl` alias, `~/.gitbook-downloader/` and the historical CHANGELOG
> entries keep the old name on purpose: they are migration facts, not branding.


---
**Full Changelog**: https://github.com/RohannShetty/DocHarvest/compare/v11.2.0...v11.3.0
