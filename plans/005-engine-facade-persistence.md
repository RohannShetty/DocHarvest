# Plan 005: Make the facade the single owner of persistence (stop the engine writing library + index)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/engine.py src/docharvest/api.py tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

`engine.stream_download` unconditionally constructs its own `StorageManager()` (default base dir — ignoring any facade-configured base) and calls `save_doc` plus `SearchIndex().index_domain(...)` at the end of every crawl. Consequences, all verified at HEAD ea307bd:

1. **`output_mode="local"` leaks into the library.** The engine writes `~/.docharvest/docs/<domain>/docs.md` and indexes it even when the user asked for local-only output. The facade's `output_mode` filtering runs on the publish side only, so it cannot undo the engine's writes.
2. **Double-write per capture in "both" mode.** `docs.md` is written once by the engine (line ~596) and again by `output_contract.publish()` (line ~444); library metadata is updated by both paths with divergent page counts; `metadata.json` history entries get duplicated.
3. **The DI seam is inert.** Tests patch `api._default_storage()` to inject a temp-library `StorageManager`, but the engine constructs its own — patches never intercept engine persistence, so tests pass while real runs double-write.

The engine's persistence is fully redundant: the only caller of `stream_download` is `api.capture()` (verified by repo-wide grep). This plan removes it.

## Current state

- `src/docharvest/engine.py` — end of `stream_download` (verified at HEAD ea307bd, lines ~589-629):
```python
    # ── Save to storage ──────────────────────────────────────
    # Snapshotting is owned solely by api.capture(), ...
    storage = StorageManager()

    storage.save_doc(
        domain=domain,
        content=combined,
        url=url,
        title=entry_title or provider.extract_title(combined, url),
        pages=pages_downloaded,
        provider=provider.name,
        new_pages=pages_downloaded,
        size_kb=round(total_size_kb, 1),
    )

    # ── Index for search ─────────────────────────────────────
    try:
        search = SearchIndex()
        try:
            pages_dir = storage.pages_dir(domain)
        except Exception:  # noqa: BLE001 - a storage without a page tree is fine
            pages_dir = None
        search.index_domain(domain, combined, domain_url=url, pages_dir=pages_dir)
    except Exception as e:
        logger.warning("Search indexing failed: %s", e)

    if progress_callback:
        progress_callback({
            "phase": "done",
            "pages": pages_downloaded,
            ...
        })

    return combined
```
- `src/docharvest/api.py` — the facade, after `normalize_engine_result(raw, url)`, does its own persistence (verified, lines ~620-656): updates library metadata via a storage handle (title/pages/provider, `content=book_text`, best-effort) and calls `SearchIndex(base_dir=storage.base).index_domain(...)` best-effort; both are skipped unless the run's mode writes to the library (inspect the surrounding `if` in the live file before assuming — keep that behavior exactly as-is). It also calls `publish()` which writes the page tree/book/manifests to the local and/or library roots.
- `stream_download(url, *, max_pages, workers, session, provider, progress_callback, path_scope, exclude_paths, timeout, cancel_check, render) -> str` — returns the combined markdown string; keep that return for this plan (plan 006 changes it to structured pages).
- Direct callers of `engine.stream_download`: `api.py` (only production caller) and `tests/test_engine_flow.py:86` (direct call in a test — read it and adapt: the test likely asserts storage side effects, which will no longer exist).
- `tests/test_engine_flow.py` — read it completely before editing; adjust or replace the assertions about engine-side persistence. Do not delete the test wholesale.
- Repo conventions: failures raise/return, no silent swallow; the facade surfaces non-fatal issues in `CaptureResult.warnings`; tests use temp dirs via `StorageManager(base_dir=tmp_path)` and monkeypatched seams (`api._load_stream_download`, `api._default_storage`).

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Install   | `uv pip install -e .`                                | exit 0              |
| Targeted  | `uv run pytest tests/test_engine_flow.py tests/test_engine_providers.py tests/test_shell_api.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/engine.py` (delete the Save/storage block and the Index block; keep `progress_callback` "done" phase and the `return combined`)
- `tests/test_engine_flow.py` (adapt direct-call assertions)
- `src/docharvest/search/` and `src/docharvest/storage/` only if an import becomes unused (remove the unused import lines in `engine.py`)

**Out of scope** (do NOT touch, even though they look related):
- `api.py` publish/metadata/index logic — plan 006 and 007 build on it; this plan must not change what the facade does.
- `output_contract.py` — plan 009.
- `mcp/server.py` — plan 007/011.
- The engine's public signature (`stream_download(...) -> str`) — unchanged in this plan.

## Git workflow

- Branch: `advisor/005-engine-facade-persistence` (branch from `master`)
- Commit: `refactor(engine): drop redundant storage/index writes (facade owns persistence)`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete the engine-side persistence

In `stream_download`, remove: the `storage = StorageManager()` construction, the `storage.save_doc(...)` call, the entire `# ── Index for search ──` try/except block, and any now-unused imports (`StorageManager`, `SearchIndex`) at the top of `engine.py`. Keep everything else, including the `progress_callback({"phase": "done", ...})` block and `return combined`. Update the module docstring of the engine if it claims the engine "saves to storage" — it must not (the facade does).

**Verify**: `grep -n "save_doc\|SearchIndex\|StorageManager" src/docharvest/engine.py` → no matches.

### Step 2: Adapt the direct-call test

Read `tests/test_engine_flow.py`. For the `stream_download(...)` direct call:
- Assertions that `~/.docharvest/docs/<domain>/docs.md` or similar paths were created by the engine must be removed or rewritten to assert what the engine now guarantees: it returns the combined string and performs **no** filesystem writes (use `tmp_path` + monkeypatched home/base if available, or simply assert the returned string and that no storage writes occurred via a fake/mock `StorageManager` — check how the existing suite fakes storage before writing anything).
- If the test was relying on default base dir (real `~/.docharvest`), that was itself a test defect — fix it to use temp dirs.

**Verify**: `uv run pytest tests/test_engine_flow.py -q` → pass.

### Step 3: Prove the "local" mode no longer leaks

In `tests/test_shell_api.py` (read it first — it uses the FakeEngine DI seam), confirm there is coverage that `output_mode="local"` writes nothing to the library; if absent, **add** one test following the file's existing FakeEngine pattern:

```python
def test_local_mode_does_not_write_library(tmp_path, monkeypatch):
    # inject temp storage as library base, capture with output_mode="local",
    # assert the library base dir stays empty (no docs/<domain>/ created)
```

**Verify**: the new test plus the file's existing tests pass.

### Step 4: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass. Investigate any failure that mentions engine-side persistence — that is expectation drift from this change, and the fix belongs in the failing test (rewriting it to use the facade), never by restoring the engine writes.

## Test plan

- Adapt `tests/test_engine_flow.py` (Step 2); add the `output_mode="local"` leak test to `tests/test_shell_api.py` (Step 3).
- Pattern: existing FakeEngine DI in `tests/test_shell_api.py` and temp-`StorageManager` in `tests/test_shell_storage.py`.
- Verification: targeted files pass, then full suite passes.

## Done criteria

- [ ] `grep -n "save_doc\|SearchIndex\|StorageManager" src/docharvest/engine.py` → no matches
- [ ] New test proving `output_mode="local"` leaves the library base empty exists and passes
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Something outside `api.py`/`tests/test_engine_flow.py` calls `stream_download` and *depends* on its storage side effect (grep once more: `grep -rn "stream_download" src/ scripts/ benchmarks/`).
- The facade turns out to persist only under a condition that excludes a case the engine was covering (compare against live `api.py` before deleting — if library writes are conditional on `output_mode != "local"`, engine writes under `"local"` were the bug; deleting them is the fix; deleting them under `"library"` would be data loss).
- Any step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Plans 006-009 build on this engine/facade boundary: 006 stops serializing pages to text; 007 makes the remaining indexing incremental; 009 dedupes the publish loop. Execute them in that order.
- Any future persistence need in the engine must be raised explicitly (via a parameter) or added to the facade — never re-add hidden writes; hidden writes are what made the local/library contract unverifiable.
- The `progress_callback({"phase": "done", ...})` block stays in the engine; the frontend and TUI depend on it.
