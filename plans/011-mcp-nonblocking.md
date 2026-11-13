# Plan 011: Stop blocking the MCP server's event loop in the async tools

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/mcp/server.py tests/test_mcp_server.py tests/test_mcp_advanced_tools.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. Plan 007 (which removes one blocking re-index call site) should land first if both touch `download_docs`; conflicts are textual only.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (recommended after 007)
- **Category**: perf
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

The MCP server is a single-process stdio `asyncio` application. `download_docs` is the only tool that was wrapped in `asyncio.to_thread(...)` — with a comment explaining exactly why (a long crawl inline would stall every other request). Every other tool handler performs blocking SQLite and filesystem IO inline on the event loop: `search_docs` (SQLite FTS query), `list_domains`/`find_docs` (metadata JSON reads), `read_doc`/`get_doc`/`diff_versions`/`list_versions`/`export_docs`/`get_changelog` (file reads, unified diff computation), `query_doc_graph`/`get_related_concepts` (reads and regex-parses every page file). While any of these run, the whole server — including keepalives and a concurrent capture's progress channel — stalls. The fix is mechanical: same seam as `download_docs`, applied to the rest.

## Current state

- `src/docharvest/mcp/server.py` — async tools (verified at HEAD ea307bd):
```python
265: async def download_docs(...)        # await asyncio.to_thread(_run_capture, ...)  -- reference pattern, line 310
346: async def search_docs(...)          # calls _search.search(...) inline (line ~482 region pre-fix; locate live)
388: async def list_domains() -> list[dict]:   # _storage.list_domains() inline
406: async def find_docs(query, limit):        # JSON reads inline
434: async def read_doc(...)                   # _storage.load_page / _versioning.get_version_content inline
506: async def get_doc(...)
546: async def diff_versions(...)
582: async def list_versions(domain):
603: async def export_docs(...)
686: async def get_changelog(domain):
711: async def query_doc_graph(domain, ...)    # build_graph_from_pages(...) inline — full corpus read + 4 regex passes
741: async def get_related_concepts(...)
```
- The reference pattern (lines 305-310):
```python
        # The capture facade is synchronous (requests + ThreadPoolExecutor).
        # Running it inline would block this server's event loop for the whole
        # crawl, stalling every other MCP request - including the client's own
        # startup tools/list - until the download finished.
        result = await asyncio.to_thread(_run_capture, url, options_kwargs)
```
  where `_run_capture(url, options_kwargs)` is a module-level synchronous helper returning a result (optionally raising).
- `asyncio` is already imported and used. Tools' public signatures (parameter names, defaults, return dict shapes) must not change — MCP clients depend on them.
- Error-handling convention: tools catch all exceptions and return `{"error": str(exc)}` (or a list with that dict) — keep that, applied inside the sync helper or around the `to_thread` call consistently with each tool's current behavior.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_mcp_server.py tests/test_mcp_advanced_tools.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/mcp/server.py`
- `tests/test_mcp_server.py` (only if you add the concurrency regression test — Step 4)

**Out of scope** (do NOT touch, even though they look related):
- The `except Exception` API convention (`{"error": ...}`).
- `query_doc_graph`/`get_related_concepts` performance (caching) — a separate finding, not wrapped by hand here; this plan only un-blocks the loop; caching is a follow-up.
- `download_docs`'s structure beyond the plan-007 overlap noted above.
- Tool schemas, docstrings' Args sections (leave unless they lie).

## Git workflow

- Branch: `advisor/011-mcp-nonblocking` (branch from `master`)
- Commit: `perf(mcp): run blocking tool bodies in worker threads`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Inventory blocking bodies

Read each async tool (locations listed in "Current state"). For each, decide the sync helper shape:
- If the tool body is a single blocking call + small shaping code, move the blocking call and shaping into a module-level `_<tool>_blocking(...)` sync function and `return await asyncio.to_thread(_<tool>_blocking, arg, ...)` from the tool.
- Keep the `"""docstring"""` and signature on the async tool.

Apply to: `search_docs`, `list_domains`, `find_docs`, `read_doc`, `get_doc`, `diff_versions`, `list_versions`, `export_docs`, `get_changelog`, `query_doc_graph`, `get_related_concepts`.

**Verify**: `grep -n "await asyncio.to_thread" src/docharvest/mcp/server.py` → ≥11 matches (10 tools + `download_docs`).

### Step 2: Behavior invariance

Every tool must return the same success payloads and the same `{"error": ...}` on failure as before. Wrap the body of each sync helper in the same try/except the inline code had, or keep the try/except in the async tool around `await asyncio.to_thread(...)` — either preserves behavior; prefer keeping the existing try/except in the async tool where it already exists (minimal diff).

**Verify**: `uv run pytest tests/test_mcp_server.py -q` → all pass.

### Step 3: Resources (same file)

The two `@mcp.resource` handlers (`docs://{domain}/book`, `docs://{domain}/manifest`) do file reads inline; wrap their blocking parts the same way (`await asyncio.to_thread(...)`) for consistency. If reading them shows heavy shared state on the event loop, apply the same pattern; do not skip silently.

**Verify**: resource-related tests in `test_mcp_server.py` pass (search for `docs://`).

### Step 4 (recommended): concurrency regression test

Add to `tests/test_mcp_server.py` (model after `test_download_docs_does_not_block_other_requests`, which uses a `slow_capture` fake: 0.6s `time.sleep` in the sync capture, then asserts a concurrent `list_domains` is served before capture finishes):

```python
async def test_search_docs_does_not_block_other_requests():
    # arrange: monkeypatch the search singleton's .search() to sleep 0.5s
    # act: start search_docs as a task; await asyncio.sleep(0.05); call list_domains
    # assert: list_domains returns before the slow search finishes
```

If the existing test file has fixtures/helpers for monkeypatching the module-level `_search` singleton, reuse them. If the arrangement is not possible with the current seams without more refactoring, skip and say so in the report.

**Verify**: the new test passes.

### Step 5: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- Step 4's optional regression test.
- Verification: `test_mcp_server.py` green; full suite green.

## Done criteria

- [ ] `grep -cn "await asyncio.to_thread" src/docharvest/mcp/server.py` ≥ 11
- [ ] Every async tool's blocking SQLite/file work runs inside a worker thread (read each tool to confirm)
- [ ] Tool signatures and success payloads unchanged (`git diff` shows no argument renames)
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Any tool closes over event-loop-affine state that cannot cross `to_thread` (e.g. an open aiosqlite cursor held across the call — there is none today, but if you find one, report).
- A tool's behavior differs observably between inline and threaded execution in the existing suite (report which).
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The stdio server has exactly one event loop; every future tool must keep its blocking work in a worker thread. Reviewers should reject new async tools with inline blocking calls.
- `query_doc_graph` still pays a full corpus re-read per call (caching is the open follow-up); the thread wrap bounds the stall, not the cost.
