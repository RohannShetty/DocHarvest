# Modern Web Guidance audit — DocHarvest (2026-11-13)

Skill: `modern-web-guidance` (GoogleChrome/modern-web-guidance), installed from npm `modern-web-guidance@latest`,
skill version `2026_11_09-5bcc021b`. Installed to `.agents/skills/modern-web-guidance` (dir the harness reads) and
`.claude/skills/modern-web-guidance`, 224 files / 16 MB, byte-identical, both gitignored. Registered in
`skills-lock.json` (entry between `migrate-radix-to-base` and `minimalist-ui`, `computedHash`
`776fdf1841b2c78d5e31a6f0dd9cf645cbc0d0188378f3e8cd245e34052bc875`, vercel `skills` v2 hash algorithm).

## Method

- `legacy-scan <path> --json` over the four surfaces that actually ship UI: `frontend/` (Vite + React app),
  `docs/` (Next.js showcase, static export), the Python-served GUI bundle (`src/docharvest/gui/web`, a build
  artifact of `frontend/`), and the repo root HTML entry `frontend/index.html`.
- Every raw finding was re-read in context and checked against the guide's `keepWhen`/`dropWhen` before acting;
  findings that were intentional or not applicable were dropped and are listed below.
- Feature-specific guidance for the three applied topics was retrieved with `retrieve` and read in full
  (`scratch/guidance/guides/{customize-scrollbar-color-and-thickness,dark-mode-toggle,ime-safe-enter-submit}.md`).

**Scope**: the whole checkout was scanned (`legacy-scan .`), then `frontend/` and `docs/` separately because
the scanner skips paths it classifies as docs and tests. Results are in "Repo-wide audit" below.

**Coverage caveat**: the legacy scan covers 35 rules / 33 guides, which the tool itself reports as
"~20% of the guidance corpus". This audit is therefore a scan of that rule set plus three targeted retrieves —
not a claim that the whole corpus has been applied.

## Raw findings (9) and disposition (6 applied areas / 9 sites)

| # | Scan finding | Site | Disposition |
|---|---|---|---|
| 1 | `textarea-onkeydown-no-iscomposing` | `frontend/src/views/CaptureStudio.tsx:659` (batch URLs textarea), `:648` (start-capture dialog input) | **Applied** — routed through `onEnterSubmit` |
| 2 | `textarea-onkeydown-no-iscomposing` | `frontend/src/views/LibraryView.tsx:224` (inline rename dialog) | **Applied** |
| 3 | `textarea-onkeydown-no-iscomposing` | `frontend/src/views/DiffView.tsx:295` (graph query input) | **Applied** |
| 4 | `scrolling-no-scrollbar-color` | `frontend/src/index.css` (global) | **Applied** — standard `scrollbar-color`/`scrollbar-width` + 3:1 thumb |
| 5 | `color-scheme-missing` | `frontend/src/index.css` (global, dark-only root) | **Applied** — `color-scheme` + `<meta>` plumbing |
| 6 | `scrolling-no-scrollbar-color` | `docs/app/globals.css` (global) | **Applied** — `color-mix` thumb above 3:1 in both themes |
| 7 | `color-scheme-missing` | `docs/app/globals.css` | **Applied** — `color-scheme` per theme, meta pinned by script |
| 8 | `textarea-onkeydown-no-iscomposing` | `docs/components/IndexSheet.tsx:156` | **Dropped** — `Enter` navigates rows in a command sheet, it is not an input/textarea submit; no composition risk |
| 9 | `scrolling-no-scrollbar-color` / `color-scheme-missing` | `src/docharvest/gui/web/index.html` + `assets/index-1WaPhU9D.css` | **Applied at source** — this is the Vite build output of `frontend/`; the fix lives in `frontend/index.html` / `frontend/src` and reappears on the next `npm run build` |

Additional site found by reading, not flagged by the scan: `frontend/src/views/SearchView.tsx:99`
(search input `Enter`) — the scan only inspects textareas; the guide covers single-line inputs too, so it was
fixed as well (5 IME-guarded call sites total).

## Applied changes

### 1. IME-safe Enter-to-submit (`ime-safe-enter-submit`)

New `frontend/src/lib/keyboard.ts`: `onEnterSubmit(event, action)` ignores non-Enter keys, calls
`event.preventDefault()` first, then returns while `isComposing` or `keyCode === 229` (Safari/WebKit bug
165004 ordering), then runs `action()`.

Wired at `frontend/src/views/LibraryView.tsx:214`, `CaptureStudio.tsx:642` and `:870`, `DiffView.tsx:286`,
`SearchView.tsx:99`; imports at `LibraryView.tsx:31`, `CaptureStudio.tsx:40`, `DiffView.tsx:25`,
`SearchView.tsx:8`. Behaviour change: `preventDefault()` now suppresses implicit form submission on the
single-line fields, and an IME confirmation keystroke no longer triggers a capture/search/rename.

### 2. Scrollbars + native UI scheme, frontend (`customize-scrollbar-color-and-thickness`, `dark-mode-toggle`)

`frontend/src/index.css`: `:root` gets `scrollbar-width: thin` and
`scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track)` (:92-`--scrollbar-thumb: hsl(var(--muted-foreground) / 0.7)`);
the old `::-webkit-scrollbar` styling is kept only inside `@supports not (scrollbar-color: auto)` and reads the
same variables. `:root { color-scheme: dark }` (:104) with `:root.light { color-scheme: light }` (:107).

Thumb contrast against the page background (track is transparent, so this is the WCAG 1.4.11 case the guide
names): **dark 4.25:1, light 3.56:1** — previously 1.49:1 / 1.48:1, i.e. effectively invisible.

### 3. Scrollbars + native UI scheme, docs site

`docs/app/globals.css`: `--scrollbar-thumb: color-mix(in srgb, var(--ink) 42%, var(--bond))` (:137), track
`var(--bond)`, same standard-first + `@supports` fallback structure (:132-); `.light` overrides the mix to 48%
(:146). Old thumb `var(--rule)` on `var(--bond)` was ~1.3:1 in both themes; the mixes land at ~3.7:1 (dark) and
~3.1:1 (light). `color-scheme: dark` (:141) / `light` (:147).

### 4. `<meta name="color-scheme">` plumbing (flash-free, JS-independent end state)

- `frontend/index.html:7` meta, and the existing pre-paint inline script runs immediately after it and pins the
  meta to `light` when the stored theme is light (:18).
- `frontend/src/App.tsx:91-102` keeps the meta in sync when the toggle changes the theme.
- `docs/app/layout.tsx`: viewport `colorScheme` narrowed to `"dark"` (:119) because the page default is dark,
  and the head script (:240-253) pins the meta and the `.light` class from `localStorage`.
- `docs/components/ThemeProvider.tsx:56-61` re-pins the meta on every theme change (including cross-tab
  `storage` events).
- `frontend/src/App.tsx:104-113` also listens for the window `storage` event, so a theme written by another
  window is followed; the event fires only in windows that did not perform the write, so it cannot fight the
  local toggle.

**Deliberate deviation**: the guide's base declaration is `color-scheme: light dark` with `localStorage` deciding
the override. Here the product's base theme *is* dark — no-JS renders the dark page, so a `light dark` base would
mis-pair native UI with the page. The base stays pinned dark, the stored preference narrows it, and the result is
still correct without JS (dark page + dark native UI).

## Verification

| Check | Result |
|---|---|
| `tsc --noEmit` (frontend) | exit 0 |
| `tsc --noEmit` (docs) | exit 0 |
| `npm run build` (frontend → `src/docharvest/gui/web`) | exit 0; emitted meta at line 7, script pin, and the scrollbar/color-scheme rules |
| `npm run build` (docs, Next 16.4.6 static export) | exit 0, 6 pages; `docs/out/index.html` has the meta, exported CSS chunk has the scrollbar rules |
| `npm test` (docs, vitest) | 10 files / 56 tests passed |
| `uv run pytest -q` | 1001 passed, 1 warning, 217 s |
| `eslint` (frontend, full) | 0 errors / 96 pre-existing warnings; changed-files run 0 errors, none on new lines |
| `eslint` (docs, touched files) | clean |
| `legacy-scan .` (whole repo, after bundle rebuild) | `totalFindings: 0` |

The generated GUI bundle was reverted after the verification build (`git checkout -- src/docharvest/gui/web`);
CI and the release workflow rebuild it, and the repo only commits bundles in dedicated release commits.

## Repo-wide audit (complete repository)

`legacy-scan .` over the whole checkout (29 s, 35 rules / 33 guides): **1 finding**, in the tracked-but-generated
`src/docharvest/gui/web/index.html` (line 12, `document.documentElement.classList.remove("dark")`) — the Vite
build output of `frontend/`, stale relative to the source fixes. The scanner skips paths it classifies as docs
and tests, so `docs/` and `tests/` were scanned separately; `docs/` came back clean.

| Area | Findings |
|---|---|
| repo root (`.`) | 1 — stale generated GUI bundle |
| `frontend/` | 0 |
| `docs/` (Next.js showcase) | 0 |
| `src/docharvest/gui/web/` after rebuild | 0 |
| full repo after rebuild | 0 |

The GUI bundle was rebuilt from the fixed source and committed, so the artifact `gitbook-dl gui` serves from a git
checkout carries the same fixes instead of lagging a release behind.

## Residual gaps (not fixed here)

- `docs/app/layout.tsx` still ships `theme-color` media queries keyed to `prefers-color-scheme`; with a stored
  theme those can disagree with the page. The `dark-mode-toggle` guide prescribes nothing for `theme-color`, so
  changing it would be an unguided redesign — left as-is and noted.
- `frontend/` and `src/docharvest/gui/web/` must be rebuilt together on future changes; CI and the release
  workflow both run the frontend build, but nothing static fails when the committed bundle drifts.

## Delivery

Pushed to `origin/master` (RohannShetty/DocHarvest) as three commits on top of `0e4db4d`:

| Commit | Contents |
|---|---|
| `65b94f4` | source fixes (10 files + new `frontend/src/lib/keyboard.ts`) |
| `ddf1e31` | rebuilt GUI bundle (rename-only churn: the `__vite__mapDeps` table) |
| `5cac680` | LF endings for the three files the editor had rewritten as CRLF |

The EOL follow-up exists because those three files were committed as CRLF blobs, which turned a
few-line change into a whole-file diff; the net change since `0e4db4d` for them is 26 lines.

## Files touched

`frontend/src/lib/keyboard.ts` (new), `frontend/src/views/{LibraryView,CaptureStudio,DiffView,SearchView}.tsx`,
`frontend/src/index.css`, `frontend/index.html`, `frontend/src/App.tsx`, `docs/app/globals.css`,
`docs/app/layout.tsx`, `docs/components/ThemeProvider.tsx`, `skills-lock.json` (local, gitignored),
and the regenerated bundle under `src/docharvest/gui/web/`.
