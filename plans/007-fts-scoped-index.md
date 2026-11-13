# Plan 007: Make FTS5 indexing scoped (no global rebuild) and single-owner

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/search/index.py src/docharvest/mcp/server.py src/docharvest/engine.py src/docharvest/api.py tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. Plan 005 must be landed first (it
> removes the engine-side indexing).
>
> **Depends on plan 005.**

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/005-engine-facade-persistence.md
- **Category**: perf
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

Every capture pays 2–3 full indexing passes, and each pass re-tokenizes the **entire** library, not the captured domain:

1. `index_domain()` inserts rows one `conn.execute` at a time, then runs `INSERT INTO pages_fts(pages_fts) VALUES('rebuild')` — FTS5 'rebuild' re-tokenizes the whole external-content table (all domains), so indexing one 50-page capture of a 10k-section library re-tokenizes 10k sections.
2. `remove_domain()` does the same global rebuild.
3. The same capture triggers indexing up to twice more: once in `api.py` (facade) and once in `mcp/server.py` (`download_docs` best-effort re-index from storage) — after plan 005 the engine-side call is gone, but the facade+MCP pair remains.
4. Per-row inserts (no `executemany`) multiply the constant factor.

At library scale, capture cost grows with the *whole library* instead of the capture, and the MCP path also blocks the stdio event loop while doing it (plan 011 covers that part).

## Current state

- `src/docharvest/search/index.py` — schema (verified lines ~148-161): `pages_fts` is an external-content FTS5 table: `content='pages_meta'`, `content_rowid='rowid'`, columns `title, content, url UNINDEXED, domain UNINDEXED, section_heading`, tokenizer `porter unicode61`. `pages_meta` carries `UNIQUE(url, section_heading)` and no explicit rowid column (rowid is the FTS5 join key).
- `index_domain()` (verified lines ~246-360): calls `_page_tree_rows`/`_book_rows` to build `rows`, then:
```python
            # Clear existing entries for this domain so a re-index is clean.
            conn.execute("DELETE FROM pages_meta WHERE domain = ?", (domain,))
            conn.execute("DELETE FROM domains WHERE name = ?", (domain,))

            for section_url, title, heading, content in rows:
                try:
                    conn.execute(
                        """INSERT OR REPLACE INTO pages_meta
                           (url, title, content, domain, section_heading)
                           VALUES (?, ?, ?, ?, ?)""",
                        (section_url, title, content, domain, heading),
                    )
                except Exception as exc:
                    logger.warning(
                        "Failed to index section %r of domain %s: %s",
                        section_url, domain, exc,
                    )
            page_count = conn.execute(
                "SELECT COUNT(DISTINCT url) FROM pages_meta WHERE domain = ?", (domain,),
            ).fetchone()[0]

            # Rebuild the FTS5 index from the updated content table.
            conn.execute("INSERT INTO pages_fts(pages_fts) VALUES('rebuild')")
```
- `remove_domain()` (lines ~515-530) — clears `pages_meta`/`domains` then the same global `'rebuild'`. Read the live function before editing; apply the identical targeted-delete pattern there.
- `src/docharvest/mcp/server.py` — `download_docs` (verified lines ~384-392) re-indexes best-effort after the facade capture:
```python
        if _search is not None:
            try:
                _search.index_domain_from_storage(domain, _storage, domain_url=url)
            except Exception as exc:
                logger.warning("Search indexing failed for %s: %s", domain, exc)
                capture_warnings.append(f"Search indexing failed: {exc}")
```
  The facade (`api.py`) already indexes via `SearchIndex(base_dir=storage.base).index_domain(domain, book_text, url, pages_dir=pages_dir)` and surfaces failures in `CaptureResult.warnings` — both are for the same domain and data. The MCP re-index is pure duplication.
- `index_domain_from_storage` re-reads the whole page tree from disk and calls `index_domain` — deleting the MCP call removes that whole re-read.

## Why scoped delete/insert is the correct FTS5 pattern

For an external-content FTS5 table, the documented maintenance operations are:
- Delete row N: `INSERT INTO pages_fts(pages_fts, rowid, <indexed columns>) VALUES('delete', N, <old values>)` — the *original* indexed values must be supplied.
- Insert row N: `INSERT INTO pages_fts(rowid, <indexed columns>) VALUES (N, ...)`.
So: capture the old rows for the domain first, `'delete'` them, `DELETE FROM pages_meta`, insert the new rows, then plain-insert the new rowids. No global rebuild anywhere.

## Commands you will need

| Purpose   | Command                                                        | Expected on success |
|-----------|----------------------------------------------------------------|---------------------|
| Install   | `uv pip install -e .`                                          | exit 0              |
| Targeted  | `uv run pytest tests/test_search.py -q`                        | all pass            |
| Full suite| `uv run pytest tests/ -q`                                      | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/search/index.py` (`index_domain`, `remove_domain` only)
- `src/docharvest/mcp/server.py` (delete the duplicated re-index block in `download_docs`, keep the warnings plumbing)
- `tests/test_search.py` (add regression tests)

**Out of scope** (do NOT touch, even though they look related):
- `domains` bookkeeping table design (columns stay as-is).
- `_page_tree_rows` / `_book_rows` row building logic.
- `search()` query path, `_fts_escape`.
- Plan 011 (async wrapping of MCP handlers) — keep these edits syntactic only; do not wrap in `to_thread` here.

## Git workflow

- Branch: `advisor/007-fts-scoped-index` (branch from `master`)
- Commit: `perf(search): scoped FTS5 maintenance; drop global rebuild; drop MCP re-index`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Scoped maintenance in `index_domain`

Replace the "Clear existing entries" block through the `'rebuild'` line with:

```python
            old = conn.execute(
                "SELECT rowid, title, content, section_heading "
                "FROM pages_meta WHERE domain = ?",
                (domain,),
            ).fetchall()
            for rowid, title, content, heading in old:
                conn.execute(
                    "INSERT INTO pages_fts(pages_fts, rowid, title, content, section_heading) "
                    "VALUES('delete', ?, ?, ?, ?)",
                    (rowid, title, content, heading),
                )
            conn.execute("DELETE FROM pages_meta WHERE domain = ?", (domain,))
            conn.execute("DELETE FROM domains WHERE name = ?", (domain,))

            conn.executemany(
                """INSERT OR REPLACE INTO pages_meta
                   (url, title, content, domain, section_heading)
                   VALUES (?, ?, ?, ?, ?)""",
                [(u, t, c, domain, h) for (u, t, h, c) in rows],
            )
            # ... keep the per-row failure logging by doing the inserts in a
            # loop with try/except as today IF executemany loses visibility.
            # Prefer: loop insert with try/except (log + skip) into a list of
            # successfully inserted (url, title, content, heading), then
            # executemany the FTS side from that list after selecting rowids.
            new = conn.execute(
                "SELECT rowid, title, content, section_heading "
                "FROM pages_meta WHERE domain = ?",
                (domain,),
            ).fetchall()
            conn.executemany(
                "INSERT INTO pages_fts(rowid, title, content, section_heading) "
                "VALUES (?, ?, ?, ?)",
                new,
            )
```

Requirements:
- Keep the existing per-section failure behavior (one bad section logs a warning, does not abort the pass). The simplest compliant shape: loop the `INSERT OR REPLACE` with try/except per row (as today), remember surviving `(url,title,content,heading)` tuples, then `SELECT rowid ... WHERE domain = ?` after the loop and use `executemany` for the FTS inserts (this preserves both granularity and speed).
- **Delete** the `INSERT INTO pages_fts(pages_fts) VALUES('rebuild')` line entirely.
- The page-count query is unchanged.

**Verify**: `uv run pytest tests/test_search.py -q` → pass (existing tests).

### Step 2: Same pattern in `remove_domain`

Read the live `remove_domain()`; apply the same scoped pattern (capture old rowids → `'delete'` → `DELETE FROM pages_meta WHERE domain = ?` → `DELETE FROM domains WHERE name = ?`), removing its global rebuild. If its body differs more than expected (e.g. it deletes by multiple domains), STOP and report.

**Verify**: `uv run pytest tests/test_search.py -q` → pass.

### Step 3: Remove the duplicated MCP re-index

In `download_docs` (`mcp/server.py`), delete the `if _search is not None:` re-index block and its warning append. Replace with a one-line comment noting the facade indexes (and surfaces failures via warnings) — or nothing if comments like that are unidiomatic in the file. Keep the `domain = _domain_from_url(url)` line and everything below.

**Verify**: `grep -n "index_domain_from_storage" src/docharvest/mcp/server.py` → no matches; `uv run pytest tests/test_mcp_server.py tests/test_mcp_advanced_tools.py -q` → all pass (adjust any assertion that explicitly expected the re-index; report which).

### Step 4: Regression tests

Add to `tests/test_search.py`:

1. `test_index_domain_does_not_rebuild_globally` — use `conn = sqlite3.connect(db)` + `conn.set_trace_callback(...)` (or open `SearchIndex(base_dir=tmp_path)`, monkeypatch nothing) and assert no executed statement contains `"VALUES('rebuild')"`.
2. `test_reindex_preserves_other_domains` — index domain A, index domain B, then re-index A with changed content; assert B's content is still findable and A reflects the new content and no longer contains the old content.
3. `test_remove_domain_scoped` — index A and B, remove A, assert B still searchable and A is not.

**Verify**: `uv run pytest tests/test_search.py -q` → all pass including the new tests.

### Step 5: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- New tests in Step 4; existing search tests must remain green unchanged.
- Verification: `uv run pytest tests/test_search.py tests/test_mcp_server.py tests/test_mcp_advanced_tools.py -q`, then the full suite.

## Done criteria

- [ ] `grep -n "'rebuild'" src/docharvest/search/index.py` → no matches
- [ ] `grep -n "index_domain_from_storage" src/docharvest/mcp/server.py` → no matches
- [ ] The three new regression tests exist and pass
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The FTS5 `content='pages_meta'` external-content contract differs from what this plan assumes at execution time (e.g. schema changed).
- Any test asserts the global-rebuild behavior directly (it shouldn't, but if one does, report before modifying it).
- Step 4's delete-command test fails with "no such rowid" — report the exact error; do not fall back to `'rebuild'`.
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- External-content FTS5 requires that every `pages_meta` rowid change be mirrored in `pages_fts`; keep the two operations inside the same transaction (they already are, since both happen before `conn.commit()`).
- `INSERT OR REPLACE` on `pages_meta` may change rowids — the scoped delete-first sequence avoids relying on REPLACE rowid stability; do not reorder delete and insert.
- If a third copy of "index after capture" is ever added (e.g. to the TUI), route it through the facade; the engine and MCP copies are now gone.
