# Plan 010: Reuse one browser per render-mode capture instead of launching Chromium per page

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/engine.py src/docharvest/utils/renderer.py tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (independent; if 005/006 have landed, the render call sites live in `download_one` either way)
- **Category**: perf
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

With `render=True`, every page pays a full `sync_playwright()` startup + `chromium.launch()` + `browser.close()` — on the order of seconds of process setup per page, plus memory churn, possibly multiplied across parallel worker threads. On a 300-page client-rendered docs crawl that dominates capture time. The browser is heavyweight and reusable; pages/contexts are designed to be created and discarded cheaply.

## Design decision (binding — do not redesign)

Playwright's **sync API is bound to the thread that created it**; browser/context objects cannot be used or closed from another thread. Rather than build a cross-thread browser registry (error-prone, and un-verifiable without a real browser), this plan takes the simpler correct trade:

**When `render=True`, the fetch loop runs sequentially on the calling thread with a single browser shared by all pages. When `render=False`, the parallel `ThreadPoolExecutor` path is completely unchanged.**

Rationale: render-mode pages are already dominated by browser startup; sequential rendering against one reused browser is typically 5–10× faster than parallel rendering with per-page browsers, and it is provably leak-free. If render-mode throughput matters afterwards, the follow-up design is the async API + dedicated render process — out of scope here.

## Current state

- `src/docharvest/engine.py` — `download_one(url_to_fetch)` (verified at HEAD ea307bd, lines ~455-533) is submitted to a `ThreadPoolExecutor` (lines ~535-543). Inside it, when `render` is true (verified lines ~462-486):
```python
            if render:
                try:
                    from .utils.renderer import HeadlessRenderer, is_render_available
                    if not is_render_available():
                        raise RuntimeError(
                            "Headless rendering requires Playwright. Install with: "
                            "pip install \"docharvest[render]\" && playwright install chromium"
                        )
                    renderer = HeadlessRenderer()
                    html = renderer.render_url(url_to_fetch)
                    if hasattr(provider, "_extract_md_from_html"):
                        content = provider._extract_md_from_html(html)
                    else:
                        from markdownify import markdownify as md
                        content = md(html, heading_style="ATX").strip()
                except Exception as exc:
                    logger.warning("Render failed for %s: %s; falling back to provider extract", url_to_fetch, exc)
                    if progress_callback:
                        progress_callback({
                            "phase": "error",
                            "url": url_to_fetch,
                            "error": f"Render failed: {exc}",
                        })
                    content = provider.extract_content(url_to_fetch, session)
```
- `src/docharvest/utils/renderer.py` — `HeadlessRenderer` (verified). `render_url()` does `from playwright.sync_api import sync_playwright` then `with sync_playwright() as p:` → `browser_launcher.launch(headless=self.headless)` → `try: ... finally:` (confirm the browser close is in a `finally` — read the rest of the function before editing). No reuse exists today.
- The executor block (verified lines ~535-543):
```python
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(download_one, u): u for u in crawl_urls}
        for future in as_completed(futures):
            if cancel_check and cancel_check():
                executor.shutdown(wait=False, cancel_futures=True)
                raise RuntimeError("Capture aborted by user")
            content, fetched_url, error = future.result()
            if content:
                url_content[fetched_url] = content
```
- `download_one` also does the post-render bookkeeping (thin-content diagnostic re-fetch, progress callbacks, size accounting) and must stay behavior-identical.

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_engine_flow.py tests/test_engine_providers.py -q` | all pass |
| Full suite| `uv run pytest tests/ -q`                            | all pass            |

(No real browser in CI; the render path is not exercised by the suite. Do not add one.)

## Scope

**In scope** (the only files you should modify):
- `src/docharvest/engine.py`
- `src/docharvest/utils/renderer.py`
- `tests/` (only if you find a fake-playwright harness to extend; otherwise skip)

**Out of scope** (do NOT touch, even though they look related):
- The async Playwright API or any queue/process architecture (Shape B) — follow-up, not this plan.
- `--render` flag semantics, CLI wiring, `is_render_available()`.
- Per-page browser behavior (user agent, viewport, timeouts, networkidle wait) — keep byte-identical.
- The non-render fetch path — it stays parallel, untouched.

## Git workflow

- Branch: `advisor/010-render-browser-reuse` (branch from `master`)
- Commit: `perf(render): reuse one browser for the whole render-mode capture`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Give `HeadlessRenderer` explicit lifecycle

Add two methods to `HeadlessRenderer` (keep `render_url(url, timeout_ms=..., wait_selector=None)` signature and per-call behavior otherwise identical):

```python
def open(self) -> "HeadlessRenderer":
    """Start playwright and launch the browser once; returns self."""
    if getattr(self, "_p", None) is not None:
        return self
    from playwright.sync_api import sync_playwright
    self._p = sync_playwright().start()
    launcher = getattr(self._p, self.browser_type, self._p.chromium)
    self._browser = launcher.launch(headless=self.headless)
    return self

def close(self) -> None:
    b, p = getattr(self, "_browser", None), getattr(self, "_p", None)
    try:
        if b is not None:
            b.close()
    finally:
        try:
            if p is not None:
                p.stop()
        finally:
            self._browser, self._p = None, None

def __enter__(self): return self.open()
def __exit__(self, *exc): self.close(); return False
```

`render_url` now uses `self._browser` (opening lazily if needed — call `self.open()` at the top of `render_url` if `self._browser is None`); remove the per-call `with sync_playwright() as p:` wrapper. Per call it creates a fresh `context` and `page` and still closes them in a `finally`.

### Step 2: Route render mode through a sequential main-thread loop

In `stream_download`, after computing `crawl_urls` and before the fetch phase, branch:

```python
    if render:
        from .utils.renderer import HeadlessRenderer
        renderer = HeadlessRenderer()
        try:
            for u in crawl_urls:
                content, fetched_url, error = download_one(u)   # unchanged function
                if content:
                    url_content[fetched_url] = content
                if cancel_check and cancel_check():
                    raise RuntimeError("Capture aborted by user")
        finally:
            renderer.close()
    else:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            ... (unchanged) ...
```

To make `download_one` use the shared renderer instead of constructing one per page: declare `renderer` outside `download_one` and have the render branch use it (e.g., pass as an argument or close over it — match the existing closure style of the function). The per-page `HeadlessRenderer()` construction and `is_render_available()` check move out of the per-page path: check once before the loop (keep the same RuntimeError message on missing Playwright).

Keep `download_one` semantics identical otherwise: same progress callbacks, same size accounting, same error handling. The only change is *where* the renderer comes from.

### Step 3: Verify no per-page browser survives

Read the final render path end-to-end and confirm: exactly one `HeadlessRenderer` per `render=True` capture; exactly one `browser_launcher.launch` per capture; `browser.close()` and `p.stop()` run on all exit paths including the cancel path (the `finally` around the loop covers it).

### Step 4: Tests + full suite

**Verify**: `uv run pytest tests/ -q` → all pass. No new tests required; if you add one, it must use fakes, not a browser.

## Test plan

- Behavioral verification limited (no browser in CI); win is structural and code-reviewable. Do not invent timing metrics.
- Verification: full suite green.

## Done criteria

- [ ] `grep -n "HeadlessRenderer()" src/docharvest/engine.py` shows construction once per capture (outside the per-page function), never inside `download_one`
- [ ] `grep -n "sync_playwright" src/docharvest/utils/renderer.py` shows it only inside `open()`
- [ ] `browser_launcher.launch` is called at most once per capture (read the path)
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `download_one` cannot accept the shared renderer without breaking other call sites (grep them first).
- The sequential render loop cannot preserve the exact `progress_callback` event sequence the GUI expects (report the mismatch).
- Any non-render test fails.
- Verification fails twice after a reasonable fix attempt.

## Maintenance notes

- If render-mode throughput becomes the bottleneck, the correct next step is the async API with a dedicated render worker (one browser, contexts per page, internally async) — do not approximate it with per-thread sync browsers.
- `HeadlessRenderer` now owns an explicit lifecycle; any new call site must use `with HeadlessRenderer() as r:` or call `open()`/`close()` symmetrically.
- Sequential render mode means a 300-page SPA capture is slow but correct; users hitting large SPAs should be steered to it consciously — document in the README flag help only if you are confident; otherwise leave docs alone.
