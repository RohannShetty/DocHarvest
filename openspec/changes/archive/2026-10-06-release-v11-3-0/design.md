# Design

## Context

Current repository state on `origin/master` includes the unified Brand System (`76d70ca`) and test count synchronization (`1a29ae9`), while the working tree contains the OpenSpec framework integration. The GitHub release and PyPI publishing pipelines trigger on git tags matching `v*` via `.github/workflows/build-release.yml` and `.github/workflows/publish.yml`.

## Goals / Non-Goals

**Goals:**
- Uniformly update version declarations to `11.3.0` across Python and showcase metadata.
- Re-render brand kit and social preview cards to match version `11.3.0`.
- Document all unreleased features and fixes in `CHANGELOG.md` under `[11.3.0] - 2026-10-06`.
- Verify brand token parity and build-kit consistency before commit.
- Cut tag `v11.3.0` and trigger automated GitHub binary and PyPI distribution pipelines.

**Non-Goals:**
- Modifying scraping engines, providers, or core CLI interfaces.
- Manual binary uploads (delegated to GitHub Actions CI).

## Decisions

- **Decision: Version bump to `11.3.0`**:
  - *Rationale*: Introduces new generated modules (`src/docharvest/brand_tokens.py`), brand-kit generation tools, and OpenSpec workflows. Minor bump follows SemVer conventions.
  - *Alternatives considered*: `11.2.1` (patch) — rejected because brand tokens and OpenSpec add capabilities and public contracts rather than merely bugfixes.
- **Decision: Re-render assets via generator scripts**:
  - *Rationale*: `scripts/build-brand-kit.mjs` reads version directly from `pyproject.toml`, keeping assets byte-identical and guaranteed to pass `tests/test_brand_assets.py`.

## Risks / Trade-offs

- **[Risk] CI brand token or asset drift** -> *Mitigation*: Run `node scripts/sync-brand-tokens.mjs --check` and `node scripts/build-brand-kit.mjs --check` in pre-flight.
- **[Risk] Untracked files in release tag** -> *Mitigation*: Ensure OpenSpec configuration (`openspec/`), workflows, and `.github/prompts/` are properly committed before tagging.
