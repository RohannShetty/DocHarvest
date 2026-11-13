# Plan 026 (SPIKE): Incremental refresh — design and prototype `capture --changed-only`

> **Executor instructions**: This is a **design/spike** plan, not a build plan. The deliverable is a design document plus a *validated prototype* behind an internal flag — not a shipped feature. Do not merge the prototype into user-facing paths. If any STOP condition occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/providers/ src/docharvest/engine.py docs/FEATURE_AUDIT_ROADMAP.md GROWTH_AUDIT.md`
> If any in-scope file changed since this plan was written, compare against the live code and report drift.

## Status

- **Priority**: P2
- **Effort**: L (coarse)
- **Risk**: MED
- **Depends on**: none (005 should land first to avoid conflicts in engine.py; not a hard dependency)
- **Category**: direction
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

The repo's own P1 backlog (`GROWTH_AUDIT.md:68`, item F1) states it verbatim: "A product whose headline is *version diffing* currently re-downloads all 673 pages to find one edit." Grep today returns zero hits for `etag|If-Modified-Since|changed_only|last_modified` in `src/` — there is no incremental path at all. A cheap `refresh` turns the flagship diff feature (VersionManager snapshots/diffs, MCP `diff_versions`, CLI `diff`) into a real product loop and unlocks the scheduled-capture item (F9) downstream. This spike decides **how** and produces a working proof on a real-ish fixture, not a half-built feature.

## Scope of the spike

Answer, with evidence from this codebase:

1. **Cache layout** — where under `~/.docharvest/docs/<domain>/` the per-page revalidation state lives (candidates: extend `metadata.json`, a new `revalidate.json`, or page frontmatter). Constraints observed: `metadata.json` is the registry and is rewritten on snapshots; `atomic_write_text` everywhere; `StorageManager` owns all library paths. Decide and document; do not implement both.
2. **Revalidation mechanism** — in priority order: (a) `ETag`/`If-None-Match`, (b) `Last-Modified`/`If-Modified-Since`, (c) content-hash compare (always available, costs a full fetch). Design the fallback ladder; note that HEAD-then-GET vs conditional-GET trade bandwidth vs requests (one round-trip either way if conditional).
3. **CLI surface** — `docharvest capture <url> --changed-only`: confirm `CaptureOptions` can carry it additively (frozen dataclass — adding a defaulted field is additive; the TUI mirror `engine_protocol.py` would then need it too, which per its pin requires the parity test from plan-audit findings — flag this in the design, do not edit the pin in the spike).
4. **Correctness gate** — how a test proves "modified page detected byte-exactly" (fixture server serving 304 first, then 200 with changed bytes).

Deliverables:
- `docs/adr/0008-incremental-refresh.md` (or the next ADR number — check `docs/adr/`… if no ADRs exist, propose the path in the report and write to `plans/026-output.md` instead — do not create docs/adr/ unasked… **advisor note**: `docs/` is the Next.js showcase workspace; an ADR belongs in the Python repo's docs area or in `plans/`; decide in the report, do not guess).
- Prototype behind `DOCHARVEST_CHANGED_ONLY=1` env gate (not a CLI flag yet), implementing conditional-GET for the **generic HTML provider path only** (no SPA/render support in the spike — say so).

## Current state (evidence the spike must use)

- `src/docharvest/providers/base.py` — `Provider.fetch(url, session)` implementations return `PageContent`; `src/docharvest/utils/retry.py` — `create_session()` with `TimeoutHTTPAdapter`, backoff, retry strategy.
- `src/docharvest/engine.py` — `_bfs_crawl` (discovery fetches pages for links), `download_one`/`stream_download` (parallel fetch), `download_urls`.
- `src/docharvest/storage/manager.py` — `save_doc`, `metadata.json` registry, `DomainLock`.
- `src/docharvest/api.py` — `CaptureOptions` (frozen; `LATEST_ONLY` helpers), `capture()`.
- `src/docharvest/tui/engine_protocol.py` — the pinned TUI mirror (do not edit).
- `tests/conftest.py:60-123` — local routing HTTP fixture server (no real network) — the revalidation fixture should reuse this harness.
- `GROWTH_AUDIT.md:68` F1 verification column: "Re-running on an unchanged site makes ~0 network fetches and completes in seconds."
- `GROWTH_AUDIT.md:90` P2 (`--changed-only` appears there too as candidate surface).

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Spike tests | `uv run pytest tests/test_engine_discovery.py -q` (baseline) | all pass |
| Full suite| `uv run pytest tests/ -q` (baseline)                 | all pass |

## Scope

**In scope**
- A design document (path as decided in the report)
- The env-gated prototype in `providers/base.py` + `engine.py` (well-marked `# SPIKE:` comments, revertible in one hunk), plus its fixture test
- `benchmarks/`/fixtures if a local corpus is needed

**Out of scope**
- Any default-on behavior change
- The CLI flag itself (`--changed-only`) — additive follow-up plan
- SPA/render path, changed-page diffing UI/UX, and ETag support for the `.md`-probe path (report that it composes but is unimplemented in the spike)
- `CaptureOptions`/`engine_protocol.py` changes

## Git workflow

- Branch: `advisor/026-incremental-refresh-spike` (branch from `master`)
- Do NOT push; do NOT merge; leave the branch for review.

## Steps

### Step 1: Baseline + harness
Read the cited files. Run the suite once to confirm green. Sketch the ADR skeleton.

### Step 2: Design document
Write the design covering the four questions above; include the fallback ladder, the metadata layout with exact field names, the invalidation semantics (cache-key drift, domain rename, manual `~/.docharvest` deletion), and a rollback story (prototype deletable without migration).

### Step 3: Prototype
Implement conditional-GET caching for the generic/HTML path behind `DOCHARVEST_CHANGED_ONLY=1`: store `{url, etag, last_modified, sha256, fetched_at}` per page in the chosen layout; on re-crawl, skip re-download when revalidation yields not-modified **and** report counts (`pages_skipped_revalidation`) through the existing progress callback channel (or log + warnings — do not extend frozen dataclasses).

### Step 4: Fixture proof
Add a fixture test using the conftest HTTP server: first capture stores validators; mutate one page; re-capture; assert the changed page's bytes were refetched and the unchanged page's were not (assert via request-log counters in the fixture server).

### Step 5: Report
One-page report: what the design concludes, what the prototype proved, measured request counts on the fixture, what breaks (render path, snapshotting semantics of unchanged-but-present pages — think: should unchanged pages still re-snapshot? answer and justify), and the follow-up build plan skeleton.

## Done criteria

- [ ] Design document exists at the agreed path with all four questions answered
- [ ] Prototype env-gated; full suite still green; new fixture test green
- [ ] ~0 revalidation requests for an unchanged site demonstrated on the fixture (report numbers)
- [ ] No user-facing behavior change on master (`DOCHARVEST_CHANGED_ONLY` unset path is byte-identical)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `CaptureOptions` must change to carry the result (it must not, per above).
- The fixture harness cannot observe request counts without deep changes (report; a playback-style alternative is acceptable).
- ETag/Last-Modified support in the `.md`-probe path turns out to be mandatory for correctness on GitBook sites (report with evidence before extending scope).

## Maintenance notes

- The design must assume the cache is a *hint*: a poisoned cache must never silently drop a changed page from `pages/` — snapshots already capture current content; the refresh path changes only *which bytes are re-downloaded*.
- If this spike's fixture numbers don't show a meaningful request-count reduction, say so and recommend deferring — a no-go result is a valid outcome.
