# DocHarvest — Growth Plan & Audit

**Document version:** 2.0 · **Date:** 2026-09-28 · **Product version audited:** 11.1.1
**Owner:** RohannShetty · **Status:** proposed, not yet started
**Purpose:** one self-contained, evidence-backed plan that a reviewer can audit line by line — every recommendation carries its evidence, its reasoning (what and why), its cost, and a verification step that proves whether it was done.

---

## 0. How to use this document

| Section | What it is | How to audit it |
|---|---|---|
| §0 | The control sheet — every action as an ID | Tick status; run the verification in the last column |
| §1 | Method and evidence base | Check that each claim's source type matches the discipline in §1.3 |
| §2 | Baseline: where we actually stand today | Re-run the commands in §2.5; they must reproduce the numbers |
| §3 | Harness-coverage research (full detail) | Diff our README matrix against §3.2–§3.5; re-verify any row marked stale |
| §4 | Feature research (full matrices + reasoning) | Re-read the cited READMEs; confirm each "they have / we lack" cell |
| §5 | Promotion research (full evidence) | Re-check the HN/directory numbers; confirm the patterns still hold |
| §6 | Prioritised roadmap | Phase gates in §7 |
| §7 | Audit protocol | The actual audit procedure — run this to accept or reject the plan |
| §8 | Risks and counter-arguments | The steelman: what would make this plan wrong |
| §9 | Open questions / unverified | Must stay empty before any claim is promoted to fact |
| §10 | Source index | Every URL actually read |

### 0.1 Corrections to version 1.0 of this document

Two findings in v1.0 were **wrong** and are withdrawn here. They are recorded rather than deleted, because an audit document that silently edits itself cannot be audited.

| v1.0 claim | Verdict | Evidence |
|---|---|---|
| "The README claims 17 harnesses but lists 15 — unsupported count" | **WITHDRAWN — false.** The README consistently claims **"14+"** (`README.md:15`, `:38`, `:260`, `:262`) and the Universal Harness Matrix lists **16 rows** (`README.md:266-283`). The claim is supported. The real finding is narrower: **3 of the 16 rows are stale** (§3.1) | `grep -n -i "harness" README.md`; `read_file README.md:256-300` |
| "`social_preview: unset` — the asset exists but was never uploaded" | **WITHDRAWN — phantom.** GitHub's REST API exposes **no** social-preview field at all; the `unset` value came from a `//` default on a non-existent key, which is indistinguishable from `false`. This cannot be verified programmatically | `gh api repos/RohannShetty/DocHarvest --jq 'keys' \| grep -i -E "social\|preview"` → no match |

**Lesson recorded for future audits:** an absent API key is not a `false` value. Any finding phrased as "X is disabled/not set" must be verified by printing the actual object keys first, or moved to §9 as unverified.

---

## 0.2 The audit sheet

Status: `TODO` = not started · `WIP` · `DONE` · `WONTFIX` · `MANUAL` = needs a human check we cannot automate.

### Front door (no new features — hours of work)

| ID | Action | Why it matters (reasoning) | Effort | Priority | Status | Verification |
|---|---|---|---|---|---|---|
| **A1** | Rebuild the README badge row to the `BRAND.md` §7 recipe: flat-square, `labelColor=18181b`, zinc ramp, **one** amber, max ~4 badges | The current row is a rainbow — `06b6d4` cyan, `10b981` emerald, `3b82f6` blue, `8b5cf6` purple, `ec4899` pink, `f59e0b` amber — on `labelColor=090d16`. It contradicts our own brand guide, and the GUI was already re-themed to it; the README is now the only off-brand surface left | 1 h | **P0** | TODO | `grep -oE "[0-9a-f]{6}" README.md \| sort -u` → must show only zinc ramp + one amber + `18181b` |
| **A2** | Verify in repo Settings → Social preview whether `assets/social-preview.svg` is uploaded; upload it if not | If unset, every X/Slack/Discord share renders a blank grey card. **Cannot be checked via API** — human step | 5 min | **P0** | MANUAL | Open the repo page and inspect the OG image, or check Settings → Social preview |
| **A3** | Add discovery topics: `ai-agents`, `claude-code`, `cursor`, `codex`, `skills`, `llm`, `ai`, `agent-skills` | Current 18 topics (`cli`, `mcp-server`, `rag`, `llms-txt`, …) omit the words people actually browse in 2026. Every comparator carries them — Graphify's list is `ai-agents, claude-code, codex, cursor, skills, llm, mcp, rag` | 10 min | **P0** | TODO | `gh api repos/RohannShetty/DocHarvest --jq '.topics'` must contain all eight |
| **A4** | Enable GitHub Discussions | `has_discussions: false` today — there is no community surface at all. Discussions is the Anthropic pattern and costs nothing to moderate at our size (Discord would be negative social proof: "0 online") | 5 min | **P0** | TODO | `gh api repos/RohannShetty/DocHarvest --jq '.has_discussions'` → `true` |
| **A5** | Put the proof artifact above the fold: `673 pages / 18.2 s / ~83% token reduction`, as a visual, not a bullet | We have headroom-class numbers and bury them. Headroom (★74k) leads with exactly this as a hero artifact ("55,957 tokens → 24,340, the FATAL line survives byte for byte"). Ref's whole pitch is token economics | 2 h | **P0** | TODO | README first 40 lines contain the numbers as a visual element, not a `-` bullet |
| **A6** | Record a 60–90 s inline demo (`## Quick Demo`) as a GitHub user-attachment | Serena is the **only** README in the whole comparator set with an inline demo — an open niche. Uploaded as a user-attachment it plays inline in the README | 2–4 h | **P1** | TODO | README contains a `user-attachments` video URL that plays in the rendered page |
| **A7** | Fix the 3 stale rows in the Universal Harness Matrix (`README.md:266-283`) and confirm the Copilot Workspace row | Windsurf → renamed **Devin Desktop** (config under `devin/`); Continue.dev → **acquired by Cursor, winding down**; **GitHub Copilot Workspace status unverified** (§9). The matrix is *skill target dirs*, which is a different axis from MCP client config — the README should not let one imply the other | 1 h | **P1** | TODO | Matrix rows match §3.1–§3.2; no deprecated harness presented as current |
| **A8** | Keep "Oh My Pi (OMP)" — it is real and larger than we treat it | **OMP is ★33.2k**, a terminal coding agent on the `pi` framework, and it reads **eight** existing config formats (`.claude`, `.cursor`, `.windsurf`, `.gemini`, `.codex`, `.cline`, `.github/copilot`, `.vscode`) — which means our existing writers serve OMP for free. This is a positive finding, not a defect | — | — | **DONE (no action)** | betterstack.com/community/guides/ai/oh-my-pi-ai-coding-agent; i-scoop.eu/omp-the-terminal-coding-agent-that-turns-your-cli-into-an-ide |

### Harness coverage (the biggest functional gap)

| ID | Action | Why | Effort | Priority | Status | Verification |
|---|---|---|---|---|---|---|
| **H1** | Implement **four config-family writers** (A: `mcpServers` JSON · B: TOML · C: YAML · D: top-level `mcp` JSONC) instead of per-harness writers | Four serializers + a path table raise coverage from ~15 to **~45 harnesses**. Family A alone covers ~20 clients because they all copied the Claude/Cursor shape | 2–4 d | **P1** | TODO | `docharvest mcp install --client X` writes a config that the client actually loads, for ≥3 clients per family |
| **H2** | Handle the **A′ variant** correctly: `type: local\|remote` + `command: [array]` | OpenCode, Kilo Code and Posit use an array-form command. Emitting the Claude `command`+`args` shape into these files silently produces a broken config — the highest-risk bug in this whole plan | 0.5 d | **P1** | TODO | Config written for OpenCode/Kilo parses and the server starts |
| **H3** | Add the top-10 missing harnesses first (§3.4): Copilot CLI, Kilo Code, Zoo Code, Qwen Code, Goose, Crush, Warp, Trae, Amazon Q CLI, Junie | Ranked by adoption: Kilo 1,542,148 marketplace installs, Qwen Code ★28.2k, Crush ★28.3k, Goose is the most-adopted OSS general agent | 3–5 d | **P1** | TODO | Each harness listed with a verified config path in §3.4 |
| **H4** | Ship **deeplink generators** for UI-only hosts (Raycast, Msty, Jan, Trae, Chatbox, Kiro, Cherry Studio, Cursor Marketplace) | These have no writable config file; the only install path is a deeplink. Playwright MCP ships 7 hosts this way, Exa 6, GitHub MCP leads with the VS Code button | 1–2 d | **P2** | TODO | A generated link installs the server in the target client |

### Feature upgrades (ranked in §4.5)

| ID | Action | Why | Effort | Priority | Status | Verification |
|---|---|---|---|---|---|---|
| **F1** | `refresh` — incremental re-crawl: ETag / If-Modified-Since, per-page hash compare, resume, `--changed-only` | A product whose headline is *version diffing* currently re-downloads all 673 pages to find one edit. This makes our best feature usable | M | **P1** | TODO | Re-running on an unchanged site makes ~0 network fetches and completes in seconds |
| **F2** | Embeddings + hybrid BM25/vector search (local Ollama/sentence-transformers; optional OpenAI/Gemini) | BM25 alone loses natural-language agent queries ("how do I rotate credentials" misses a page titled "Key management"). This is the feature that decides a head-to-head comparison | M | **P1** | TODO | A natural-language query with no exact keyword overlap returns the right page |
| **F3** | Multi-format ingest (PDF, DOCX, PPTX, XLSX, EPUB, local dir, zip) behind a pluggable extractor interface | We ingest the HTML ~60% of a real docset; release PDFs and spec spreadsheets are invisible | L | **P2** | TODO | A PDF and a DOCX land in `pages/` with frontmatter + hash |
| **F4** | HTTP/Streamable MCP transport + Docker image + optional token auth (stdio stays default) | Stdio-only blocks team-shared instances and remote/cloud harnesses. Every strong comparator ships a network transport | M | **P2** | TODO | A remote client can connect over HTTP and list tools |
| **F5** | Retrieval-quality benchmark harness (`docharvest bench`, IR metrics + agent-task eval) | We have 820 tests proving the code runs and **zero** evidence the retrieval is good. Grounded Docs ships a benchmark; publishing numbers is how a ★2 project wins an argument against a ★62k one | S–M | **P1** | TODO | `docharvest bench` prints reproducible metrics for ≥3 public doc sets |
| **F6** | OpenAPI/GraphQL → typed endpoint index + `search_endpoints` MCP tool | Mintlify/ReadMe docs ship `openapi.json` and **nobody** turns it into agent-usable endpoint tools. Genuinely unclaimed and exactly what coding agents need | M–L | **P2** | TODO | `search_endpoints("create invoice")` returns a typed endpoint with method + path |
| **F7** | `Accept: text/markdown` negotiation + llms.txt-first discovery + `.md` URL preference | Free correctness win; Cloudflare's Markdown-for-Agents returns markdown directly. Grounded Docs already does this, so its absence is a visible quality delta | S | **P1** | TODO | Capturing a site that supports it yields markdown with no HTML parsing |
| **F8** | Prompt-injection screening / untrusted-content quarantine on ingest | Scrapling already markets stripping injection payloads before the agent sees them. We pipe arbitrary web pages into agent context unfiltered while advertising SHA-256 — which authenticates bytes, not intent | S–M | **P1** | TODO | A fixture page carrying an injection payload is flagged, not passed through |
| **F9** | Scheduled capture + change notifications (webhook/email/Slack) + a GitHub Action | Turns a one-shot CLI into always-fresh docs without a human remembering. Firecrawl's `monitor_*` and Repomix's Action show the demand | M | **P3** | TODO | A schedule detects a changed page and fires a notification |
| **F10** | Repo-backed ingestion (GitHub/GitLab tree; branch/tag = version) | Docs-as-code is the canonical source; GitMCP/gitingest/Repomix own that entry point and we have no path in. Also gives version snapshots for free | M | **P3** | TODO | `docharvest capture gh:owner/repo@v1.2` produces a versioned library |
| **F11** | Resilient fetch layer: robots.txt compliance, adaptive throttling/backoff, proxy rotation, optional stealth | Large portals and Cloudflare-fronted docs will rate-limit plain HTTP+Playwright. Being silently blocked is worse than being slow | M | **P3** | TODO | A 429/timeout in a fixture triggers backoff instead of a hard failure |
| **F12** | User-supplied auth profiles for private/internal docs (header/cookie file, GitHub token) — *not* access-control bypass | Unlocks internal Docusaurus/GitBook corpora, the highest-value local-first use case, while keeping our existing "we do not bypass access controls" stance | S | **P2** | TODO | An authenticated internal site captures using a supplied profile |
| **F13** | MCP server sandbox/scope confinement (Repomix `--sandbox` pattern) | An MCP server that can read any path the host user can is too broad for untrusted clients | S–M | **P3** | TODO | Paths outside the library root are refused |
| **F14** | Secret scrubbing on ingest (Repomix Secretlint pattern) | Agents reading internal docs should not be able to exfiltrate credentials that were in them | S–M | **P3** | TODO | A fixture containing an API key is redacted |
| **F15** | Emit `llms-full.txt` alongside `llms.txt`; per-response token budgets on `search_docs` | Ref's entire thesis is minimum tokens per answer; we bound `read_doc` but not `search_docs` | S | **P2** | **DONE (local)** | `llms-full.txt` emitted by `publish()`; `search_docs(max_tokens=...)` contract tests pass |

### Promotion (ranked in §5.4)

| ID | Action | Why | Effort | Priority | Status | Verification |
|---|---|---|---|---|---|---|
| **P1** | Rewrite README screens 1–3: hero → **one-line install → one-click Cursor/VS Code deeplink → one-sentence pitch**, then a ❌/✅ before-after block, then a 4-row client matrix | This is the single highest-leverage change available. Context7 puts the Cursor deeplink on line 3, above its own title; the ❌/✅ block is the cheapest persuasion artifact in the category | 3–6 h | **P0** | TODO | A stranger can install from screen 1 without scrolling or hand-editing JSON |
| **P2** | `docharvest init --client cursor\|vscode\|claude-code\|…` — detect client, write config, verify the server starts, print the library path; `--dry-run` | A one-command installer is the actual growth engine: `npx ctx7 setup`, `firecrawl-cli init --all`, `serena init`. Nobody makes JSON hand-editing step 1. `--dry-run` is mandatory for a zero-telemetry tool — the installer must be inspectable | 1–3 d | **P1** | TODO | On a clean machine, one command produces a working MCP server in a real client |
| **P3** | Publish to every free directory + the official MCP Registry, then embed the badges | Compounding channel that outlives any launch: MCP Registry (`publish`, OIDC), Glama (89,739 servers), Smithery, mcp.so free tier, PR to `punkpeye/awesome-mcp-servers` (we are **not** listed) | 1 d | **P1** | TODO | Listing URLs captured; `awesome-mcp-servers` PR merged or open |
| **P4** | Eat our own dogfood: publish `/llms.txt`, `/llms-full.txt`, `/index.md`, per-page `.md` on the showcase site, plus a real captured `book.md` + manifest as a demo artifact | 7 of 10 comparator hosts return 200 for these; Repomix puts "(Are you an LLM? View /llms.txt)" in its nav. For a tool whose *output* is `llms.txt`, not shipping one is a credibility hole | 1–2 d | **P1** | TODO | `curl -o /dev/null -s -w "%{http_code}" https://rohannshetty.github.io/DocHarvest/llms.txt` → `200` |
| **P5** | Publish honest, reproducible benchmarks from a committed script | Firecrawl sells "96% of the web / P95 3.4 s"; Context7 gives every library a Benchmark score. We have the numbers but no table a skeptic can rerun | 1–2 d | **P1** | **DONE (local)** | `python benchmarks/run.py --dataset fixtures` reproduces the local fixture table in `docs/PROMOTION_PACKAGE.md`; external publication remains manual |
| **P6** | "Why local-first" comparison table (vs Context7, Firecrawl, Ref) on: data leaves your machine / offline / API key / versioned snapshots / diffs / cost | The privacy argument is one only we can make, and it pairs with Ref's own thesis ("more context makes models dumber") — we are the deterministic version of that promise | 3–4 h | **P2** | TODO | Table published; every cell sourced |
| **P7** | Tool-schema diet: document the 12 tools' token weight; ship a minimal default profile with opt-in extras | Tool-schema bloat is now the headline complaint; Playwright MCP's README concedes CLI+Skills beats MCP on tokens. Exa gates optional tools; GitHub MCP has Toolsets | 2–3 d | **P2** | **DONE (local)** | `docharvest mcp` exposes minimal; `docharvest mcp --profile full` restores all 12; `docs/TOOL_PROFILES.md` documents both |
| **P8** | Lead the README with **CLI + skill**, present MCP as the second path | Context7, Firecrawl and Playwright MCP all repositioned this way in 2026. We already have all four surfaces (CLI, GUI, skill, MCP) — we just pitch the wrong one first | 2 h | **P1** | TODO | Screen 1 mentions the skill/CLI path before MCP |
| **P9** | One coordinated launch: one Show HN *with the demo video*, one r/LocalLLaMA + one r/mcp, one X thread, one blog post carrying the benchmark table | Correct sequencing, not a spray. Ask for stars exactly once, in one line | 1 d | **P3** | TODO | Posts exist with the benchmark table + video attached |
| **P10** | Reconcile the 13 existing launch drafts with this research before publishing any of them | The repo already contains HN/Reddit/X/PH/Dev.to drafts written *before* this evidence existed; they assume HN is the growth engine, which §5.1 shows it is not for this category | 2–3 h | **P1** | TODO | Each draft marked keep / reorder / deprioritise with a reason (§2.4) |
| **P11** | GitHub Sponsors + a tasteful sponsor section **below** the fold | The one funding model that fits a zero-telemetry tool. Repomix (solo, ★28.5k) is funded this way | 2 h | **P4** | TODO | Sponsors section present, below the fold |
| **P12** | README i18n (中文 + 日本語, native-reviewed) — two languages maximum for now | Context7 ships 4, DeepWiki-Open 8, Repomix 16 locales. The MCP audience is heavily represented there, but 16 locales is unsustainable solo | 1 d | **P4** | TODO | Two translated READMEs exist and are linked |

---

## 1. Method and evidence base

### 1.1 What was gathered, and how

| Stream | Method | Artifact |
|---|---|---|
| Star audit | `gh api user/starred --paginate` with the `star+json` header, diffed against the previous snapshot | `D:\hermes\.hermes\cache\scratch\stars_fresh.tsv` (402 rows) |
| Neighbour mining | Filtered the star list by domain keywords; pulled metadata + READMEs via `gh api` | §2.1, §5.2 |
| Harness landscape | Each harness verified against its **official vendor docs**; unverifiable rows flagged inline | §3 |
| Promotion teardown | 15 comparator READMEs downloaded and script-analysed (badge counts, demo media, deeplink hosts, `/llms.txt` probes); HN via Algolia API; directory pages fetched live | §5 |
| Feature comparison | Competitor READMEs/docs read directly, not from memory | §4 |

Raw transcripts for the three research streams: `D:\hermes\.hermes\cache\delegation\live\deleg_014cf109\task-0.log` (harness), `task-1.log` (promotion), `task-2.log` (features). Consolidated summary: `D:\hermes\.hermes\cache\delegation\subagent-summary-1-20260928_173951_493289.txt`.

### 1.2 Dates and version pins

All star counts, install counts and documentation reads are **as of 2026-09-28**. Counts in this space move weekly — re-run the commands in §7.3 before quoting any number publicly.

### 1.3 Evidence discipline (the rule that makes this auditable)

1. **A competitor's marketing number is a claim, not a fact.** "96% of the web", "150,000+ companies", "Trusted by teams at" are quoted as *their claims*, with the URL.
2. **An absent API key is not a `false` value** (§0.1 correction).
3. **Unverifiable rows are marked, not asserted** — §3.4 flags CodeBuddy Code and Witsy; §9 lists everything else.
4. **Feature gaps are read from the competitor's own docs**, not inferred from their absence in a README.

---

## 2. Baseline: where DocHarvest actually stands

### 2.1 The numbers (2026-09-28)

| Project | Stars | Age | What it is | Model |
|---|---|---|---|---|
| firecrawl/firecrawl | **185,738** | ~2.5 y | Web → Markdown/structured API | VC-backed, AGPL, hosted |
| microsoft/markitdown | **187,399** | ~1.9 y | Files/Office → Markdown | Microsoft, MIT |
| modelcontextprotocol/servers | 90,642 | ~1.9 y | Official reference MCP servers | Anthropic, Apache-2.0 |
| unclecode/crawl4ai | 84,398 | ~2.4 y | OSS LLM-friendly crawler | Apache-2.0 |
| docling-project/docling | 68,115 | ~2.2 y | Document → structured Markdown | IBM/LF AI, MIT |
| upstash/context7 | **62,492** | ~18 mo | Up-to-date docs into any agent | Company, MIT (server only) |
| microsoft/playwright-mcp | 37,645 | ~18 mo | Browser automation MCP | Microsoft |
| oraios/serena | 29,866 | ~18 mo | Semantic code tools for agents | Solo/small team |
| yamadashy/repomix | **28,517** | ~26 mo | Repo → one AI-friendly file | **Solo, sponsorship-funded** |
| asyncfuncai/deepwiki-open | 18,092 | ~5 mo | OSS DeepWiki clone | MIT |
| exa-labs/exa-mcp-server | 5,056 | ~22 mo | Web search MCP | Funded, hosted |
| ref-tools/ref-tools-mcp | 1,176 | ~17 mo | Agentic doc search | Funded, hosted |
| **RohannShetty/DocHarvest** | **2** | ~4 mo | Docs site → local LLM-ready corpus | MIT, solo, local-first |

**The realistic ceiling for a solo maintainer in this niche is Repomix: ~28.5k stars over ~26 months**, reached with README + docs site + directory listings + sponsors — not paid acquisition, and not a Hacker News hit.

### 2.2 Positioning: delivery service vs compilation tool

| | Context7 | DocHarvest |
|---|---|---|
| Job | Documentation **delivery** (retrieval service) | Documentation **compilation** (capture tool) |
| Who crawls | They do — into a **private** index ("API backend, parsing engine, and crawling engine are private and not part of this repository") | You do, into `~/.docharvest/` |
| Agent surface | 2 tools, remote endpoint, API key | 12 tools + resources + prompts, stdio, no key |
| Coverage | Their catalogue (public OSS libraries) | Any public docs site, including ones nobody will ever register |
| Data | Their servers; auth + rate limits | Your disk; offline; zero telemetry |
| Freshness | Automatic (per-library "updated 10 hours ago") | On demand — but hash-pinned and reproducible |
| Lock-in | Service dependency; MIT covers the MCP shim only | MIT end-to-end |

**Positioning line to adopt:** *"Context7 covers the libraries everyone uses; DocHarvest covers the documentation that isn't in anyone's catalogue — and gives you an offline copy you own."*

### 2.3 Front-door baseline (what a stranger sees today)

| Signal | Current value | Verdict |
|---|---|---|
| Description | "Turn any documentation portal (GitBook, Mintlify, Docusaurus, ReadTheDocs) into LLM-ready Markdown, vector RAG JSONL, llms.txt, and styled offline PDFs. Zero-config CLI, desktop GUI & FastMCP server." | Good — concrete, keyword-rich |
| Homepage | `https://rohannshetty.github.io/DocHarvest/` | Set ✓ |
| License | MIT ✓ | — |
| Topics (18) | `cli, desktop-app, documentation-scraper, docusaurus, fpdf2, gitbook, llms-txt, local-ai, mcp-server, mintlify, nextra, offline-docs, pdf-generator, rag, readme-io, sqlite-fts5, vector-database, vitepress` | **Gap** — missing `ai-agents, claude-code, cursor, codex, skills, llm, ai` (A3) |
| Discussions | `false` | **Gap** (A4) |
| Wiki | `true` | Fine |
| Open issues | 0 | Fine |
| Default branch | `master` | Fine |
| README | 594 lines, 54 headings, centred hero + logo + 2 static PNGs | Hero is good; **badge row off-brand** (A1), **proof buried** (A5), **no video** (A6) |
| Badge row | 10 badges: `06b6d4`, `10b981`, `3b82f6`, `8b5cf6`, `ec4899`, `27272a`, `f59e0b`, `06b6d4`, `labelColor=090d16` | **Off-brand** — violates `BRAND.md` §7 |
| Social preview | Cannot be verified via API | **MANUAL** (A2) |

### 2.4 Existing assets in the repo, and their verdict against this evidence

The repo already holds a substantial marketing and planning corpus written **before** this research. The audit question is not "is it good?" but "does it still match the evidence?".

| Existing asset | Size | Verdict against §5 evidence |
|---|---|---|
| `docs/MARKETING_PLAN.md` | 20 KB | **Reconcile (P10).** Multi-channel + skill-distribution strategy; its registry/skill-hub phase matches the evidence, its launch-timeline phase predates the HN finding |
| `docs/FEATURE_AUDIT_ROADMAP.md` | 21 KB | **Reconcile with §4.** Competitive matrix + roadmap exists; cross-check its "next-gen" items against the ranked list in §4.5 for agreement or contradiction |
| `docs/RESEARCH_MULTI_AGENT.md` | 34 KB | Keep — engineering research, orthogonal to growth |
| `docs/SEO_GUIDE.md` | 12.6 KB | Keep, and use its "canonical metrics" rule: one source of truth for any published number |
| `marketing/HACKER_NEWS_SHOW_HN.md` | 14.7 KB | **Deprioritise (P9/P10).** §5.1 shows HN never carried this category (Context7's best Show HN = 4 points) |
| `marketing/REDDIT_LAUNCH_POSTS.md` | 24.7 KB | Keep, but sequence after the installer + benchmarks exist |
| `marketing/X_TWITTER_LAUNCH_THREAD.md` | 6.7 KB | Keep |
| `marketing/PRODUCT_HUNT_PLAYBOOK.md` | 14.6 KB | Keep, later; only Firecrawl has a confirmed PH presence in the comparator set |
| `marketing/DEVTO_HASHNODE_ARTICLE.md` | 18.8 KB | Keep — a technical article carrying the benchmark table is the strongest content asset we have |
| `marketing/GITHUB_TRENDING_CHECKLIST.md` | 8.5 KB | **High value.** Directly complements A1–A4: repository presentation is exactly the front-door work |
| `marketing/MCP_DIRECTORY_LISTING.md` | 8.4 KB | Keep — pairs with P3 (directories) |
| `marketing/REGISTRY_SUBMISSION.md` | 9.3 KB | Keep — pairs with P3 (official registry) |
| `marketing/README.md` | 18.4 KB | Campaign master guide; update the KPI scorecard once P5's benchmark numbers exist |

**Audit rule for this table:** any asset marked *reconcile* must be updated or explicitly overruled in writing before launch activity starts, so the repo does not contain two contradictory plans.

### 2.5 Reproduce the baseline

```bash
gh api repos/RohannShetty/DocHarvest \
  --jq '{stars: .stargazers_count, topics: .topics, description: .description,
         homepage: .homepage, discussions: .has_discussions, wiki: .has_wiki,
         license: .license.spdx_id, open_issues: .open_issues_count}'
grep -oE "[0-9a-f]{6}" README.md | sort | uniq -c | sort -rn   # badge colours
gh api "user/starred?per_page=100" --paginate -H "Accept: application/vnd.github.star+json" \
  --jq '.[] | [.starred_at, .repo.full_name, (.repo.stargazers_count|tostring)] | @tsv' | wc -l
```

---

## 3. Agent-harness coverage — full research

### 3.1 What we claim, and what is actually true

| Claim in README | Reality (verified 2026-09-28) | Verdict |
|---|---|---|
| "14+ Harnesses" (badge, `:15`) | The Universal Harness Matrix lists **16 rows** (`:266-283`) | ✅ **Claim is supported** |
| "14+ coding agents (Cursor, Claude Code, Windsurf, Gemini CLI, Oh My Pi, Codex)" (`:38`) | All six are real. **OMP is ★33.2k** and reads eight existing config formats | ✅ Accurate |
| "all 14+ MCP-capable agent harnesses … load and execute it natively" (`:260`) | True for **skill** loading. The matrix is *skill target directories* — a **different axis** from MCP client config, which the README does not cover at all | ⚠️ **Two axes conflated** — see below |

**The conflation is the real finding.** The README's matrix tells a user where to drop a `SKILL.md` (16 rows). It says nothing about where to register the **MCP server** — the thing that actually makes the 12 tools available. Those are different files, different formats and different harness lists. A user who follows the matrix gets the skill but not the server. §3.6 is the plan for closing that.

### 3.2 The 16 matrix rows, audited

| Row | Status | Note |
|---|---|---|
| Cursor, Claude Code, Claude Desktop, Oh My Pi (OMP), Zed, Cline, Kiro, OpenCode, OpenAI Codex CLI, Antigravity/Gemini CLI, VS Code (Copilot/MCP), JetBrains AI Assistant, Universal/Standard Agents | ✅ Current | Verified real and active |
| **Windsurf** → `.codeium/skills` | ⚠️ **Stale** | Renamed **Devin Desktop** (Cognition). MCP config now under `devin/`; the old Windsurf page covers "the legacy Cascade agent only". Skill dir `.codeium/skills` needs re-verification against the Devin docs |
| **Continue.dev** → `.agents/skills` | ⚠️ **Stale** | Continue is **acquired by Cursor and winding down**. Keep the row as legacy, stop implying it is a growth audience |
| **GitHub Copilot Workspace** → `.github/skills` | ❓ **Unverified** | Its current product status could not be confirmed from official sources in this pass (§9). Confirm before keeping it as a headline row |
| JetBrains AI Assistant | ⚠️ **Too coarse** | JetBrains ships at least two MCP-capable agents: AI Assistant (IDE dialog) and **Junie** (CLI, `.junie/mcp/mcp.json`, `~/.junie/mcp/mcp.json`). These should be two rows |

**Positive finding — do not "fix" OMP:** Oh My Pi is a ★33.2k terminal agent built on Mario Zechner's `pi` framework, with MCP servers, skills and hooks. Critically, **OMP reads eight existing config formats natively** (`.claude`, `.cursor`, `.windsurf`, `.gemini`, `.codex`, `.cline`, `.github/copilot`, `.vscode`), so every writer we build for those clients also serves OMP. It is arguably the best-value harness row in our matrix.
Sources: betterstack.com/community/guides/ai/oh-my-pi-ai-coding-agent · i-scoop.eu/omp-the-terminal-coding-agent-that-turns-your-cli-into-an-ide

### 3.3 Entries that are wrong, discontinued or renamed (do not add these)

| Entry | Verdict | Evidence |
|---|---|---|
| **Void** | **Deprecated** — official README: "Void is deprecated and no longer accepting contributions." | `github.com/voideditor/void` |
| **Roo Code** | **Do not add** — extension "was shut down on May 15th", repo archived read-only. Add **Kilo Code** and **Zoo Code** instead, which absorbed its users | `github.com/RooCodeInc/Roo-Code`, `docs.roocode.com` |
| **Continue** | Legacy only (see §3.2) | `continue.dev` site title |
| **Amazon Q Developer IDE plugins** | **End of support** — only the CLI keeps agentic coding + MCP. Do not advertise "Amazon Q IDE" | `docs.aws.amazon.com/amazonq/…/q-developer-ide-end-of-support.html` |
| **Aider** | **No native MCP client** — open feature request, unimplemented. Do not build a writer | `github.com/Aider-AI/aider/issues/4506` |
| **Plandex** | MCP issue open, not implemented | `github.com/plandex-ai/plandex/issues/241` |
| **Pieces, Boost.space** | **Not clients** — they ship MCP *servers* | `docs.pieces.app/products/mcp`, `docs.boost.space/…/bse-mcp` |

### 3.4 Missing coding agents — full ranked list (29)

Ranking anchors: marketplace installs where available (Cline 5,393,259 · Continue 4,211,679 · Roo 2,020,991 · Kilo 1,542,148 · Augment 779,207) and GitHub stars (Codex ★126.9k · Gemini CLI ★107.2k · Cline ★69.5k · AnythingLLM ★66.5k · Cherry Studio ★52.2k · Jan ★44.7k · Crush ★28.3k · Qwen Code ★28.2k · Kilo ★27.4k · OMP ★33.2k).

| # | Harness | Kind | MCP config mechanism | Why it matters |
|---|---|---|---|---|
| 1 | **GitHub Copilot CLI** | CLI | `copilot mcp add` / `/mcp add`; `~/.copilot/mcp-config.json` | Copilot's terminal agent is **separate from VS Code Copilot** (which we do list). A GitHub MCP server is built in — a large, well-distributed audience |
| 2 | **Kilo Code** | ext + CLI | `~/.config/kilo/kilo.jsonc` or `kilo.jsonc` → `mcp`, `type: local\|remote`, `command: []` | **1,542,148 installs**; the default landing spot for Roo Code's user base |
| 3 | **Zoo Code** | ext | `.roo/mcp.json` + global `mcp_settings.json` | Carries Roo Code's extension forward after the shutdown |
| 4 | **Qwen Code** | CLI | `~/.qwen/settings.json` → `mcpServers`; `qwen mcp add` | ★28.2k; very large CN + global CLI base |
| 5 | **Goose (Block)** | CLI + desktop | `~/.config/goose/config.yaml` → `extensions` | Most-adopted open-source general agent; MCP is its native extension model |
| 6 | **Crush (Charm)** | CLI/TUI | `crush.json` → `mcp`; `crush mcp add` | ★28.3k, active, Go single binary |
| 7 | **Warp** | terminal/agent | `~/.warp/.mcp.json` + in-app page | Large install base; MCP wired into local agents |
| 8 | **Trae (ByteDance)** | IDE | in-IDE MCP panel; `trae://…mcp-import?config=<base64>` | Major CN IDE with agents as MCP clients (stdio/SSE/HTTP) |
| 9 | **Amazon Q Developer CLI** | CLI | `qchat mcp add/remove/list/import` | Enterprise/AWS audience; CLI is the surviving surface |
| 10 | **Junie (JetBrains)** | CLI | `.junie/mcp/mcp.json` / `~/.junie/mcp/mcp.json` | JetBrains' own agent CLI — a **separate product** from the AI Assistant row we list |
| 11 | **Google Antigravity** | IDE + CLI + SDK | `~/.gemini/config/mcp_config.json`, `.agents/mcp_config.json` | Google's agent-first harness |
| 12 | **Visual Studio 2026** | IDE | `.mcp.json`, `%USERPROFILE%\.mcp.json`, `.vs\mcp.json` | Copilot agent mode in full VS — distinct config locations from VS Code |
| 13 | **Android Studio** | IDE | `mcp.json` (`httpUrl` remote) | Android developers |
| 14 | **Xcode 26.3** | IDE | Copilot/MCP config; Apple also exposes Xcode **as** an MCP server | Xcode is now both client and server |
| 15 | **Devin CLI / Devin Desktop** | CLI + app | `devin mcp add`; `.devin/mcp_config.json` | Cognition's successor to Windsurf — same vendor as our stale row |
| 16 | **Factory Droid** | CLI | `/mcp` TUI manager + CLI subcommands | Widely used harness with a registry |
| 17 | **OpenHands** | CLI + SDK + cloud | `~/.openhands/mcp.json`, `/mcp` | Established open agent platform |
| 18 | **Mistral Vibe CLI** | CLI | `config.toml` → `[[mcp_servers]]` | Mistral's official CLI (no OAuth servers yet) |
| 19 | **Grok CLI (xAI)** | CLI | `~/.grok/config.toml` → `[mcp_servers.<name>]`; `grok mcp add` | xAI's terminal agent, MCP first-class |
| 20 | **Kimi Code CLI (Moonshot)** | CLI | `~/.kimi-code/mcp.json`; `/mcp-config` | ★11.4k successor to the archived `kimi-cli` |
| 21 | **iFlow CLI (Alibaba)** | CLI | `~/.iflow/settings.json` → `mcpServers` | ★5.1k, one-click MCP market |
| 22 | **Posit Assistant (Positron)** | IDE | `~/.posit/assistant/settings.json` → `mcpServers`, `type: local\|remote` | R/Python audience; uses the A′ array-form command |
| 23 | **Tabnine** | plugin + CLI | `.tabnine/mcp_servers.json` | Enterprise assistant with an explicit MCP engine |
| 24 | **Augment Code** | plugin + CLI | settings-panel JSON import | **779,207 installs** |
| 25 | **Firebase Studio** | cloud IDE | `.idx/mcp.json` → `mcpServers` | Google's cloud dev environment |
| 26 | **Cursor CLI (`agent`)** | CLI | `agent mcp …`; shares the editor's `mcp.json` | A distinct entry point from the Cursor IDE we already list |
| 27 | **avante.nvim / codecompanion.nvim** | editor plugins | via `mcphub.nvim` / companion plugin | Neovim users; plugin-mediated rather than native config |
| 28 | **CodeBuddy Code (Tencent)** | CLI | ❓ **UNVERIFIED** — official page exists in nav but would not render; config path unknown | Do not implement on a guess |
| 29 | **Witsy** | desktop app | ❓ **UNVERIFIED** — no official MCP doc page confirmed | Do not implement on a guess |

### 3.5 Non-coding MCP hosts (a second, separate opportunity)

| # | Host | Kind | Config mechanism |
|---|---|---|---|
| 1 | **Claude Desktop** | desktop | `claude_desktop_config.json` → `mcpServers`; `.mcpb` extensions — the largest MCP host, and the format everyone copies |
| 2 | **ChatGPT (Apps/connectors)** | cloud | No local file; developer mode, endpoint + metadata (Business/Enterprise/Edu, web only) |
| 3 | **Perplexity** | web + desktop | Connectors UI; local MCP on desktop |
| 4 | **LibreChat** | self-hosted | `librechat.yaml` → `mcpServers` |
| 5 | **LM Studio** | desktop | `~/.lmstudio/mcp.json` — explicitly "follows Cursor's notation" |
| 6 | **AnythingLLM** | desktop/Docker | `anythingllm_mcp_servers.json` in the storage `plugins` dir |
| 7 | **Jan** | desktop | In-app MCP form |
| 8 | **Msty Studio** | desktop | Toolbox → Add New Tool (STDIO JSON or HTTP URL) |
| 9 | **Cherry Studio** | desktop | UI (command/args/env or URL+auth); ★52.2k, big CN audience |
| 10 | **ChatWise** | desktop | Tools settings + "Import JSON from Clipboard" |
| 11 | **Chatbox** | desktop | Settings → MCP; `chatbox://mcp/install?server=<base64>` |
| 12 | **Raycast** | macOS launcher | Install MCP Server command (Pro-gated) |
| 13 | **BoltAI** | macOS | `mcp.json`; can import Cursor/Claude configs |
| 14 | **5ire** | desktop | UI-managed MCP tools |
| 15 | **Smithery** | registry/CLI | Not a host — it **writes client configs**, so it is a distribution channel (and a competitor for installer UX) |

### 3.6 The engineering plan: four writers ≈ 45 harnesses

| Family | Shape | Harnesses covered | Path count |
|---|---|---|---|
| **A** | `mcpServers` JSON, Claude/Cursor shape (`command`+`args`+`env`, remote `url`/`headers`) | Claude Desktop, Claude Code, Cursor + Cursor CLI, VS Code, Visual Studio, Cline, Zoo Code, Amazon Q CLI, Kimi Code, Junie, Qwen Code, Gemini CLI, Antigravity, Warp, Devin, OpenHands, AnythingLLM, Firebase Studio, Tabnine, Kiro, Augment, LM Studio | **~20** |
| **A′** | Same file, different shape: `type: local\|remote` + `command: [array]` | OpenCode, Kilo Code, Posit Assistant | 3 |
| **B** | TOML `[mcp_servers.<name>]` | Codex, Mistral Vibe, Grok CLI | 3 |
| **C** | YAML (`extensions` / `mcpServers`) | Goose, Continue | 2 |
| **D** | Top-level `mcp` key (JSON/JSONC) | OpenCode, Kilo Code | 2 |
| **E** | No writable file → **emit a deeplink** | Raycast, Msty, Jan, Perplexity, ChatGPT, Cherry Studio, Kiro, Trae, Chatbox, Cursor Marketplace | ~10 |

**Key-name exceptions inside Family A** (a path table alone is not enough): Zed uses `context_servers`; Amp uses `amp.mcpServers`; Devin Desktop's Cascade uses `mcp_config.json` under `devin/`.

**Risk note (H2):** families A and A′ look alike and are not. Writing the Claude shape into an OpenCode/Kilo/Posit file produces a config that silently fails. This is the single highest-risk item in the plan and needs its own tests.

### 3.7 Why harness coverage is worth this effort (the reasoning)

1. **It is the cheapest distribution we have.** Every harness we support is a place our name appears in a user's config file — and per §5, "being listed where developers already look" is what actually built the leaders in this category.
2. **Skill ≠ server.** Today a user can install the *skill* into 16 harnesses but has no documented way to register the *server* in most of them. The 12 MCP tools are the product; the skill is the workflow. Shipping the skill without the server registration path caps the product at half its value.
3. **OMP collapses the cost.** Because OMP reads eight existing config formats, one writer per family covers harnesses we never explicitly targeted.
4. **Counter-argument (§8.1):** 45 harnesses is vanity if none of them work well. Mitigation: H2's per-family tests, and shipping H3's top-10 before H1's long tail.

---

## 4. Feature research — full matrices and reasoning

### 4.1 Matrix A — docs-site → agent-context tools

✅ yes · ◐ partial · ❌ no

| Capability | DocHarvest | Grounded Docs | Context7 | Ref | Firecrawl | Crawl4AI | Scrapling | Jina Reader |
|---|---|---|---|---|---|---|---|---|
| Formats ingested | ◐ HTML + framework `.md` only | ✅ HTML, MD, PDF, Office, ODF, EPUB, notebooks, archives, 90+ code langs, local dirs, GitHub/npm/PyPI | ◐ own indexed corpus + GitHub | ◐ docs URLs + hosted index | ✅ web + PDF/DOCX/XLSX | ◐ web HTML | ◐ HTML/XML/CSV/JSON | ✅ URL + PDF + Office |
| JS-rendered sites | ◐ optional Playwright, **off by default** | ✅ incl. hash-routed SPAs | ✅ | ✅ | ✅ + interact | ✅ default | ✅ stealth fetchers | ✅ |
| Output formats | ✅ `pages/*.md`+frontmatter, `book.md`, `llms.txt`, `.manifest.json`, RAG JSONL, PDF | ✅ chunks + MD + JSON/YAML | ◐ snippets | ◐ token-bounded passages | ✅ MD/HTML/JSON/screenshots | ✅ MD/HTML/JSON | ✅ MD/HTML/JSON | ✅ MD/HTML/JSON |
| Chunking / RAG | ◐ AST chunks, **no embeddings** | ✅ embeddings + hybrid | ◐ server-side | ◐ passages | ◐ schema extraction | ◐ BM25/pruning | ◐ extra | ✅ embeddings + reranker |
| Search index | ✅ local SQLite FTS5 BM25 | ✅ local vector + hybrid | ✅ cloud | ✅ hosted | ✅ 3 indexes | ❌ | ❌ | ✅ s.jina.ai |
| PDF | ✅ **exports** styled handbook | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Version diffing | ✅ semver snapshots + `diff_versions`/`get_changelog` | ◐ version-specific index, no diff tool | ◐ Refresh API | ❌ | ◐ `monitor_*` | ❌ | ❌ | ❌ |
| MCP server | ✅ 12 tools + resources + prompts, **stdio only** | ✅ tools + Web UI + SSE/HTTP | ✅ 2 tools | ✅ 2 tools | ✅ full + OAuth | ✅ SSE/WS | ✅ extra | ✅ remote |
| Agent skill output | ✅ `SKILL.md`, 16-row matrix | ✅ | ✅ | ❌ | ✅ | ◐ | ✅ | ❌ |
| Incremental re-crawl | ◐ full re-crawl only | ✅ `refresh`, llms.txt seeding, prefers `.md` | ✅ Refresh API | ◐ | ✅ monitors + webhooks | ◐ cache modes | ✅ cache/pause/resume | ◐ bucket cache |
| Auth / private docs | ❌ explicitly refuses | ✅ OAuth2/OIDC | ✅ API key, private repos | ◐ | ✅ headers/cookies | ✅ sessions | ✅ session/cookies | ◐ API key |
| Offline use | ✅ fully local, zero telemetry | ✅ local-first | ❌ cloud | ❌ hosted | ◐ self-host (AGPL) | ✅ | ✅ | ◐ self-host |
| License | MIT | MIT | MIT (pkg only) | MIT | AGPL-3.0 | Apache-2.0 | BSD-3 | Apache-2.0 |
| Framework-aware extraction | ✅ **8 providers** | ❌ generic | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Retrieval benchmark | ❌ | ✅ IR metrics + LLM-judged | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Injection screening | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| GUI | ✅ desktop + TUI | ✅ web UI | ✅ dashboard | ❌ | ✅ playground | ❌ | ❌ | ✅ demo |

### 4.2 Matrix B — converters and adjacent tools

| Capability | Docling | MarkItDown | Repomix | gitingest | Serena | GitMCP | MS Learn MCP | llms.txt generators |
|---|---|---|---|---|---|---|---|---|
| Formats ingested | ✅ ~30 (PDF, Office, EPUB, audio, video, LaTeX, email) | ✅ ~15 (+OCR, audio, YouTube, ZIP) | ◐ repos | ◐ git repos | ◐ code symbols | ◐ GitHub repos | ◐ MS Learn | ❌ (generates only) |
| Output | ✅ MD, HTML, lossless JSON, DocTags | ✅ MD | ✅ XML/MD/text | ✅ digest | ◐ symbol-level | ◐ MD | ✅ MD + samples | ✅ `llms.txt`, `llms-full.txt`, per-page `.md` |
| MCP server | ✅ local or remote | ✅ stdio + HTTP + SSE | ✅ `--mcp --sandbox` | ❌ | ✅ core product | ✅ hosted | ✅ remote | ❌ |
| Agent skill output | ✅ 4 harness skill dirs | ❌ | ✅ | ❌ | ◐ | ❌ | ❌ | ❌ |
| Incremental | ❌ | ❌ | ✅ git-aware | ✅ git-aware | ✅ per-project cache | ✅ on-demand | ✅ | ❌ build-time |
| Secret scrubbing | ❌ | ❌ | ✅ Secretlint | ❌ | ❌ | ❌ | ❌ | ❌ |
| Offline | ✅ air-gapped | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| License | MIT | MIT | MIT | MIT | custom | Apache-2.0 | CC-BY-4.0 | mixed |

### 4.3 What they have that we lack — with reasoning

| # | Gap | Why it costs us | Maps to |
|---|---|---|---|
| 1 | **Semantic/vector retrieval.** Our only query path is FTS5 BM25 over exact terms; we emit a RAG JSONL and ask the user to embed it | Agent queries are natural language. "how do I rotate credentials" misses a page titled "Key management" under BM25 and hits it under embeddings. This is the feature that decides a head-to-head | F2 |
| 2 | **Incremental refresh.** No `refresh`, no ETag/If-Modified-Since, no per-page change detection | A tool selling *version diffing* must re-download the whole site to find a diff. It leaves our best feature half-usable | F1 |
| 3 | **Multi-format ingest.** No PDF, DOCX, EPUB, local folder or Git repo; PDF is export-only | Real doc sets are ~60% HTML and 40% everything else (release PDFs, spec sheets, repo READMEs) | F3, F10 |
| 4 | **Network MCP transports.** Stdio only | No shared team instance, no remote/cloud agent, no multiplexing. Every strong comparator ships one | F4 |
| 5 | **`Accept: text/markdown` negotiation + llms.txt-first discovery.** We probe `.md` for GitBook only | Cheapest available accuracy win; Cloudflare's Markdown-for-Agents hands back markdown directly, and a competitor already does it automatically | F7 |
| 6 | **Retrieval-quality benchmarking.** We have 820 tests proving the code runs, none proving retrieval is good | In this category retrieval quality *is* the product; Grounded Docs ships an IR-metric benchmark | F5 |
| 7 | **Prompt-injection screening.** Scrapling strips injection payloads before the agent sees them | We pipe arbitrary third-party pages into agent context unscreened while advertising SHA-256 — which authenticates bytes, not intent | F8 |
| 8 | **Repo-backed ingestion.** GitMCP/gitingest/Repomix own the docs-as-code entry point | Docs-as-code is where canonical documentation lives | F10 |
| 9 | **Fetch resilience.** Scrapling: adaptive throttling, backoff, proxy rotation, robots caching, Turnstile handling | We will get rate-limited on large portals; being silently blocked is worse than being slow | F11 |
| 10 | **Scheduled/CI operation.** No watch mode, no scheduler, no CI story | Freshness currently depends on a human remembering to run it | F9 |
| 11 | **Private/internal docs.** We refuse login-walled content (defensible) but offer nothing for a team's *own* SSO-protected docs | The highest-value corpus a local-first tool could serve, and Grounded Docs has OAuth2/OIDC | F12 |
| 12 | **MCP server scope confinement.** Repomix added `--sandbox` because an unconfined server is too broad | Our tools take arbitrary URLs and write to the library with no documented confinement | F13 |

### 4.4 Our genuine moat, and what is table stakes

**Genuine and defensible today**

| Asset | Why it is a moat |
|---|---|
| **Framework-aware extractors** — 8 priority-ordered providers (GitBook 100 → ReadTheDocs 60 → generic 0) with per-framework discovery (`mintlify.json`, `search_index.json`, `docusaurus.config.js`, `.md` probing) and per-framework selectors | Every comparator does generic readability/trafilatura extraction. This is the only *structural* quality advantage we hold, and it is what produces the ~83% token reduction |
| **Version diffing exposed as agent tools** — `list_versions`, `diff_versions`, `get_changelog` | Nobody in either matrix offers a diff tool over captured snapshots to the agent. Context7 has refresh; Firecrawl has monitors; neither answers "what changed between v1.0.0 and v1.0.1". **Most defensible feature we have — and currently under-built** |
| **PDF handbook export** with syntax highlighting (fpdf2) | Nobody exports PDF. Docling/MarkItDown *parse* PDF; Firecrawl ingests it. Small market, zero competition |
| **SHA-256 per-page provenance + `.manifest.json`** | Citation-verifiable chunks with a hash a user can independently check. Grounded Docs hashes internally for change detection; nobody surfaces it as a verification primitive for the agent |
| **MCP resources + prompts**, not just tools (`docs://{domain}/book`, `docs://{domain}/manifest`) | Widest agent surface in the comparison: 12 tools vs Context7's 2 and Ref's 2 |
| **Zero-config, no API key, zero telemetry, pure-Python, MIT** | Firecrawl's equivalent is AGPL + hosted; Context7/Ref/Jina are hosted SaaS; Grounded Docs needs Node 22+ |

**Table stakes — stop marketing these as differentiators**

MCP server with tools · a bundled agent skill · clean Markdown output · `llms.txt` generation · sitemap/BFS discovery · Playwright rendering · RAG JSONL export · MIT license · local-first/zero-telemetry · CLI + GUI. Every serious tool in §4.1 has most of these. In particular **"agent skill output" is no longer special** — Scrapling, Grounded Docs, Context7, Docling and Firecrawl all ship skills.

**Weaker than the README implies — do not treat as moat**

- **The concept graph** (`query_doc_graph`, `get_related_concepts`) is heuristic — no embedding model, no benchmark. A graph nobody has measured against BM25 is a liability in a comparison, not an asset.
- **"Capture any docs site" is bounded** — any *public, HTML-or-`.md`, sitemap-discoverable* site. Not PDF, not private, not repo, not SPA-by-default.

### 4.5 Ranked upgrades — the reasoning behind the order

| Rank | Upgrade | Impact | Effort | Reasoning for this position |
|---|---|---|---|---|
| 1 | `refresh` (F1) | High | M | Highest ratio of value to effort in the list: the diff engine already exists, it just cannot be fed cheaply |
| 2 | Hybrid search (F2) | High | M | Decides the head-to-head comparison; without it every other quality gain is invisible to a natural-language query |
| 3 | Multi-format ingest (F3) | High | L | Largest raw coverage gain (~40% of a real docset) but the most expensive — and it should reuse Docling/MarkItDown-class parsing rather than reinvent it |
| 4 | HTTP transport (F4) | High | M | Converts a laptop tool into deployable infrastructure; a prerequisite for any team use |
| 5 | Benchmark harness (F5) | High | S–M | **Deliberately before the retrieval work** — measure first, so F1/F2 improvements are provable and publishable |
| 6 | OpenAPI → endpoint index (F6) | High | M–L | The genuinely unclaimed wedge; nothing in either matrix does it |
| 7 | Markdown negotiation (F7) | Med-High | S | Small effort, immediate correctness win |
| 8 | Injection screening (F8) | Med-High | S–M | Trust gap a security-minded buyer finds immediately; cheap to close |
| 9 | Scheduling + notifications (F9) | Med-High | M | Converts a manual habit into always-fresh docs |
| 10 | Repo ingestion (F10) | Med | M | Canonical source; also gives version snapshots for free |
| 11 | Resilient fetch (F11) | Med | M | Reliability on large/Cloudflare-fronted portals |
| 12 | Auth profiles (F12) | Med | S | Unlocks the highest-value local-first corpus (internal docs) |

---

## 5. Promotion research — full evidence

### 5.1 The evidence: HN points do not track stars

| Project | Best Hacker News result (Algolia) | Stars |
|---|---|---|
| MarkItDown | **329 points / 81 comments** (2024-12-13) | 187,399 |
| Context7 | **4 points** (Show HN, 2025-03-28); 3 pts twice more | 62,492 |
| Repomix | **4 points max** across four separate submissions | 28,517 |
| Serena | **no launch post found** | 29,866 |
| Docling | 13 points + an 8-point independent write-up by Simon Willison the same day | 68,115 |
| Firecrawl | 4 points for the original (2024-05-19); 35 pts was someone else's fork | 185,738 |
| Playwright MCP | 6 points — while a *competing* "Skill" post scored **189** | 37,645 |

**Conclusion:** in this category HN is a lottery nobody in the comparator set actually won on. The projects that grew did so on: (a) a one-command installer, (b) being listed everywhere a developer already browses, (c) other people's READMEs linking them, (d) influencer YouTube coverage, (e) one explicit before/after argument. MarkItDown's 187k came from one HN hit **plus Microsoft's distribution** — not reproducible by a solo maintainer.

### 5.2 Directory economics (verified live, 2026-09-28)

| Directory | What it is | How to get listed |
|---|---|---|
| **Official MCP Registry** | `registry.modelcontextprotocol.io` | `publish` endpoint with GitHub OIDC token exchange — the canonical listing; Anthropic's own servers README now redirects directory-seekers here |
| **Glama** | 89,739 MCP servers, A–D grades for license/quality/maintenance, embeddable score badge | Free listing; `glama.ai/mcp/servers/<owner>/<repo>/badges/score.svg` |
| **Smithery** | Now part of Arcade.dev; LLM-friendly docs at `/docs/llms.txt`; writes client configs | Free publish flow |
| **mcp.so** | Monetises placement — "premium submissions get a dofollow link, faster review, featured placement", citing DR 72 / 2.2M unique visitors per year | Free tier first; **paid only after the free listings are done and measurable** |
| **punkpeye/awesome-mcp-servers** | The list developers actually browse; flag emojis (`🎖️ 🐍 🏠 ☁️`) | PR. **We are not in it.** Context7, Serena and MarkItDown all are |
| **Trendshift** | Trending-repo badges — all three of our starred neighbours (Graphify ★122k, headroom ★74k, donsetch ★753) carry one | Repo badge once trending |

### 5.3 The 12 copyable patterns, with raw evidence

| # | Pattern | Evidence |
|---|---|---|
| **P1** | **Install deeplink above the title** | Context7: line 1 cover, **line 3 the Cursor deeplink**, line 5 the H1. Format: `cursor.com/en/install-mcp?name=<name>&config=<base64 mcp.json>` |
| **P2** | **One command that is the whole product** | `npx ctx7 setup` (auths, mints a key, installs the skill, picks the client) · `npx -y firecrawl-cli@latest init --all --browser` · `uv tool install -p 3.13 serena-agent && serena init` · `npx repomix@latest`. Nobody makes JSON hand-editing step 1 |
| **P3** | **❌/✅ before-after block** | Context7 `## ❌ Without Context7` ("Code examples are outdated… Hallucinated APIs that don't even exist…") mirrored by `## ✅ With Context7`. Cheapest persuasion artifact available — needs zero third-party proof |
| **P4** | **Per-client install matrix** | Playwright MCP: 7 deeplink hosts + per-client blocks (`claude mcp add`, `codex mcp add`, `amp mcp add`, `droid mcp add`). Exa: 6 buttons. GitHub MCP: VS Code button first |
| **P5** | **Lead with CLI + Skills, MCP second** | Context7: "Works in two modes: **CLI + Skills** … (no MCP required) / **MCP**". Firecrawl: `### Skill` before `### MCP`. Playwright MCP's own README: agents "favor CLI-based workflows exposed as SKILLs over MCP because CLI invocations are more token-efficient: they avoid loading large tool schemas" |
| **P6** | **Ship `/llms.txt` on your own site** | 7 of 10 comparator hosts return 200 for `/llms.txt` + `/llms-full.txt` + `/index.md`. Repomix puts "(Are you an LLM? View /llms.txt)" in its nav; Firecrawl publishes an agent onboarding `SKILL.md` |
| **P7** | **Reciprocal badges that also serve the other tool** | DeepWiki's "Ask DeepWiki" badge links your repo to a generated wiki and triggers **weekly auto-refresh** — maintainer gets docs, DeepWiki gets distribution. Glama, Smithery, Trendshift and star-history work the same way |
| **P8** | **Agent-quoted testimonials + reproducible eval** | Serena quotes its *agents*: "Opus 4.6 (high) in Claude Code on a large Python codebase: '…cross-file renames, moves, and reference lookups that would cost me 8–12 careful, error-prone steps collapse into one atomic call…'", from a stated ~20-task evaluation with a published methodology page |
| **P9** | **Numbers where you have no logos** | Firecrawl: "Covers 96% of the web", "P95 latency of 3.4 s" (their claims). Context7's site gives every indexed library a **Benchmark score** (Next.js 92.2, Playwright 86.8, Stripe 65.5) + snippet counts + update recency — a table a solo project can build with a deterministic script |
| **P10** | **Trendshift / star-history / awards** | Docling, Crawl4AI and Gitingest carry Trendshift badges; Repomix announces its JSNation Open Source Awards 2025 nomination in README and site — free third-party validation |
| **P11** | **Sponsorship instead of SaaS** | Repomix: Warp + CodeRabbit logos above everything, sponsor grid, GitHub Sponsors badge. Crawl4AI: full sponsor wall + "Become a Strategic Partner". Funds a solo maintainer without a cloud backend — the only model compatible with our zero-telemetry stance |
| **P12** | **README + docs-site i18n** | Context7 4 localized READMEs; DeepWiki-Open 8; Crawl4AI 8; Repomix 16 site locales with a switcher |

### 5.4 Why the ranked tactics sit where they do

| Tactic | Reasoning |
|---|---|
| **P1 README screens 1–3** first | Highest conversion-per-hour of anything in this document; it is the only asset every visitor sees |
| **P2 installer** next | It is the documented growth engine of every project that grew without a launch event (P2's evidence). It also *is* the harness work (H1/H2) wearing a product hat |
| **P3 directories** third | Compounding, not one-shot; survives any failed launch. One day of work |
| **P4 dogfooding** fourth | Credibility: a tool that produces `llms.txt` must ship one |
| **P5 benchmarks** fifth | Supplies the proof artifact that P1's rewritten screen needs, and the content for P9's launch |
| **P6–P8** | Positioning depth once the front door works |
| **P9 launch** deliberately late | Sequence matters: a launch before the installer, benchmarks and video exist spends the one shot you get |
| **P10 reconciliation** runs *before* P9 | The repo currently holds launch copy written against assumptions this research contradicts |

### 5.5 What NOT to copy, with reasons

| Tactic | Who does it | Why it is wrong for us |
|---|---|---|
| Cloud upsell in the first screen ("Crawl4AI Cloud — try free", $10 promo banner) | Crawl4AI | Contradicts local-first; the banner outranks the product in the reader's eye |
| Private server-side backend as part of the architecture | Context7 | Unsustainable solo, and it invalidates the local-first promise |
| Hosted-only MCP endpoint as the primary path | Exa, Ref, GitHub, Firecrawl | All need an account + key + network. Our differentiator is stdio + a local corpus |
| "Trusted by teams at" logo walls / "150,000+ companies" | Context7 (24 logos), Firecrawl | Unearned at ★2; reads as bait. Substitute benchmarks (P5) and real capture artifacts |
| Paid directory placement | mcp.so | Only after free listings, and we cannot attribute traffic without analytics |
| Badge `?ref=` campaign params | Crawl4AI | The analytics behind them is the telemetry we promise not to do |
| Discord from day one | Firecrawl, Serena, Repomix, Docling | An empty Discord is negative social proof ("0 online"). GitHub Discussions until >20–30 active users |
| 8–16 locale READMEs / a 90-fence README | Repomix, DeepWiki-Open | Unsustainable solo; dilutes the install path |
| Trusting marketplaces to carry the install command | Serena explicitly warns against it ("they contain outdated and optimal installation commands") | Copy the *listing*, not the *trust*; keep a version-pinned canonical one-liner |
| Sponsorship slots above the fold | Repomix | Works at ★28k with sponsor-sales effort; at ★2 it pushes install below the fold |
| SOC2/SSO/enterprise FAQ | Ref (Vanta/Trust Center) | Zero relevance to a single-user local tool |
| Building distribution on HN | Context7, Repomix | Nobody in the set won on it (§5.1). Do it once, correctly, do not count on it |

### 5.6 Product lessons the marketing implies

1. **MCP is no longer the default pitch** — three leaders repositioned to CLI+Skills in 2026 (P5). We have CLI + GUI + skill + MCP; we pitch MCP first.
2. **Tool-schema diet is advertisable** — 12 always-on tools is now a known cost. Document the token weight; ship a reduced default profile (P7).
3. **Ref's fear is our advantage** — "more context makes models dumber" / "minimizing tokens matters" is Ref's entire pitch. A pre-filtered local FTS5 index + `llms.txt` + `book.md` is the *deterministic* version of that promise, and it works offline. This is the one-line positioning we lack.
4. **Version diffs are an unclaimed wedge** — Context7 sells freshness (which needs a private crawler fleet); we sell provable, restorable, diffable snapshots.
5. **`llms.txt` is the category's authority layer** (the proposal itself: 206 HN points / 175 comments). Publishing a small, precise convention on top of it — e.g. a canonical manifest / `llms-full.txt` snapshot format with content hashes — is a cheap, durable citation magnet, and exactly the standards play a solo maintainer can win.

---

## 6. Prioritised roadmap

**Phase 0 — front door (hours; no new features).** A1, A2, A3, A4, A5, A7, P1, P8, P10.
*Gate: a stranger can install from the first screen without hand-editing JSON, and the repo is on-brand.*

**Phase 1 — the compounding assets (1–2 weeks).** P2 installer, H1/H2 writers, H3 top-10 harnesses, P3 directories, P4 dogfooding, P5 benchmarks, A6 demo video, F5 benchmark harness, F1 refresh, F7 markdown negotiation, F8 injection screening.
*Gate: one command installs into a real client; benchmarks are published and reproducible; listings live.*

**Phase 2 — depth and reach (1 quarter).** F2 hybrid search, F3 multi-format ingest, F4 HTTP transport, F6 endpoint index, F12 auth profiles, H4 deeplinks, P6 comparison table, P7 tool diet, F15.
*Gate: retrieval quality is measurably better than the Phase-1 baseline, and the MCP server is deployable beyond one machine.*

**Phase 3 — the long tail.** F9 scheduling, F10 repo ingestion, F11 resilient fetch, F13 sandbox, F14 secret scrubbing, P9 launch, P11 sponsors, P12 i18n.
*Gate: freshness is automatic; the launch happens with every asset in place.*

---

## 7. Audit protocol

### 7.1 What "done" means for each class of item

| Class | Acceptance test |
|---|---|
| Front door (A) | The §0.2 verification command returns the expected value, **and** a screenshot/`curl` proves it renders |
| Harness (H) | A config written for a named client is loaded by that client and lists the 12 tools — tested per family, with the A′ variant as its own case |
| Feature (F) | A test exists that fails before and passes after; the behaviour is documented in README/docs |
| Promotion (P) | A URL exists (listing, PR, page, published table) that a third party can open |

### 7.2 Phase gates

Do not start a phase until the previous gate passes. In particular: **do not launch (P9) before P1, P2, P4 and P5 are done** — the launch spends a one-time attention budget and needs the installer, the dogfooded `llms.txt`, the benchmark table and the rewritten first screen to convert it.

### 7.3 Re-verification commands (run these to audit the audit)

```bash
# Front door state
gh api repos/RohannShetty/DocHarvest --jq '{stars, topics, has_discussions, homepage}'
grep -oE "[0-9a-f]{6}" README.md | sort | uniq -c | sort -rn        # badge colours vs BRAND.md §7

# Brand guard (must stay green)
node scripts/sync-brand-tokens.mjs --check
pytest tests/test_brand_tokens.py -q

# Published numbers must equal reality (single source of truth)
node docs/scripts/sync-stats.mjs --run

# Dogfooding
for p in llms.txt llms-full.txt index.md; do
  printf "%s -> " "$p"
  curl -o /dev/null -s -w "%{http_code}\n" "https://rohannshetty.github.io/DocHarvest/$p"
done

# Directory presence
curl -s "https://api.github.com/search/issues?q=repo:punkpeye/awesome-mcp-servers+docharvest" | head -5

# Comparator numbers are volatile — refresh before publishing any claim
for r in upstash/context7 yamadashy/repomix unclecode/crawl4ai docling-project/docling; do
  gh api "repos/$r" --jq '"\(.full_name) \(.stargazers_count)"'
done
```

### 7.4 Cadence

Re-audit **quarterly**, and re-run §7.3 before any public post. Star counts, harness configs and directory rankings in this document decay in weeks; the *reasoning* decays much more slowly, which is why the reasoning is written down next to the number.

---

## 8. Risks and counter-arguments (the steelman)

| # | Risk / objection | Honest answer |
|---|---|---|
| **8.1** | **Harness breadth is vanity.** 45 half-working integrations are worse than 6 solid ones | Accepted. Mitigation: H2 tests the A′ variant explicitly, and H3 ships the top 10 by adoption *before* the long tail. Breadth is only valuable because the writers are shared — if a family's writer is wrong, every harness in it is wrong |
| **8.2** | **Feature work delays the growth work**, and growth work is what we actually need | Accepted, and it is why Phase 0 is hours not weeks, and why the feature ranking puts `refresh` and the benchmark first. But note the dependency: P5's benchmarks need F5's harness, and P2's installer is the same code as H1 |
| **8.3** | **Publishing benchmarks can backfire** — ours may look worse than a hosted competitor's | Possible, and publishing anyway is the point: a *reproducible local* number with a methodology beats an unreproducible marketing claim. If our numbers are bad, that is the most valuable finding in the plan |
| **8.4** | **The local-first constraint blocks the biggest markets** (no cloud, no telemetry, no accounts) | True, and deliberate. The addressable audience is "developers who want docs offline / private / reproducible". Repomix reached ★28.5k inside a comparable constraint |
| **8.5** | **Multi-format ingest (F3) is a trap** — Docling and MarkItDown are years ahead | Accepted. Recommendation is explicitly to *reuse* a parser rather than compete: pluggable extractor interface, not a new PDF engine |
| **8.6** | **Some evidence is competitor self-reporting** | Mitigated by §1.3's discipline: claims are labelled as claims. The numbers we act on (star counts, install counts, HN points) come from APIs, not from READMEs |
| **8.7** | **Two of the 29 harness rows are unverified** (CodeBuddy, Witsy) | Accepted and flagged. Neither should be implemented until its config is confirmed |
| **8.8** | **This plan was written by an AI from public data and may misread the product's real constraints** | Legitimate. The counter is §7: every claim has a re-runnable verification, and the audit sheet is designed to be rejected item by item rather than wholesale |

---

## 9. Open questions and unverified claims

| # | Item | Status |
|---|---|---|
| 1 | **GitHub Copilot Workspace** — is it still a live product? It is row 8 of our harness matrix | **Unverified.** Web search in this pass returned model-deprecation and metrics-API sunsets, not its status. Confirm against GitHub's official docs before keeping the row |
| 2 | **CodeBuddy Code (Tencent)** — config path | **Unverified** — official page would not render |
| 3 | **Witsy** — MCP support and config | **Unverified** — no official doc page confirmed |
| 4 | **Repo social preview** — set or not | **Unverifiable via API** (see §0.1). Manual check required |
| 5 | **Gitingest** star/created/license metadata | Did not resolve cleanly via the API; its README was still analysed |
| 6 | **Product Hunt presence** for Context7, Repomix, Serena, MarkItDown, Docling, DeepWiki | Not verified. Only Firecrawl has a confirmed PH listing |
| 7 | **Reddit launch threads** for any comparator | None found in the sources pulled — absence of evidence, not evidence of absence |
| 8 | **Discord member counts** for Repomix/Docling/Gitingest | Live-count badges present, numeric values not resolved |
| 9 | **Firecrawl's "96% of the web" / "P95 3.4 s"** | Their own README claims, not independently reproduced |
| 10 | **`developer.mcp.so`** `/llms.txt` probe | Returned a connection failure (`000`), not a 404 — host status undetermined |
| 11 | **xAI docs domain** | Currently titled "SpaceXAI Docs"; nothing beyond the verified URL is asserted |
| 12 | **Windsurf's `.codeium/skills` target dir** post-rename | Needs re-verification against Devin Desktop docs |

---

## 10. Source index

**Comparators (READMEs/sites actually read):** `github.com/upstash/context7` + `context7.com` · `github.com/firecrawl/firecrawl` + `firecrawl.dev` + `docs.firecrawl.dev/llms.txt` · `github.com/microsoft/markitdown` · `github.com/docling-project/docling` · `github.com/yamadashy/repomix` + `repomix.com` · `github.com/oraios/serena` + `oraios.github.io/serena` · `github.com/ref-tools/ref-tools-mcp` + `ref.tools` · `github.com/microsoft/playwright-mcp` · `github.com/exa-labs/exa-mcp-server` · `github.com/github/github-mcp-server` · `github.com/modelcontextprotocol/servers` · `github.com/unclecode/crawl4ai` · `github.com/coderamp-labs/gitingest` · `github.com/asyncfuncai/deepwiki-open` · `deepwiki.com/badge-maker` · `github.com/answerdotai/llms-txt` · `github.com/arabold/docs-mcp-server` · `github.com/D4Vinci/Scrapling` · `github.com/idosal/git-mcp` · `github.com/jina-ai/reader`

**Directories / registries:** `registry.modelcontextprotocol.io/docs` · `glama.ai/mcp/servers` · `smithery.ai/docs` · `mcp.so/submit` · `github.com/punkpeye/awesome-mcp-servers` · `trendshift.io`

**Harness documentation (one per row in §3.2–§3.5):** `code.claude.com/docs/en/mcp-quickstart` · `developers.openai.com/codex/mcp` · `cursor.com/docs/mcp` + `/docs/cli/mcp` · `docs.windsurf.com/windsurf/cascade/mcp` · `docs.devin.ai/cli/extensibility/mcp/configuration` · `zed.dev/docs/ai/mcp` · `code.visualstudio.com/docs/copilot/customization/mcp-servers` · `docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers` · `docs.cline.bot/mcp/mcp-overview` · `docs.continue.dev/customize/deep-dives/mcp` · `geminicli.com/docs/tools/mcp-server` · `opencode.ai/docs/mcp-servers` · `ampcode.com/docs/customize/mcp` · `kiro.dev/docs/mcp/` · `jetbrains.com/help/ai-assistant/mcp.html` · `junie.jetbrains.com/docs/junie-cli-mcp-configuration.html` · `kilo.ai/docs/automate/mcp/using-in-kilo-code` · `docs.zoocode.dev/features/mcp/using-mcp-in-roo` · `qwenlm.github.io/qwen-code-docs/en/users/features/mcp` · `goose-docs.ai/docs/getting-started/using-extensions` · `github.com/charmbracelet/crush` · `docs.warp.dev/agents/capabilities/mcp` · `docs.trae.ai/ide/model-context-protocol` · `docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-config-CLI.html` · `antigravity.google/docs/mcp` · `learn.microsoft.com/en-us/visualstudio/ide/mcp-servers` · `developer.android.com/studio/gemini/add-mcp-server` · `developer.apple.com/documentation/xcode/giving-external-agents-access-to-xcode` · `docs.factory.ai/cli/configuration/mcp` · `docs.openhands.dev/overview/model-context-protocol` · `docs.mistral.ai/vibe/code/cli/mcp-servers` · `docs.x.ai/build/features/mcp-servers` · `kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html` · `github.com/iflow-ai/iflow-cli` · `assistant.posit.co/docs/reference/mcp-servers/` · `docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup` · `docs.augmentcode.com/setup-augment/mcp` · `firebase.google.com/docs/studio/mcp-servers` · `support.claude.com/en/articles/10949351` · `help.openai.com/en/articles/12584461` · `perplexity.ai/help-center/en/articles/11502712` · `librechat.ai/docs/features/mcp` · `lmstudio.ai/blog/lmstudio-v0.3.17` · `docs.anythingllm.com/mcp-compatibility/overview` · `jan.ai/docs/desktop/mcp` · `docs.msty.ai/studio/toolbox/tools` · `docs.cherry-ai.com/advanced-basic/extensions/mcp` · `docs.chatwise.app/tools` · `docs.chatboxai.app/en/guides/mcp` · `manual.raycast.com/ai/model-context-protocol` · `docs.boltai.com/docs/plugins/mcp-servers` · `github.com/nanbingxyz/5ire` · `github.com/voideditor/void` · `github.com/RooCodeInc/Roo-Code` · `github.com/Aider-AI/aider/issues/4506` · `github.com/plandex-ai/plandex/issues/241` · `betterstack.com/community/guides/ai/oh-my-pi-ai-coding-agent` · `i-scoop.eu/omp-the-terminal-coding-agent-that-turns-your-cli-into-an-ide`

**Own repo:** `README.md` (`:15`, `:38`, `:256-283`) · `docs/brand/BRAND.md` §7 · `docs/design/SHADCN_CONVENTIONS.md` · `brand/tokens.json` · `scripts/sync-brand-tokens.mjs` · `docs/scripts/sync-stats.mjs` · `tests/test_brand_tokens.py` · `marketing/*` (13 assets, §2.4) · `docs/MARKETING_PLAN.md` · `docs/FEATURE_AUDIT_ROADMAP.md` · `docs/SEO_GUIDE.md` · `docs/RESEARCH_MULTI_AGENT.md`

**Research artifacts:** `D:\hermes\.hermes\cache\scratch\stars_fresh.tsv` (402 starred repos) · `D:\hermes\.hermes\cache\delegation\subagent-summary-1-20260928_173951_493289.txt` · `D:\hermes\.hermes\cache\delegation\live\deleg_014cf109\task-{0,1,2}.log`


---

## 11. Review decisions and execution contract

Reviewed with the repository owner on 2026-09-28.

| Decision | Locked value |
|---|---|
| Execution scope | Execute the complete internal roadmap across Phases 0–3; do not silently drop feature families. |
| External side effects | Checkout-only. Do not mutate GitHub repository settings, publish directory listings, open public PRs, upload media, or publish launch posts. Produce local runbooks and artifacts for those actions instead. |
| Canonical MCP command | `docharvest mcp`. Installer output and documentation MUST use this command unless a client requires a different platform-specific wrapper. |
| MCP update rule | Any MCP protocol, SDK, manifest, transport, tool-schema, or README change required by the roadmap MUST be implemented and tested in this repository; `server.json`, MCP docs, and registry checks stay synchronized. |
| Execution plan | `docs/superpowers/plans/2026-09-28-growth-roadmap.md` is the task-level implementation plan. This audit remains the evidence and prioritization source. |
| Acceptance discipline | Each feature requires a regression test, user-facing documentation, and a local smoke proof. External-only acceptance criteria are recorded as `MANUAL` rather than claimed complete. |

### 11.1 Scope clarification

The roadmap contains three different deliverable classes:

1. **Implementable in this checkout:** source, tests, README/showcase changes, benchmark fixtures, local `llms.txt` artifacts, installer/deeplink generators, and runbooks.
2. **Requires a live third-party system:** GitHub topics/Discussions/social preview, registry and directory submissions, public launch posts, sponsors, and published external URLs. These remain local `MANUAL` checklists under the owner's checkout-only decision.
3. **Requires a product policy choice not present in the original audit:** embedding backend, document-parser dependency, network-auth model, notification providers, and secret-redaction policy. The implementation plan selects conservative local-first defaults and makes optional integrations explicit; it does not add telemetry or access-control bypass.

No public metric is promoted from the research document without a reproducible local source. Reference-capture numbers remain labelled as reference measurements, not guarantees.
