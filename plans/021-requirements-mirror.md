# Plan 021: Make requirements.txt actually mirror pyproject dependencies (+ a drift test)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- requirements.txt pyproject.toml tests/test_packaging.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

`requirements.txt` declares itself "a mirror of [project.dependencies] in pyproject.toml" (pyproject is source of truth) — but it is missing three of nine runtime dependencies: `mcp>=1.2.0`, `pywebview>=6.2.1`, `fpdf2>=2.8.8`. A user installing via `pip install -r requirements.txt` gets a package where `docharvest mcp` crashes at import, `--gui` is unavailable, and PDF export fails — the three headline capabilities — with no hint why. This exact drift already happened twice (the extras system has the same shape in the duplicate dev groups); the mirror needs a test, not just a re-sync.

## Current state

- `requirements.txt` (verified at HEAD ea307bd, complete file):
```
# Runtime dependencies - mirror of [project.dependencies] in pyproject.toml.
# pyproject.toml is the source of truth; this file exists only for
# `pip install -r requirements.txt` workflows. GUI (customtkinter) was removed
# in v7 (replaced by the Textual TUI) and tiktoken was never used.
requests>=2.28.0
beautifulsoup4>=4.11.0
markdownify>=0.11.0
lxml>=4.9.0
textual>=0.60
pyperclip>=1.8.0
```
- `pyproject.toml` `[project].dependencies` (verbatim at HEAD):
```
    "requests>=2.28.0",
    "beautifulsoup4>=4.11.0",
    "markdownify>=0.11.0",
    "lxml>=4.9.0",
    "mcp>=1.2.0",
    "textual>=0.60",
    "pyperclip>=1.8.0",
    "pywebview>=6.2.1",
    "fpdf2>=2.8.8",
```
- `tests/test_packaging.py` — exists; check how it parses pyproject (likely `tomllib`) and add the mirror test there.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_packaging.py -q`          | all pass            |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `requirements.txt`
- `tests/test_packaging.py`

**Out of scope** (do NOT touch, even though they look related):
- The stale comment in requirements.txt mentioning customtkinter/tiktoken history — you may rewrite the comment but keep the "pyproject is source of truth" statement.
- `[project.optional-dependencies]` / `[dependency-groups]` dedupe — plan 023.
- Pinning strategy — keep the same floor style as pyproject.

## Git workflow

- Branch: `advisor/021-requirements-mirror` (branch from `master`)
- Commit: `fix(packaging): requirements.txt mirrors all runtime deps (+ drift test)`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Complete the mirror

Add the three missing lines, preserving pyproject's floors:

```
mcp>=1.2.0
pywebview>=6.2.1
fpdf2>=2.8.8
```

Position: keep requests/bs4/markdownify/lxml, then mcp, then textual/pyperclip, then pywebview/fpdf2 — order does not matter functionally; group as done above (matching pyproject's sequence to make eyeball-diffing trivial).

### Step 2: Add the drift test

In `tests/test_packaging.py`, add a test (model after the file's existing tests — read one first for fixture/style) that:

```python
def test_requirements_mirror_matches_pyproject():
    import tomllib
    pp = tomllib.loads(Path("pyproject.toml").read_text(encoding="utf-8"))
    expected = {d.split(">=")[0].split("[")[0].lower() for d in pp["project"]["dependencies"]}
    text = Path("requirements.txt").read_text(encoding="utf-8")
    actual = {
        line.split(">=")[0].split("[")[0].lower()
        for line in text.splitlines()
        if line.strip() and not line.startswith("#")
    }
    assert expected == actual
```

Handle environment markers (e.g. `importlib-metadata; python_version<"3.10"`) if any appear — split on `;` too. Fail with a message naming the missing/extra packages.

**Verify**: `uv run pytest tests/test_packaging.py -q` → all pass.

### Step 3: Prove the test bites

Temporarily remove `mcp>=1.2.0` from requirements.txt, run the new test, confirm it **fails**, then restore the line. (Do not commit the removal.) This validates the test is load-bearing — say so in your report.

**Verify**: test fails with the removal, passes with it restored.

### Step 4: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- One new drift test (Step 2); Step 3's fail-restore check.

## Done criteria

- [ ] `requirements.txt` package set == `[project].dependencies` package set
- [ ] New drift test exists and passes
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- pyproject's dependencies contain a marker/extra the mirror cannot express (report; the test must then document the accepted deviation explicitly).
- `test_packaging.py` parses pyproject in an incompatible way (report; add the test in a fresh file if needed but say so).

## Maintenance notes

- The mirror is now machine-checked; future dependency additions to pyproject must add the same line to requirements.txt (and the test will fail otherwise) — that is the point.
