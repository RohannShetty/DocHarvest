# Plan 025: Give the docs/ (showcase) workspace the gates it actually has — typecheck script + CI lint/typecheck

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- docs/package.json .github/workflows/ci.yml .github/workflows/pages.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (if plan 004 lands first, `eslint-config-next` version may have moved — re-read `docs/package.json`)
- **Category**: dx
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

The two TypeScript workspaces in this repo have asymmetric quality gates. `frontend/` (desktop GUI) is linted and typechecked **in CI**; `docs/` (the public showcase — the project's front door on GitHub Pages) has an eslint config and an `npm run lint` script, but no `typecheck` script, and **nothing anywhere CI runs either** — `pages.yml` builds (which typechecks as a side effect of `next build` but applies no ESLint rules) and `ci.yml` has no docs job. Violations reach the production deploy unflagged.

## Current state

- `docs/package.json` (verified at HEAD ea307bd) — scripts: `dev`, `build`, `start`, `lint` (`eslint`), `test`, `test:ui`, `test:run`, `sync:stats`. DevDependencies include `eslint@^9`, `eslint-config-next`, `typescript@^5`. No `typecheck` script (contrast `frontend/package.json`, which has one).
- `docs/eslint.config.mjs` — exists and is wired to `eslint-config-next` (verify by reading it in Step 2).
- `.github/workflows/ci.yml` — has `test`, `gui` (frontend lint+typecheck+build), `brand-tokens` jobs; **no docs job**.
- `.github/workflows/pages.yml` — runs `npm ci` (after plan 022) and `npm run build` only.

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Install   | `cd docs && npm ci`                                  | exit 0              |
| Typecheck | `cd docs && npx tsc --noEmit`                         | exit 0              |
| Lint      | `cd docs && npm run lint`                             | exit 0 (or report existing violations) |

## Scope

**In scope** (the only files you should modify):
- `docs/package.json` (add `typecheck` script)
- `.github/workflows/ci.yml` (add a `showcase` job)

**Out of scope** (do NOT touch, even though they look related):
- Any lint rule changes in `eslint.config.mjs` — if the first lint run fails, report the violation list; do not relax the config.
- `pages.yml` — the deploy gate stays "build passes"; adding lint there is redundant once ci.yml gates PRs (push to master flows through CI first in this repo's branch protection — if it doesn't, say so).
- `frontend/` — unrelated workspace.

## Git workflow

- Branch: `advisor/025-docs-workspace-gates` (branch from `master`)
- Commit: `ci(docs): typecheck script + showcase lint/typecheck job`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: typecheck script

Add to `docs/package.json` scripts:
```json
    "typecheck": "tsc --noEmit",
```

**Verify**: `cd docs && npm run typecheck` → exit 0 (if it errors, read the errors — a `next-env.d.ts` missing or tsconfig issue; report rather than hack).

### Step 2: Lint status check

`cd docs && npm run lint`. Two possible outcomes:
- exit 0 → proceed.
- Non-zero → **do not fix the violations and do not relax the config**. Record the list, and gate the CI job on typecheck only for now; leaving lint as a reported follow-up is a legitimate scoping decision — mark it in the report and in the plan README notes. (Rationale: a repo with a red lint gate must not get a pre-commit-level red X for hundreds of pre-existing findings.)

**Verify**: the outcome is recorded either way; the CI job is written accordingly.

### Step 3: Showcase job in ci.yml

Add a job mirroring the `gui` job's shape:

```yaml
  showcase:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: "22"
        cache: npm
        cache-dependency-path: docs/package-lock.json

    - name: Install showcase dependencies
      working-directory: docs
      run: npm ci

    - name: Typecheck the showcase
      working-directory: docs
      run: npm run typecheck

    - name: Lint the showcase
      working-directory: docs
      run: npm run lint
```

Include the lint step **only if** Step 2 was green. If red, include typecheck only and leave the lint step as a commented block with a note pointing at this plan.

### Step 4: YAML parse + diff review

**Verify**: `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` clean; `git diff --stat` shows exactly 2 files.

## Test plan

- No unit tests; the new CI job is the verification.

## Done criteria

- [ ] `npm run typecheck` exists in `docs/package.json` and exits 0
- [ ] `ci.yml` contains a `showcase` job running install + typecheck (+ lint if Step 2 was green)
- [ ] YAML parse clean
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `npm run typecheck` fails on a clean checkout (report the first 10 error lines).
- Lint is red — do not fix; gate typecheck only and report the count of lint errors (per Step 2).

## Maintenance notes

- If the showcase lint backlog ever gets burned down, flip the commented lint step on in the same PR that removes the last violation.
- `next build` already typechecks; this job makes the gate explicit, parallel, and ESLint-capable — keep both.
