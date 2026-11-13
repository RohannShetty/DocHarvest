# Plan 022: CI install/cache hygiene — pip caching in ci.yml, npm ci in pages.yml and build-release.yml

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- .github/workflows/ci.yml .github/workflows/pages.yml .github/workflows/build-release.yml`
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

Three install-path defects in CI pay real minutes and mask real failures:

1. `ci.yml`'s test job installs with plain `pip install` with **no cache**, on 4 matrix cells — full dependency resolution ×4 every run. The committed `uv.lock` is never exercised in CI either, so lockfile/pyproject divergence is invisible.
2. `pages.yml` (the live showcase deploy path) runs `npm install` instead of `npm ci` while its cache is keyed on `package-lock.json` — the deploy resolves fresh versions; the lockfile is decorative; a new Next minor can break the deployed site without reproducing locally. (ci.yml correctly uses `npm ci` for `frontend/`.)
3. `build-release.yml` does `npm ci || npm install` in the frontend build step — the `||` fallback silently masks lockfile drift on the exact artifacts that get published.

(The 3× OS-matrix frontend rebuild in build-release.yml and the uv.lock adoption are deliberate non-goals here — see Maintenance notes.)

## Current state

- `.github/workflows/ci.yml` (verified at HEAD ea307bd) — `test` job:
```yaml
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python-version }}

    - name: Install package with dev + mcp extras
      run: |
        python -m pip install --upgrade pip
        pip install -e ".[dev,mcp]"
```
- `.github/workflows/pages.yml` (verified) — install step:
```yaml
      - name: Install Dependencies
        working-directory: docs
        run: npm install
```
  (setup-node already has `cache: 'npm'` + `cache-dependency-path: docs/package-lock.json`.)
- `.github/workflows/build-release.yml` (verified line ~39): `npm ci || npm install` in the "Install Frontend Dependencies & Build Web Assets" step; also lacks `cache: npm` on its setup-node (frontend/package-lock.json is the dependency path — the frontend job in ci.yml uses exactly that).

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| YAML parse| `python -c "import yaml,sys; [yaml.safe_load(open(f)) for f in ['.github/workflows/ci.yml','.github/workflows/pages.yml','.github/workflows/build-release.yml']]"` | no exception (if pyyaml available; else use node/`npx js-yaml`) |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/ci.yml`
- `.github/workflows/pages.yml`
- `.github/workflows/build-release.yml`

**Out of scope** (do NOT touch, even though they look related):
- Switching CI to uv (`setup-uv` + `uv sync`) — a bigger change touching the test command itself; deliberately deferred (see Maintenance notes).
- Collapsing the OS-matrix frontend build into a shared artifact — larger restructure, deferred.
- Anything in `publish.yml`.

## Git workflow

- Branch: `advisor/022-ci-cache-hygiene` (branch from `master`)
- Commit: `ci: cache pip in ci.yml; npm ci everywhere; drop ci||install fallback`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: pip caching in ci.yml

```yaml
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python-version }}
        cache: 'pip'
        cache-dependency-path: |
          pyproject.toml
          uv.lock
```

### Step 2: npm ci in pages.yml

`run: npm install` → `run: npm ci`. Leave the setup-node cache block untouched.

### Step 3: build-release.yml

Two edits: add to its setup-node step `cache: 'npm'` and `cache-dependency-path: frontend/package-lock.json` (mirror the `gui` job in ci.yml); change `npm ci || npm install` → `npm ci`.

### Step 4: Parse all three workflow files

Use the YAML parse row from the table (or a visual diff review if no YAML tool is available). The diffs must be limited to the hunks above (`git diff --stat` should show ≤3 files, all workflow files).

**Verify**: YAML parse clean; diff limited to in-scope hunks.

## Test plan

- No unit tests (workflow files). Verification = YAML parse + a pushed-branch CI run if the operator requests one (do not push).

## Done criteria

- [ ] `grep -n "npm install" .github/workflows/pages.yml .github/workflows/build-release.yml` → no matches (all `npm ci`)
- [ ] `grep -n "cache" .github/workflows/ci.yml` shows `cache: 'pip'` on setup-python
- [ ] `grep -n "npm ci || npm install" .github/workflows/build-release.yml` → no matches
- [ ] YAML parse of all three files clean
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `pages.yml`'s lockfile is stale (`npm ci` would fail) — report; do not regenerate the lockfile blindly (that changes the deployed site's dependency set; the maintainer must see the diff).
- YAML parse fails after edit.

## Maintenance notes

- Deferred, deliberately: (a) adopting `uv.lock` in CI via `astral-sh/setup-uv` — the strongest single move for supply-chain and reproducibility, needs the test job switched to `uv sync --extra dev --extra mcp` and acceptance of lockfile-gating semantics; (b) building the frontend once and sharing the artifact across the 3-OS release matrix; (c) caching `~/.npm` in build-release is handled by `cache: npm` here — the 3× OS rebuild itself remains.
- `pip cache` in setup-python is keyed on `cache-dependency-path`; if the package stops being pip-installable from sdist/wheel metadata, the cache may over-hit — watch for it.
