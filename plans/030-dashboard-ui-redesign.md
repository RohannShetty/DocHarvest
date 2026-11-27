# 030: Agency-Grade Dashboard UI Redesign

**Status:** Proposed  
**Target Workspace:** `frontend/src/`  
**Brand Contract:** `brand/tokens.json` -> `frontend/src/styles/brand-tokens.css` (enforced by `tests/test_brand_tokens.py`)

---

## 1. Problem & Audit Summary

The current GUI dashboard suffers from monolithic views, redundant bridge calls, and generic AI UI patterns:

1. **Monolithic View (`views/CaptureStudio.tsx`, 1,274 lines):** Mixes 25+ `useState` hooks, URL detection, crawl options, batch queue orchestration, live streaming terminal logs, lock banners, and completion states in one file.
2. **Tab-Switch Refetching (`App.tsx`):** Calls `loadLibrary()` on every `activeTab` change (`useEffect(() => { loadLibrary() }, [activeTab])`), causing unnecessary Python bridge calls and UI flicker.
3. **Render Storms on Live Crawls:** High-frequency `pyApi` crawl events trigger per-event React state updates and full DOM list re-renders.
4. **AI Design Clichés:** Decorative `Sparkles` icons in `AppSidebar.tsx`, heavy card/border soup, inconsistent spacing, missing skeleton loaders, and missing composed empty states.
5. **Secondary Monoliths:** `DiffView.tsx` (28.8 KB), `LibraryView.tsx` (20 KB), `InAppDocsView.tsx` (32.4 KB), and `SettingsView.tsx` (19.4 KB) lack shared data/surface primitives.

---

## 2. Brand & Visual Standards (Non-Negotiable)

Do **not** override `brand-tokens.css` (which is generated from `brand/tokens.json`). Lean into DocHarvest's **Swiss Instrument / Tool-Grade** identity:

- **Sharp Architectural Geometry:** Preserve `--radius: 0px`.
- **Surface Ladder (No Drop Shadows):**
  - Canvas: `--bond` (`#09090B` dark / `#FBFBFA` light)
  - Elevated panels: `--bond-2` (`#101013`) and `--bond-3` (`#18181B`)
  - Depth via 1px hairline dividers (`border-[var(--rule)]` and `border-[var(--rule-subtle)]`).
- **Single Accent Discipline:** Reserve `--match` (`#F59E0B`) strictly for active focus rings, primary triggers, and active route indicators.
- **Typography & Tabular Discipline:**
  - `Archivo` (`--font-sans`) for UI labels (sentence case, `tracking-[-0.02em]` on display headers, weights `400`/`500`/`600`).
  - `Geist Mono` (`--font-mono`) + `tabular-nums` (`font-variant-numeric: tabular-nums`) for all URLs, timestamps, worker counts, and live crawl counters.
- **Iconography:** Remove decorative `Sparkles` in `AppSidebar.tsx`. Standardize icon stroke weight (`strokeWidth={1.5}`).
- **WebView2 GPU Guardrails:** Never apply `backdrop-blur` to scrolling containers. Restrict blur to fixed overlays (`CommandMenu`, modals/drawers). Animate only `transform` and `opacity`.

---

## 3. Target Architecture (Shape B: Headless Hooks + Decoupled Surfaces)

### A. Global Library Cache (`frontend/src/hooks/useLibrary.ts`)
- Single owner for `library`, `loadingLibrary`, `refresh()`, and `invalidate()`.
- Fetches once on mount; reloads **only** on capture completion, deletion, or explicit refresh — never on tab switches.

### B. High-Frequency Log & Telemetry Pipeline
```
pyApi crawl events (10-100/sec)
   │
   ▼
Mutable RingBuffer (useRef, capped at 5,000 entries)
   │
   ├──► requestAnimationFrame loop (flushes snapshot at most once per 16ms)
   │         │
   │         ▼
   │    LiveLogStream.tsx (CSS `contain: strict` + fixed 24px row virtualization)
   │
   └──► Telemetry counters (throttled independently for TelemetryStrip)
```

### C. Decomposed `CaptureStudio` Module Map
```
frontend/src/
├── hooks/
│   ├── useLibrary.ts              # Cached library state + invalidation
│   └── useReducedMotion.ts        # Respect OS/WebView motion prefs
└── views/
    └── CaptureStudio/
        ├── index.tsx              # < 120 lines layout orchestrator
        ├── hooks/
        │   ├── useCaptureConfig.ts    # URL, scope, workers, SPA toggle
        │   ├── useCaptureStream.ts    # Ref ring-buffer + rAF flush + bridge events
        │   └── useBatchQueue.ts       # Sequential queue controller
        └── components/
            ├── UrlCommandBar.tsx      # Hero input + inline provider/version chips
            ├── CrawlConfigPanel.tsx   # Compact hairline popover/drawer
            ├── TelemetryStrip.tsx     # 4-metric tabular-nums bar (Discovered/Saved/Failed/Time)
            ├── LiveLogStream.tsx      # Virtualized, CSS-contained monospaced terminal
            └── CompletionBanner.tsx   # Inline action dock (Read, Diff, Export)
```

### D. Type Contracts
```typescript
export interface CaptureConfig {
  readonly workers: number
  readonly maxPages?: number
  readonly pathScope: string[]
  readonly excludePaths: string[]
  readonly siteVersions?: string[]
  readonly renderSpa: boolean
  readonly outputMode: "library" | "local" | "both"
}

export interface LiveTelemetry {
  readonly elapsedSec: number
  readonly discovered: number
  readonly downloaded: number
  readonly failed: number
  readonly currentUrl?: string
  readonly progressPct: number
}
```

---

## 4. Phased Execution & Verification Gates

Every phase must leave `frontend` in a green, buildable state (`npm run typecheck && npm run lint && npm run build`) and pass `pytest tests/test_brand_tokens.py` from repo root.

### Phase 1: Foundation & App Shell (`App.tsx`, `AppSidebar.tsx`, `useLibrary.ts`)
- [ ] Extract `useLibrary` hook; remove `loadLibrary()` from `activeTab` effect in `App.tsx`.
- [ ] Refactor `AppSidebar.tsx`: remove `Sparkles` cliché, enforce `>= 44x44px` hit targets on rail items and collapse toggle, add `aria-expanded`, keep visually hidden labels in DOM for collapsed rail, and use hairline active indicator.
- [ ] Add skeleton loader and composed empty-state primitives matching `--bond` / `--rule` tokens.
- **Gate:** `cd frontend && npm run typecheck && npm run lint && npm run build`

### Phase 2: Streaming Engine & Virtualized Log Pipeline
- [ ] Implement `useCaptureConfig.ts`, `useCaptureStream.ts` (mutable `useRef` ring-buffer + `requestAnimationFrame` 60Hz flush), and `useBatchQueue.ts`.
- [ ] Implement fixed-height (`24px`) log virtualization (using `@tanstack/react-virtual` or a zero-dependency windowing hook) with CSS `contain: strict`.
- **Gate:** `cd frontend && npm run typecheck && npm run build` + unit test for ring-buffer cap and batch state transitions.

### Phase 3: `CaptureStudio` UI Rebuild
- [ ] Build `UrlCommandBar`, `CrawlConfigPanel`, `TelemetryStrip` (`tabular-nums`), `LiveLogStream`, and `CompletionBanner`.
- [ ] Replace `views/CaptureStudio.tsx` with `views/CaptureStudio/index.tsx` (< 120 lines) and delete the old monolith.
- [ ] Verify all `pyApi` calls, lock detection/unlock, single capture, and batch queue flows remain intact.
- **Gate:** `cd frontend && npm run typecheck && npm run lint && npm run build`

### Phase 4: Secondary Views Alignment
- [ ] Align `LibraryView.tsx`, `SearchView.tsx`, `DiffView.tsx`, and `SettingsView.tsx` to `useLibrary`, hairline dividers, `--bond` surface ladder, and `tabular-nums`.
- [ ] Run full frontend checks + `uv run pytest tests/test_brand_tokens.py`.
- **Gate:** All checks pass cleanly; `git status` clean of scratch artifacts.
