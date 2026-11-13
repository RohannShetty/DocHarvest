# DocHarvest v11.5.0

The three direction spikes are now part of the product: flag-first ingest screening (on by default), opt-in incremental refresh, and a dry-run-first MCP installer. No breaking CLI or capture-facade changes.

**Notes**

### Γ£¿ Features & Capabilities

- Captured content is screened at the normalize boundary for prompt-injection
  shapes (instruction overrides, fake role markers, hidden characters,
  exfiltration directives) and credential-shaped strings. Findings surface as
  `CaptureResult.warnings`, a `## Security findings` section in `llms.txt`, and
  an additive `security_flags` key on MCP `read_doc`.

- **Content is never rewritten by default.** `DOCHARVEST_SCREEN=off` disables
  the pass; `DOCHARVEST_SCREEN_REDACT=1` opts into masking credentials only.
  The scanner is heuristic ΓÇö flags are a warning, not a verdict.

- `DOCHARVEST_CHANGED_ONLY=1` sends `If-None-Match` / `If-Modified-Since` for
  pages fetched in a previous capture and reuses cached bytes on `304`, so an
  unchanged site transfers no page bodies. The cache lives under
  `<library>/cache/<domain>/` and never inside the capture artifacts. Off by
  default; render mode bypasses it.

- `docharvest setup --client <claude-code|claude-desktop|cursor|vscode|windsurf|auto>`
  writes the JSON `mcpServers.docharvest` entry (VS Code uses `servers` +
  `stdio`). Dry-run is the default; `--apply` writes, `--force` replaces an
  existing entry. Writes are atomic, parse-back verified, and byte-identical
  rollback on any failure. `--client auto` reports only. No network access.

- `docharvest init` is unchanged for compatibility; the new safe surface is
  `setup` (see `MCP_INSTALLER_SPIKE.md`).

- The screening scanner and the incremental cache are prototypes promoted with
  tests; see `SECURITY_SCREENING_SPIKE.md` and `INCREMENTAL_REFRESH_SPIKE.md`
  for threat model, known limits, and the follow-up build plans (family B/C
  installers, cache dedupe, `init`/`setup` unification).


### ≡ƒÉ¢ Bug Fixes & Hardening

- MCP responses may carry `security_flags`; consumers that ignore unknown keys
  are unaffected.

- The fixture HTTP server now emits ETags and counts requests/304s for the
  incremental-refresh tests.


### ≡ƒôª Downloadable Binaries & Verification Checksums

| Asset / Executable | Target Platform | File Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| `docharvest-macos-latest` | macOS (Apple Silicon / Intel) | 40.6 MB | `d370b397bd5e000cd2a941684312af90679591fbcdbbe475b98a8a08f67239e1` |
| `docharvest-ubuntu-latest` | Linux x64 | 61.4 MB | `cb5884bb96353e09d5e4f8bd567ae1d148d85cc495569657cb288560caf7e83a` |
| `docharvest-windows-latest.exe` | Windows x64 | 43.5 MB | `8374a2678b45f192878a1cb7f39aa2be678440740c04c94e0fee63955eedea05` |
| `SHA256SUMS.txt` | All Platforms | < 1 KB | *(Verification Manifest)* |

#### Verification Instructions
```bash
# Linux / macOS integrity verification:
sha256sum -c SHA256SUMS.txt

# Windows PowerShell integrity verification:
Get-FileHash -Algorithm SHA256 gitbook-dl-windows-latest.exe
```

---
**Full Changelog**: https://github.com/RohannShetty/DocHarvest/compare/v11.3.2...v11.5.0

