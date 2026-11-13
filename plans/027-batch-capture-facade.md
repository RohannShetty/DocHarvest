# Plan 027 (Design): Batch capture as a first-class facade capability (`capture_many`)

> **Executor instructions**: This is a **design** plan with a working core. The deliverable is a design document **plus** the facade-level implementation and its tests; CLI wiring and GUI delegation are included. If any STOP condition occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/api.py src/docharvest/tui/engine_protocol.py frontend/src/lib/batch.ts src/docharvest/cli.py`
> If any in-scope file changed since this plan was written, compare against the live code and report drift.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (if 005 has landed, rebase onto it — the engine/facade boundary is shared)
- **Category**: direction
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

Batch semantics already exist — written and tested — but only inside the frontend GUI: `frontend/src/lib/batch.ts` implements a "Dependency-injected async batch capture controller" (busy/stall/cancel state machine; sequences captures one URL at a time, awaits real completion, handles stalls and cancellation; covered by `batch.test.mts`). Meanwhile the pinned facade accepts exactly one URL per call (`api.capture(url, options)`) and the CLI takes a single positional `url`. CLI, MCP and agent users — the audience PRODUCT.md pitches — must shell-loop to capture a list of doc sites, losing queue semantics the project already proven. This plan lifts the proven semantics into the facade (`api.capture_many`), exposes `docharvest capture <url...>` and `--file urls.txt`, and points the GUI at the same contract.

## Current state (evidence)

- `frontend/src/lib/batch.ts` (verified head at ea307bd):
```ts
  export type BatchCompletion = {
    success: boolean
    cancelled?: boolean
    error?: string
  }
  export type BatchDriver = {
    start(url: string): Promise<{ success: boolean; error?: string }>
    cancel(): Promise<void>
  }
  export type BatchEvent = {
    kind: 'started' | 'completed' | 'failed' | 'cancelled' | 'stalled'
    url: string
    index: number
    result?: CaptureCompletion
  }
  export type BatchOptions = { /* ... see live file */ }
```
  Behavior: one URL at a time; never starts while a worker is alive; immediate rejected/throw starts handled as failed; stall timeout configurable; No real delays required in tests.
- `src/docharvest/api.py` — `capture(url: str, options: CaptureOptions, *, progress=None) -> CaptureResult`; `CaptureOptions.cancel_check: Callable[[], bool] | None` already exists — global cancel across a batch is expressible today.
- `src/docharvest/cli.py` — capture parser (verified): `url` positional `nargs="?"`, `--preset`, etc. Adding `nargs="*"`-style multiple URLs is additive at the parser level (route: if multiple URLs and no --preset, batch path).
- `src/docharvest/tui/engine_protocol.py` — pinned mirror; any new facade symbol meant for the TUI must be mirrored deliberately (the pin says: do not edit casually). This plan does **not** change `CaptureOptions`; `capture_many` is a new additive function — the TUI pin is untouched.
- `api.py` `CaptureResult` per URL; aggregate result shape is ours to define (see Step 2).

## Design (binding shape unless the live code forces a deviation — then report it)

```python
@dataclass(frozen=True)
class BatchItemResult:
    url: str
    ok: bool
    result: CaptureResult | None      # None when ok=False
    error: str | None                  # populated when ok=False

@dataclass(frozen=True)
class CaptureBatchResult:
    items: tuple[BatchItemResult, ...]
    succeeded: int
    failed: int
    cancelled: bool
```

`capture_many(urls, options, *, progress=None) -> CaptureBatchResult`:
- Executes **sequentially** (mirrors GUI semantics: never two crawls against `~/.docharvest` at once; the GUI's invariant "never starts a new capture while a worker is alive" is preserved by construction).
- Honors `options.cancel_check()` between and within items — if it fires (or returns True before item N), stop, mark remaining items `cancelled`, set `CaptureBatchResult.cancelled=True`.
- Failure of one item is recorded (`ok=False`, `error=str`) and the batch continues; no exception escapes for per-item failures.
- `progress` receives the underlying per-item progress events unmodified plus (additive) batch events? **Do not extend ProgressEvent kinds in this plan** — batch-level progress is out of scope; the CLI prints per-item completions it already prints for single captures.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_shell_api.py -q`          | all pass            |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |
| CLI help  | `docharvest capture --help`                           | shows `[url ...]` and `--file` |

## Scope

**In scope**
- `src/docharvest/api.py` — add `BatchItemResult`, `CaptureBatchResult`, `capture_many`
- `src/docharvest/cli.py` — `capture` accepts `url` (nargs `*` — keep single-URL behavior byte-identical when exactly one) or `--file urls.txt` (one URL per line, `#` comments skipped, blanks skipped); new `cmd_capture` branch prints a one-line summary at end (`N ok, M failed`)
- `tests/test_shell_api.py` — batch tests with FakeEngine (reuse the file's harness; FakeEngine already returns canned dict pages)
- `docs/` and `frontend/` — **not** touched in this plan (the GUI can adopt `capture_many` in a follow-up; do not edit TS here)

**Out of scope**
- Parallel batches (matches GUI semantics; parallel is a new decision)
- MCP tool for batch (`download_docs_batch`) — note as follow-up in report; the MCP surface addition is its own review
- TUI mirror / CaptureOptions changes
- Per-item snapshot dedup semantics beyond what single-capture already does
- `CaptureResult` changes

## Git workflow

- Branch: `advisor/027-capture-many` (branch from `master`)
- Commit(s): `feat(api): capture_many batch facade`; `feat(cli): capture <url...> and --file urls.txt`

## Steps

### Step 1: Baseline + harness
Read the cited files; run the suite green; confirm FakeEngine can serve two different URLs (it returns `{"url",...}` pages already keyed by... the FakeEngine doesn't key on URL — each call returns the same pages; that is fine for batch mechanics tests, and per-URL failure injection can use `fail_calls`).

### Step 2: Facade
Implement the types + `capture_many` per the design. Reuse `capture()` per URL (no duplicated crawl logic). Wrap per-URL `CaptureError` → `BatchItemResult(ok=False, error=str(exc))`. Update `__all__`/public surface per repo convention (`api.py` has an `__all__`? — read it; if yes, add the names).

### Step 3: CLI
`cap.add_argument("url", nargs="*", ...)` — check how single-url capture currently consumes `args.url` (likely `args.url` is a `str | None` used with `--preset`); restructure minimally:
- `urls = args.url or []`; if `--file` given, extend.
- If `not urls and not args.preset` → error (same as today's required-url behavior).
- If exactly one URL → call the existing single-capture path unchanged (byte-identical CLI behavior for the common case).
- Else → run batch, print per-item results and a final `N ok, M failed (batch aborted by cancel)` summary; exit code 0 if at least one succeeded? **Binding**: exit 0 only when all items succeed; exit 1 with the failed count if any failed — document in help text.

### Step 4: Tests
`TestCaptureMany` in `test_shell_api.py`:
1. two URLs both succeed → `succeeded == 2`, items ordered, both ran through FakeEngine once each.
2. second item fails (arrange FakeEngine to fail on its second call — extend FakeEngine in the test file if needed: e.g. fail_calls=1 with sequential ordering covers first-fail; for second-fail, add an `on_call(index)` hook to the local FakeEngine class — keep it local to tests).
3. cancel_check flips after first item → batch stops, `cancelled is True`, second item absent (`len(items) == 1`).
4. CLI `--file` parsing: write a temp file with 3 lines (one comment, one blank) → parser-level test if the repo has parser tests, else unit-test the file loader function you factor out.

**Verify**: `uv run pytest tests/test_shell_api.py -q` → all pass including the new class.

### Step 5: Full suite + help text check
**Verify**: `uv run pytest tests/ -q` → all pass; `docharvest capture --help` shows the new usage; single-URL invocation output unchanged (`docharvest capture <url>` behaves identically — diff the help/behavior by reading the `cmd_capture` diff).

## Done criteria

- [ ] `api.capture_many(["https://a.com", "https://b.com"], CaptureOptions(...)).succeeded == 2` (in a test)
- [ ] CLI `--file` works; single-URL path unchanged
- [ ] `CaptureOptions` untouched (`git diff` shows no change to the dataclass)
- [ ] Full suite green
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `cmd_capture` is structured such that the single/batch split cannot be made additive without touching preset handling (report; do not restructure presets).
- The CLI exit-code decision cannot honor the existing convention without breaking scripted users (report with evidence from `git log` bump/exit-code history).
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The GUI should delegate to `capture_many` (or its TS equivalent semantics) in a follow-up — then `frontend/src/lib/batch.ts` shrinks to a thin adapter; until then the two implementations must evolve in parallel (the TS one documents the reference behavior).
- MCP exposure (`download_docs_batch`) is the obvious next step; do not piggyback it here.
- Sequential batches mean large batches are slow — that is a feature (politeness + lock semantics), not a bug; parallelism needs a new concurrency decision around `~/.docharvest` locking.
