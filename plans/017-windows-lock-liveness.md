# Plan 017: Treat Windows OpenProcess access-denied as "alive", not "dead", in DomainLock liveness

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/storage/manager.py tests/test_shell_storage.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 016's tests should land first so a regression has a net)
- **Category**: bug
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

On Windows, `OpenProcess` can fail with `ERROR_ACCESS_DENIED` for a **live** process owned by another user/session (or when the caller lacks the privilege). `is_process_running` returns `False` in that case, so the stale-lock recovery path concludes the lock holder is dead and **steals its lock** — two concurrent captures then run unguarded against the same domain, corrupting `metadata.json` and racing version snapshots: exactly what `DomainLock` exists to prevent. There is a second, subtler wrong case: a recycled PID (pid reuse) — unavoidable and out of scope; this plan fixes only the access-denied verdict, and keeps the steal path conservative in "unknown" states.

## Current state

- `src/docharvest/storage/manager.py` (verified at HEAD ea307bd, lines ~153-181):
```python
def is_process_running(pid: int) -> bool:
    """Check whether a process with the given PID is currently active."""
    if pid <= 0:
        return False
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            SYNCHRONIZE = 0x00100000
            handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION | SYNCHRONIZE, False, pid)
            if not handle:
                return False                      # ← access-denied lands here: reported as DEAD
            exit_code = ctypes.c_ulong()
            STILL_ACTIVE = 259
            if kernel32.GetExitCodeProcess(handle, ctypes.byref(exit_code)):
                alive = (exit_code.value == STILL_ACTIVE)
            else:
                alive = False
            kernel32.CloseHandle(handle)
            return alive
        except Exception:
            return False                          # ← any error: reported as DEAD
    else:
        try:
            os.kill(pid, 0)
            return True
        except (OSError, ProcessLookupError):
            return False
```
- Constants: `ERROR_ACCESS_DENIED = 5`, `ERROR_INVALID_PARAMETER = 87` (Windows). `ctypes.windll.kernel32.GetLastError()` must be called immediately after the failed `OpenProcess` (before any other ctypes call) to read the code.
- `DomainLock.acquire` uses this (and mtime staleness) to decide to steal a lock file owned by a foreign pid; see `acquire`/`_is_stale` in the live file before editing — the steal path unlinks the lock file and recreates it.
- Verified Windows-only defect; POSIX branch (`os.kill(pid, 0)`) distinguishes `EPERM` (alive) from `ESRCH` (dead) correctly and is unchanged.

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_shell_storage.py -q`       | all pass            |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/storage/manager.py`
- `tests/test_shell_storage.py` (add unit tests for the new tri-state helper)

**Out of scope** (do NOT touch, even though they look related):
- POSIX `os.kill` branch — already correct; do not restructure it.
- The staleness/mtime logic and `clear_all_locks` — plan 018.
- PID-reuse mitigation (file created-by matching) — report as follow-up if you notice it, do not implement.

## Git workflow

- Branch: `advisor/017-windows-lock-liveness` (branch from `master`)
- Commit: `fix(storage): Windows OpenProcess access-denied means alive, not dead`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Tri-state liveness

Replace the win32 branch body: introduce (module-private) `_process_state(pid) -> str` returning `"running" | "not_running" | "unknown"`:

```python
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            SYNCHRONIZE = 0x00100000
            handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION | SYNCHRONIZE, False, pid)
            if not handle:
                err = kernel32.GetLastError()
                ERROR_ACCESS_DENIED = 5
                if err == ERROR_ACCESS_DENIED:
                    return "running"           # exists, we just can't interrogate it
                return "not_running"           # ERROR_INVALID_PARAMETER (87) etc.
            exit_code = ctypes.c_ulong()
            if kernel32.GetExitCodeProcess(handle, ctypes.byref(exit_code)):
                alive = exit_code.value == 259  # STILL_ACTIVE
            else:
                alive = True                    # cannot interrogate: do not kill the lock
            kernel32.CloseHandle(handle)
            return "running" if alive else "not_running"
        except Exception:
            return "unknown"
```

`GetLastError` placement: call it immediately after `OpenProcess`, before anything else touches ctypes. (Note: `ctypes.windll.kernel32.GetLastError` maps to the Win32 `GetLastError` — use `ctypes.WinDLL("kernel32", use_last_error=True).GetLastError()` only if the plain variant proves unreliable in your MSVC runtime; the plain `kernel32.GetLastError()` is the common pattern. If calls behave oddly, report the exact error rather than guessing.)

Then `is_process_running(pid) -> bool` = `_process_state(pid) != "not_running"` — i.e., **unknown counts as running** (conservative: never steal on doubt). Hmm — but that inverts on POSIX? No: POSIX branch unchanged; keep the public `is_process_running` semantics for non-Windows exactly as today (`os.kill` success→True else False).

For `"unknown"` (exception path): treat as running too in `is_process_running` — a liveness check that errors must not authorize lock theft.

### Step 2: Steal path stays conservative

In the DomainLock steal branch (locate `acquire`'s stale/dead-pid recovery in the live file), confirm it only steals on an explicit `"not_running"` verdict or `LOCK_STALE_SECONDS` mtime expiry — with the new tri-state, `is_process_running` returning True for unknown already tightens the path; no further changes expected there. If the steal condition is expressed via another route (e.g. inline OpenProcess in `_is_stale`), STOP and report — the fix must be centralized, not duplicated.

**Verify**: `uv run pytest tests/test_shell_storage.py -q` → existing `test_stale_lock_is_stolen` still passes (it relies on mtime staleness, which is untouched).

### Step 3: Unit tests (Windows only)

Add `@pytest.mark.skipif(sys.platform != "win32", ...)` tests in `test_shell_storage.py` mocking `ctypes.windll.kernel32`:

1. `OpenProcess` returns falsy handle + `GetLastError` → 5 → `_process_state` "running"; `is_process_running` True.
2. `OpenProcess` falsy handle + `GetLastError` → 87 → "not_running"; False.
3. `OpenProcess` returns a fake handle; `GetExitCodeProcess` fails → "running".
4. `OpenProcess` raises → "unknown"; `is_process_running` True.

Mocking pattern: monkeypatch `ctypes.windll.kernel32` attribute on the module's imported `ctypes` — since `manager.py` imports `ctypes` inside the function, monkeypatch `ctypes.windll.kernel32` globally in the test with a `types.SimpleNamespace` of fakes. Read how the suite mocks ctypes elsewhere first (grep `ctypes` in tests/).

**Verify**: the four tests pass.

### Step 4: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- Four new unit tests (Step 3); existing stale-lock tests must remain green.
- Verification: `test_shell_storage.py` green; full suite green.

## Done criteria

- [ ] Access-denied (5) maps to "running"; invalid-parameter (87) maps to "not_running"; exceptions map to "unknown"; `is_process_running` returns True for "unknown" on win32
- [ ] `uv run pytest tests/test_shell_storage.py -q` exits 0 incl. new tests
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The steal logic lives somewhere other than `DomainLock.acquire`'s recovery branch (report the location; the fix must not be duplicated).
- The mocked-ctypes tests show `GetLastError` returning 0/uninitialized (report; DLL binding strategy differs from the plan's assumption).
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Conservative liveness is the correct default for file locks on Windows: a false "running" just delays recovery of genuinely abandoned locks (mtime staleness still reclaims those after 15 min), while a false "dead" corrupts concurrent captures.
- PID reuse remains unmitigated; if it ever bites, the fix is a creation-time-token comparison, not a looser verdict.
