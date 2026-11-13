# Plan 029 (SPIKE): Ingest-side untrusted-content screening (prompt-injection flag + secret scrub)

> **Executor instructions**: This is a **design/spike** plan. The deliverable is a design document plus a working flag-first scrubber behind an opt-in, evaluated against a fixture corpus — not a silent content mutator in the default path. If any STOP condition occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/output_contract.py src/docharvest/api.py GROWTH_AUDIT.md`
> If any in-scope file changed since this plan was written, compare against the live code and report drift.

## Status

- **Priority**: P2 (repo's own P1 — `GROWTH_AUDIT.md:75` item F8; F14 secret scrubbing folds in naturally)
- **Effort**: M (coarse)
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

DocHarvest's pitch is agent-consumed, local-first documentation. Captured pages are arbitrary third-party content — adversarial by design availability — and today they flow unfiltered into agent context: the repo advertises SHA-256 integrity ("authenticates bytes, not intent", `GROWTH_AUDIT.md:75`), while a competitor (Scrapling) already markets stripping injection payloads before the agent sees them. The repo's own P1 backlog carries this; F14 (secret scrubbing, S–M) is its sibling. The product's credibility with security-conscious users hinges on this being real, not a marketing claim — and it must be **flag-first**: scrubbing user content silently would destroy the archival fidelity the tool exists for.

## Evidence anchors (must be cited in the design doc)

- `GROWTH_AUDIT.md:75` (F8, P1, TODO): "A fixture page carrying an injection payload is flagged, not passed through."
- `GROWTH_AUDIT.md:82` (F14, P3, TODO): "A fixture containing an API key is redacted."
- Zero hits for `injection|scrub|redact` anywhere in `src/` (verified at ea307bd).
- `output_contract.py` — the normalize/publish boundary where pages become Markdown artifacts and where `CaptureResult.warnings` exists as the non-fatal issue channel.
- `CaptureResult.warnings` — the established surfacing channel (see `api.py`: indexing failures already surface this way).
- SHA-256 mention: output contract hashing for `.manifest.json` — the design must explicitly state what SHA-256 proves and does not prove.

## Scope of the spike

1. **Threat model + non-goals** — what this catches (instruction-shaped text targeted at agents: `ignore previous instructions`, fake tool-use directives, fake system prompts, hidden unicode trigger phrases, role/jailbreak markers; credential-shaped strings: common API key formats, private-key blocks, cloud token prefixes) and what it deliberately does not catch (semantically-valid-but-malicious prose; natural-language persuasion; encoded payloads beyond the scanner's depth — state explicitly).
2. **Where** — one screen at the **normalize boundary** in `output_contract.py` (or `api.py` if that is where normalization actually happens after the 005/006 refactor — read the code at execution time; the screen must run once, on the page content, pre-write).
3. **What** — pattern+heuristic scanner with a **confidence** field per hit; actions in priority: `flag` (default) → `quarantine-file` (opt-in: page shipped under `pages-quarantine/` with a manifest note) → `redact` (opt-in for the secret class only). **Nothing mutates content by default.**
4. **Surfacing** — hits attached to `CaptureResult.warnings` summaries (counts + page URLs + classes), plus a `security_findings` section in the written manifest (`llms.txt` or `.manifest.json` — pick one and justify; the manifest is the artifact's machine-readable face). The GUI shows warnings already — no GUI work needed.
5. **Evaluation** — fixture corpus: 3 injection-bearing pages, 3 benign-but-adversarial-looking pages (docs about prompt injection, security advisories quoting payloads — precision test), 2 secret-bearing pages. Measure flag rate on both classes; target: all 3 malicious flagged, ≤1 false positive on the benign set (perfection not required; honesty required).

## Current state (read these)

- `src/docharvest/output_contract.py` — where content is normalized/written (`publish`, `write_page_tree`); the frontmatter/`source_url` handling.
- `src/docharvest/api.py` — `CaptureOptions` (frozen), `CaptureResult.warnings`.
- `src/docharvest/search/index.py` — `_strip_unprintable` exists (a precedent: one scanner that already cleans content — read it; the screening pass is its sibling, NOT its extension).
- `tests/conftest.py` — fixture server harness for crafting hostile pages without real network.

## Steps

### Step 1: Baseline
Read the files; run the suite; record the exact normalization boundary line numbers.

### Step 2: Design document
Cover the five scope points; include the full threat-model table with example-shaped (not runnable) payload classes; the warning/manifest shapes with exact field names; the failure policy (scanner exception → warning "screening unavailable", content unchanged, never a capture failure).

### Step 3: Fixture corpus + scanner
Build the 8 fixtures and the scanner. Keep the scanner data-driven (pattern table with class labels) so patterns can be extended without code changes. All content flows through one `screen_page(page) -> list[Finding]` seam.

### Step 4: Wire behind flags (default off for redact/quarantine; flag-on default for warnings)
`DOCHARVEST_SCREEN=flag|off` env override (default `flag`); `DOCHARVEST_SCREEN_REDACT=1` for secret redaction. No CaptureOptions change (frozen contract); if the team later wants a permanent option, that's a follow-up plan.

### Step 5: MCP visibility
`read_doc` responses for flagged pages include a `"security_flags": [...]` summary (additive dict key — MCP tool returns are dicts; consumers ignore unknown keys — confirm no test asserts exact key sets in `test_mcp_server.py`; adjust or report).

### Step 6: Report
One page: corpus results (recall/precision), what landed behind which flag, the recommendation on making `flag` the default, and the F14/secret-scrubbing delta this subsumes or leaves open.

## Done criteria

- [ ] Design document covers all five scope points
- [ ] Fixture corpus in `tests/fixtures/` with the scanner green: 3/3 malicious flagged, ≤1 benign false positive
- [ ] `flag` mode on by default (unless report argues otherwise — then justify); `redact` off by default
- [ ] `warnings` and manifest carry the findings; `read_doc` carries `security_flags`
- [ ] Full suite green
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The normalize boundary is unreachable before content hashing/writing (report the dataflow; propose the alternative seam, do not hack around).
- Benign-page false positives exceed 1 in the corpus after reasonable pattern tuning (report; a noisy screener in the default path is a product failure, not a tuning problem).
- Any MCP contract test asserts exact response key sets requiring heroics to update.

## Maintenance notes

- Pattern tables age badly; ship the corpus and treat it as the regression bed — any future pattern addition must keep benign fixtures green.
- This does not change what SHA-256 means; docs touching both must keep the two claims separate.
- The scrubber must remain strictly additive in `flag` mode — never blocks a capture, never rewrites a byte in default mode. If it ever does, that is the bug.
