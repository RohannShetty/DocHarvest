# Plan 014: Add coverage for capture cancellation (the GUI Cancel button path)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/api.py src/docharvest/engine.py src/docharvest/gui/bridge.py tests/test_shell_api.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

`CaptureOptions.cancel_check` is the only way a user stops a runaway crawl (the GUI's Cancel button wires `bridge.py`'s `_cancel_event` into it; the TUI's stop affordance will use it too). A repo-wide grep of `tests/` for `cancel_check` returns **zero matches**. A regression in any of the four check sites (before crawl, inside the fetch loop, between fetch and completion, or at the facade boundary) would ship silently — and the blast radius is a user unable to stop an expensive capture.

## Current state

- `src/docharvest/api.py` — `CaptureOptions` declares `cancel_check` (verified line ~76). The facade checks it (verified lines ~513-514):
```python
        if options.cancel_check and options.cancel_check():
            raise CaptureError("Capture aborted by user")
```
  …right before invoking the engine, and plumbs it into the engine call (line ~527).
- `src/docharvest/engine.py` — `download_one` checks it twice per page (lines ~458 and ~489-490 in the render/non-render branches), `_bfs_crawl`'s enqueue path and the post-download executor loop check it too (lines ~444-445, ~458, ~489, ~538), each raising/returning cancel semantics.
- `src/docharvest/gui/bridge.py` — wires `_cancel_event` into the capture call (line ~234).
- `tests/test_shell_api.py` — the facade test harness: `FakeEngine(pages=..., on_start=callable)` records calls; `run_capture(tmp_path, options, engine, ...)` helper injects the fake engine via `api._load_stream_download`; a `library` fixture injects a temp `StorageManager` via `api._default_storage`. Tests assert on `pytest.raises(CaptureError, match="...")` and on the `events` list. Exemplar error-path tests: `TestCaptureValidation` (max_pages/workers/output_mode) and `test_engine_rejected_signature...` (line ~232) — read those two before writing yours.
- Grep proof: `grep -rn "cancel_check" tests/` → no output.

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_shell_api.py -q`           | all pass            |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `tests/test_shell_api.py`
- (If you uncover a real defect while writing these tests, STOP — do not fix it in this plan; report it.)

**Out of scope** (do NOT touch, even though they look related):
- `src/docharvest/api.py`, `engine.py` — behavior changes belong in a separate plan; this plan only *measures* current behavior.
- GUI bridge tests (`test_gui_bridge.py`) — the bridge's cancel wiring is covered by existing thread-safety tests; not in scope.

## Git workflow

- Branch: `advisor/014-cancel-check-tests` (branch from `master`)
- Commit: `test(api): cover cancel_check capture paths`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Cancel before crawl starts

Add `test_cancel_before_crawl_raises_capture_error` to `tests/test_shell_api.py` following the `TestCaptureValidation` style:

```python
def test_cancel_before_crawl_raises_and_writes_nothing(tmp_path, library, ...):
    engine = FakeEngine()
    options = CaptureOptions(local_dir=tmp_path / "out",
                             cancel_check=lambda: True)
    with pytest.raises(CaptureError):
        run_capture(tmp_path, options, engine=engine)
    assert engine.calls == []           # engine never invoked
    # assert no page tree / metadata written into tmp library
```

(Adapt fixture names to the live file: the `library` fixture and `run_capture` signature — read the fixtures block at the top of the file first.)

**Verify**: the new test passes, and `engine.calls == []` actually holds (if it doesn't, STOP — that is a real bug to report, not to paper over).

### Step 2: Cancel delivered to the engine and surfaced

Two tests:

1. `test_cancel_check_passed_to_engine` — `FakeEngine` records kwargs (its `calls` list); assert `cancel_check` in `calls[0]` and that it is the same callable. (The facade plumbs it; this pins the contract.)
2. `test_engine_cancel_runtime_error_propagates` — `FakeEngine(on_start=...)` raising `RuntimeError("Capture aborted by user")` (or `fail_calls=1` — read `FakeEngine.__call__`) — assert the surfaced exception type/message. **Document current behavior exactly**: at plan time the facade converts only `TypeError`s to `CaptureError`; a `RuntimeError` from the engine propagates as `RuntimeError`. If your test shows anything else, write the test to the *observed* behavior and note it in your report — do not "fix" the facade.

**Verify**: both tests pass.

### Step 3: Mid-run cancellation observable through progress events

`test_cancel_during_crawl_stops_cleanly` — if the current facade/engine event seam supports it cheaply: make `cancel_check` flip to True after N calls (e.g. a counter via `itertools.count`), run capture, and assert either `CaptureError` is raised or the run completes with zero/partial pages — whichever the code does. **Read the code path first and write the assertion to the observed behavior**; if the flip trips the pre-engine check only, assert that (and this test then duplicates Step 1 — in that case skip it and say so).

**Verify**: test passes.

### Step 4: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- New tests (3–4) in `tests/test_shell_api.py`, FakeEngine-based, no network.
- Pattern: existing `TestCaptureValidation` + `test_engine_rejected_signature*` (lines ~119-232).

## Done criteria

- [ ] `grep -rn "cancel_check" tests/` returns matches (your tests)
- [ ] The three new tests pass; full suite passes
- [ ] Behavior quirks observed (e.g. `RuntimeError` escaping unconverted) are listed in your report — no source changes made for them
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The facade does not actually forward `cancel_check` to the engine (contract broken — that is a bug to report, not to fix here).
- Writing the tests requires source changes to pass (report the minimal change you think is needed; do not make it).
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The four check sites in the engine + one in the facade are the whole cancellation contract; if a fifth is ever added, mirror the test pattern.
- Known open question (report only): should engine-raised `RuntimeError("Capture aborted by user")` be converted to `CaptureError` at the facade? Tracked as a follow-up decision, not this plan.
