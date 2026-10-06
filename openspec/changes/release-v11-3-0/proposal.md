# Proposal

## Why

DocHarvest has accumulated key enhancements on master that remain unreleased on GitHub: the unified Brand System overhaul, token synchronization, and the OpenSpec spec-driven development integration. Preparing and publishing the `v11.3.0` release cuts a new official version, triggers automated multi-platform binary builds via GitHub Actions, and publishes updated distributions to PyPI.

## What Changes

- Bump project version to `11.3.0` across `pyproject.toml`, `src/docharvest/__init__.py`, and `docs/package.json`.
- Regenerate brand assets and social cards with the new `11.3.0` version stamp via `scripts/build-brand-kit.mjs`.
- Promote `## [Unreleased]` section in `CHANGELOG.md` to `## [11.3.0] - 2026-10-06`, documenting the unified brand system, test suite updates, and OpenSpec integration.
- Run pre-flight token, brand, and release note verification checks.
- Commit, tag `v11.3.0`, and push to GitHub master to trigger `.github/workflows/build-release.yml` and `.github/workflows/publish.yml`.

## Capabilities

### New Capabilities
None (release management, tooling, and brand assets).

### Modified Capabilities
None.

## Impact

- `pyproject.toml`, `src/docharvest/__init__.py`, `docs/package.json`: Version updated to `11.3.0`.
- `CHANGELOG.md`: Updated with `11.3.0` release notes.
- `assets/social-preview.svg`, `docs/public/assets/social-preview.svg`: Updated with `11.3.0` badge.
- GitHub Actions CI/CD: Release workflow builds Windows, Linux, and macOS binaries; PyPI workflow publishes sdist/wheel.
