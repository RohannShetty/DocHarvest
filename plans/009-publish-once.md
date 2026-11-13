# Plan 009: Build the book and manifests once per capture, not per output root

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/output_contract.py tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. Plan 005 should be landed first (it removes the engine's own duplicate `docs.md` write; this plan handles the publish-side duplicate work).

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/005-engine-facade-persistence.md (soft — can land independently; recommended order is after)
- **Category**: perf
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

In the default `output_mode="both"`, `publish()` loops over two targets (project-local dir with book name `book.md`, and the library dir with `docs.md`) and, for **each** target, re-runs `write_page_tree`, `assemble_book`, `build_manifest`, and `build_full_manifest` over the same `pages`, then `atomic_write_text`-writes every file (each `atomic_write_text` does tempfile + fsync + replace — `manager.py` documents this). The book and the full manifest are byte-identical across targets; only `llms.txt` differs (its `book_name` field differs). Net effect: a 500-page capture builds the entire book twice, builds the full manifest twice, and pays ~2× atomic writes.

## Current state

- `src/docharvest/output_contract.py` — `publish()` (verified at HEAD ea307bd, lines ~404-462):
```python
    targets: list[tuple[str, Path]] = []
    if output_mode in ("both", "local") and local_dir is not None:
        targets.append(("book.md", Path(local_dir)))
        outcome.local_path = Path(local_dir)
    if output_mode in ("both", "library") and library_dir is not None:
        targets.append(("docs.md", Path(library_dir)))
        outcome.library_path = Path(library_dir)

    for book_name, root in targets:
        page_files, nbytes = write_page_tree(root, pages, crawl_date=crawl_date)
        book_text = assemble_book(
            pages, site_title=site_title, source_url=source_url, crawl_date=crawl_date
        )
        manifest_text = build_manifest(
            pages,
            site_title=site_title,
            source_url=source_url,
            provider=provider,
            crawl_date=crawl_date,
            book_name=book_name,
        )
        full_manifest_text = build_full_manifest(
            pages,
            site_title=site_title,
            source_url=source_url,
            provider=provider,
            crawl_date=crawl_date,
        )
        book_file = atomic_write_text(root / book_name, book_text)
        manifest_file = atomic_write_text(root / "llms.txt", manifest_text)
        full_manifest_file = atomic_write_text(root / "llms-full.txt", full_manifest_text)

        outcome.page_files.extend(page_files)
        outcome.bytes_written += (
            nbytes
            + len(book_text.encode("utf-8"))
            + len(manifest_text.encode("utf-8"))
            + len(full_manifest_text.encode("utf-8"))
        )
        if outcome.book_file is None:
            outcome.book_file = book_file
        if outcome.manifest_file is None:
            outcome.manifest_file = manifest_file
        if outcome.full_manifest_file is None:
            outcome.full_manifest_file = full_manifest_file
```
- `assemble_book(pages, site_title, source_url, crawl_date)` — pure; output does not mention the target or `book_name` (verified signature).
- `build_full_manifest(pages, site_title, source_url, provider, crawl_date)` — pure; no `book_name`.
- `build_manifest(...)` — takes `book_name`; differs per target only in that one field.
- `write_page_tree(root, pages, crawl_date)` — writes per-page files under `root/pages/`; this genuinely runs per target (different roots) and must stay per target.
- The `outcome.book_file`/`manifest_file` fields are reported in `CaptureResult`; "both" mode reports the local copy first. Keep that.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_output_contract.py tests/test_shell_output_contract.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

(File names listed are the expected ones; if `tests/` shows different output-contract test files, run `ls tests/` and use the real ones.)

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/output_contract.py`
- `tests/` (only if you add a regression assertion — optional)

**Out of scope** (do NOT touch, even though they look related):
- `atomic_write_text` itself.
- The contents/format of any emitted file. Only *how many times* they are computed may change — outputs must remain byte-identical.
- `engine.py` — plan 005's territory; do not re-add or touch engine-side writes here.

## Git workflow

- Branch: `advisor/009-publish-once` (branch from `master`)
- Commit: `perf(output): build book/manifests once per capture`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Hoist the pure computations

Before the `for book_name, root in targets:` loop, compute:

```python
    book_text = assemble_book(
        pages, site_title=site_title, source_url=source_url, crawl_date=crawl_date
    )
    full_manifest_text = build_full_manifest(
        pages, site_title=site_title, source_url=source_url,
        provider=provider, crawl_date=crawl_date,
    )
```

Inside the loop, keep only: `write_page_tree(...)`, the per-target `build_manifest(..., book_name=book_name)`, and the three `atomic_write_text` calls. Update `bytes_written` accounting to use the hoisted strings (same arithmetic).

### Step 2: Verify outputs are byte-identical

Write a quick check before running tests: capture a fixture corpus twice (or trust the existing suite if it asserts manifest/book bytes — check `tests/test_output_contract.py` for byte-level assertions first). At minimum confirm: book file content equality is asserted somewhere or add one:

```python
def test_publish_both_mode_book_identical(tmp_path):
    ...  # call publish(...) with output_mode="both"
    local_book = (local_dir / "book.md").read_bytes()
    library_book = (library_dir / "docs.md").read_bytes()
    assert local_book == library_book
```

(Use whatever publish invocation pattern existing tests use — read one test in `tests/test_output_contract.py` first.)

**Verify**: targeted test files pass.

### Step 3: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- Optional byte-identical assertion test (Step 2).
- Verification: output-contract tests pass; full suite green.

## Done criteria

- [ ] `grep -n "assemble_book\|build_full_manifest" src/docharvest/output_contract.py` → each appears once, above the target loop
- [ ] Local and library book bytes are identical in a "both"-mode publish (asserted or verified by existing tests)
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `assemble_book` or `build_full_manifest` (at execution time) takes a target-dependent parameter — the plan's assumption is false; report before hoisting.
- Any test fails in a way that suggests outputs changed.

## Maintenance notes

- The two books differ in *filename* (`book.md` vs `docs.md`) intentionally (project-local vs library convention); the shared content is intentional too — keep `llms.txt` as the only per-target manifest difference.
- If a third output root is ever added, remember this hoist: the book is a function of (pages, crawl context), not of the target.
