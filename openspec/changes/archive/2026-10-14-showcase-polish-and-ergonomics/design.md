# Design

## Context
See `proposal.md` for background and motivation. The showcase surface is a Next.js 16 App Router application (`docs/`) configured for static export (`output: "export"`). The primary visual anchor is "The Index Sheet" (`docs/components/IndexSheet.tsx`), styled under strict anti-slop guidelines: 0px border-radii, 1px hairlines, dark bond `#09090B`, and `#F59E0B` amber accents.

## Goals / Non-Goals

**Goals:**
- Provide instant keyboard ergonomics for power users (`Esc` to clear query/blur, `/` to jump focus to search).
- Debounce `aria-live` announcements to ensure screen reader stability.
- Align specimen outer wrapper constraints between `Hero.tsx` and `IndexSheet.tsx` without layout shifts or border clipping.
- Render an understated visual fade/mask on small mobile screens (<375px) for horizontal compact navigation.

**Non-Goals:**
- No visual redesign or changes to typography/colors (preserving `Archivo` + `Geist Mono` and amber accent).
- No new client dependencies or server-side requirements.

## Decisions

### 1. Global Keyboard Listener in `IndexSheet.tsx`
- **Choice**: Use a `useEffect` hook in `IndexSheet` registering a `keydown` listener on `window`.
- **Condition**: Ignore when active element is an input, textarea, select, or has `isContentEditable`.
- **Rationale**: Keeps keyboard handling co-located with the `IndexSheet` search input ref, avoiding unnecessary global state or context providers.

### 2. Throttled Screen Reader Live Region
- **Choice**: Use a debounced state (`debouncedCount`) updated with a 300ms `setTimeout` on query change.
- **Rationale**: Prevents screen reader speech queue churn when a user types rapidly, while updating immediately when typing stops.

### 3. Harmonized Container Height in `Hero.tsx`
- **Choice**: Remove redundant `max-h-[330px] overflow-hidden` wrapper in `Hero.tsx`, delegating the scroll boundary entirely to `IndexSheet.tsx` (`max-h-[360px] sm:max-h-[420px]`).
- **Rationale**: Avoids nested scroll containers and prevents clipping the bottom hairline border across different device aspect ratios.

### 4. CSS Gradient Mask for Mobile Compact Nav in `Header.tsx`
- **Choice**: Apply a CSS linear-gradient `mask-image` or pseudo-element indicator on the right edge of the compact nav bar for screens under `sm:` breakpoint.
- **Rationale**: Pure CSS approach that works cleanly during static rendering without JavaScript scroll listener overhead.

## Risks / Trade-offs

- **[Risk]** Keydown `/` conflicts with browser quick-find in Firefox.
  - **Mitigation**: `e.preventDefault()` is only called when active element is body or non-input, matching standard GitHub/Gmail shortcut conventions.
- **[Risk]** Mobile nav gradient indicator might obscure the final link text on certain screen widths.
  - **Mitigation**: Use a tight 16px fade with padding-right on the scroll container so the last item can always be fully scrolled into clear view.
