# Plan 015: Make coverage measurement real (pytest-cov is installed but never run)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- pyproject.toml .github/workflows/ci.yml tests/`
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

`pytest-cov>=4.0` is a declared dev dependency, but nothing in the repo ever runs with `--cov`: there is no `[tool.coverage]` section in `pyproject.toml`, no `.coveragerc`, no `fail_under` anywhere. CI runs `python -m pytest tests/ -q --tb=short --timeout=120` with no coverage flags. Net effect: the project's own `pytest-cov` dependency is dead weight and every "is this module tested?" question is unanswerable — which is exactly how the zero-coverage `cancel_check` path (plan 014) went unnoticed.

## Current state

- `pyproject.toml` (verified at HEAD ea307bd): `[tool.pytest.ini_options]` exists (`tmp_path_retention_policy`, `markers = ["real_min_content_config: ..."]`). No `[tool.coverage.*]` sections. `[project.optional-dependencies].dev` pins `pytest-cov>=4.0`.
- `.github/workflows/ci.yml` — the `test` job (verified): setup-python matrix `["3.10", "3.12"] × [ubuntu-latest, windows-latest]`; install `pip install -e ".[dev,mcp]"`; test step `python -m pytest tests/ -q --tb=short --timeout=120`. No `--cov`.
- The suite today: ~936 tests collected via `uv run pytest --collect-only -q` (≈47s); the full run is the CI gate.

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Coverage  | `uv run pytest tests/ --cov=src/docharvest --cov-report=term-missing -q` | report printed, exit 0 or (expected) < threshold fails — see Step 2 |
| Full suite| `uv run pytest tests/ -q`                            | all pass (coverage flags not added to the default run) |

## Scope

**In scope** (the only files you should modify):
- `pyproject.toml` (add `[tool.coverage.run]` and `[tool.coverage.report]`; raise no dependency pins)
- `.github/workflows/ci.yml` (add `--cov` to the test step; add a `coverage config` note if needed)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- Raising `fail_under` above a threshold the suite meets — set the gate at/under the measured value, never above it.
- Adding `pytest-cov` to the `[dependency-groups].dev` block — plan 023 handles the dev-group dedupe; do not pre-empt it.
- Rewriting any source to improve coverage. This plan *measures*; improving is future work fed by the report.

## Git workflow

- Branch: `advisor/015-coverage-measurement` (branch from `master`)
- Commit: `ci(test): measure coverage in CI (fail_under at current baseline)`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add coverage config

Add to `pyproject.toml`:

```toml
[tool.coverage.run]
source = ["src/docharvest"]
branch = true

[tool.coverage.report]
show_missing = true
skip_covered = false
exclude_also = [
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]
# Do NOT set fail_under yet — measure first (Step 2).
```

### Step 2: Measure

Run the coverage command from the table. Record the total percentage from the printed report (it will be in the last line, e.g. `TOTAL   …  74%`).

**Verify**: the report prints; copy the measured number into the plan's commit message or PR description (not into a README claim).

### Step 3: Set the gate at/below the measured value

Add to `[tool.coverage.report]`: `fail_under = <measured − 1>` (floor, e.g. measured 74 → `fail_under = 73`; if measured < 50, use measured−5 and note it). Rationale in a comment: "baseline ratchet — raise deliberately, never lower."

### Step 4: Wire CI

In `.github/workflows/ci.yml`'s test step: `python -m pytest tests/ -q --tb=short --timeout=120 --cov=src/docharvest --cov-report=term-missing`. Do **not** switch setup-python caching in this plan (plan 022 handles caching). Keep the matrix unchanged.

### Step 5: Full suite

**Verify**: `uv run pytest tests/ -q` (no coverage) still passes; then the CI-equivalent command with `--cov` and `fail_under` exits 0.

## Test plan

- No new tests; the CI job itself is the verification.
- Verification: both commands in Step 5 exit 0.

## Done criteria

- [ ] `[tool.coverage.run]` and `[tool.coverage.report]` exist in `pyproject.toml` with `fail_under` at or below the measured baseline
- [ ] `ci.yml` test step runs with `--cov`
- [ ] CI-equivalent local command `uv run pytest tests/ --cov=src/docharvest --cov-report=term-missing -q` exits 0
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] The measured baseline number is written in the commit message
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The coverage run fails to complete (it may take longer than 120s per test node — if the whole run exceeds 20 minutes, report instead of forcing it; the CI timeout is `--timeout=120` per test, not per suite, so completion should be fine).
- The measured coverage is implausibly high (>95) or low (<30) — something is off with the config; report, do not gate.

## Maintenance notes

- `fail_under` is a ratchet: raise it in deliberate PRs with the report attached; never lower it to make a failing PR pass.
- The per-node matrix runs coverage twice (ubuntu/windows); if runtime becomes a problem, gate coverage on ubuntu only — report first.
