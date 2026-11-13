# Plan 028 (SPIKE): One-command MCP installer — `docharvest init --client <name>`

> **Executor instructions**: This is a **design/spike** plan, not a full build. The deliverable is a design document plus a prototype that writes one config **family** behind `--dry-run`; the rest is follow-up. If any STOP condition occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- src/docharvest/installers.py src/docharvest/tool_profiles.py server.json src/docharvest/cli.py`
> If any in-scope file changed since this plan was written, compare against the live code and report drift.

## Status

- **Priority**: P2 (repo's own P1 — `GROWTH_AUDIT.md:90` item P2)
- **Effort**: L (coarse; design + one-family prototype ≈ 1–3 d)
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

`GROWTH_AUDIT.md:90` (P2, with its own research) calls the one-command installer "the actual growth engine: `npx ctx7 setup`, `firecrawl-cli init --all` … Nobody makes JSON hand-editing step 1." Today the README's own MCP install path is manual: `README.md:376` tells the user to run `claude mcp add docharvest docharvest mcp` by hand. The repo already contains the feasibility proof for the machinery: `docharvest skill install <name> -o <harness-dir>` writes skill files into ~17 harness directories (driven by a path table — see `src/docharvest/cli.py` ~780-793 and `installers.py`). The MCP side is worse: emitting the wrong `command` shape breaks clients silently, and the audit's own H2 note calls array-form `command` configs for OpenCode/Kilo Code the highest-risk bug in the whole plan family. This spike designs the installer so v1 is safe: one config family, `--dry-run` default-on, and parse-back verification per client.

## Scope of the spike

1. **Family A only**: `mcpServers: { "docharvest": { "command": ..., "args": [...] } }` JSON family — covers Claude Desktop, Cursor, VS Code, Windsurf, Roo, Cline and siblings (the audit's family A estimate is ~20 clients). Explicitly do **not** attempt the array-form family (OpenCode/Kilo/Posit) or deeplink-only hosts (Raycast/Msty/etc.) in v1.
2. **Path table**: where each client's config lives per OS (reuse the pattern of the skill-install path table). Deliver a verified table for: claude-code, claude-desktop, cursor, vscode, windsurf (5 clients v1).
3. **Detection**: `docharvest init --client cursor` writes the entry; `--client auto` detects by probing known config paths (report-only; never edits without explicit `--client` or a confirm).
4. **Safety**: `--dry-run` prints the exact JSON diff and exits 0 — the default documented behavior; actual write requires the flag to be false (`--apply`) or an interactive confirm. Write path: parse existing config JSON → merge `mcpServers.docharvest` → atomic write via `atomic_write_text` → **parse-back verification** (re-read and assert the entry round-trips). On any mismatch: leave the original file byte-identical (write to temp + rename only after verification).
5. **Zero-telemetry honesty**: print the exact bytes that would be written; no network calls anywhere in the installer path.

## Current state (evidence the spike must use)

- `src/docharvest/installers.py` — `_render_json`/`_render_toml`/`_render_yaml` families and the per-file force semantics (the JSON force inconsistency was a noted audit item; the installer must reuse these primitives or fork them deliberately).
- `src/docharvest/tool_profiles.py` — the MCP tool profiles module (minimal default, full opt-in) — the installer should write `docharvest mcp` with the minimal profile (documented default), not `--profile full`.
- `server.json` — the MCP registry manifest (version orchestration; the installer must not duplicate what the registry gives Claude Code for free).
- `src/docharvest/cli.py:780` — `skill install` subcommand implementation and its `-o`/harness-table pattern — the closest existing exemplar for the path table and CLI wiring.
- `README.md:376` — the manual install line this replaces (prose only; no README rewrite in the spike).
- `GROWTH_AUDIT.md:60-63` (H2 array-form risk), `:90` (P2 spec), `:103` (P4 deeplinks — out of v1 scope).
- Hard constraints: `docharvest skill install` already exists; the new subcommand is `docharvest init` only if you verify it doesn't collide with an existing `init` (grep `sub.add_parser` for "init" — if collision, report and propose alternatives, do not force).

## Design deliverable outline (the spike's product)

- Client-config schema per family, with the exact `mcpServers.docharvest` value written (command from `sys.argv[0]`? from the console-script path? decide and document — prefer `docharvest` on PATH per README's own usage), the `args` value `["mcp"]`, minimal profile.
- Path table (OS × client) with verification method per row.
- Conflict policy: existing `mcpServers.docharvest` entry present → report current value, no overwrite without `--force`.
- Failure semantics: atomic write, temp-file+rename, parse-back check, byte-identical rollback on any failure; checksum of original logged.
- Test plan: temp-home fixture covering write / idempotent rewrite / conflict-no-force / corrupt-existing-config (must not corrupt further) / dry-run produces no disk writes.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
|-----------|-----------------------------------------------------|---------------------|
| Tests     | `uv run pytest tests/test_installers.py -q` (baseline) | all pass |
| Full suite| `uv run pytest tests/ -q` (baseline)                 | all pass |

## Scope

**In scope**
- Design document (`plans/028-output.md` or `docs/` location as agreed in the report)
- The env-unneeded prototype: a new module `src/docharvest/mcpinstall.py` + `docharvest init --client <five-clients> [--apply] [--force]` behind no flag (explicit user action), fully unit-tested with a temp HOME
- No changes to `skill install`

**Out of scope**
- Array-form family, deeplinks, UI-only hosts
- Auto-detection in v1 (report-only `auto` mode with explicit confirmation)
- README changes, marketplace/registry publishing (P3/P4 items)
- GUI wiring

## Git workflow

- Branch: `advisor/028-mcp-init-spike` (branch from `master`)
- Do NOT push; leave for review.

## Steps

### Step 1: Baseline
Read the cited files; run the suite; confirm the `init` subcommand name is free (`grep -n '"init"' src/docharvest/cli.py`).

### Step 2: Design document
Cover: family scope and why; the path table with per-row verification; command resolution; merge/rollback semantics; dry-run output format (show expected JSON diff verbatim); test plan; v2 roadmap (families B/C, auto-detect) explicitly out of scope.

### Step 3: Prototype + tests
Implement `mcpinstall.py` with the five clients and `init` subcommand exactly as spec'd. Reuse `atomic_write_text`. All tests use a temp HOME-like env (monkeypatch `Path.home` or the module's path resolver — prefer the resolver seam like `skill install` does).

### Step 4: Report
One page: what shipped, what's verified (tests + one real dry-run against your own HOME copy), what's explicitly not covered, and the v1 go/no-go recommendation.

## Done criteria

- [ ] Design document exists
- [ ] `docharvest init --client cursor --dry-run` prints the exact JSON it would write; writes nothing; exit 0
- [ ] With `--apply` on a temp HOME, the config parses and contains `mcpServers.docharvest` with `args: ["mcp"]` (or `["mcp", "--profile", "minimal"]` — match the live minimal-profile flag name after reading `tool_profiles.py`)
- [ ] Corrupt existing config → original file unchanged after failure
- [ ] Full suite green
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Any of the five clients' config formats cannot be verified from this machine/docs in under ~30 minutes of research (report which; drop it from v1, do not guess its format).
- The `init` name collides with existing CLI surface.
- A client's real-world config is not JSON (report; do not coerce it into the JSON family).

## Maintenance notes

- The installer writes into other applications' config files; every release must re-verify the five path rows — client updates move these files.
- If zero-telemetry discipline ever slips (a network fetch sneaks into the installer for "latest client version"), that is a stop-the-line defect.
