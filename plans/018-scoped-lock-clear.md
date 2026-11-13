# Plan 018: Stop the GUI cancel path from deleting every domain's lock files

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/gui/bridge.py tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

When the GUI's capture thread finishes after a user cancel, `bridge.py` runs `self._storage.clear_all_locks(force=True)`. `StorageManager.clear_all_locks(force=True)` deletes **every** `.lock` file under the library's `locks/` directory — including live locks held by another GUI window, a TUI, or a CLI capture that is actively writing to a *different* domain. Those processes then run unlocked against their domains: the exact corruption `DomainLock` prevents. The startup path in the same file already uses the safe call (`force=False`, line ~126), which clears only stale locks and locks owned by this process.

## Current state

- `src/docharvest/gui/bridge.py` (verified at HEAD ea307bd, lines ~376-451 — the method around `_cancel_event`):
```python
        with self._capture_state_lock:
            self._cancel_requested = True
            self._cancel_event.set()
            thread = self._active_thread
            still_running = bool(thread and thread.is_alive())
            if still_running:
                thread.join(timeout=1.0)
                still_running = thread.is_alive()
            if still_running:
                cleared = 0
            else:
                self._active_thread = None
                cleared = self._storage.clear_all_locks(force=True)   # ← line ~386 pre-edit / ~446 in rev ea307bd
        return {
            "success": True,
            "cleared_locks": cleared,
            "worker_still_running": still_running,
        }
```
- `StorageManager.clear_all_locks(force=False)` clears only: locks whose `get_info()` reports stale, locks with no info, and locks whose recorded pid is this process's pid — exactly the abandoned locks this session could own. `force=True` bypasses all of that.
- The bridge does not currently record which domain the capture worked on, so a fine-grained "clear only my domain's lock" fix is out of scope (see Maintenance notes).

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_gui_bridge.py tests/test_gui_bridge_safety.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/gui/bridge.py`
- `tests/test_gui_bridge_safety.py` (add the regression test — create it if it does not exist)

**Out of scope** (do NOT touch, even though they look related):
- `StorageManager.clear_all_locks` itself — its contract (`force` semantics) is correct; the caller chose the wrong force level.
- The startup sweep (`force=False` at line ~126) — already correct.
- `is_process_running` / lock staleness — plan 017.

## Git workflow

- Branch: `advisor/018-scoped-lock-clear` (branch from `master`)
- Commit: `fix(gui): clear only own/stale locks on cancel completion`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: One change, correct force level

Change `cleared = self._storage.clear_all_locks(force=True)` → `force=False`. No other logic changes.

### Step 2: Regression test

In `tests/test_gui_bridge_safety.py`, add a test that:
1. Creates `tmp_path` storage; writes two lock files: one "foreign" live lock (a `<name>.lock` whose recorded pid is a real, *different* live pid — e.g. spawn `python -c "import time; time.sleep(30)"` via subprocess, record its pid, or simply hand-craft a lock file with a pid you know is alive and is not `os.getpid()`) and one own-process or stale lock.
2. Drives the bridge's cancel path with no active thread (set `_active_thread` to None) so `clear_all_locks` runs.
3. Asserts: the foreign live lock file still exists; the result dict reports `cleared` ≥ 1 for the own/stale one.

If fabricating a live foreign pid is infeasible in the test environment, use a pid that is provably alive and foreign (the spawned child) — and kill the child in `finally`.

**Verify**: the new test passes; then both bridge test files pass.

### Step 3: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- One regression test (Step 2).
- Verification: targeted files + full suite green.

## Done criteria

- [ ] `grep -n "clear_all_locks" src/docharvest/gui/bridge.py` → both call sites use `force=False`
- [ ] Regression test proving a foreign live lock survives the cancel path passes
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- You cannot fabricate a foreign *live* pid portably (skip to asserting only the own/stale semantics and report the limitation — do not spawn helpers with shells).
- The bridge code at the cited lines does not match the excerpt (report).

## Maintenance notes

- A precise fix is to have the bridge remember the `domain` it locked (set under `_capture_state_lock` when capture starts) and clear exactly `storage.domain_lock(domain)` — if the capture flow is reworked, prefer that over any `clear_all_locks` call in the cancel path.
- `force=True` should remain reserved for an explicit user-facing "clear stale locks" action, never for incidental post-run cleanup.
