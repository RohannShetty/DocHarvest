# Spike 026 — Incremental refresh (`DOCHARVEST_CHANGED_ONLY=1`)

Status: branch-only prototype. Not merged, no CLI flag shipped.
Plan: `plans/026-incremental-refresh-spike.md`.

## What it does

When `DOCHARVEST_CHANGED_ONLY=1`, page fetches send the validators stored by
the previous capture (`If-None-Match` / `If-Modified-Since`). A `304 Not
Modified` is turned into a synthetic `200` carrying the cached HTML, so the
provider pipeline emits byte-identical Markdown without downloading the body.
The default path (env unset) is untouched.

## 1. Cache layout

```
<library>/cache/<domain>/revalidate.json
{
  "<page url>": {
    "etag": "\"…\"",
    "last_modified": "Wed, 12 Nov 2026 10:00:00 GMT",
    "html": "<cached response body>",
    "content_type": "text/html; charset=utf-8",
    "fetched_at": "2026-11-13T05:00:00Z"
  }
}
```

Why the library and not `metadata.json` / page frontmatter:

- `metadata.json` is the registry, rewritten on snapshot; per-page validators
  there would churn it and race the version manager.
- Frontmatter lives inside the artifact and would change every capture, which
  breaks byte-stability of `docs.md` diffs.
- `cache/` is outside `docs/<domain>/`, so it never appears in the artifact
  or a snapshot; deleting it is the rollback.

`html` is stored so a 304 is self-contained. That is a spike-only trade: it
duplicates bytes. Follow-up: keep validators here and resolve a 304 body from
the stored page tree through a URL→relpath index (frontmatter already carries
`source_url`). Entries are capped at 2 MB; a larger page is simply refetched.

## 2. Revalidation ladder

1. `ETag`/`If-None-Match` — cheapest, exact.
2. `Last-Modified`/`If-Modified-Since` — used when the server sends no ETag.
3. Content hash (`sha256` of the response body) — always available but costs a
   full fetch; the prototype uses it only as a cache-consistency check, not as
   a network optimisation.

Only page URLs are recorded (`crawl_urls`); sitemaps, `llms.txt` probes and
`.md` fallbacks pass through unchanged. If a provider fetches a different URL
than the page URL, that request is not revalidated — correct, just less
efficient.

## 3. CLI surface (not shipped)

`--changed-only` is deliberately not wired. `CaptureOptions` is frozen and the
TUI mirror (`engine_protocol.py`) is a pinned contract; an additive option
would need the mirror and its parity test. The env var is the prototype
surface; the follow-up plan owns the flag + TUI mirror.

## 4. Correctness gate and measured numbers

`tests/test_revalidate.py` uses the shared fixture server, which now emits
ETags, answers `If-None-Match` with 304, counts requests, and can swap a page
body between captures.

| Scenario | 304s | Bodies fetched |
|---|---|---|
| Second capture, site unchanged (index + A + B) | 3 | 0 |
| After changing B | 2 (index, A) | 1 (B) |
| `DOCHARVEST_CHANGED_ONLY` unset | 0 | all |

Captured Markdown is byte-identical across the unchanged capture; the changed
capture contains B's new text and A's old text.

## 5. What still changes, and what breaks

- **Snapshots still happen.** Snapshotting is a facade concern and runs before
  every capture. Unchanged pages are still written from cached bytes, so a
  snapshot is a complete, consistent copy. Re-snapshotting an unchanged site
  may create a new version with identical content; the existing identical-
  snapshot skip is the place to dedupe, not this spike.
- **Search indexing still runs** for the captured domain (scoped since plan
  007). Revalidated pages are re-indexed from the same content.
- **Render mode is not supported.** Browser rendering bypasses the HTTP cache;
  rendering with changed-only set silently behaves as a full capture.
- **Cache poisoning is not a data-loss vector**: a stale entry can only cause
  a 304 with that URL's old bytes, and the server decides the 304; a changed
  page always yields 200.
- **Domain rename/delete** leaves an orphan cache directory; deleting it is
  safe. A follow-up should clean it with the library entry.

## 6. Follow-up build plan skeleton

1. Add `CaptureOptions.changed_only: bool = False` and mirror it in
   `tui/engine_protocol.py`; add the parity test.
2. Replace cached HTML with a URL→relpath index over `pages/` and store only
   validators; add a cache-version field.
3. Add `--changed-only` to the CLI and surface `revalidated` counts in the
   completion summary / GUI diagnostics.
4. Clean the cache on domain delete/rename; expire entries older than N days.
5. Keep `tests/test_revalidate.py` as the regression bed.

## Recommendation

Proceed: the prototype shows a meaningful reduction (all page bodies skipped
on an unchanged site) with no change to default behaviour. The duplicate-body
cache and the missing flag are the two pieces to resolve before shipping.
