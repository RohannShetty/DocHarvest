# Plan 006: Return structured pages from the engine instead of a regex-parsed markdown blob

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/engine.py src/docharvest/api.py tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.
>
> **Depends on plan 005** — if 005 has not landed, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/005-engine-facade-persistence.md
- **Category**: perf
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

The engine holds a clean `ordered_pages: list[tuple[str, str]]` (it downloads and orders them), then throws that structure away: it joins everything into one `combined` markdown string with `Source: <url>\n\n...` delimiters and returns the string. The facade then re-parses it with `re.split(r"(?:^|\n\n)---\n\n(?=Source:\s*https?://)", ...)` (`api.py:_parse_pages_from_text`) to recover what the engine already had. Costs, in order of severity:

1. **Correctness shadow**: any page whose *body* contains `\n---\n\nSource: https://...` is split into phantom pages, and content before/after the delimiter is silently reassigned to wrong URLs.
2. **O(n) re-parse** of the full corpus with two regex passes on the hot path of every capture.
3. Wasted title extraction (the engine computes `extract_title` already; the facade recomputes it per page).

The facade's `normalize_engine_result` already accepts a list of dicts (`{"url", "title", "content"}`) and a dict with a `"pages"` key — the string path is only one of four accepted shapes.

## Current state

- `src/docharvest/engine.py` — assembly (verified at HEAD ea307bd, lines ~545-562):
```python
    ordered_pages: list[tuple[str, str]] = []
    for u in crawl_urls:
        content = url_content.get(u)
        if content:
            ordered_pages.append((u, content))

    entry_title = ""
    combined_parts: list[str] = []
    for i, (u, raw_content) in enumerate(ordered_pages):
        if i == 0:
            entry_title = provider.extract_title(raw_content, u)
        rewritten = rewrite_markdown_links(raw_content, u)
        combined_parts.append(f"Source: {u}\n\n{rewritten}")

    combined = "\n\n---\n\n".join(combined_parts)
```
  …and `return combined` at the end of `stream_download` (after plan 005 removes the persistence block). Empty-crawl path returns `""`.
- `src/docharvest/api.py` — `normalize_engine_result(raw, source_url)` (lines ~326-360) handles: `str` (via `_parse_pages_from_text`, lines ~283-323), `list` of dicts, `dict` mapping `url -> markdown`, `dict` with `"pages"` + `provider`/`discovered`/`failed`. `_parse_pages_from_text` (lines ~283-323) splits on the delimiter regex and regex-extracts a `#` title per page. `_coerce_page` handles dict/object page shapes.
- The combined string is **not** consumed anywhere else: the only production caller of `stream_download` is `api.capture()`, which feeds the raw value straight into `normalize_engine_result`. `publish()` rebuilds the book from pages directly and never re-reads the raw engine output.
- `tests/` — `tests/test_shell_api.py` injects a FakeEngine returning dict pages (the list shape) — the structured path is already first-class and tested. `tests/test_engine_flow.py` may call the real engine and parse `combined` itself — read it before changing the return type.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Install   | `uv pip install -e .`                               | exit 0              |
| Targeted  | `uv run pytest tests/test_engine_flow.py tests/test_engine_providers.py tests/test_shell_api.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/engine.py`
- `src/docharvest/api.py`
- `tests/test_engine_flow.py` (only if it parses `combined` itself)

**Out of scope** (do NOT touch, even though they look related):
- `_parse_pages_from_text` — keep it as the legacy-string fallback in `normalize_engine_result` (delete nothing yet).
- `output_contract.py`, `search/index.py`, `mcp/server.py` — they consume pages, not the string.
- The public `CaptureOptions`/`CaptureResult` contract — untouched.

## Git workflow

- Branch: `advisor/006-structured-pages` (branch from `master`)
- Commit: `perf(engine): return structured page list; facade keeps string fallback`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Engine returns the page list

In `stream_download`, replace the `combined` assembly with construction of `page_dicts`:

```python
    page_dicts: list[dict] = []
    for u, raw_content in ordered_pages:
        rewritten = rewrite_markdown_links(raw_content, u)
        page_dicts.append({
            "url": u,
            "title": provider.extract_title(raw_content, u),
            "content": rewritten,
        })
```

Handle the empty-crawl case as before: the current code logs a warning, emits a `"done"` phase with 0 pages, and returns `""`. Keep the diagnostic block and return `{"pages": [], "provider": provider.name}` instead of `""`.

Return `{"pages": page_dicts, "provider": provider.name, "discovered": len(crawl_urls), "failed": pages_errored}` (the facade already understands this shape — verify the keys it reads: `pages`, `provider`, `discovered`, `failed`).

Preserve the `progress_callback` contract exactly — especially the `"phase": "done"` payload fields.

**Verify**: `uv run pytest tests/test_engine_flow.py -q` → see Step 3.

### Step 2: Facade stays as-is

`normalize_engine_result` already accepts the dict shape — no code changes are expected in `api.py`. Confirm by reading the live function; leave `_parse_pages_from_text` untouched as the legacy-string fallback. If you find a line that special-cases the engine specifically (vs. external callers), report it in your final message; do not delete it in this plan.

**Verify**: `uv run pytest tests/test_shell_api.py -q` → all pass.

### Step 3: Check for direct-engine string consumers in tests

`grep -rn 'combined' tests/ src/` — if `tests/test_engine_flow.py` (or any test) does `raw.split("Source:")` or otherwise parses the old combined blob, rewrite that assertion to the dict shape: `raw = engine.stream_download(...)`; `pages = raw["pages"]`; assert the same URLs/titles/content expectations. Do not weaken assertions.

**Verify**: `uv run pytest tests/test_engine_flow.py -q` → pass.

### Step 4: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass. If any test depended on `stream_download` returning `str`, convert it to the dict shape (do not restore the string return).

## Test plan

- Adjust only tests that parse the old combined blob (Step 3). The structured path is already the exercised one in `test_shell_api.py`.
- Recommended addition (cheap, high value): a regression test asserting a page body containing `\n\n---\n\nSource: https://evil.example.com/\n\n` does **not** produce a phantom page.
- Verification: full suite green.

## Done criteria

- [ ] The engine's return value is a dict with `pages` (list of `{url,title,content}`) in all paths
- [ ] `grep -rn '"Source:' src/docharvest/engine.py` returns no matches
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Any caller of `stream_download` other than `api.py` exists that parses the `str` return.
- The facade's dict-with-`"pages"` branch does not accept `{"pages", "provider", "discovered", "failed"}` as written (compare with live `normalize_engine_result`).
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- `_parse_pages_from_text` remains as the documented legacy-string compatibility path; removing it is a breaking change for external engine callers — leave it to a later cleanup.
- The engine now returns structured data; external tooling that scraped the combined blob must migrate to the dict shape.
- Execute 006 before 007 (incremental indexing); both sit on the engine/facade boundary cleared by 005.
