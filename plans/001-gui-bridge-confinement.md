# Plan 001: Confine the GUI bridge attack surface (read_file, open_folder/open_file, and the dead open_folder fallback)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/gui/bridge.py src/docharvest/storage/manager.py tests/`
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

The desktop GUI binds an `ApiBridge` object two ways: in-process via PyWebView's `js_api`, and over HTTP on a loopback server (`docharvest gui --browser`). The HTTP surface (`POST /api/<method>`) dispatches *any* public bridge method by name to callers that are not necessarily the GUI: any local process, and any request with no `Origin` header (the loopback gate in `server.py` deliberately lets headerless requests through, because DNS-rebinding/CSRF are already mitigated — see `_request_allowed`). Three bridge methods are far broader than the GUI legitimately needs:

1. `read_file` reads **any absolute path** on disk and returns it to the caller.
2. `open_file` calls `os.startfile` (Windows) / `open` / `xdg-open` on an arbitrary path — executes or opens whatever the caller names.
3. `open_folder` builds `subprocess.Popen(f'explorer.exe /select,"{p}"', shell=True)` on Windows when `p` is API-controlled — a quoting-fragile shell string.

In the same method, the fallback path references `self._storage.root_dir`, which does not exist (`StorageManager` exposes `.base`), so "open library folder" always AttributeErrors today. This plan confines all three methods to the library root (or explicit last-capture outputs), removes the `shell=True`, and fixes the dead attribute.

## Current state

- `src/docharvest/gui/bridge.py` — the GUI ↔ Python boundary. Relevant regions (verified at HEAD ea307bd):

`read_file` (lines 485-494):
```python
    def read_file(self, file_path: str) -> dict[str, Any]:
        """Read a single markdown page."""
        try:
            p = Path(file_path)
            if not p.exists() or not p.is_file():
                return {"success": False, "error": "File not found"}
            content = p.read_text(encoding="utf-8", errors="replace")
            return {"success": True, "content": content, "filename": p.name}
        except Exception as exc:
            return {"success": False, "error": str(exc)}
```

`open_folder` (lines 530-561):
```python
    def open_folder(self, target: str) -> dict[str, Any]:
        """Open a directory or highlight a file in Windows Explorer / Finder."""
        try:
            p = Path(target)
            if not p.is_absolute():
                if self._storage.domain_exists(target):
                    p = self._storage._domain_dir(target)
                else:
                    p = Path.cwd() / target

            if not p.exists():
                if p.parent.exists():
                    p = p.parent
                else:
                    p = self._storage.root_dir        # <-- line 544: attribute does not exist

            if sys.platform == "win32":
                if p.is_file():
                    subprocess.Popen(f'explorer.exe /select,"{p}"', shell=True)   # <-- line 548: shell=True, interpolated
                else:
                    os.startfile(str(p))
            elif sys.platform == "darwin":
                if p.is_file():
                    subprocess.Popen(["open", "-R", str(p)])
                else:
                    subprocess.Popen(["open", str(p)])
            else:
                folder = p.parent if p.is_file() else p
                subprocess.Popen(["xdg-open", str(folder)])
            return {"success": True, "path": str(p)}
        except Exception as exc:
            return {"success": False, "error": str(exc)}
```

`open_file` (lines 565-583):
```python
    def open_file(self, target: str) -> dict[str, Any]:
        """Open a document / export file directly with the operating system's default application."""
        try:
            p = Path(target)
            if not p.is_absolute():
                p = Path.cwd() / target
            if not p.exists():
                return {"success": False, "error": f"File not found: {p}"}
            if sys.platform == "win32":
                os.startfile(str(p))
            elif sys.platform == "darwin":
                subprocess.Popen(["open", str(p)])
            else:
                subprocess.Popen(["xdg-open", str(p)])
            return {"success": True, "path": str(p)}
        except Exception as exc:
            return {"success": False, "error": str(exc)}
```

- `src/docharvest/storage/manager.py` — `StorageManager` exposes `.base` (the library root, default `~/.docharvest`), `.pages_dir(domain)`, `.latest_path(domain)`, `_domain_dir(domain)` (private). `domain_to_path_name()` (lines 67-97) makes Windows-safe dir names. There is **no** `root_dir` attribute.
- `src/docharvest/gui/server.py` — `do_POST` (lines 443-475) maps `clean_path[5:]` to `getattr(bridge, method_name)` and calls it with the JSON body as args; methods starting with `_` are refused. `_origin_allowed` returns True for requests with **no** Origin header.
- Legit callers of these three methods (from the frontend): the library view passes absolute `path` values that the bridge itself produced (page paths under `~/.docharvest/docs/<domain>/pages/`), plus "open folder" buttons passing a domain name or a library path. They never pass arbitrary user-typed absolute paths.
- Repo conventions: public bridge methods return `{"success": bool, "error": str?...}`; the bridge never raises. Writes go through `atomic_write_text()`. Tests use temp `StorageManager(base_dir=tmp_path)`.
- Exemplar test style: `tests/test_gui_bridge.py` — constructs the bridge with a temp storage and calls methods directly; `tests/test_gui_bridge_safety.py` — adversarial-input bridge tests. Model your new tests on `test_gui_bridge_safety.py` (read it first).

## Commands you will need

| Purpose   | Command                                   | Expected on success |
|-----------|-------------------------------------------|---------------------|
| Install   | `uv pip install -e .`                     | exit 0              |
| Tests     | `uv run pytest tests/test_gui_bridge_safety.py tests/test_gui_bridge.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                 | all pass            |
| Drift     | `git diff --stat`                          | only in-scope files |

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/gui/bridge.py`
- `tests/test_gui_bridge_safety.py` (add tests; create `tests/test_gui_bridge_confinement.py` if that file does not exist — check first with `ls tests/`)

**Out of scope** (do NOT touch, even though they look related):
- `src/docharvest/gui/server.py` — the header gate is deliberately headerless-friendly; changing auth semantics is a separate decision (tracked as a future hardening item).
- `src/docharvest/storage/manager.py` — do not rename `_domain_dir` or add public accessors in this plan; a one-line public wrapper is acceptable **only if** you need it, and then it must be named `domain_dir` and documented as public.
- The frontend (`frontend/`) — the TS call sites stay exactly as they are; they already pass library-derived paths.
- `read_doc` / `list_library` / any other bridge method.

## Git workflow

- Branch: `advisor/001-bridge-confinement` (branch from `master`)
- Commit per step or per logical unit; message style matches repo history, e.g. `fix(gui): confine bridge file access to the library root`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a private path-confinement helper to ApiBridge

Add to `src/docharvest/gui/bridge.py` (module-level or as a static method), e.g.:

```python
def _resolve_under(self, path_like: str, roots: list[Path]) -> Path | None:
    """Resolve *path_like* and return it only if it lands under one of *roots*.

    Returns None for anything else. Used to confine API-reachable file access
    to the docharvest library (or other caller-approved roots).
    """
    try:
        p = Path(path_like).expanduser().resolve()
    except (OSError, ValueError):
        return None
    for root in roots:
        try:
            p.relative_to(Path(root).resolve())
            return p
        except ValueError:
            continue
    return None
```

Define the allowed roots once (e.g. `self._allowed_roots()` returning `[Path(self._storage.base)]`). Do not add `Path.cwd()` as an allowed root — the GUI never needs it.

**Verify**: `uv run python -c "from docharvest.gui.bridge import ApiBridge; print('import ok')"` → prints `import ok`.

### Step 2: Confine `read_file` to the library root

Replace the `Path(file_path)` handling in `read_file` with: resolve under `self._allowed_roots()`; on failure return `{"success": False, "error": "Path is outside the docharvest library"}`. Keep the `is_file()`/`File not found` behavior and the return shape unchanged otherwise.

**Verify**: `uv run pytest tests/test_gui_bridge_safety.py -q` → pass (add the new tests in Step 5 first if the file currently lacks this coverage; verification is then the new tests passing).

### Step 3: Rewrite `open_folder` and `open_file`

For `open_folder`:
- Relative input: keep the existing behavior only when the input is a bare domain name (`self._storage.domain_exists(target)`) — resolve to `self._storage._domain_dir(target)`. All other relative inputs are rejected with `{"success": False, "error": "..."}`.
- Absolute input: confine with `_resolve_under` to the library root; reject otherwise.
- Missing-path fallback: replace `self._storage.root_dir` with the parent-of-target behavior you already have, and final fallback with `Path(self._storage.base)` — never a nonexistent attribute.
- Windows branch: replace `subprocess.Popen(f'explorer.exe /select,"{p}"', shell=True)` with `subprocess.Popen(["explorer.exe", f"/select,{p}"])` (argv list, no shell). `os.startfile(str(p))` may remain for directories.

For `open_file`:
- Resolve `p` (absolute only; relative inputs are rejected), confine with `_resolve_under` to the library root, keep the platform dispatch (`os.startfile` / `open` / `xdg-open`) otherwise.

**Verify**: `uv run pytest tests/test_gui_bridge.py -q` → pass; and `uv run python -c "import docharvest.gui.bridge as b; print('ok')"`.

### Step 4: Add adversarial tests

In the safety test file, add tests covering:
1. `read_file("../../etc/passwd")` (or `C:\\Windows\\win.ini` on Windows) → `success` is False, no file content returned.
2. `read_file` with a path inside a temp library (e.g. `<base>/docs/example.com/pages/index.md`) → `success` True (prove the confinement allows the legitimate case).
3. `open_folder("C:/Windows")` / absolute path outside the library → `success` False. (Do not actually spawn Explorer/Finder in tests — confine happens before the platform dispatch, so a rejected path returns before any subprocess call. Assert on the returned dict only.)
4. `open_file` with an outside-library absolute path → `success` False.
5. `open_folder(<domain-name>)` with a temp library containing that domain → `success` True. To keep the test from shelling out to a real file manager, monkeypatch `subprocess.Popen` and `os.startfile` in the module under test; assert they were called with the confined path.
6. `open_folder` fallback no longer references `root_dir`: `grep -n "root_dir" src/docharvest/gui/bridge.py` → no matches.

**Verify**: `uv run pytest tests/test_gui_bridge_safety.py -q` → all pass.

### Step 5: Full suite

**Verify**: `uv run pytest tests/ -q` → all pass (936+ tests).

## Test plan

- New tests live in the safety test file identified in Scope (Step 4 lists the six cases).
- Pattern to model after: the existing adversarial tests in `tests/test_gui_bridge_safety.py`.
- Verification: `uv run pytest tests/test_gui_bridge_safety.py tests/test_gui_bridge.py -q` → all pass including the 6 new ones.

## Done criteria

- [ ] `grep -n "root_dir" src/docharvest/gui/bridge.py` → no matches
- [ ] `grep -n "shell=True" src/docharvest/gui/bridge.py` → no matches
- [ ] `uv run pytest tests/test_gui_bridge_safety.py -q` exits 0 with the new confinement tests present
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The frontend calls these methods with paths that are legitimately outside `~/.docharvest` (e.g. the GUI's "export to a user-chosen folder" flow passes an arbitrary absolute path to `open_file`). If you find such a legitimate call site in `frontend/src/`, report it — the allowed-roots list needs a second root, and that is a maintainer decision, not yours.
- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- Fixing the confinement appears to require touching `server.py` or the frontend.

## Maintenance notes

- Any future bridge method that opens/reads a caller-named path must go through `_resolve_under` — reviewers should reject new public bridge methods that take a raw path without it.
- If a second allowed root is ever added (e.g. a user-chosen export directory), thread it through `self._allowed_roots()`, not ad-hoc per method.
- This plan deliberately does not add a per-launch auth token to the HTTP server; headerless local callers remain in scope of the loopback gate by design. That is a separate hardening decision tracked in the audit (SEC-06), not a defect in this change.
