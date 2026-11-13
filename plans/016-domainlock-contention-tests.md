# Plan 016: Test DomainLock under concurrent acquisition contention

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/storage/manager.py tests/test_shell_storage.py tests/test_storage.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

`DomainLock` is the mechanism that prevents concurrent captures from corrupting `metadata.json` and the versions directory. The existing suite covers acquire/release, second-lock-raises, stale-lock stealing (backdated mtime), and pid recording (`tests/test_shell_storage.py:227-263`, `TestDomainLock`) — but **nothing** exercises simultaneous acquisition from two threads/processes, which is the only way the lock actually earns its name. The plan-audit's claim that DomainLock was "untested" was stale; the remaining gap is precisely the concurrent-contention case.

## Current state

- `src/docharvest/storage/manager.py` — `DomainLock` (verified): lockfile at `<base>/locks/<domain>.lock` (domain name through `domain_to_path_name()`), created with `O_CREAT | O_EXCL` (atomic on Windows and POSIX), `LOCK_STALE_SECONDS = 15 * 60`, lock files record `pid=<pid>`, `acquire`/`release`/`get_info()`; stale or dead-pid locks are reclaimed; `clear_all_locks(force=False)` clears only stale/own locks. `LockHeldError` is raised when a second acquisition hits a healthy foreign lock.
- `tests/test_shell_storage.py` — existing harness: `sm` fixture is a `StorageManager(base_dir=tmp_path)`; `TestDomainLock` (lines ~227-263) covers acquire/release/raises/stale-steal/pid-recording via `os.utime`. The `staleness`/pid-liveness read path uses `os.getpid()` and (Windows) `is_process_running`.
- `tests/test_storage.py` — `test_lock_does_not_use_illegal_characters` is the only DomainLock mention there.
- The two-processes-same-domain scenario is exactly what a ThreadPoolExecutor-free design still permits across processes (CLI + GUI + TUI). Tests use threads; that is sufficient to exercise atomic `O_EXCL` contention on the same file object path.

## Commands you will need

| Purpose   | Command                                                       | Expected on success |
|-----------|---------------------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_shell_storage.py -q`                | all pass            |
| Full suite| `uv run pytest tests/ -q`                                      | all pass            |

## Scope

**In scope** (the only files you should modify):
- `tests/test_shell_storage.py` (add `TestDomainLockContention`)

**Out of scope** (do NOT touch, even though they look related):
- `DomainLock` internals — behavior changes belong to the Windows liveness plan (017), not this one.
- Stale-lock semantics — already tested.

## Git workflow

- Branch: `advisor/016-domainlock-contention-tests` (branch from `master`)
- Commit: `test(storage): DomainLock contention under threads`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Two threads, one domain — exactly one winner

Add `TestDomainLockContention` with an `sm` fixture reuse (the file already provides one):

```python
def test_contending_acquires_one_wins(sm):
    lock_a, lock_b = sm.domain_lock("race.com"), sm.domain_lock("race.com")
    results = []
    def worker(lock):
        try:
            acquired = lock.acquire()
            results.append(("ok", acquired))
        except LockHeldError:
            results.append(("held", None))
    t1, t2 = threading.Thread(target=worker, args=(lock_a,)), threading.Thread(target=worker, args=(lock_b,))
    t1.start(); t2.start(); t1.join(); t2.join()
    winners = [r for r in results if r[0] == "ok"]
    held    = [r for r in results if r[0] == "held"]
    assert len(winners) == 1 and len(held) == 1
    winners[0][1].release()
```

Add a `start_barrier`-style simultaneous start using `threading.Barrier(2)` inside `worker` to maximize contention. After the winner releases, the loser can acquire — assert that too.

**Verify**: the test passes repeatedly (`uv run pytest tests/test_shell_storage.py::TestDomainLockContention -q` run 10 times — if flaky, report the flakiness honestly; do not fix the implementation).

### Step 2: N-thread storm — no crash, no double-hold

`test_lock_storm_serializes`: 8 threads racing to acquire the same domain lock 25 times each, appending `"acquired"`/`"held"` to a shared list; assert: total successful holds are consistent (each iteration at most one holder), no exception other than `LockHeldError`, final lock state clean. Keep runtime < 2s.

**Verify**: passes 10 consecutive runs.

### Step 3: Cross-process smoke (optional, cheap)

Skip unless trivially available — a subprocess-based test is not required for this plan; threads suffice for the O_EXCL path. Note skipped in report.

### Step 4: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- Two contention tests (Steps 1-2). Pattern: `TestDomainLock` in `tests/test_shell_storage.py`.
- Verification: the file passes 10 consecutive runs; full suite passes.

## Done criteria

- [ ] `grep -n "class TestDomainLockContention" tests/test_shell_storage.py` → match
- [ ] Tests pass 10 consecutive runs locally (report the command)
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Contention tests are flaky beyond reruns (the O_EXCL path on this file may be racy in a way threads expose — report timings, do not "fix" DomainLock here).
- The `sm` fixture or `domain_lock` helper differs from the excerpts above (report).

## Maintenance notes

- These tests are the early-warning system for plan 017 (Windows `is_process_running` tri-state) — if contention behavior is already correct under threads, a regression there after 017 must fail here.
- Do not "strengthen" by removing the O_EXCL atomicity in favor of timeouts/retries — the kernel is the arbiter here.
