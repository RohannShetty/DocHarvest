# DocHarvest v11.5.1

A web-platform correctness release. No CLI, capture-facade, or MCP contract changes: the crawled output, storage layout, and tool schemas are identical to 11.5.0. The GUI bundle is rebuilt from the fixed sources, and dark stays the pinned default with light as the explicit opt-out.

### 🐛 Bug Fixes & Hardening

- **Fixed: native UI follows the theme.** color-scheme is now set on the
  document and mirrored into the color-scheme meta tag, so form controls,
  select popups and scrollbars no longer render as a light island inside the
  dark UI.

- **Fixed: Enter is IME-safe.** The capture, search, diff and domain-rename
  inputs all submit through one helper that cancels the implicit form
  submission first and then ignores Enter while an input method editor is still
  composing (isComposing / keyCode 229). Previously a candidate-selection Enter
  could start a capture or search mid-word.

- **Fixed: scrollbars are visible again.** Both themes now declare the standard
  scrollbar-color / scrollbar-width pair, with a thumb that clears the 3:1
  non-text contrast floor (dark 4.25:1, light 3.56:1). The WebKit
  pseudo-elements are scoped to browsers that do not support scrollbar-color,
  so one styling path wins instead of two competing ones.

- **Fixed: cross-tab theme sync.** A theme change made in another tab is picked
  up via the window storage event, so the pinned theme and the in-page toggle
  cannot disagree after a second tab writes the preference.

- **Fixed: the documentation site** gets the same scrollbar and color-scheme
  treatment, with theme-aware thumbs derived from the brand tokens.

- **Fixed: generate_release_notes.py** joins wrapped changelog summary lines
  into one paragraph instead of emitting a broken sentence per line.


---
**Full Changelog**: https://github.com/RohannShetty/DocHarvest/compare/v11.5.0...v11.5.1
