# Proposal

## Why
A technical UX/UI critique of the DocHarvest showcase (`docs/app/page.tsx`) identified key polish and usability opportunities:
1. The interactive specimen (`IndexSheet.tsx`) lacked standard CLI/developer keyboard ergonomics (`Esc` to reset/blur and `/` to focus the search input).
2. Screen reader announcements on filter queries were unthrottled, causing stuttering during fast keystrokes.
3. Specimen viewport height constraints were nested and duplicated between `Hero.tsx` and `IndexSheet.tsx`, leading to clipped lower borders on certain resolutions.
4. The sticky compact navigation bar on mobile viewports (<375px) lacked a visual scroll overflow affordance.

Addressing these issues elevates the showcase from an acceptable technical proof to an impeccable, terminal-grade developer experience.

## What Changes
- **IndexSheet Keyboard Shortcuts**:
  - Add `Escape` key handling to clear the active filter query, or blur when already empty.
  - Add global `/` shortcut listener to focus the search filter from anywhere on the page when not already in an editable element.
- **IndexSheet Accessibility**:
  - Debounce the `aria-live` row match announcement to prevent screen reader stuttering.
- **Hero Specimen Height**:
  - Harmonize max-height styling between `Hero.tsx` and `IndexSheet.tsx` to eliminate redundant container clipping.
- **Header Mobile Affordance**:
  - Add a subtle trailing edge mask/fade indicator on the mobile sub-navigation bar to clearly signal horizontal scrollability.

## Capabilities

### New Capabilities
- `showcase-ui`: Interactive controls, keyboard ergonomics, and responsive layout styling for the DocHarvest documentation showcase.

### Modified Capabilities
*(None - no existing capabilities defined under `openspec/specs/` yet)*

## Impact
- Files modified: `docs/components/IndexSheet.tsx`, `docs/components/Hero.tsx`, `docs/components/Header.tsx`.
- No backend, CLI, or API contracts affected.
- Retains static export compatibility (`next export`).
