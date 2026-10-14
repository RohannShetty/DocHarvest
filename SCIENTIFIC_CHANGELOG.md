# Scientific Changelog

## Context & Purpose
Reproduction and execution audit conducted using `minimal-run-and-audit` skill for DocHarvest (docharvest) codebase following the `v11.3.0` release.

## Changes & Scientific Meaning Assessment
- **Scientific Meaning Changes**: None. Codebase algorithms for document crawling, AST concept graph extraction, BFS traversal, and SQLite FTS5 search indexing remain scientifically unchanged.
- **Verification Command Executed**:
  `uv run docharvest bench`
- **Execution Outcome**:
  - `status`: Verified (exit code 0)
  - `dataset_id`: `fixture-v1`
  - `corpus_hash`: `f6ea24a7b9ea2ec2322515eedd154b21bb18f481be9c7515adb65cc5a9778130`
  - `hit_at_k`: 1.0 (k=5)
  - `mrr`: 1.0
  - `answer_containment_at_k`: 1.0
  - `latency_ms`: [2.843, 2.011]
- **Repository Modifications**:
  - No algorithmic or model changes were made during this audit.
  - Test suite status notes: 10 test assertion failures in `test_version_drift.py`, `test_naming_drift.py`, `test_registry_manifest.py`, `test_gui_bridge.py`, and `test_imports.py` stem from hardcoded version drift checks asserting `11.2.0` instead of the newly tagged `11.3.0`, and a mention of `gitbook-dl` in `RELEASE_NOTES.md`.
