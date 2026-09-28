# DocHarvest — Consultant Review
**Product, Marketing & Website Overhaul Report**

| | |
| :--- | :--- |
| **Reviewed** | `github.com/RohannShetty/DocHarvest` (v11.1.0, MIT, master @ `7a3dd04`) |
| **Website** | https://rohannshetty.github.io/DocHarvest/ — *the URL was left as `[SPECIFY]`; taken from the repo's Homepage field + README badge* |
| **Package** | PyPI `gitbook-downloader` 11.1.0 · ~745 downloads/month |
| **Local working copy** | `D:\gd-new` — *assumption: this is the DocHarvest working tree (remote `origin` matches, version 11.1.0)* |
| **Review date** | 2026-09-28 |
| **Method** | Read the live site in a real browser (desktop 1264px, mobile 390px, dark + light), read the repo docs and the bundled showcase source, re-ran the Python test suite locally, inspected the last 8 CI runs, checked PyPI/Pages/release metadata over the network. |

### Constraint flags (raised, then worked around)
1. **Website URL** — missing from the brief; resolved from the repository itself (GitHub `homepageUrl`, README badge, `next.config.ts` base path). No clarification needed.
2. **"Do not suggest features or technologies not mentioned in the request"** conflicts with "propose a complete overhaul." I resolved it this way: **every recommendation below is grounded in material the team already wrote** — `README.md`, `PRODUCT.md`, `docs/REDESIGN_PLAN.md`, `docs/MARKETING_PLAN.md`, `docs/SEO_GUIDE.md`, `docs/HANDOFF.md`, `docs/FEATURE_AUDIT_ROADMAP.md`, `marketing/*`, and the shipped site/CLI itself. Where I go one step past that material, it is marked **[beyond-provided]**. Nothing here is off-topic to product / marketing / website.
3. **"Recommended skills"** is ambiguous — read as *the competencies the team must add or hire for*. The agent-skill (harness) angle is covered separately in Product §4.

---

## Headline: the product is ahead of its own story

The engine is real, fast, and unusually well-documented. The gap is **not capability — it is trust, discoverability and comprehension.**

What a visitor actually sees today vs. what is true:

| Claim on the live site | What I measured | Verdict |
| :--- | :--- | :--- |
| "765 tests passing in the root suite on 2026-09-16" | `pytest --collect-only` → **802 collected**; full local run → **798 passed, 4 failed** | ❌ stale number, and the suite is not green |
| "100% pass rate" (README §Test Suite) | Same 4 failures on last **4 consecutive CI runs on `master`** — CI is red | ❌ claim is false right now |
| README badge "765" vs README body "686" vs HANDOFF "740" | three different numbers for one suite | ❌ self-contradicting |
| "Install: pip install gitbook-downloader" | works — but the PyPI page's own homepage link is a **404** | ⚠️ leaks the top-of-funnel click |
| "See the capture before you install it" | 2 static PNGs (269 KB + 208 KB), no recording, no animation | ⚠️ under-delivers |
| FastMCP "12 tools" | true (`src/gitbook_downloader/mcp/server.py`) — but `PRODUCT.md` still says 10 | ⚠️ docs drift |

**One-line diagnosis:** *a genuinely strong local-first compiler is being sold with numbers that don't survive a click, on a site that hides its best feature, with zero measurement and a red CI badge.*

---

## A. Product Improvement Recommendations

### A1 — Restore trust (P0, do this first, ~1 day)
- **Make the suite green.** All 4 failures are the same class of bug: the "Index Sheet" redesign deleted the fake hero terminal and the `fadeIn` keyframe, but the tests that *enforced* the content contract were left behind.
  - `tests/test_stats_drift.py::test_hero_uses_stats_in_terminal_logs`
  - `tests/test_visual_anchors.py::test_hero_uses_stats_for_status_line`
  - `tests/test_typo_classes.py::test_globals_css_defines_fadein_keyframe`
  - `tests/test_typo_classes.py::test_hero_uses_animate_fadeIn_with_real_keyframe`
  - Fix = retire the three tests that describe a removed component, and either delete the dead `animate-fadeIn` contract or actually define the keyframe. Add a CI rule: **red CI blocks release tagging**.
- **Single source of truth for every public number.** `docs/lib/stats.ts` hardcodes `testsPassing: 765`. Replace the hardcode with a generated file (`scripts/build-stats.mjs` reading pytest's collected count + the release SHA + a date) and let the site fail the build if a number is older than 30 days. This kills claim-drift permanently instead of once.
- **Purge the three stale documents**: `PRODUCT.md` (10 tools → 12; Pages path `/gitbook-downloader` → `/DocHarvest`), `README.md` (duplicate paragraph at lines 58–60; 686 vs 765), `docs/HANDOFF.md` (740 vs 765). Add a rule: *any doc that states a number must name the command that reproduces it and the date it was run.*
- **Fix the PyPI metadata** (highest-leverage 10-minute fix in this report): the published long description links to `https://rohannshetty.github.io/gitbook-downloader/` — **verified 404** — and its project URLs point at the legacy `RohannShetty/gitbook-downloader` slug (301-redirects, but looks abandoned). Ship 11.1.1 with corrected `project.urls` + description.

### A2 — Close the install-funnel leaks (P0, ~1 day)
- **Download counts prove the funnel is broken**: Windows exe = **1** download, macOS = **0**, Ubuntu = **0**, PyPI ≈ **745/month** — against a marketing plan targeting 5,000/month. The site's primary button ("Install") opens a modal whose default tab is a `curl -LO` command, not the "Download for Windows" button that sits *below* it.
- Make the **Detect-OS → one-click Download** path the default, with the raw command as the secondary disclosure.
- **Publish the checksums you already ship.** Every release includes `SHA256SUMS.txt`, and SHA-256 provenance is the product's headline trust feature — yet the install modal never mentions it. Add a one-line "Verify: `sha256sum -c SHA256SUMS.txt`" and a link. It costs nothing and it is the single most on-brand trust signal available.
- **Ship a real "what you get in 30 seconds" asset**: a 20–30 s silent screen recording of `capture → files appear → search hits`, embedded on the site and reusable for every launch post. The marketing directory already assumes a hero video ("[Attach: assets/capture_studio.png]") that doesn't exist.

### A3 — Surface the differentiator that is currently invisible (P0, ~2 days)
- The universal agent-skill matrix (one command → 14–17 harnesses) is the strongest thing DocHarvest has. On the live site it appears as **three collapsed accordions and no client list**. Meanwhile:
  - `components/AgentTools.tsx` — which renders `AgentSkillSwitcher` (17 harness cards), `MultiAgentSimulation` and `TokenBenchmark` — **is not imported anywhere**. It exists, is tested, and never renders.
  - `ComparisonTable` (vs Firecrawl/Jina) and `ProviderTable` are also unrendered, while the competitor question lives only as FAQ prose.
- Action: promote the harness switcher into the Integrations section as the primary content, with a copy-paste snippet per client. Add a **`--dry-run`-style "verify my install" step** (`docharvest ls` + one `search`) so a new user can prove it works in under a minute. **[beyond-provided]** a per-harness install page also fixes the SEO thinness in §C.
- Delete or archive the 12 other unrendered components (`FeatureBento`, `IndexSection`, `InteractivePlayground`, `SheetRail`, `Workflows`, `Masthead`, `FaqSheet`, `Colophon`, `Releases`, `AgentTools` chain) and the unused `framer-motion` dependency. Dead UI code plus a dead motion library is exactly how "we have animations" claims appear in a README while the site has none.

### A4 — Product surface gaps worth shipping next (P1)
Grounded in what the CLI already exposes (`capture/search/ls/history/diff/split/config/mcp/skill/gui/tui`):
- **Presets are a hidden feature.** `--preset NAME` exists; the site never names one. Ship a documented preset list (`react`, `openai`, `kubernetes`…) and make one the hero command. It converts "I have to configure a crawler" into "I type one word".
- **Snapshot workflows are under-sold for the agent-era use case**: `history` / `diff` / `--versions` / `get_changelog` = "know when a vendor quietly changed an API". That deserves its own section, not a table row.
- **`split` + `config` + `tui` are undocumented on the site** and barely in the README. Either document them or hide them; an unknown command surface erodes confidence.
- **Prove the benchmark reproducibly.** "673 pages in 18.2 s / ~83% token reduction" is a reference number; publish a `bench/` script + raw JSON + the date so a skeptic can re-run it. This is the difference between a claim and a receipt, and it is the number HN will attack first.

### A5 — Desktop GUI vs website brand divergence (P1)
The site deliberately banned glassmorphism and now runs a strict zinc + amber "Index Sheet" system. The **shipped desktop GUI bundle still ships glass effects**: `backdrop-blur` and `glow-cyan` are present in `src/gitbook_downloader/gui/web/assets/index-*.css/js` and in `frontend/src/index.css`. Pick one system and propagate it — the CSS is already tokenised, so this is a theme pass, not a rewrite.

### A6 — Repo & release hygiene (P1)
- The working tree is mid-migration and dirty: **33 tracked files deleted** (the previously committed GUI bundle), **46 untracked** (the new build), **8 modified**. Committed output ≠ local build ≠ the 83 MB `dist/docharvest.exe` from 30 Aug.
- Decide the policy — commit the built `gui/web` bundle (as the packaging tests expect) or generate it in CI — then land one clean "chore: rebuild GUI assets" commit. Right now a fresh clone and a fresh release are not the same artifact.
- **Turn Discussions on or add issue templates.** 0 open issues, 0 watchers, discussions disabled. A launch drives questions; today there is nowhere for them to land that a maintainer is notified about.

---

## B. Marketing Plan Highlights

The team has already written 8 launch assets in `marketing/` and a full plan in `docs/MARKETING_PLAN.md`. **The plan is not the problem — the sequencing and the proof are.** Highlights:

1. **Sequence: fix trust → then launch. No exceptions.**
   Current state would be attacked on sight: red CI badge, a stale test count, a 404 on the PyPI homepage, "$0.01–$0.05/page" competitor pricing with no citation. Spend one week on §A1–A2, then launch. A Show HN that dies cannot be relaunched.
2. **Lead with the three claims only this product can make.** Local-first (nothing leaves the machine), verifiable provenance (`content_hash` you can paste into any SHA-256 tool), and one command → 14+ harnesses. Token savings are the *consequence*, not the pitch.
3. **Lead the channel mix with the agent-ecosystem, not the aggregators.**
   - Primary: `modelcontextprotocol/servers` + `awesome-mcp-servers` PRs, `cursor.directory`, Claude-skill registries — these are intent-bound, permanent, and free. The drafts for these already exist in `marketing/MCP_DIRECTORY_LISTING.md` and `marketing/PRODUCT_HUNT_PLAYBOOK.md`.
   - Secondary: Show HN (`marketing/HACKER_NEWS_SHOW_HN.md`), r/LocalLLaMA, r/programming, X thread — all drafted.
   - Keep Product Hunt last: it rewards a broad consumer audience DocHarvest doesn't have; the same effort in the MCP registries compounds.
4. **Build the proof assets the posts ask for.** The X thread references a hero image; the HN post asserts a benchmark. Ship: a 30 s recording, the reproducible benchmark JSON, a real before/after token count on one public page (raw HTML vs `book.md`), and the checksum verify line. One afternoon of work; it is reused in every channel.
5. **Instrument before you launch — the site has zero analytics.** You cannot chase a 1,000-star / 5,000-download target with no measurement. Add privacy-respecting page + click analytics oriented to *one* conversion ("Install opened" → "Download started" → "CLI ran"), and a README/PyPI badge panel. **[beyond-provided]** an install-event signal (opt-in, one-line, no telemetry by default) would be the honest version of this and fits the brand.
6. **Make support a marketing asset.** Docs site → Discussions → a 48-hour answer promise. For a local-first tool, "the maintainer answers" is a differentiator against cloud scrapers.
7. **KPI reality check.** Current: 2 stars, 0 forks/watchers, ~745 PyPI downloads/month, 1 exe download. The plan's 30-day targets (1,000 stars, 5,000 downloads) are ~2 orders of magnitude of step change — keep the ambition, but add 14-day leading indicators (skill installs, MCP registry merges, README→repo click-through) so week one is measurable at all.
8. **Re-use the docs you already wrote as the content flywheel.** `docs/RESEARCH_MULTI_AGENT.md`, `FEATURE_AUDIT_ROADMAP.md`, `SEO_GUIDE.md` are long-form material that just needs an editing pass into dev.to/Hashnode posts.

---

## C. Website Redesign Blueprint

**Stack today (verified):** Next.js 16.3.2 App Router, static export → GitHub Pages (`/DocHarvest`), React 19, Tailwind v4, `next/font` (Archivo + Geist Mono), Vitest + Testing Library, ~1,334 words on one page, 2 images, 1 sitemap URL, no analytics, one route.

### C1 — Information architecture (fix comprehension before adding depth)
Current single page is 10 sections and **10,452 px tall on a 390 px phone**, with the useful config collapsed inside 8 `<details>`. Rewrite to a task-first spine:

1. **Hero** — one promise, one command, one button (Download for this OS). *Below it: a "before → after" strip (noisy HTML vs clean `book.md` + hash) instead of the current jargon table of `book.md:10 …` index rows.*
2. **See it work (30 s)** — the recording, then 3 real artifacts.
3. **Pick your path** — CLI / Desktop GUI / MCP / Agent Skill, each with the one command and a 10-second "you'll know it worked when…".
4. **Works with your agent** — the 17-harness matrix, searchable, with copy-paste config per client. *(This is the section the site is missing.)*
5. **Outputs & provenance** — real filenames + the hash verify line.
6. **Platforms** — detector table, collapsed by default, with the reference URL per row.
7. **Proof** — dated, reproducible numbers with a link to the raw run.
8. **Scope & limits** — the honest "not for login-walled / internet-scale" block already in the README. Enormous credibility value; it is buried today.
9. **FAQ** → **Install**.

### C2 — Skills to bring in (team composition)
- **A design engineer** who can own motion + interaction performance (the site currently has CSS transitions only; `framer-motion` is installed and unused).
- **A technical writer** to convert `README`/`CHANGELOG`/`docs/*` into one voice (three docs currently disagree with each other).
- **A DevRel/community person** to run launches and turn questions into docs (0 issues, 0 discussions today).
- **An SEO/content owner** — one page cannot rank for `gitbook scraper`, `mintlify downloader`, `mcp server docs`; you need per-platform and per-harness pages.
- **Accessibility + content audit** recurring, not one-off: the redesign plan already lists WCAG AA as a commitment, so someone must own the regression check.

### C3 — Technology stack (keep it boring; the product is the interesting part)
- **Keep**: Next.js static export on GitHub Pages — free, fast, no server to leak. Tailwind v4 + design tokens.
- **Add**: an MDX/docs section (`/docs`, `/harnesses/*`, `/platforms/*`) with a shared token set so the marketing page and docs don't drift; `next/og`-style generated OG images per section; WebP/AVIF for screenshots (both current PNGs are >200 KB); privacy-first analytics; a web-vitals report in CI so regressions block merges; Lighthouse/axe budget check in the Pages workflow.
- **Motion**: use the `framer-motion` already installed, deliberately and in ~4 places (or remove it). Prefer CSS for everything it can do.
- **Testing**: Vitest is wired; add the *content-contract* tests to the same CI job as pytest so "765" can never go stale unnoticed again (though generated stats make that moot).

### C4 — Design principles (keep what's working)
The "Index Sheet" direction is genuinely good and unusual for a dev tool: near-black zinc, **one** amber accent, square geometry, ruled divisions, monospace for every number/path/command, real screenshots, dark + working light mode. Verified contrast on body text = ~7.7:1 (passes AA). **Keep it. Fix the readability details rather than redesigning.**

### C5 — Readability (the explicit ask: "easy to read, understand, do more")
- **Kill the 11 px uppercase labels as a default.** There are **140** `.sheet-label/.sheet-num` instances and **73** text nodes under 12 px. Keep 11 px for decorative rail labels only; body-adjacent labels go to 13–14 px.
- **Fix the headline leading.** H1 renders at **75.84 px / 74.3 px line-height (0.98)** — visually striking, genuinely tiring on two lines and worse on mobile. Use 1.05–1.1.
- **Prose 16 → 17–18 px** for explanatory paragraphs (`#A1A1AA` on `#09090B` has the headroom), and cap measure at 60–70 characters.
- **Open the useful things by default.** The MCP snippet, the skill-install command and the file tree should be visible, not behind `+` accordions (keep accordions for the long tables).
- **Add a scroll-spy.** All 7 header links keep the muted `text-ink-3` style at every scroll position — there is no active state, so a reader has no idea where they are in a 10,000 px page. Also fix the ordering mismatch (nav says OUTPUTS → INTEGRATIONS → WORKFLOWS; the page says WORKFLOWS → … → OUTPUTS → INTEGRATIONS).
- **Plain-language pass on the hero.** "LIVE CAPTURE SPECIMEN — 251 rows / 14 OF 14 ROWS · 4 CAPTURES · 23 PAGES" is honest real data but reads as an artifact of the tool, not a benefit. Lead with *"Here is a real capture: 4 doc sites, 23 pages, 251 sections — every row links back to its source."*
- **Tables on mobile**: the detector table enforces `min-width: 640px` inside a scroll container at 390 px. Convert to stacked cards below `sm`, or keep only 3 columns on mobile.
- **Footer is a dead end**: no docs, changelog, PyPI, license, contact, or star CTA. Add them plus one newsletter/RSS hook.

### C6 — Motion & smoothness
Currently: CSS transitions + a `prefers-reduced-motion` override that already exists (`globals.css:191`, correctly honoured). Nothing else — so "smooth" is achievable with restraint:
- **One hero moment**: a 3-step capture sequence (URL → pages stream in → files appear) at ~2.4 s, `transform`/`opacity` only, one-shot, skippable.
- **Micro-interactions at 120–180 ms, `ease-out`** — copy-success confirmation (already there — keep it), install-button press state, accordion open/close with height+opacity.
- **Scroll reveals**: staggered 40 ms entries driven by one `IntersectionObserver`, never per-scroll-event work; cap to first paint of each section.
- **Use the View Transitions API for the theme toggle** — cheap, dramatic, and degrades gracefully.
- **Guardrails**: no parallax, no autoplaying carousels, no layout-shifting animations, everything inside `@media (prefers-reduced-motion: no-preference)`, and a CI budget on LCP/CLS (today: DOM ready ≈ 559 ms, load ≈ 880 ms on a warm cache — a good baseline to protect).

### C7 — Homogenise the two surfaces
Website (amber/zinc Index Sheet) and Desktop GUI (glass/glow cyan) currently look like two products. One token file, two consumers.

---

## D. Anti-AI-Slop Guidelines

The repo already has good instincts (`REDESIGN_PLAN.md` bans gradients, glassmorphism, bento grids, fake dashboards, invented metrics). What follows is the enforcement layer, because **two of those bans were violated anyway** — in shipped code and in shipped claims.

**Rule 1 — No number without a source line.** Every metric on the site carries its command and date (`§: 802 collected, 798 passed, 2026-09-28`). *Violated today: "765 tests passing", "100% pass rate".* If a number can't be regenerated, delete it.

**Rule 2 — Static claims must be generated, not typed.** Hardcoded `stats.ts` values are how 765 survived a 802-test suite. Generate, date-stamp, and expire.

**Rule 3 — Show real artifacts or show nothing.** Real screenshots, real capture rows, real filenames, real hashes. No mock terminals (one already shipped and was removed), no placeholder dashboards, no "10× faster" arrows.

**Rule 4 — One accent, one geometry, one type system.** If a new section needs a gradient to look good, the section is wrong. Ban: glassmorphism, purple/indigo SaaS gradients, glow shadows, rounded-blob cards, icon-in-every-card repetition, floating 3D blobs. *(Enforce it in the desktop GUI too — glass and `glow-cyan` are still shipping there.)*

**Rule 5 — Banned vocabulary** (search-and-destroy in copy and PRs): *revolutionize, unlock, seamless, effortless, supercharge, game-changing, blazing-fast, magical, "in today's fast-paced world", "imagine a world where"*. Current copy is mostly clean — the exceptions are `meta description` ("Stop burning context tokens on cookie banners") and FAQ competitor pricing, both of which read like generic growth copy rather than the author's voice.

**Rule 6 — No unsourced competitor claims.** "Firecrawl charges $0.01–$0.05/page" is a time-sensitive factual claim about a third party, with no source or date. Either cite it with a date or replace it with the structural difference (per-page billing vs local).

**Rule 7 — No fake social proof.** No invented logos, testimonials, "trusted by", or download counters. You have 2 stars; the honest answer is *"made by one developer, MIT, no account, no telemetry"*, which is a better story than a borrowed logo wall.

**Rule 8 — Volumetric copy is slop too.** The README is 588 lines with a duplicate paragraph; `marketing/` holds 8 assets for a product with 0 issues. Ship fewer, denser, sourced pages: one page per claim.

**Rule 9 — Say the limits out loud.** The "What DocHarvest Is *Not* For" block is the most anti-slop paragraph in the whole repo — move it up the page.

**Rule 10 — Human review gate for generated copy.** Add a checklist item to `CONTRIBUTING.md`: *every public sentence must be true, dated if numeric, and readable aloud without cringing.*

---

## E. Summary of Action Items

| # | Action | Why it matters | Effort | Priority |
| :-- | :--- | :--- | :--- | :--- |
| 1 | Fix the 4 failing tests (retire the 3 stale contract tests, resolve the `fadeIn` keyframe) and unblock CI | A red CI badge is the first thing a Show HN reader checks; the site claims 100% pass | 2–4 h | **P0** |
| 2 | Correct PyPI `project.urls` + long description (homepage link currently **404**s) and ship 11.1.1 | The `pip install` page is the top of the funnel | 1 h | **P0** |
| 3 | Generate `stats.ts` from real runs; date-stamp every public number | Ends claim-drift permanently | 3–4 h | **P0** |
| 4 | Reconcile `PRODUCT.md`, `README.md` (dup paragraph, 686/765), `HANDOFF.md` (740/765) | Three docs disagree; the repo is the source of truth | 2 h | **P0** |
| 5 | Render the agent-skill matrix (17 harness cards) on the live site with per-client config | The best feature is currently invisible | 1–2 d | **P0** |
| 6 | Make "Download for this OS" the default install path; add the SHA-256 verify line | Exe downloads: 1. Provenance is the brand promise | 3–4 h | **P0** |
| 7 | Record a 20–30 s capture demo; publish a reproducible benchmark JSON with date | Every launch post assumes assets that don't exist | 1 d | **P1** |
| 8 | Add privacy-first analytics tied to one conversion (install opened → download started) | Marketing targets are currently unmeasurable | 3 h | **P1** |
| 9 | Readability pass: 11 px labels → 13–14 px, H1 leading 0.98 → ~1.07, prose 17–18 px, open the install/config accordions | Directly addresses "easy to read, understand, do more" | 1 d | **P1** |
| 10 | Scroll-spy + nav-order fix + footer links (docs, changelog, PyPI, license, contact) | A 10,000 px page with no "you are here" and a dead-end footer | 4 h | **P1** |
| 11 | Add `/docs`, `/harnesses/*`, `/platforms/*` routes + per-section OG images; expand the 1-URL sitemap | One page cannot rank; docs drift is the same bug as claim drift | 3–5 d | **P1** |
| 12 | Ship the hero motion moment + micro-interactions (or remove `framer-motion`) | "Smooth" needs 4 deliberate moments, not a library | 1–2 d | **P1** |
| 13 | Unify the design system between the website and the Desktop GUI (remove glass/`glow-cyan`) | Two surfaces currently look like two products | 2 d | **P2** |
| 14 | Repo hygiene: land one clean GUI-asset rebuild commit; decide commit-vs-CI for build output | Committed ≠ local ≠ released artifact | 2 h | **P2** |
| 15 | Enable Discussions / add issue templates; publish a 48 h response promise | A launch needs a place for questions | 1 h | **P2** |
| 16 | Delete the 12 unrendered components and the unused motion dependency | Dead code is how false README claims are born | 2 h | **P2** |
| 17 | Execute the launch sequence **after** 1–6: MCP registries → HN → Reddit → X → dev.to | A dead launch can't be relaunched | 2–3 wk | **P2** |

**Sequencing:** `P0 (1 week) → P1 (2 weeks) → launch → P2 cleanup`.
**Definition of done for the P0 block:** CI green, every public number generated and dated, PyPI links live, the agent-skill matrix visible on the site, and one-click install with checksum verification.

---

## Appendix — Evidence collected 2026-09-28

| Check | Result |
| :--- | :--- |
| `pytest --collect-only -q` | **802 tests collected** |
| `pytest -q` (local, `D:\gd-new\.venv`) | **798 passed, 4 failed** in 148 s |
| CI runs on `master` (last 8) | 4 consecutive **failures** (same 4 tests); Pages deploys succeed |
| GitHub repo | 2 stars, 0 forks, 0 watchers, 0 issues, discussions off, MIT, 18 topics, homepage set |
| PyPI `gitbook-downloader` | 11.1.0, requires-python ≥3.10; project URLs → legacy `gitbook-downloader` slug; description links to a **404** Pages path |
| PyPI downloads | ~745/month (bursty: 162 on 05 Sep) |
| Release v11.1.0 assets | win `.exe` 45.8 MB (**1 download**), macOS 41.4 MB (**0**), Ubuntu 61.5 MB (**0**), `SHA256SUMS.txt` |
| Live page (1264 px) | 1 H1, 10 H2, 1,334 words, 2 images, 140 small-caps labels, 73 nodes <12 px, no analytics, no scroll-spy |
| Live page (390 px) | total height **10,452 px**, no body overflow; detector table `min-width:640px` scrolls horizontally |
| Typography | body 16/24 Archivo; H1 75.84/74.3; body text `#A1A1AA` on `#09090B` ≈ **7.7:1** (AA pass) |
| Theme | dark default; light mode works (`#FBFBFA` / `#18181B`); `prefers-reduced-motion` honoured at `globals.css:191` |
| Showcase components | 13 of 33 not rendered, incl. `AgentTools` → `AgentSkillSwitcher` (17 harnesses), `TokenBenchmark`, `MultiAgentSimulation`, `ComparisonTable`, `ProviderTable` |
| Dependencies | `framer-motion` installed, **used in 0 components** |
| Working tree | 8 modified, 33 deleted, 46 untracked |
| Desktop GUI bundle | still ships `backdrop-blur` + `glow-cyan` (brand divergence from the site) |
| CLI surface | `capture|dl|crawl`, `search`, `ls`, `history`, `diff`, `split`, `config`, `mcp`, `skill`, `gui`, `tui`; flags `--scope --exclude --max-pages --workers --latest-only --versions --output --no-snapshot --preset --render --rag --pdf` |

*Screenshots of the live site (desktop full-page, mobile full-page, integrations section) are attached alongside this report.*

---

## Update log — 2026-09-28 (P0 items executed)

This section records what was actually changed in the working copy, so the report above stays a
record of the audit rather than a list of intentions.

### Fixed and verified

| Item from §E | What changed | Evidence |
| :--- | :--- | :--- |
| P0-1 CI green | Restored `@keyframes fadeIn` + `.animate-fadeIn` in `docs/app/globals.css` (the install modal's entrance animation had been dead since the keyframe was deleted); rewrote the three stale hero-contract tests against the current architecture; added `tests/test_animation_contract.py` so any custom `animate-*` class without a definition now fails | `804 passed, 0 failed` locally; the same 4 tests were failing before |
| P0-3 Generated numbers | New `docs/scripts/sync-stats.mjs` (`--run` / `--input`), `docs/lib/stats.ts` restructured with `testsCollected/testsPassing/testsFailing/suiteSeconds/statsUpdated`, and the Pages workflow now runs the suite and regenerates the numbers before every deploy | `node docs/scripts/sync-stats.mjs` output; new guard tests in `tests/test_stats_drift.py` |
| P0-3 Docs reconciled | README (duplicate paragraph removed, badge now a live CI badge + dated generated number, 686/765 claims replaced), `PRODUCT.md` (10 → 12 MCP tools, Pages path), `docs/HANDOFF.md` (740/765 → the generated contract), `CONTRIBUTING.md` (claims policy made mechanical) | grep for 765/686/740/`gitbook-downloader` Pages paths |
| P0-2 PyPI links | `pyproject.toml` `[project.urls]` now Homepage = showcase, plus Documentation/Source/Repository/Issues/Changelog on the DocHarvest repo; version bumped 11.1.0 → **11.1.1** across all 14 version-bearing files + rebuilt GUI bundle; `publish.yml` documents the trusted-publisher repo rename | `tests/test_version_drift.py` passes; `DocHarvest v11.1.1` present in the shipped `gui/web/index.html` |
| P0 (name/links everywhere) | Fixed the 404 Pages path and the retired repo slug in `PROFILE_README.md`, `PRODUCT.md`, `docs/HANDOFF.md`, `marketing/MCP_DIRECTORY_LISTING.md`; corrected the broken `#quick-start` README anchor in the site footer | Verified GitHub's real anchor is `#-quick-start` via the API's rendered README |
| Registry | Added `server.json` (`io.github.RohannShetty/docharvest`), the `mcp-name:` ownership token in `README.md` that the registry requires, `scripts/check-registry-manifest.py`, `tests/test_registry_manifest.py`, and `marketing/REGISTRY_SUBMISSION.md` | Manifest validates against the live `2025-12-11` registry schema |
| Readability (partial) | Hero headline leading 0.98 → 1.06; `.sheet-label` 11px/0.12em → 12px/0.10em (slightly narrower overall, larger glyphs) | `docs/app/globals.css` |

**Important correction to the brief:** the belief that DocHarvest had been "submitted to some MCP
server website" does not hold up. Nothing is listed in the official MCP registry, mcp.so, Smithery,
PulseMCP, mcpservers.org or `modelcontextprotocol/servers`, and no PRs exist from the account. So
there was no external listing to rename — only the prepared copy naming the retired slug. The
publish path is documented and ready in `marketing/REGISTRY_SUBMISSION.md`; the `mcp-publisher`
step needs the owner's GitHub device login, so it was prepared rather than executed.

### Deliberately not done (needs a decision, not a fix)

- **Deleting the 13 unrendered showcase components** (`AgentTools` → 17-harness switcher,
  `TokenBenchmark`, `MultiAgentSimulation`, `ComparisonTable`, `ProviderTable`, `Masthead`, …) and
  the unused `framer-motion` dependency. `AgentTools.tsx` contains a real feature; rendering it is a
  design task (§A3) while deleting it is destructive. Flagged for the owner rather than guessed at.
- **Analytics, `/docs` + `/harnesses/*` routes, per-section OG images, scroll-spy and the hero
  motion moment** — feature work from §C, not defect repair.
- **P1: reproducible benchmark script** (§A4) — publishing a benchmark runner is a product change.
- **No commit, tag, push or PyPI publish was performed.** The working tree already contained 46
  untracked and 33 deleted files from an earlier local build before this session, so landing a
  commit needs the owner's call on what belongs in it. Publishing 11.1.1 to PyPI is the gate for
  the registry listing and should happen after that commit lands on `master`.

---

## Update log — 2026-09-28 (rename phase: `gitbook-downloader` → `docharvest`)

Owner decision, taken explicitly: rename **both** the PyPI distribution and the import package to
`docharvest`, accepting breaking changes, with no compatibility shim. This section records what
that cost, because a rename this wide fails by leaving one stale instruction behind, not by
crashing.

### What changed

| Surface | Before | After |
| :--- | :--- | :--- |
| PyPI distribution | `gitbook-downloader` | **`docharvest`** (name verified free; old project frozen, its final release points here) |
| Import package | `gitbook_downloader` | **`docharvest`** (`src/` moved, 91 files detected as renames by git) |
| Library directory | `~/.gitbook-downloader/` | **`~/.docharvest/`** — migrated automatically, contents intact |
| Environment override | `GITBOOK_DOWNLOADER_HOME` | **`DOCHARVEST_HOME`** (old one warns rather than silently redirecting) |
| Project config file | `./gitbook-downloader.toml` | **`./docharvest.toml`** |
| Console scripts | `docharvest`, `gitbook-downloader`, `gitbook-dl` | `docharvest`, `gitbook-dl` |
| Scan | 122 files, 684 occurrences rewritten | — |

### Behaviour worth reviewing, not just a find-and-replace

- **`src/docharvest/paths.py` (new)** is now the single source of the library location, shared by
  the storage manager, the search index and the config loader — they previously each hard-coded the
  path. It also owns the one-time migration.
- **The migration merges, it does not assume.** If the new directory is an empty shell (the search
  index creates one on first touch) the library is moved in; if both directories hold captures,
  neither is touched and the tool says so; existing files are never overwritten. 13 tests in
  `tests/test_library_migration.py` pin those cases. On this machine the real 15 MB library
  (2 domains, search index, locks) moved correctly.
- **Two generators were fixed while wiring this up**, both found by the guards rather than by
  inspection: `sync-stats.mjs` could not match a badge URL containing `)` (so it silently skipped
  the README badge), and it rewrote the badge image but not the alt text (which is what screen
  readers and broken-image states show). It now rewrites both, fails loudly if the badge pattern
  stops matching, and re-checks the published numbers against their own guards before exiting.
- **`tests/test_naming_drift.py` (new)** scans *every git-tracked file* for the retired name and
  fails on any hit outside a documented exemption list, with a second test asserting each exemption
  still earns itself. It immediately caught `.omp/mcp.json` (a harness config that would have
  launched `uvx gitbook-downloader mcp`), `AGENTS.md` and `PROJECT.md`. Untracked scratch trees
  (a code-graph cache, a stale second `venv/`, capture artifacts) are excluded by design.

### Verified

- `806 passed, 3 skipped, 0 failed` (Python), `63 passed` (showcase), showcase build green.
- `uv build` produces `dist/docharvest-11.1.1-py3-none-any.whl` with the GUI assets, TUI
  stylesheets, bundled skill and exactly two console scripts.
- Published numbers now equal reality: 809 collected / 806 passing / 0 failing / 3 skipped,
  dated 2026-09-28, in both `docs/lib/stats.ts` and the README badge.
- Showcase rebuilt: install commands, PyPI link and version all read `docharvest` / 11.1.1, with
  zero occurrences of the old name in the rendered page.

### Still open (needs the owner's hands, not code)

1. Commit and push (the rename is staged for `src/`; the rest of the tree is untouched).
2. Publish `docharvest` 11.1.1 (Trusted Publishing / OIDC), then `mcp-publisher login github` +
   `mcp-publisher publish`. The registry reads the ownership token from the **new** package's PyPI
   description, so the package must ship first.
3. Publish the final "moved" release on `gitbook-downloader` — copy is ready in
   `marketing/REGISTRY_SUBMISSION.md` §6.
4. The repo's `venv/` (untracked, contains `gitbook_downloader-11.1.0.dist-info`) and
   `graphify-out/` are stale local scratch from the old name; safe to delete.

