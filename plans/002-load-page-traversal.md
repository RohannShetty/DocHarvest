# Plan 002: Stop `StorageManager.load_page` from escaping the pages tree

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/storage/manager.py src/docharvest/mcp/server.py tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

`StorageManager.load_page(domain, relpath)` joins an agent- or caller-supplied relative path onto `<domain>/pages/` after only stripping leading slashes. `..` segments are not rejected, and there is no containment check, so `load_page(domain, "../../<anything>.md")` reads files outside the domain's pages tree. The MCP `read_doc` tool passes an LLM-controlled `path` straight through to `load_page` (with a `.md` retry), which makes this a prompt-injection primitive: a hostile captured page can instruct an agent to call `read_doc` with a traversal path and pull an arbitrary local file into the conversation. Stored-credential theft from an agent context is the concrete failure mode. The write side of this codebase already has a real traversal guard (`output_contract.py`, `domain_to_path_name` collapses `..`) — the read side does not.

## Current state

- `src/docharvest/storage/manager.py` — `load_page` (verified at HEAD ea307bd, lines 512-519):
```python
    def load_page(self, domain: str, relpath: str) -> str | None:
        """Read an individual page from the domain's pages/ tree.

        Returns None if the page file does not exist.
        """
        clean_rel = str(relpath).lstrip("/\\")
        page_path = self._domain_dir(domain) / "pages" / clean_rel
        return page_path.read_text(encoding="utf-8") if page_path.exists() and page_path.is_file() else None
```
  `list_pages` (lines 521-530) already enumerates pages via `rglob` inside `pages/`; `relpath` values the system itself produces (e.g. from `list_pages`) never contain `..`.
- `src/docharvest/mcp/server.py` — the MCP `read_doc(domain, path=..., ...)` tool (lines 456-472) passes `path.replace("\\", "/")` straight into `_storage.load_page(domain, clean_p)`, and retries with `.md` appended when the first attempt returns None. Nothing else calls `load_page` with untrusted input (the CLI/TUI/GUI pass paths the system itself produced).
- `_domain_dir` is a private method; `domain_to_path_name()` governs the domain segment and is unaffected by this plan.
- Repo conventions: storage paths use `Path` operations and `atomic_write_text()`; tests use `StorageManager(base_dir=tmp_path)`.
- Exemplar test: `tests/test_storage.py` (storage manager tests with `tmp_path`); MCP tool tests: `tests/test_mcp_server.py`.

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Install   | `uv pip install -e .`                                | exit 0              |
| Tests     | `uv run pytest tests/test_storage.py tests/test_mcp_server.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/storage/manager.py`
- `tests/test_storage.py` (add tests; or `tests/test_mcp_server.py` for the tool-level one — add both, cheaply)

**Out of scope** (do NOT touch, even though they look related):
- `output_contract.py` and `domain_to_path_name` — the write-side guard exists and stays as-is.
- `gui/bridge.py` — file-access confinement there is plan 001.
- The MCP tool's parameter handling beyond what is needed to route through the now-safe `load_page`.

## Git workflow

- Branch: `advisor/002-load-page-traversal` (branch from `master`)
- Commit per step; message style: `fix(storage): confine load_page to the domain pages tree`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Contain the resolved path

In `load_page`, after `clean_rel = str(relpath).lstrip("/\\")`, build and verify the target:

```python
pages_root = (self._domain_dir(domain) / "pages").resolve()
page_path = (pages_root / clean_rel).resolve()
try:
    page_path.relative_to(pages_root)
except ValueError:
    return None
```

Then keep the existing `exists()/is_file()/read_text` behavior. Use `Path.resolve()` (not `os.path.abspath`) so Windows short-name and symlink escapes are normalized. Backslashes are already normalized to `/` by the MCP caller, but `load_page` must not rely on that — the resolution check must be the single guard.

**Verify**: `uv run pytest tests/test_storage.py -q` → pass (existing tests unchanged).

### Step 2: Add traversal tests

In `tests/test_storage.py` add a test class (e.g. `TestLoadPageTraversal`) using `StorageManager(base_dir=tmp_path)` with a temp domain whose `pages/` contains `index.md`:

1. `load_page(domain, "index.md")` → returns the content.
2. `load_page(domain, "../../secret.md")` → `None` (create a sibling file outside `pages/` to prove nothing is read).
3. `load_page(domain, "..\\..\\secret.md")` → `None` (backslash variant: normalize before the check, or ensure `resolve()` handles it — on Windows it does; assert the result, not the mechanism).
4. `load_page(domain, "/absolute/outside.md")` → `None`.
5. `load_page(domain, "sub/dir/../../../outside.md")` → `None`.

In `tests/test_mcp_server.py` add one tool-level test: `read_doc(domain=..., path="../../secret.md")` → the response indicates not found / has no file content (assert no secret bytes appear in the returned dict).

**Verify**: `uv run pytest tests/test_storage.py tests/test_mcp_server.py -q` → all pass.

### Step 3: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass.

## Test plan

- Five storage-level tests (Step 2, cases 1-5) and one MCP tool-level test.
- Pattern: existing `test_storage.py` temp-`StorageManager` fixtures and `test_mcp_server.py` async tool invocation style.
- Verification: both files pass; then the full suite passes.

## Done criteria

- [ ] `uv run pytest tests/test_storage.py -q` exits 0 with the traversal tests present
- [ ] `uv run pytest tests/test_mcp_server.py -q` exits 0 with the read_doc traversal test present
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Some in-repo caller passes a `relpath` that legitimately escapes `pages/` (grep found none at plan time — if you find one, report it before changing behavior for it).
- The excerpts in "Current state" no longer match.
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The containment check in `load_page` is the single choke point; any future page-loading API must reuse it rather than re-implement it.
- A residual limitation: `resolve()` on a path that does not exist is safe on modern Python (it normalizes without requiring existence), but if a Windows junction/symlink inside `pages/` points outside the tree, `resolve()` follows it and the containment check correctly rejects the escape. Do not "optimize" by switching to purely lexical checks — that would re-open the escape.
- Plan 001 confines the GUI bridge; this plan confines storage. Both are needed; neither subsumes the other.
