# Plan 013: Stop shipping the book twice and stop reading every page file for a title

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/gui/bridge.py frontend/src/lib/api.ts frontend/src/types.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

The GUI's domain-details payload today: (a) contains the **entire book twice** — `"content"` and `"book_content"` carry the same string, doubling the JS↔Python boundary crossing on every domain open; (b) reads every page file **fully** (`read_text(...).splitlines()[:5]`) just to find a `# ` title; (c) if `docs.md` is missing, re-reads all pages again to synthesize a fallback book. On a large library this makes opening a domain scale with corpus size in O(total bytes), not O(pages).

## Current state

- `src/docharvest/gui/bridge.py` (verified at HEAD ea307bd, lines ~508-481):
```python
            if not book_content and pages_list:              # fallback synthesis
                parts = []
                for p in pages_list:
                    p_path = Path(p["path"])
                    if p_path.exists():
                        parts.append(p_path.read_text(encoding="utf-8", errors="replace"))
                book_content = "\n\n---\n\n".join(parts)

            return {
                "success": True,
                "domain": domain,
                "title": domain,
                "content": book_content,
                "book_content": book_content,
                "folder": str(doc_dir),
                "path": str(doc_dir),
                "pages": pages_list,
            }
```
and the page-list builder just above (lines ~527-549):
```python
            pages_dir = doc_dir / "pages"
            pages_list = []
            if pages_dir.exists():
                for md_file in sorted(pages_dir.rglob("*.md")):
                    rel = md_file.relative_to(pages_dir).as_posix()
                    title = md_file.stem
                    try:
                        first_lines = md_file.read_text(encoding="utf-8", errors="replace").splitlines()[:5]
                        for l in first_lines:
                            if l.startswith("# "):
                                title = l[2:].strip()
                                break
                    except Exception:
                        pass
                    pages_list.append(
                        {
                            "title": title,
                            "relpath": rel,
                            "path": str(md_file),
                            "size": md_file.stat().st_size,
                        }
                    )
```
  where `book_content` comes from `docs.md` read just above this block (locate in live code — it is the `load_doc` result).

- Frontend consumers: `grep -rn 'book_content\|\.content\b' frontend/src --include=*.ts*` will show which surfaces use which key. Preserve the one the frontend actually uses; remove or empty-string the other **only after** checking both keys' real usage.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_gui_bridge.py -q`         | all pass            |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/gui/bridge.py`
- `frontend/src/**` — **only** if Step 2 finds a consumer of the removed key (see STOP conditions first)

**Out of scope** (do NOT touch, even though they look related):
- `read_file` / `open_file` / `open_folder` — plan 001.
- `pages_list`'s `path`/`size` fields (the frontend uses them).
- The `docs.md` file format itself.

## Git workflow

- Branch: `advisor/013-gui-payload-dedupe` (branch from `master`)
- Commit: `perf(gui): single book payload; cheap title reads`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Single-read title extraction

Replace the full-file read with a bounded read:

```python
                        with open(md_file, "rb") as fh:
                            head = fh.read(512).decode("utf-8", errors="replace")
                        for l in head.splitlines()[:10]:
                            if l.startswith("# "):
                                title = l[2:].strip()
                                break
```

**Verify**: `uv run pytest tests/test_gui_bridge.py -q` → pass.

### Step 2: One book payload

Decide which of `content` / `book_content` the frontend consumes:
- `grep -rn 'book_content' frontend/src` → if zero matches, the frontend reads `.content` (or neither); set the response to carry only what is consumed (default: drop `book_content`, keep `content`).
- If the frontend uses both (unlikely), keep both and report — the double payload is then load-bearing and removing it is not this plan's call.

Also: the fallback path (no `docs.md`) should **reuse** the already-read page texts is impossible after Step 1 (only 512 bytes are read) — so simply let the fallback synthesize from full reads *only when `docs.md` is missing*, which is what it does; the defect was the duplicate payload and the always-full title reads, not the fallback. Leave the fallback logic unchanged.

**Verify**: `grep -n 'book_content\|"content"' src/docharvest/gui/bridge.py` → shows the deliberate final shape; `uv run pytest tests/test_gui_bridge.py -q` → pass.

### Step 3: Full suite + GUI bundle note

**Verify**: `uv run pytest tests/ -q` → all pass. (Python-only change; no frontend rebuild required unless you had to touch the frontend — if you did, `cd frontend && npm run build` and commit the regenerated `src/docharvest/gui/web/`.)

## Test plan

- No new tests required; existing bridge tests must pass (they may assert payload shape — if one asserts the removed key, update that assertion to the kept key and report it).
- If the frontend had to change, its type check must pass: `cd frontend && npm run typecheck`.

## Done criteria

- [ ] Domain-details response contains the full book at most once (`git diff` shows one of `content`/`book_content` removed, or a documented reason both remain)
- [ ] Page-title extraction reads ≤512 bytes per file (visible in `git diff`)
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Both `content` and `book_content` have live consumers in `frontend/src/` (report; the removal needs a frontend-coordinated change).
- An existing bridge test hard-asserts both keys (report; coordinate test update before removing).

## Maintenance notes

- Keep the fictional "book" single-sourced from `docs.md` when it exists; the GUI's doc viewer should be pointed at the same string, not a re-synthesized variant.
- If a `pages` index (relpath→size only) is ever all the library list needs, the title can move behind a click-time `read_file` call — that removes the per-open O(pages) head reads entirely.
