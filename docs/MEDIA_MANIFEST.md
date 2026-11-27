# Media manifest

> Path note: the brief asked for `docs/media/MANIFEST.md`. This sandbox denies directory
> creation under `docs/` (`New-Item docs/media` -> access denied, sandbox `denied: true`),
> so the same content lives here as `docs/MEDIA_MANIFEST.md`. Move it to
> `docs/media/MANIFEST.md` unchanged when that directory can be created.

Rule: the showcase may only use images listed here, and every entry names the command,
version, date, target site and file path. New captures must come from the installed
checkout (11.5.1), one viewport, one theme, 2x. Nothing here is a mockup.

## Status, 2026-11-13

**No new screenshot, GIF, video or OG image was produced.** This environment cannot run a
browser or drive the desktop app:

- Playwright is not installed (`.venv` -> `ModuleNotFoundError: playwright`).
- Headless Edge 157.0.4341.46 aborts with `FATAL mojo platform_channel.cc:187 Access is
  denied`; `--no-sandbox` does not help.
- The Orca browser runtime is present (1.4.258) but its socket refuses this sandbox
  (`EPERM`).
- The DSH approval for a wider sandbox hung without an answerer.

So the site ships **no product photography** in this branch. The sections that used the
legacy screenshots were rebuilt around real, copyable text from an actual run (see
`docs/data/capture-evidence.ts`), which is verifiable and cannot go stale silently.

## Legacy images (kept on disk, not used by the site)

| File | Status | Decision needed |
|---|---|---|
| `assets/capture_studio.png` (275,502 B) | older version, not current UI | delete or re-shoot |
| `assets/document_library.png` (213,076 B) | older version, not current UI | delete or re-shoot |
| `docs/public/assets/capture_studio.png` | duplicate of the above | same |
| `docs/public/assets/document_library.png` | duplicate of the above | same |
| `assets/social-preview.png` / `.svg` | branded card, not a product shot | keep if the lockup is current |
| `docs/public/assets/og-sheet.png` (129,433 B) | 1280x640 OG sheet, drawn from brand assets | keep until a new capture exists |
| `brand/brand-kit.png`, `brand/brand-kit.svg` | brand kit, current | keep |

`assets/logo-icon.svg` (906 B) and `assets/logo.svg` (1,069 B) are the current lockup used by
the site header and favicon; no evidence of a rebrand was found.

## Shot list for a machine with a browser

Capture all of these in one session, same viewport (1440x900), same theme (dark, the
default), at 2x DPR, against `https://docs.openalgo.in` (public docs, permits crawling):

1. `capture-studio-detected.png` — Capture Studio after URL entry, provider chip `gitbook`,
   scope fields populated, before start.
2. `capture-studio-running.png` — live progress: pages found/downloaded, log lines, cancel
   available; mid-run, not staged.
3. `capture-complete.png` — summary state with page count, skipped count, output paths and
   the emitted file list.
4. `library.png` — Library view with at least two real domains, page counts and versions.
5. `search.png` — Search view with a real query and highlighted BM25 hit.
6. `versions-diff.png` — Diff view between two real snapshots.
7. `export.png` — Export view with RAG JSONL and PDF options visible.
8. `diagnostics.png` — Diagnostics view after a real run.
9. `settings.png` — Settings view (theme, defaults).
10. `terminal-capture.png` or SVG — a real `docharvest capture` run, unchanged output.
11. `files-tree.png` or SVG — the real output folder tree (`pages/`, `book.md`, `llms.txt`,
    `llms-full.txt`, PDF, JSONL).
12. `mcp-call.png` — a real MCP tool call from an agent or the MCP inspector.
13. `hero.webm` — 8-12 s muted screen recording of a capture completing, under ~1.5 MB,
    with a poster frame.
14. `og-image.png` — 1280x640 from the new hero frame, current logo, no invented text.

Each file needs: command or screen, version (`docharvest --version`), date, target URL.
Add the row here before wiring it into a component.
