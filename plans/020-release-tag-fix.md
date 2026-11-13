# Plan 020: Fix the release workflow's invalid-Python version fallback

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- .github/workflows/build-release.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

`build-release.yml` resolves the release tag for manually-dispatched runs (no tag input, not pushed from a tag ref) with a `python -c` one-liner that is a **SyntaxError** — `open('pyproject.toml', 'rb') as f:` without `with`. That code path can never have run successfully; it is only never hit because tag-triggered releases resolve the tag from `github.ref` first. Manual `workflow_dispatch` releases would crash at tag resolution. Fix is one line.

## Current state

- `.github/workflows/build-release.yml` — the `get_tag` step (verified at HEAD ea307bd, lines ~109-120):
```bash
          if [ -n "${{ github.event.inputs.tag_name }}" ]; then
            TAG="${{ github.event.inputs.tag_name }}"
          elif [[ "${{ github.ref }}" == refs/tags/* ]]; then
            TAG="${GITHUB_REF#refs/tags/}"
          else
            TAG=$(python -c "import tomllib; open('pyproject.toml', 'rb') as f: print('v' + tomllib.load(f)['project']['version'])")
          fi
```
- Python ≥3.11 is guaranteed on the runner? **No** — the job uses `python-version: '3.12'` (line ~101), which is ≥3.11, so `tomllib` (stdlib 3.11+) is available. Keep tomllib; do not switch to pip-installed tomli.

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Local check | `python -c "import tomllib; print('v' + tomllib.load(open('pyproject.toml','rb'))['project']['version'])"` | prints `v11.3.2` (verify against `grep 'version =' pyproject.toml`) |
| YAML lint | `python -c "import yaml; yaml.safe_load(open('.github/workflows/build-release.yml'))"` (if pyyaml available) | no exception (optional) |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/build-release.yml`

**Out of scope** (do NOT touch, even though they look related):
- The release-notes generator, checksum manifest, or the PyInstaller spec.
- The `get_tag` *logic* (input precedence stays tag_input → ref → pyproject) — only the broken Python is fixed.

## Git workflow

- Branch: `advisor/020-release-tag-fix` (branch from `master`)
- Commit: `fix(ci): build-release manual-dispatch version fallback SyntaxError`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the one-liner

Replace line ~117 with:

```bash
            TAG=$(python -c "import tomllib; print('v' + tomllib.load(open('pyproject.toml', 'rb'))['project']['version'])")
```

(`open(...)` without `with` is intentional and fine for a one-shot `-c`; the file handle dies with the process.)

### Step 2: Verify locally

Run the "Local check" row from the table against the repo root and confirm the output equals `v$(grep '^version =' pyproject.toml | cut -d\" -f2)`.

**Verify**: output is `v11.3.2` (or the live version from pyproject.toml).

### Step 3: YAML sanity

Parse the workflow file with any available YAML parser (python pyyaml, node, or `npx js-yaml`). Confirm no exception. Review the diff by eye — it must be one changed line.

## Test plan

- No tests (CI-shell one-liner). Verification is the local `python -c` check + YAML parse.

## Done criteria

- [ ] The `python -c` in `get_tag` parses as valid Python (Step 2 output matches pyproject version)
- [ ] `git diff --stat` shows a single file changed, one line
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The live file differs from the excerpt (report the actual line).
- `python -c "import tomllib"` fails on the runner image (report the Python version — do not add a tomli install step without flagging it).

## Maintenance notes

- A `workflow_dispatch` smoke run after merge (with no tag input, from a non-tag ref, expecting a `Target Release Tag: v<pyproject version>` log line) would have caught this permanently; consider requesting one as a manual step when the next release is cut.
