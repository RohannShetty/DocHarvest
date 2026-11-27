# Claims ledger — DocHarvest

Every factual claim the showcase or README makes must appear here with the command, file
or test that verified it. Recorded 2026-11-13 against the working tree at tag v11.5.1
(commit 9ab8d45). Where the old README or site disagreed with the code, the code wins and
the disagreement is listed under **Discrepancies**.

Reproduce with the repo virtualenv (`.venv/Scripts/python.exe`) and
`DOCHARVEST_HOME=D:/gd-new/.work/dh-home` for any command that writes to the library —
`~/.docharvest` is not writable in this sandbox. The demo library only affects where files
land, never the product behaviour.

## 1. Identity and install

| Claim | Verified by | Result | Date |
|---|---|---|---|
| Version is 11.5.1 | `pyproject.toml:7`, `src/docharvest/__init__.py`, `docs/package.json` | all three say 11.5.1 | 2026-11-13 |
| Installed CLI reports the same version | `.venv/Scripts/docharvest.exe --version` | `DocHarvest 11.5.1 (package: docharvest)` | 2026-11-13 |
| Editable install points at this checkout | `.venv/Scripts/python.exe -c "import docharvest; print(docharvest.__file__)"` | `D:\gd-new\src\docharvest\__init__.py` | 2026-11-13 |
| Published on PyPI as 11.5.1 | PyPI JSON API for `docharvest` | 11.5.1 present, `requires_python >=3.10` | 2026-11-13 |
| GitHub release v11.5.1 ships binaries | `gh release view v11.5.1` | `docharvest-windows-latest.exe` 45,621,657 B, `docharvest-ubuntu-latest` 64,385,768 B, `docharvest-macos-latest` 42,582,992 B, `SHA256SUMS.txt` 277 B; published 2026-11-13T17:39:21Z | 2026-11-13 |
| Release notes scope | `gh release view v11.5.1` | web-platform correctness; no CLI/capture/MCP contract change; GUI bundle rebuilt; dark stays default | 2026-11-13 |
| `uvx docharvest` works | not verified | **UNVERIFIED** — the sandbox denies the uv cache and `uv tools` lock (`EPERM`); no claim may be made | 2026-11-13 |

## 2. Documentation providers

Nine registered classes, eight dedicated plus the generic fallback: `GitBookProvider`
(`src/docharvest/providers/gitbook.py:51`), `MintlifyProvider`
(`src/docharvest/providers/mintlify.py:20`), `DocusaurusProvider` (`docusaurus.py:23`),
`NextraProvider` (`nextra.py:31`), `VitePressProvider` (`vitepress.py:31`),
`MkDocsProvider` (`mkdocs.py:32`), `ReadMeProvider` (`readme.py:31`),
`ReadTheDocsProvider` (`readthedocs.py:23`), `GenericProvider` (`generic.py:20`).
All registered with `@ProviderRegistry.register` and resolved by
`ProviderRegistry.detect()` (`src/docharvest/providers/base.py:233`).

Live detection (`detect_provider()` against real sites, 2026-11-13):

| Site | Result |
|---|---|
| https://docs.openalgo.in (root) | gitbook |
| https://docs.openalgo.in/v/v2.0/api-reference | **generic** (deep path not recognised) |
| https://reactnative.dev/docs/getting-started | docusaurus |
| https://nextra.site/docs | nextra |
| https://mintlify.com/docs | mintlify |
| https://vitepress.dev/guide/what-is-vitepress | vitepress |
| https://squidfunk.github.io/mkdocs-material/ | mkdocs |
| https://fastapi.tiangolo.com | mkdocs |
| https://docs.readme.com/reference | readme |
| https://docs.readthedocs.io/en/stable/ | readthedocs |
| https://example.com | generic (fallback works) |
| https://docs.anthropic.com (root and `/en/docs`) | **generic** — Mintlify is not detected on this site |
| https://swr.vercel.app (root and deep link) | **generic** — the site no longer looks like Nextra |
| https://www.mkdocs.org/ | **generic** — the project's own site is not built with MkDocs |

Conclusion: "eight dedicated readers plus a generic fallback" is true at the code and
class level. It is **not** true that every sample URL on the showcase resolves to its named
reader; see Discrepancies.

## 3. CLI surface

`docharvest --help` and every subcommand `--help` were captured to `.work/cli-help.txt`
(157 lines). Fourteen subcommands exist: `capture` (aliases `dl`, `crawl`), `setup`,
`search`, `list` (`ls`), `history`, `diff`, `split`, `config`, `init`, `bench`, `mcp`,
`skill`, `gui`, `tui`, plus `--version`.

`capture` flags: `--file`, `--scope` (repeatable), `--exclude` (repeatable), `--max-pages`,
`--workers` (default 8), `--latest-only`, `--versions`, `--output {both,library,local}`,
`-o/--output-dir`, `--no-snapshot`, `--preset`, `--render`, `--rag`, `--pdf`.

`mcp` has `--profile {minimal,full}` and defaults to minimal. `init` takes `--client`,
`--url`, `--dry-run`, `--force`; `setup` has a different, smaller client set. `bench` takes
`--dataset`, `--k`, `--json`.

## 4. MCP server

In-process introspection (`src/docharvest/mcp/server.py`) on 2026-11-13:

- **12 tools** registered: `download_docs` (:266), `search_docs` (:339), `list_domains`
  (:387), `find_docs` (:409), `read_doc` (:441), `get_doc` (:551), `diff_versions` (:595),
  `list_versions` (:635), `export_docs` (:660), `get_changelog` (:747), `query_doc_graph`
  (:776), `get_related_concepts` (final tool).
- **minimal profile = 5 tools** (the first five), **full profile = 12**.
- **2 prompts**: `search_docset` (`:873`), `summarize_library` (`:882`).
- **2 resource templates**, not 2 resources: `docs://{domain}/book` (`:841`) and
  `docs://{domain}/manifest` (`:846`). The registry exposes them as templates; the concrete
  resource list is empty until a domain is expanded.

Live call with a real capture (`ToolManager.call_tool('search_docs', {'query': 'plugin',
'domain': 'docusaurus.io'})`): returned the real hit
`https://docusaurus.io/docs/2.x/advanced/plugins#creating-plugins`, title "Creating plugins",
section heading "Creating plugins". `list_domains` returned `docusaurus.io` (10 pages,
497.7 KB, latest 1.0.0, first scraped 2026-11-13T23:20:10).

Environment note: without `DOCHARVEST_HOME`, `SearchIndex.__init__` raises
`sqlite3.OperationalError: unable to open database file` at
`src/docharvest/search/index.py:107` (WAL pragma) because `~/.docharvest` is unwritable here.

## 5. Output contract

Real capture of `https://docusaurus.io/docs` (20 pages, `.work/capture-demo`):

| Artifact | Measured |
|---|---|
| `llms.txt` | 5,327 B |
| `llms-full.txt` | 120,753 B |
| `book.md` (TOC + `# Introduction` + source/capture stamp) | 119,107 B |
| `pages/` tree | per-page markdown, e.g. `pages/docs/2.x/advanced/plugins.md` 5,320 B |
| `<domain>_handbook.pdf` | 139,536 B, 82 pages |
| `docs.md` in the library copy | present (`~/.docharvest/docs/<domain>/docs.md`) |
| RAG JSONL | `docusaurus.io_rag.jsonl` 86,870 B **only** with `--output both` (`--rag`); `--output local` warns `No page data ... no JSONL written` |

Every page's YAML frontmatter has exactly five fields: `source_url`, `title`, `crawl_date`,
`content_hash` (SHA-256), `site_version`.

## 6. GUI

`DOCHARVEST_HOME=... docharvest gui --browser --port 8799` serves HTTP 200 from
127.0.0.1:8799; the shell is `<html lang="dark" class="dark">`, title `DocHarvest
v11.5.1`, with a pre-paint theme script (persisted light theme honoured, dark default).
Eight view modules exist in `frontend/src/views/`: CaptureStudio, Library, Search, Diff,
Export, Diagnostics, Settings, InAppDocs.

**No GUI screenshot was captured.** Playwright is not installed, headless Edge aborts with
`FATAL mojo platform_channel.cc:187 Access is denied`, and the desktop window cannot be
driven from inside this sandbox. The desktop (pywebview) window itself is therefore
unverified in this environment; only the browser mode was confirmed.

## 7. Agent skill and client support

- `docharvest skill list` reports exactly **1 bundled skill**: `docharvest` ->
  `src/docharvest/skills/docharvest/SKILL.md`.
- `src/docharvest/installers.py` registers **28 MCP client specs** (`_CLIENTS`, e.g.
  `claude-desktop`, `claude-code`, `cursor`, `vscode`, `codex`, `opencode`, `goose`).
- The README skill matrix documents **17 skill directories** across 17 named environments.
- `init --client` and `setup --client` accept different sets; `init` covers the 28-spec
  registry, `setup` a short list (claude-code, claude-desktop, cursor, vscode, windsurf,
  auto).

## 8. Performance and token measurement (2026-11-13)

**Capture.** Full local capture of `https://docs.openalgo.in`: **470 pages in 76,427 ms**
(about 6.2 pages/s), provider gitbook, output `.work/bench-openalgo` (4.6 MB `book.md`,
76,281 B `llms.txt`). The old "673 pages in 18.2 s (~37 pages/s)" reference could not be
reproduced on this machine.

**Retrieval fixture.** `python benchmarks/run.py --dataset fixtures --k 5` ->
`hit@5 1.0`, `MRR 1.0`, `answer_containment@5 1.0`, corpus hash
`f6ea24a7b9ea2ec2322515eedd154b21bb18f481be9c7515adb65cc5a9778130`, generated
2026-11-13T17:48:36Z, Python 3.11.16, Windows 10.0.26200. This is an offline fixture, not
a speed test.

**Token reduction — the 83% claim does not reproduce.** Three measurements on the
OpenAlgo capture:

| Method | Sample | Result |
|---|---|---|
| Raw HTML bytes / 4 vs markdown tokens | 10 pages | 99.6% (1,512,804 vs 6,495 tokens) — inflated by inline scripts |
| Visible text (scripts/styles removed) vs markdown | 10 pages | 39.6% (10,747 vs 6,495) — high variance |
| Visible text vs markdown, evenly spaced | 60 pages | **-1.6%** (178,880 vs 181,784) — no reduction |

Conclusion: markdown removes markup and chrome but is approximately the same token size as
the page's readable text. The "~83% less boilerplate" line was removed from the README and
SEO guide; `docs/lib/stats.ts` now publishes `reductionPct: 0` and the measured capture
numbers. No token-reduction multiple should be quoted until a defensible method exists.

## 9. Test suite

`pytest` -> **1001 collected, 1001 passed, 0 failed, 0 skipped, 157.653 s** (JUnit
`.work/junit8.xml`, 2026-11-13T23:28:50+05:30, hostname DESKTOP-KIKFM6Q).

Re-run after the branch edits (2026-11-13): **1001 passed, 0 failed, 175.22 s**
(`.work/pytest-final.log`) — the same 1001 tests still pass with the corrected claims.

Caveat: the DSH sandbox denies the default temp directory, so the run used
`.work/run_pytest4.py` (redirects `tempfile.tempdir` to `.work/tmp` and patches pytest's
numbered-dir helpers). An unmodified `pytest` invocation cannot complete under this
sandbox; on a normal machine it needs no patching. `DOCHARVEST_HOME` must **not** be set
for the suite — a test asserts the default home path.

## 10. Licence, dependencies, network and telemetry

- Licence MIT (`pyproject.toml:10`); Python `>=3.10` (`:30`), classifiers 3.10-3.13.
- Base dependencies (`pyproject.toml`): requests>=2.28.0, beautifulsoup4>=4.11.0,
  markdownify>=0.11.0, lxml>=4.9.0, mcp>=1.2.0, textual>=0.60, pyperclip>=1.8.0,
  pywebview>=6.2.1, fpdf2>=2.8.8. Extras: `render`/`js` -> playwright>=1.40.0; `dev` ->
  pytest and plugins; `mcp` is a no-op kept for compatibility.
- No telemetry: grep over `src/` for telemetry/analytics/posthog/sentry/mixpanel/amplitude
  returns nothing; no update check or PyPI call. Hardcoded URLs are fixtures
  (`fixture.test`, `docs.example.com`, `example.com`, `api.other.dev`), the sitemap
  namespace, and localhost GUI ports.
- "No network except the target site" holds for capture; GUI and MCP stay local.

## 11. Discrepancies (code wins)

1. **README, fixed in this branch**: header table said `673 pages | 18.2 s | ~83% less
   boilerplate`; the note and the throughput/token bullets repeated it. Now 470 pages /
   76.4 s / 5 files per capture, with the token claim explicitly withdrawn. The test that
   pinned the old numbers (`tests/test_readme_contract.py::test_first_screen_leads_with_install_proof_and_local_first_path`)
   was updated to the new canonical metrics and now asserts the old `18.2 s` / `~83%` are
   absent.
2. **README, fixed in this branch**: the client heading read "14 Clients" while the
   installer registry holds **29** client specs (`installers._CLIENTS`) and the skill matrix
   17 harness directories; the heading now says 29, and the tool sentence now says "2
   resource templates and 2 prompts".
3. **`docs/SEO_GUIDE.md` §3, fixed**: the canonical table now carries the measured capture,
   the withdrawal of the 83% figure, and "no single number" for raw-page noise.
4. **`docs/SEO_GUIDE.md` §3, still stale**: "Documented AI clients | 14" — the registry has
   29 specs and the skill matrix 17 directories; pick one definition and state it.
5. **Showcase `Proof` copy**: "Plus 2 resources and 2 prompts" — the server registers two
   *resource templates* (`docs://{domain}/book`, `.../manifest`); the concrete resource
   list is empty until expanded. Wording should say templates.
6. **Showcase `SupportedPlatforms` sample URLs**: three of the eight named samples do not
   detect as their named provider today — GitBook `docs.openalgo.in/v/v2.0/api-reference`
   (generic), Mintlify `docs.anthropic.com/en/docs` (generic), Nextra
   `swr.vercel.app/docs/getting-started` (generic; the site changed). The other five
   (Docusaurus reactnative.dev, VitePress vitepress.dev, MkDocs squidfunk material, ReadMe
   docs.readme.com, ReadTheDocs docs.readthedocs.io) detect correctly.
7. **`docs/data/benchmark.ts`** is current (fixture-v1, hit@5 1.0, generated 2026-10-27)
   but predates this measurement round; regenerate after any fixture change.
8. **`sync-stats.mjs --input`** parses only a pytest *console* summary, not JUnit XML, and
   the Node write to `docs/lib/stats.ts` fails with `EPERM` inside this sandbox. The values
   in `docs/lib/stats.ts` were therefore applied through the audited file-edit path with
   the same numbers the JUnit report proves.

9. **Internal planning docs, still stale**: `docs/MARKETING_PLAN.md`,
   `docs/RESEARCH_MULTI_AGENT.md`, `docs/CONSULTANT_REVIEW.md` and
   `docs/FEATURE_AUDIT_ROADMAP.md` repeat the withdrawn `673 pages`, `18.2 s` and `~83%`
   figures (sometimes `82.8%`). They are not published on the site, but they will mislead
   anyone planning from them; rewrite or archive them in the same branch.

## 12. Still unverified — do not publish

- `uvx docharvest` and the standalone executables on a clean machine.
- Desktop (pywebview) window, its native chrome, and every GUI screenshot or video.
- Any token-reduction percentage; the 83% and 82.8% figures are withdrawn.
- "80-85% of a raw page's bytes" as a precise range (direction is right, number is not
  measured in this repo).
- Behaviour behind logins/CAPTCHAs and JS-rendered sites (`--render` needs Playwright,
  which is not installed here).

**Sandbox limits in this environment (not product limits).** Files under `docs/` can be
edited through the audited file tools but not by `node`/shell writes, and `docs/media/`
cannot be created here. Consequently: `sync-stats.mjs --run` cannot rewrite
`docs/lib/stats.ts` (values were applied by hand from the measurements above), `next
build` and `vitest` cannot run (vitest worker spawn is denied — `EPERM`, errno -4048),
and no fresh screenshot or screen recording could be produced. Python `pytest` and
`tsc --noEmit` both run. These are environment constraints; the site and package are
unaffected on a normal machine.
