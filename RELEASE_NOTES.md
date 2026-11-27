# DocHarvest v11.6.0

Canonical identity, stable addressing, agency-grade dashboard UI redesign, and comprehensive brand alignment. This release resolves cross-subsystem addressing divergences, ensures deterministic page path and manifest synchronization, eliminates search index and concept graph collisions, hardens markdown chunking inside code fences, guarantees platform-agnostic Windows CRLF delimiter handling, and introduces a high-frequency virtualized streaming engine with a tool-grade React GUI.

### ✨ Features & Capabilities

- **High-Frequency Virtualized Streaming Engine**: Replaced unbuffered React
  state updates with a fixed-capacity mutable `RingBuffer` (5,000 entries) and
  a 60Hz `requestAnimationFrame` flush loop in `useCaptureStream`, paired with a
  zero-dependency 24px virtualized row windowing hook (`useVirtualizer`) with
  CSS `contain: strict`. High-throughput crawls run smoothly with zero UI freeze.

- **Decoupled CaptureStudio Architecture**: Decomposed the legacy 1,274-line
  monolith into modular, single-responsibility components (`UrlCommandBar`,
  `CrawlConfigPanel`, `TelemetryStrip`, `LiveLogStream`, `CompletionBanner`,
  and `index.tsx`), reducing the orchestrator to under 185 lines.

- **Global Library Caching**: Introduced `useLibrary` hook to manage library
  state and mutations, eliminating redundant Python bridge calls and screen
  flicker on tab switches.

- **Tool-Grade Brand & Geometry Discipline**: Strictly enforced `--radius: 0px`,
  the `--bond` neutral surface ladder, hairline dividers, and monospaced tabular
  numbers (`tabular-nums font-mono`) across `LibraryView`, `SearchView`, `DiffView`,
  `SettingsView`, and `AppSidebar`. Replaced decorative `Sparkles` icons and AI
  design clichés with semantic Lucide iconography.

- **Composed Surface Primitives**: Added reusable `EmptyState` and normalized
  zero-radius `Skeleton` components.

- **Canonical Domain Resolution**: Introduced `canonical_domain()` in
  `providers.base` with deterministic normalization (scheme stripping, trailing
  slash stripping, lowercase normalization, default port `:80`/`:443` elimination,
  and custom port preservation). Integrated across `StorageManager`,
  `SearchIndex`, `VersionManager`, MCP server, and CLI to eliminate fragmented
  storage directories and split indexes.

- **Synchronized Manifest (`llms.txt`)**: Aligned `build_manifest()` links 1:1
  with disk-written page files, ensuring AI agents and tools can resolve every
  listed page path directly.

- **URL-Aware Page Resolution**: Extended `StorageManager.load_page()` and MCP
  `read_doc` to accept canonical source URLs directly alongside disk-relative
  paths.

- **Concept Graph Direct ID Lookup**: Added direct `node.id` matching to
  `DocGraph.query()` and `get_related_concepts()`, with duplicate heading node
  disambiguation and cross-file endpoint reference tracking (`referenced_in`).

- Canonical version bumped across all packages, frontend GUI assets, showcase
  docs, and test suites to `11.6.0` with zero drift verified.


### 🐛 Bug Fixes & Hardening

- **Code-Fence Aware Markdown Chunking**: Fixed heading splitter in `splitter.py`
  and MCP `_extract_topic_bounded` by tracking code fences (```` ``` ```` / `~~~`).
  Python and shell comments (`# comment`) inside code blocks are no longer
  mistaken for section headings.

- **Windows CRLF Delimiter Normalization**: Hardened `_parse_pages_from_text()`
  in `api.py` with multi-line regex accepting `\r?\n` line endings, preventing
  multi-page document collapse on Windows systems.

- **Brand & CLI Alignment**: Aligned all user-facing CLI strings, help texts,
  and error messages to `docharvest`, while retaining `gitbook-dl` as a
  first-class backward-compatible command alias in `pyproject.toml`.


### ⚡ Performance & Architecture

- **Deterministic Query-Aware Page Paths**: Upgraded `page_relpath()` in
  `output_contract.py` to deterministically encode URL query parameters using
  `__q_<key>_<val>` conventions, preserving query-differentiated pages (such as
  API versions) without arbitrary `-2` collision suffixes.

- **Collision-Free Search Sections**: Disambiguated duplicate markdown headings
  in SQLite FTS5 search indexing via ordinal slugging (`#heading`, `#heading__2`),
  preventing silent section deletion on `UNIQUE(url, section_heading)` constraints.

- **Seed Version Materialization**: Standardized snapshot semver normalization
  with consistent `"v"` prefixing (`v1.0.0`), enabling diffing against initial
  seed versions before subsequent snapshots are captured.


---
**Full Changelog**: https://github.com/RohannShetty/DocHarvest/compare/v11.5.1...v11.6.0
