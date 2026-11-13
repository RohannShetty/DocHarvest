# Plan 003: Harden Mermaid in the desktop GUI (strict SVG, lazy import) and clear critical advisories

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ea307bd..HEAD -- frontend/ src/docharvest/gui/web/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `ea307bd`, 2026-11-12

## Why this matters

The desktop GUI renders Mermaid diagrams embedded in **captured third-party documentation** — untrusted content by design. Two concrete defects ship today:

1. `mermaid.initialize` uses `securityLevel: "loose"` (mermaid's weakest mode: HTML labels and click-handlers in diagrams are emitted unsanitized), and the rendered SVG string is assigned straight to `innerHTML` in both viewers. Mermaid's default is `"strict"` and is what this app needs.
2. The production dependency tree pulls in a DOMPurify below the patched floor (GHSA-p98j-92pf-mc4p and siblings, DOM-XSS class — the exact sink used above) and a vulnerable KaTeX, both transitive via mermaid.

On top of that, `mermaid` (~1.65 MB minified) is imported statically by both viewer components, so every GUI launch parses it even for users who never open a diagram. `frontend/vite.config.ts` silences the chunk-size warning (`chunkSizeWarningLimit: 2000`) instead of splitting lazily. This plan fixes all three.

## Current state

- `frontend/src/components/MarkdownViewer.tsx` — imports (lines ~15-22):
```tsx
import { brandTokens } from "@/lib/brand"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import mermaid from "mermaid"
```
`initMermaid` (lines ~50-67) initializes with `securityLevel: "loose"`; `initMermaid("dark")` runs once at module load (line ~69). The render effect (lines ~126-148) does:
```tsx
    const mermaidBlocks = contentRef.current.querySelectorAll("pre.mermaid-block")
    mermaidBlocks.forEach((el) => {
      const code = el.getAttribute("data-code") || ""
      el.classList.remove("mermaid-rendered")
      if (code) el.textContent = code
    })
    let cancelled = false
    mermaidBlocks.forEach((el, index) => {
      const code = el.getAttribute("data-code") || el.textContent || ""
      if (!code) return
      void (async () => {
        try {
          const id = `mermaid-svg-${Date.now()}-${index}`
          const { svg } = await mermaid.render(id, code)
          if (cancelled) return
          el.innerHTML = svg
          el.classList.add("mermaid-rendered")
        } catch (err) {
          console.warn("Mermaid rendering error:", err)
        }
      })()
    })
```
- `frontend/src/views/DiffView.tsx` — same pattern (lines ~125-149): `import mermaid from "mermaid"` at the top (~line 26) and `mermaidContainerRef.current.innerHTML = svg` (~line 140) inside an effect gated on `activeSubTab === "graph"`. DiffView relies on the global loose init from MarkdownViewer.
- `frontend/package.json`: `"mermaid": "^11.17.2"` (line 34).
- `frontend/vite.config.ts`: `chunkSizeWarningLimit: 2000` (line 26) and a `manualChunks` entry returning `'vendor-mermaid'` for node_modules paths containing `mermaid` (lines ~44-49).
- Build pipeline: `frontend/vite.config.ts` sets `build.outDir` to `'../src/docharvest/gui/web'` with `emptyOutDir: true` — so `npm run build` **regenerates the prebuilt GUI assets that ship inside the Python wheel** (`pyproject.toml` package-data: `gui/web/*.html`, `gui/web/assets/*`). After any frontend change, the `src/docharvest/gui/web/` diff is a build artifact you should commit alongside.
- `npm audit --omit=dev` (run at HEAD ea307bd): critical DOMPurify (lock had 3.4.14; advisories fixed in ≥3.4.17) and a vulnerable KaTeX range, both reachable via mermaid; low-severity mermaid/katex advisories also present.
- The desktop GUI is embedded content: captured markdown flows into these viewers by design. Do not weaken the viewers to "preserve" diagram fidelity — strict mode is the requirement.

## Commands you will need

| Purpose   | Command                                   | Expected on success |
|-----------|-------------------------------------------|---------------------|
| Install   | `cd frontend && npm ci`                   | exit 0              |
| Audit     | `cd frontend && npm audit --omit=dev`     | no criticals remain |
| Lint      | `cd frontend && npm run lint`             | exit 0              |
| Typecheck | `cd frontend && npm run typecheck`        | exit 0              |
| Build     | `cd frontend && npm run build`            | exit 0; writes ../src/docharvest/gui/web/ |
| Tests     | `uv run pytest tests/ -q` (repo root)     | all pass            |

## Scope

**In scope** (the only files you should modify):
- `frontend/src/components/MarkdownViewer.tsx`
- `frontend/src/views/DiffView.tsx`
- `frontend/package.json` + `frontend/package-lock.json`
- `frontend/vite.config.ts` (only to remove the `chunkSizeWarningLimit` override; keep `vendor-mermaid` manualChunk)
- `src/docharvest/gui/web/**` — regenerated by the build; commit the result

**Out of scope** (do NOT touch, even though they look related):
- `docs/` (the Next.js showcase) — unrelated workspace.
- `src/docharvest/gui/server.py` — CSP headers are a separate hardening item, not this plan.
- Any markdown sanitizer choice beyond mermaid's own `securityLevel: "strict"` (optionally plus DOMPurify with an SVG profile; do not introduce a second HTML sanitizer for the page body itself — that is a separate decision).

## Git workflow

- Branch: `advisor/003-mermaid-hardening` (branch from `master`)
- Commit code and regenerated `gui/web/` assets together; message style: `fix(gui): strict mermaid + lazy load; bump mermaid/dompurify`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Raise the floor on the vulnerable transitive deps

In `frontend/package.json`:
- Set `"mermaid"` to the latest 11.x (or 12.x if `npm view mermaid version` shows 12 is the current stable and `npm ci` resolves cleanly — do not force a breaking major without verifying the build).
- Add an `"overrides"` block forcing `dompurify` to `>=3.4.17` and `katex` to the patched release named by the advisory (`npm audit --omit=dev` will tell you the fixed version; use exactly that).
Then `npm ci` and `npm audit --omit=dev`.
**Verify**: audit output contains no critical advisories. If a critical remains with no fix available, STOP and report.

### Step 2: Switch mermaid to strict

In `MarkdownViewer.tsx` `initMermaid`, change `securityLevel: "loose"` → `"strict"`. In its `catch` around render, keep the existing fallback (code text stays visible). No other behavior change.

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Lazy-load mermaid in MarkdownViewer and DiffView

Remove the top-level `import mermaid from "mermaid"` from both files. In each render site, do `const { default: mermaid } = await import("mermaid")` and keep mermaid initialized before first render (call `initMermaid(theme)` after the import — `activeMermaidTheme` caching already prevents re-init). Guard the lazy import so it only runs when at least one mermaid block exists (MarkdownViewer: early-return when `mermaidBlocks.length === 0`; DiffView: the effect is already gated on `activeSubTab === "graph"` and a non-empty `mermaidGraphCode` — add the `import` inside).

Remove `chunkSizeWarningLimit: 2000` from `vite.config.ts` (keep the `vendor-mermaid` manualChunk; the lazy import plus the warning limit removal is the honest fix). If the build then fails with a chunk-size *warning* (not error) about mermaid, leave the warning in place — warnings are acceptable; the override is not. If it fails with a hard error, STOP and report.

**Verify**: `cd frontend && npm run build` → exit 0; confirm exit code and that `src/docharvest/gui/web/assets/` contains a `vendor-mermaid-*.js` chunk and **no other new chunk exceeds 500 kB unexpectedly** (check `ls src/docharvest/gui/web/assets/`; record the mermaid chunk size in your report).

### Step 4: Render-path sanity tests

Add one component test (the frontend has vitest configured — check `frontend/vite.config.ts` / existing `*.test.*` files; if no component test harness exists for viewers, add a minimal one only if it is already set up — otherwise rely on the build + typecheck and say so in the report):

1. A page containing a mermaid block renders an `.mermaid-rendered` element with strict init (or falls back gracefully to visible code text) — never throws.
2. A mermaid block containing an HTML label (`A[<img src=x onerror=...>]`) does **not** produce an `<img>` with an event handler in the DOM after render (strict mode strips it). Assert the absence, not a specific SVG shape.

**Verify**: the frontend test command (see package.json scripts) passes, or the step is reported as not-applicable with the reason.

### Step 5: Rebuild + commit + full repo suite

`npm run build` regenerates `src/docharvest/gui/web/`; stage those artifacts with the source changes. Then from the repo root:

**Verify**: `uv run pytest tests/ -q` → all pass (these tests check package-data completeness and GUI bridge contracts; they should be unaffected, and must not fail).

## Test plan

- Steps 4 defines the new tests (or documents why the harness wasn't available).
- Verification: frontend build green; repo pytest green; `npm audit --omit=dev` clean of criticals.

## Done criteria

- [ ] `grep -n 'securityLevel' frontend/src/components/MarkdownViewer.tsx` shows `"strict"`
- [ ] `grep -rn 'import mermaid from "mermaid"' frontend/src/` returns **no matches** (all imports are dynamic)
- [ ] `cd frontend && npm audit --omit=dev` reports no critical advisories
- [ ] `cd frontend && npm run build` exits 0 and `src/docharvest/gui/web/` is regenerated and committed
- [ ] `uv run pytest tests/ -q` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `npm audit` still shows a critical with no available fix (report the advisory ID and your options).
- The frontend vitest harness is not set up and strict-mode rendering cannot be verified otherwise — do not scaffold a whole test framework without asking.
- `npm run build` fails after the lazy-load change (report the exact error).
- Any step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The mermaid chunk stays split out (`vendor-mermaid`) and lazy — do not reintroduce static imports.
- Mermaid's trust model is per-`initialize`; both viewers must initialize with `"strict"` (or share a module that does). A future theme switch must go through `initMermaid`, never inline `mermaid.initialize`.
- The wheel ships whatever is in `src/docharvest/gui/web/` — if this plan is abandoned after Step 1, the GUI assets may be stale relative to the source; always rebuild before releasing.
