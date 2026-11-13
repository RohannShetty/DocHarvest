# Plan 023: Deduplicate the two dev dependency groups (single pin, two scopes)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- pyproject.toml CONTRIBUTING.md tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

The repo declares its dev tooling twice, with divergent pins:

- `[project.optional-dependencies].dev`: `pytest>=8.0`, `pytest-timeout>=2.3`, `pytest-asyncio>=0.23`, `pytest-cov>=4.0` — **no pyinstaller**.
- `[dependency-groups].dev` (PEP 735, what `uv sync` installs by default): `pytest>=9.1.1`, `pytest-asyncio>=1.4.0`, `pytest-timeout>=2.4.0`, **no pytest-cov**, plus `pyinstaller` + `pyinstaller-hooks-contrib`.

`uv sync` and `pip install -e ".[dev]"` therefore produce different environments (pytest 8 vs 9, coverage tool present vs absent), and the repo's own docs instruct `uv sync --extra dev --extra mcp`, mixing both paths. Plan 015 wires `--cov` into CI; it relies on pytest-cov being present in the install path CI uses (extras) — that must not diverge again.

## Design decision (binding — do not redesign)

- `dependency-groups.dev` is the **uv default**; `uv sync` (no flags) must install everything a contributor needs for tests, coverage, and the exe build.
- `[project.optional-dependencies].dev` is the **pip path**; it ships the pytest/coverage stack only (PyInstaller is a build tool, not needed to run the tests; it stays in the uv group and in the release workflow, which installs it explicitly).
- Shared packages must be pinned **identically** in both; a drift test enforces it.

## Current state

- `pyproject.toml` (verbatim, at HEAD ea307bd):
```toml
[project.optional-dependencies]
...
dev = [
    "pytest>=8.0",
    "pytest-timeout>=2.3",
    "pytest-asyncio>=0.23",
    "pytest-cov>=4.0",
]
...
[dependency-groups]
dev = [
    "pyinstaller>=6.22.2",
    "pyinstaller-hooks-contrib>=2026.6",
    "pytest>=9.1.1",
    "pytest-asyncio>=1.4.0",
    "pytest-timeout>=2.4.0",
]
```
- `CONTRIBUTING.md:16` (approx) — instructs `uv sync --extra dev --extra mcp` for contributors.
- `tests/test_packaging.py` — exists; home for the drift test (see plan 021's Step 2 pattern).

## Commands you will need

| Purpose   | Command                                     | Expected on success |
|-----------|---------------------------------------------|---------------------|
| Install   | `uv sync`                                   | exit 0              |
| Tests     | `uv run pytest tests/ -q`                   | all pass            |

## Scope

**In scope** (the only files you should modify):
- `pyproject.toml`
- `CONTRIBUTING.md` (one line)
- `tests/test_packaging.py` (add drift test)

**Out of scope** (do NOT touch, even though they look related):
- The `mcp` extra backward-compat no-op — intentional, documented in pyproject; keep.
- The `render`/`js` extras.
- Plan 015's `fail_under` (do not change it here).

## Git workflow

- Branch: `advisor/023-dev-group-dedupe` (branch from `master`)
- Commit: `chore(deps): pin dev tooling identically across extras and dependency-groups`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Align the pins

```toml
[project.optional-dependencies]
dev = [
    "pytest>=9.1.1",
    "pytest-asyncio>=1.4.0",
    "pytest-timeout>=2.4.0",
    "pytest-cov>=4.0",
]

[dependency-groups]
dev = [
    "pyinstaller>=6.22.2",
    "pyinstaller-hooks-contrib>=2026.6",
    "pytest>=9.1.1",
    "pytest-asyncio>=1.4.0",
    "pytest-timeout>=2.4.0",
    "pytest-cov>=4.0",
]
```

Add a comment above the extras block:
```toml
# The four pytest packages above are pinned identically to [dependency-groups].dev;
# only PyInstaller differs (build tool, uv-group and release workflow only).
# tests/test_packaging.py::test_dev_pins_match enforces the shared pins.
```

### Step 2: Drift test

In `tests/test_packaging.py` add `test_dev_pins_match`: parse both blocks with `tomllib`; assert the shared package names (`pytest`, `pytest-asyncio`, `pytest-timeout`, `pytest-cov`) have identical specifier strings in both; assert pyinstaller appears only in the group; assert the `dev` extra does not contain pyinstaller.

**Verify**: `uv run pytest tests/test_packaging.py -q` → pass.

### Step 3: CONTRIBUTING one-liner

Point contributors at plain `uv sync` (installs the group by default, which now includes pytest+cov+pyinstaller) and keep `uv sync --extra mcp` only if mcp needs enabling — the mcp SDK is already a base dependency, so plain `uv sync` suffices; adjust the line to `uv sync` with a short note. Read the actual line first; keep the edit minimal.

### Step 4: uv sync + full suite

**Verify**: `uv sync` → exit 0; `uv run pytest tests/ -q` → all pass.

## Test plan

- One drift test (Step 2).
- Verification: `uv run pytest tests/ -q` green.

## Done criteria

- [ ] Shared dev pins identical between the two blocks (asserted by the new test)
- [ ] `pytest-cov` present in `[dependency-groups].dev`
- [ ] `uv sync` succeeds; suite green
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `uv sync` resolves differently than before in a way that breaks the suite (report the resolution diff; do not revert blindly — the whole point is one canonical set).

## Maintenance notes

- Never add a dev package to only one of the two blocks without updating the other and the drift test's expectations.
- If the repo ever drops the pip path entirely, delete `[project.optional-dependencies].dev` and the drift test in one go.
