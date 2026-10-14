# Comparability Report

## Executive Summary
This report audits the reproduction and comparability of DocHarvest (`docharvest`) against documented commands, baseline expectations, and smoke evaluations.

## Evaluated Reproduction Targets

| Target | Command | Status | Notes |
|---|---|---|---|
| Retrieval Benchmark | `uv run docharvest bench` | **Verified** (100% pass) | MRR: 1.0, Hit@5: 1.0, Answer Containment@5: 1.0 |
| CLI Help / Discovery | `uv run python -m docharvest --help` | **Verified** | Command definitions match documentation |
| Unit / Regression Suite | `uv run pytest -q --tb=short` | **Partial** | 919 passed, 10 failed |

## Comparability Analysis

### 1. Benchmark & Functional Verification
- The core retrieval benchmark executed cleanly using `fixture-v1` without external network access.
- Latency recorded: ~2.0ms – 4.5ms per query.
- Corpus hash matches expected fixture: `f6ea24a7b9ea2ec2322515eedd154b21bb18f481be9c7515adb65cc5a9778130`.

### 2. Discrepancies & Blockers
- **Test Suite Status**:
  - 10 test failures are regression assertion mismatches following the recent `v11.3.0` release tag.
  - Specifically, `tests/test_version_drift.py`, `tests/test_imports.py`, `tests/test_registry_manifest.py`, and `tests/test_gui_bridge.py` retained a hardcoded `CANONICAL_VERSION = "11.2.0"` check while the repository code was updated to `11.3.0`.
  - `tests/test_naming_drift.py` flagged a legacy reference in `RELEASE_NOTES.md` line 69.
- **Scientific Impact**:
  - The discrepancies are strictly version-metadata and naming lints in test fixtures; core crawling, indexing, graph building, and retrieval mechanisms remain sound and verifiable.
