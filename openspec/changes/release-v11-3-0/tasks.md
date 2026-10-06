# Tasks

## 1. Version Bumps and Asset Updates

- [x] 1.1 Update `version = "11.3.0"` in `pyproject.toml`, `src/docharvest/__init__.py`, and `docs/package.json` and verify with grep
- [x] 1.2 Run `node scripts/build-brand-kit.mjs` to regenerate `assets/social-preview.svg` and `docs/public/assets/social-preview.svg` with version `11.3.0`
- [x] 1.3 Verify brand tokens and brand kit generators with `node scripts/sync-brand-tokens.mjs --check` and `node scripts/build-brand-kit.mjs --check`

## 2. Changelog Finalization

- [x] 2.1 Update `CHANGELOG.md` to promote `## [Unreleased]` to `## [11.3.0] - 2026-10-06`, adding the OpenSpec SDD integration entry alongside the Brand System and test sync notes

## 3. Pre-Flight Verification & Release Notes

- [x] 3.1 Run `python scripts/generate_release_notes.py --tag v11.3.0` and verify the output contains all canonical sections

## 4. Git Commit, Tag & Push

- [ ] 4.1 Stage all release files and OpenSpec configurations (`openspec/`, `.github/prompts/`, `.omp/commands/`, `.gemini/`, `AGENTS.md`, version files) and commit with message `release: v11.3.0 — Brand system unification and OpenSpec SDD`
- [ ] 4.2 Create git tag `v11.3.0`
- [ ] 4.3 Push `master` branch and `v11.3.0` tag to `origin` to trigger GitHub Actions release and PyPI publishing workflows
