# Plan 019: Centralize `www.` stripping with `removeprefix` instead of `str.replace`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/engine.py src/docharvest/mcp/server.py src/docharvest/cli.py src/docharvest/api.py src/docharvest/providers/base.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

Four places strip a leading `www.` with mid-substring `str.replace("www.", "")`. `str.replace` removes **every occurrence anywhere**: a host like `a.www.example.com` becomes `a.example.com`, colliding the storage key of two different sites into one domain directory (mixed pages, metadata, and FTS index rows). `api.py` handles the prefix correctly; the other three do not — the "single source of truth" convention says URL normalization belongs in `providers.base`. Existing libraries with mangled names are out of scope (no migration); this plan stops new mangling.

## Current state

Verified at HEAD ea307bd:
- `src/docharvest/engine.py:303` — `host.replace("www.", "")`-style stripping inside crawl bookkeeping (locate the exact line; it computes the domain key for storage).
- `src/docharvest/mcp/server.py:108` — same pattern inside `_domain_from_url(url)`.
- `src/docharvest/cli.py:225` and `cli.py:249` — same pattern in display/path helpers.
- `src/docharvest/api.py:392` — inconsistent-but-correct handling (uses `removeprefix` or an equivalent prefix check; confirm).
- `src/docharvest/providers/base.py` — home of `normalize_url()` (the designated single normalization point, re-exported by `utils/discovery`). Add the helper here.
- `normalize_url` already exists there; match its style (module-private underscore functions are re-exported deliberately; a public `strip_www_prefix` is appropriate).

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_engine_discovery.py tests/test_mcp_server.py tests/test_shell_cli.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/providers/base.py` (add `strip_www_prefix`)
- `src/docharvest/engine.py`, `src/docharvest/mcp/server.py`, `src/docharvest/cli.py` (call it)
- `src/docharvest/api.py` (only if its correct handling is an inline local re-implementation — replace with the shared helper)
- `tests/test_engine_url_identity.py` (add the regression tests there if present, else `tests/test_utils.py`)

**Out of scope** (do NOT touch, even though they look related):
- `normalize_url()` behavior and its re-exports.
- `domain_to_path_name()`.
- Storage migration for previously mangled domain directories.

## Git workflow

- Branch: `advisor/019-www-strip` (branch from `master`)
- Commit: `fix(url): strip leading www. prefix only; centralize helper`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: One helper

In `providers/base.py` next to `normalize_url`:

```python
def strip_www_prefix(host: str) -> str:
    """Remove a single leading ``www.`` from *host* (idempotent, prefix-only)."""
    return host.removeprefix("www.")
```

### Step 2: Rewire the four sites

Replace each `x.replace("www.", "")` with `strip_www_prefix(x)` (import from `..providers.base` / `.providers.base` / `.base` matching each file's existing import style — `providers.base` is already imported in engine and mcp). For `api.py`, replace the equivalent inline logic with the helper if it is a local re-implementation; leave `normalize_url` untouched.

**Verify**: `grep -rn 'replace("www."' src/` → no matches.

### Step 3: Regression tests

Add tests (in `tests/test_engine_url_identity.py` if it exists — `ls tests/` to check — else `tests/test_utils.py`):

1. `strip_www_prefix("www.example.com") == "example.com"`
2. `strip_www_prefix("a.www.example.com") == "a.www.example.com"` (no mid-string removal)
3. `strip_www_prefix("www.www.example.com") == "www.example.com"` (single prefix removal)
4. `strip_www_prefix("example.com") == "example.com"`

**Verify**: the tests pass.

### Step 4: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- Four unit tests of the helper (Step 3).
- Verification: full suite green; `grep -rn 'replace("www."' src/` empty.

## Done criteria

- [ ] No mid-string `www.` replacement remains in `src/`
- [ ] All four call sites use the shared helper
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `normalize_url()` already performs www-stripping somewhere non-obvious and these call sites are downstream of it (report; double-stripping is harmless but the architecture note belongs in the report).
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Hosts with `www.` as a *second-label* component are legitimate (rare but real); `removeprefix` semantics from now on, everywhere.
- If a bulk domain-dir migration is ever wanted, script it separately; not this plan.
