# DocHarvest v11.3.2

Reliable capture queues, safer local browser access, GUI preferences, and documentation updates. No breaking CLI or capture-facade changes.

### ✨ Features & Capabilities

- Refined Capture Studio hierarchy and control alignment, corrected semantic icon colors, improved icon-button labels, and distinguished added diff lines. Tab shortcuts no longer switch views while typing in form controls.

- Replaced wildcard CORS with explicit local origins and Host validation. Foreign and opaque origins, including `Origin: null`, cannot invoke local bridge methods or subscribe to capture events. The existing local Vite development proxy remains supported.

- The browser GUI remains a local desktop companion, not an authenticated service for network deployment.

- Added dependency-free frontend regression tests for batch ordering, fast completion, rejected starts, cancellation, stalls, configured options, version selection, library selection, and diff classification.

- **Config bridge (`ApiBridge.get_config` / `save_config`).** Exposes the merged config and writes it back to the global (`~/.docharvest/config.toml`) or project (`./docharvest.toml`) file. Only capture-related keys are accepted, so the GUI cannot write arbitrary keys.

- **TOML writer (`utils.config.save_config_values`).** Line-preserving merge: comments, presets, and unknown keys survive, and a key that already lives in a legacy `[download]` / `[output]` / `[capture]` table is updated in place instead of shadowed by a duplicate in `[defaults]`.

- **Dynamic OpenGraph Preview Card**: Implemented Next.js dynamic static OpenGraph image generator at `docs/app/opengraph-image.tsx` using `next/og`, showcasing live metrics (`930+ Tests Passing`, `12 FastMCP Tools`, `17 Agent Harnesses`, `~83% Token Reduction`).


### 🐛 Bug Fixes & Hardening

- Batch capture now waits for each worker's completion before starting the next URL, including when completion arrives before the start acknowledgement. Each queued URL receives the configured capture options.

- Rejected starts and failed captures are counted separately from successful completions. Cancellation stops the queue; a stalled worker stops the batch without falsely freeing its busy state.

- Cancel and reset retain a live worker's slot and domain locks. Start/cancel/reset state transitions are synchronized to prevent overlapping capture workers.

- Version selection cannot deselect the last explicit version and accidentally request all versions. Library select-all checks domain membership rather than matching selection counts.

- Early rejected requests drain small request bodies with a size limit and socket timeout, preventing Windows connection resets from discarding the intended HTTP error response.

- Added backend regression coverage for origin/Host rejection, Windows delayed-body responses, worker lifecycle, and domain-lock preservation. Refreshed the bundled GUI and synchronized release versions.

- **New Preferences tab (`frontend/src/views/SettingsView.tsx`, `Ctrl+8`).** Edits persisted capture configuration — workers, timeout, max pages, retries, minimum content, output mode, snapshot, SPA rendering, path scope, and exclude paths — plus a read-only view of config file locations and `[presets.*]` tables. Capture Studio still supplies its own per-run options; saving preferences does not populate its controls automatically.


### ⚡ Performance & Architecture

- PyPI automation now runs on version-tag pushes (or manual dispatch), avoiding duplicate uploads when the binary workflow subsequently creates the GitHub release.

- Run `uv run pytest -q -p no:cacheprovider` for Python tests and `node --experimental-strip-types --test src/lib/__tests__/flow.test.mjs src/lib/__tests__/batch.test.mts` from `frontend/` for frontend flow tests. Browser visual and end-to-end acceptance remain separate manual checks.

- **Universal Extraction Framing**: Refactored `SupportedPlatforms.tsx` to communicate that DocHarvest is a universal documentation compiler and crawler for any technical website, API portal, developer hub, or SPA, framing dedicated detectors as native AST extraction optimizations with a universal fallback.

- **Comprehensive Agent Harness SEO Meta**: Expanded `layout.tsx` metadata with high-intent search keywords covering all 17 agent harnesses (Cursor, Claude Code, Windsurf, VS Code / Cline, Roo Code, Copilot Workspace, Antigravity, Gemini CLI, Oh My Pi, OpenCode, Codex, JetBrains, Zed, Continue, Kilo, Grok, Trae, Mistral Vibe) and universal doc scraping queries.

- **Honest Test Stats Drift Guard**: Re-verified test sync drift guards and published claim consistency (`tests/test_stats_drift.py` and `tests/test_naming_drift.py` passing cleanly).


---
**Full Changelog**: https://github.com/RohannShetty/DocHarvest/compare/v11.3.1...v11.3.2
