# Plan 012: Split markdown in linear time (byte counter instead of re-encoding the accumulator)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/splitter.py tests/test_splitter.py`
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

`split_file` (the header-aware markdown chunker behind `gitbook-dl split`, documented for "huge downloads" such as 39 MB books) is quadratic in the book size: inside the loop over sections it computes `len((current + section).encode("utf-8"))` — re-concatenating and re-encoding the *entire accumulated chunk* for every section — and `current += section` repeatedly copies the accumulator. Output is byte-identical either way; only the cost changes.

## Current state

- `src/docharvest/splitter.py` (verified at HEAD ea307bd, lines ~29-61):
```python
    # Read input
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()

    max_bytes = int(max_mb * 1024 * 1024)

    # Split on markdown headers - this is the key: we split at `\n#`
    # so each chunk starts at a header boundary
    sections = content.split("\n#")
    chunks = []
    current = ""

    for i, section in enumerate(sections):
        if i > 0:
            section = "#" + section  # Restore the header marker

        # If adding this section would exceed the limit AND we already have content,
        # finish the current chunk and start a new one
        if len((current + section).encode("utf-8")) > max_bytes and current.strip():
            chunks.append(current)
            current = section
        else:
            current += section

    # Don't forget the last chunk
    if current.strip():
        chunks.append(current)
```
- The public contract (`split_markdown(content, ...)` / `split_file(...)`) and the exact chunk boundaries must not change: a section still starts a new chunk exactly when `current` is non-empty and adding it would exceed `max_bytes`. Chunk-boundary stability matters — downstream RAG pipelines depend on reproducible splits.
- `extract_topic_context` in the same module has the same accumulator pattern (`current += section` at its own loop) — apply the same byte-counter fix there if it encodes per iteration; read it and decide. (The `len((current + section)...)` site is the quadratic hot path; fix what exists, do not speculate.)

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_splitter.py -q`           | all pass            |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/splitter.py`

**Out of scope** (do NOT touch, even though they look related):
- The split semantics (which section starts a chunk, trailing-chunk handling) — byte-identical boundaries required.
- `split_file`'s caller-facing I/O (naming `doc_part_NN.md`, output dir handling).
- Any fence-aware splitting work — that was a separate, unselected audit finding.

## Git workflow

- Branch: `advisor/012-splitter-linear` (branch from `master`)
- Commit: `perf(splitter): linear-time byte counting for chunk boundaries`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Running byte counter + list accumulator

Rewrite the loop:

```python
    sections = content.split("\n#")
    chunks: list[str] = []
    parts: list[str] = []
    current_bytes = 0

    for i, section in enumerate(sections):
        if i > 0:
            section = "#" + section  # Restore the header marker
        section_bytes = len(section.encode("utf-8"))

        if current_bytes + section_bytes > max_bytes and parts:
            chunk = "".join(parts)
            if chunk.strip():
                chunks.append(chunk)
            parts = [section]
            current_bytes = section_bytes
        else:
            parts.append(section)
            current_bytes += section_bytes

    chunk = "".join(parts)
    if chunk.strip():
        chunks.append(chunk)
```

Semantics preserved: a section starts a new chunk exactly when `parts` is non-empty (i.e. `current` non-empty) and the running byte total would exceed `max_bytes`. Note the original checked `current.strip()` — the new predicate checks `parts` (equivalent to `current` non-empty; if every part is whitespace the `.strip()` filter at append time drops it either way — keep the same append-time `.strip()` behavior).

### Step 2: Equivalence check on a big synthetic input

Before trusting the suite, run one equivalence probe locally in a scratch REPL (do **not** commit it): generate ~5000 sections of pseudo-markdown with a fixed seed, split with the old algorithm (e.g., from `git show HEAD:src/docharvest/splitter.py`) and the new one, and assert `chunks_old == chunks_new`. If you cannot script the old version easily, compare against `tests/test_splitter.py` outputs only and say so honestly in the report.

**Verify**: equivalence confirmed (or the limitation stated).

### Step 3: Full suite

**Verify**: `uv run pytest tests/test_splitter.py -q` then `uv run pytest tests/ -q` → all pass.

## Test plan

- No new tests required; the existing splitter tests pin boundaries.
- Step 2 equivalence probe is the real check for a large-input regression.

## Done criteria

- [ ] `grep -n "(current + section)" src/docharvest/splitter.py` → no matches
- [ ] Old vs new splitter produce identical chunk lists on a synthetic multi-thousand-section input (report the probe result)
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The equivalence probe shows any chunk-boundary divergence (report the first divergent input).
- `split_markdown` (the string-based entry point, if distinct from `split_file`) has its own accumulator line with the same pattern — fix it with the same technique in the same plan, and report it.

## Maintenance notes

- If the fence-aware split rework ever lands (unselected audit finding), this byte-counter scheme must be carried into it — the quadratic trap returns easily.
