# Tasks

## 1. IndexSheet Keyboard Ergonomics & Accessibility

- [x] 1.1 Implement Escape-to-clear and Escape-to-blur handlers in `docs/components/IndexSheet.tsx` and verify by pressing Escape in the filter input.
- [x] 1.2 Implement global `/` focus shortcut listener in `docs/components/IndexSheet.tsx` that ignores active editable elements and verify focus redirects to filter input.
- [x] 1.3 Debounce the `aria-live` row match announcement in `docs/components/IndexSheet.tsx` to 300ms and verify speech queuing stability.

## 2. Container Layout Harmonization

- [x] 2.1 Remove redundant `max-h-[330px] overflow-hidden` wrapper in `docs/components/Hero.tsx` to let `IndexSheet.tsx` manage scroll height cleanly without border clipping.
- [x] 2.2 Verify full border visibility and scroll behavior on mobile and desktop viewports.

## 3. Mobile Navigation Responsive Affordance

- [x] 3.1 Add trailing edge horizontal scroll fade/mask styling in `docs/components/Header.tsx` for compact navigation on screens <375px.
- [x] 3.2 Verify horizontal scrollability and visual clarity of navigation links on narrow viewport emulation.

## 4. Verification & Static Build

- [x] 4.1 Run Next.js static build (`npm run build` or `npx next build` in `docs/`) to verify static export integrity without errors.
- [x] 4.2 Re-run `detect.mjs` scan to ensure 0 anti-pattern regressions.
