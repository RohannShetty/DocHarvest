# Spike 028 — One-command MCP installer (JSON family A)

Status: branch-only prototype (`advisor/028-mcp-init-spike`). Not merged.
Plan: `plans/028-mcp-init-spike.md`.

## Finding first: `init` already exists

`docharvest init --client <name>` is already implemented (`cli.py:cmd_init`,
backed by `installers.py`). It covers many clients, writes **by default**
(`--dry-run` is opt-in), merges JSON, and uses `atomic_write_text`. It does
**not** parse-back-verify, and its JSON renderer overwrites an existing
`docharvest` entry without honouring `--force` (the audit's “JSON force
inconsistency”).

The plan's constraint was: verify the name is free; if it collides, report and
propose alternatives rather than force a rename. It collides. Changing
`init`'s write-by-default contract would break scripts and muscle memory, so
this spike ships the safer surface under a new name:

```
docharvest setup --client <claude-code|claude-desktop|cursor|vscode|windsurf|auto>
                 [--apply] [--force] [--path PATH]
```

`setup` is dry-run by default; writing requires `--apply`. `init` is left
untouched (a follow-up should either deprecate it over a major version or make
`setup` the documented path and keep `init` as an alias).

## 1. Family scope

v1 writes only **family A**: a JSON root object mapping a server name to
`{command, args}`.

| Client | Root key | Entry shape |
|---|---|---|
| claude-code | `mcpServers` | `{command, args}` |
| claude-desktop | `mcpServers` | `{command, args}` |
| cursor | `mcpServers` | `{command, args}` |
| windsurf | `mcpServers` | `{command, args}` |
| vscode | `servers` | `{type: "stdio", command, args}` |

Out of scope: array-form configs (OpenCode/Kilo/Posit), TOML/YAML clients
(Codex/Goose/Continue), and deeplink-only hosts. Those are family B/C and get
their own plan.

## 2. Path table

| Client | Windows | macOS | Linux |
|---|---|---|---|
| claude-code | `%USERPROFILE%\.claude.json` | `~/.claude.json` | `~/.claude.json` |
| claude-desktop | `%APPDATA%\Claude\claude_desktop_config.json` | `~/Library/Application Support/Claude/claude_desktop_config.json` | `~/.config/Claude/claude_desktop_config.json` |
| cursor | `%USERPROFILE%\.cursor\mcp.json` | `~/.cursor/mcp.json` | `~/.cursor/mcp.json` |
| windsurf | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` | same | `~/.codeium/windsurf/mcp_config.json` |
| vscode | `<workspace>\.vscode\mcp.json` | same (workspace) | same (workspace) |

Verification note: these are the documented/observed locations for the
desktop clients; VS Code's is workspace-scoped by convention (there is no
stable user-level file this spike can rely on). Every row must be re-verified
against current client docs at each release — client updates move files — and
`--path` exists so a wrong guess can be corrected without code.

## 3. Command resolution

`command: "docharvest"`, `args: ["mcp"]`, no `env`, no remote URL. This is the
same invocation the README documents and the MCP server's minimal profile is
the default; do not pass `--profile full`. Resolution relies on PATH; the
spike does not embed `sys.executable` or an absolute install path, because
those go stale on upgrade.

## 4. Merge and rollback

1. Read the existing file (missing file = `{}`).
2. Invalid JSON → fail with “not valid JSON”, file untouched.
3. If `docharvest` already exists and `--force` is absent → report the
   existing entry, fail, file untouched.
4. Render the merged object (2-space JSON, trailing newline).
5. `--dry-run` (default): print the target path and exact bytes; write nothing.
6. `--apply`: atomic write, then **parse-back verify** (root key exists, entry
   has `command: docharvest`, `args: ["mcp"]`). Any failure restores the
   original bytes (or deletes the file if it did not exist).

Dry-run output shape:

```
Would write: C:\Users\me\.cursor\mcp.json
{
  "mcpServers": {
    "docharvest": {
      "command": "docharvest",
      "args": [
        "mcp"
      ]
    }
  }
}

Dry run: nothing written. Re-run with --apply to write.
```

No network calls anywhere in this module; no telemetry.

## 5. Tests

`tests/test_mcpinstall.py` (temp paths, no real HOME):

- dry run writes nothing and prints the entry;
- `--apply` creates a parseable file with `mcpServers.docharvest.args == ["mcp"]`;
- VS Code uses `servers` + `type: "stdio"`;
- existing entry without `--force` leaves the file byte-identical; `--force` replaces;
- corrupt JSON leaves the file byte-identical;
- a simulated verification failure restores the original bytes;
- `--client auto` reports only;
- the path table covers all five clients.

## 6. Recommendation

Ship `setup` (dry-run default) as the documented installer, leave `init` as a
compatibility alias, and fix `installers._render_json` to honour `--force` in
a separate small PR. The next families (B/C) need their own design because
their schema errors are silent and client-specific.

## Follow-ups

1. Unify `init`/`setup` in a major release (or keep both, documented).
2. Enforce `--force` in `installers._render_json` (currently JSON overwrites).
3. Add family B (array-form) and C (TOML/YAML) with per-family tests.
4. Add `--client auto` with confirmation, never silent edits.
5. Re-verify the path table at every release; add a CI reminder if those
   clients' docs change.
