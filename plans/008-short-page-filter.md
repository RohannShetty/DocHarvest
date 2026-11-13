# Plan 008: Make the short-page filter a single pass instead of O(n·m)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/api.py tests/test_shell_api.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

In the capture facade, pages below `min_content_chars` are dropped with:

```python
short_pages = [page for page in pages
               if min_content_chars and len(page.content.strip()) < min_content_chars]
pages = [page for page in pages if page not in short_pages]
```

`CapturedPage` is a frozen dataclass; `in` uses structural `__eq__` across every field — including the full page text. The removal is O(n·m) complete-content string comparisons, and the failure mode is precisely the sites that produce many stub pages (large docs portals with thin stubs — the case that also yields the biggest `short_pages` list). The two-row-filter rewrite is manifestly equivalent and one pass.

## Current state

- `src/docharvest/api.py` (verified at HEAD ea307bd, lines ~566-576):
```python
        min_content_chars = _configured_min_content_chars()
        short_pages = [
            page for page in pages
            if min_content_chars and len(page.content.strip()) < min_content_chars
        ]
        if short_pages:
            pages = [page for page in pages if page not in short_pages]
            warnings.append(
                f"Skipped {len(short_pages)} page(s) below the configured minimum "
                f"content length of {min_content_chars} characters."
            )
```
- `short_pages` is used for the warning count and the filter only. The count of skipped pages equals `len(short_pages)`.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_shell_api.py -q`          | all pass            |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/api.py`
- `tests/test_shell_api.py` (only if you add a regression test — optional)

**Out of scope** (do NOT touch, even though they look related):
- `CapturedPage` — do not implement `__hash__`/`__eq__` shortcuts on the dataclass; fixing the call site is the correct change.
- The `min_content_chars` semantics, config plumbing, or the warning text format (tests may assert the exact string — keep it byte-identical).

## Git workflow

- Branch: `advisor/008-short-page-filter` (branch from `master`)
- Commit: `perf(api): single-pass short-page filter`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: One pass

Replace the block with:

```python
        min_content_chars = _configured_min_content_chars()
        if min_content_chars:
            pages = [p for p in pages
                     if len(p.content.strip()) >= min_content_chars]
            skipped_pages = <original count> - len(pages)
```

and set the warning count from `skipped_pages`. To preserve exact behavior for the `min_content_chars == 0/None` case (no filtering at all, no warning), compute `skipped` only when the filter is active. Cleanest equivalent:

```python
        min_content_chars = _configured_min_content_chars()
        if min_content_chars:
            skipped = sum(
                1 for p in pages
                if len(p.content.strip()) < min_content_chars
            )
            if skipped:
                pages = [p for p in pages
                         if len(p.content.strip()) >= min_content_chars]
                warnings.append(
                    f"Skipped {skipped} page(s) below the configured minimum "
                    f"content length of {min_content_chars} characters."
                )
```

**Verify**: `grep -n "not in short_pages" src/docharvest/api.py` → no matches; `uv run pytest tests/test_shell_api.py -q` → all pass (tests asserting the warning string keep passing because it is byte-identical).

### Step 2 (optional): regression test

If `tests/test_shell_api.py` has no test pinning the min-content filter, add one following the file's FakeEngine pattern: two pages, one whose content is shorter than the configured minimum (set the env var/fixture the existing tests use to control `_configured_min_content_chars` — read how existing tests stub it before writing yours), assert the capture `skipped`/warning mentions exactly one skipped page. If the existing suite already covers it, skip and say so in your report.

**Verify**: test passes.

### Step 3: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- Optional single regression test (Step 2).
- Verification: `test_shell_api.py` green; full suite green.

## Done criteria

- [ ] `grep -n "short_pages" src/docharvest/api.py` → no matches
- [ ] Warning text byte-identical to before (`git diff` shows only the computation, not the message string)
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- A test asserts the `short_pages` variable or the exact filter expression (report; the test is coupled to the implementation, not the behavior).
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The dataclass `__eq__` cost is a recurring trap anywhere `page in some_list` appears; if that pattern shows up in review, rewrite at the site.
