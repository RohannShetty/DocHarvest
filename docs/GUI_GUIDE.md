# Desktop and Browser GUI

DocHarvest provides the same capture and library interface in a native window or a local browser:

```bash
docharvest gui
docharvest gui --browser
docharvest gui --browser default --port 8765
```

## Capture workflow

1. In **Capture Studio**, enter a public documentation URL and review provider/version detection.
2. Set the page limit, workers, scope, exclusions, output mode, and optional SPA rendering. Rendering requires the optional Playwright installation.
3. Start capture and inspect progress and logs. In **Batch**, add URLs and choose **Run Batch** to process them sequentially using the configured options.
4. Open completed documents in the reader or use **Library**, **Search**, **Diff**, and **Export**.

At least one detected version remains selected when choosing an explicit version subset. A rejected start is a failure, not a completed capture. Batch completion can report both successes and failures; successful captures remain available in the library.

## Cancellation and recovery

- **Cancel** requests cooperative cancellation. The interface remains busy until the worker reports completion; a slow network operation may delay that event.
- **Cancel Batch** prevents subsequent URLs from starting and requests cancellation of the current capture.
- A batch with no completion event for ten minutes stops advancing. That deadline does not kill the worker, and the interface retains its busy state.
- **Force Reset** requests cancellation and checks whether the worker has stopped. If it is still alive, its busy state and domain locks are preserved. Wait and retry; do not manually remove a live capture's lock.
- A reset is not a hard thread termination. If recovery requires exiting the application, check Diagnostics and retain relevant logs first.

## Preferences and configuration

Open **Preferences** from the sidebar or press **Ctrl+8** outside a form field. The screen shows merged values, built-in defaults, configuration paths, and read-only preset tables.

Choose the destination before saving:

| Scope | Location | Precedence |
| --- | --- | --- |
| Global | `~/.docharvest/config.toml` | Overrides built-in defaults |
| Project | `./docharvest.toml`, relative to the GUI process working directory | Overrides global values |

Only supported capture-related keys can be saved. The writer retains unrelated tables, presets, and standalone comments; comments on a rewritten setting line may be replaced. **Reset to Defaults** changes the form only until you save it.

Capture Studio currently supplies explicit per-run options and initializes its own controls. Saving Preferences does not automatically update those controls or an active capture. CLI arguments also override persisted configuration.

## Local browser security

The browser companion exposes local file and capture operations. Keep its server bound to loopback. Host validation rejects unrelated hostnames, and origin checks reject foreign sites and opaque origins such as `Origin: null`. Explicit local development origins on port 5173 remain supported. Native clients without an Origin header are allowed: this is not authentication, a remote API, or protection from other local software.

Do not forward the GUI port to the internet, proxy untrusted sites through it, or treat it as a multi-user service.

## Development and debug tests

Run the backend on port 8765, then start Vite in another terminal:

```bash
docharvest gui --browser default --port 8765
cd frontend
npm ci
npm run dev
```

Vite proxies `/api` and `/api/events` to `127.0.0.1:8765`. A running backend is required for real capture operations.

```bash
# From the repository root
uv run pytest -q -p no:cacheprovider
uv run pytest tests/test_gui_server.py tests/test_gui_bridge.py tests/test_gui_bridge_safety.py tests/test_gui_config_bridge.py

# From frontend/; use Node 22.18+ or a newer compatible runtime
node --experimental-strip-types --test src/lib/__tests__/flow.test.mjs src/lib/__tests__/batch.test.mts
npm run typecheck
npm run lint
npm run build
```

`npm run build` refreshes the assets shipped in `src/docharvest/gui/web/`. A source-only change will not update an already-built desktop bundle until this command runs. Python tests and frontend unit tests cover logic and protocol behavior; they do not replace manual visual, keyboard, responsive, and real-capture acceptance tests.
