# Showcase redesign & SEO correction — change log

**Scope:** `docs/` (the Next.js 16 showcase that ships to
`https://rohannshetty.github.io/DocHarvest/` via static export).
**Date:** 2026-10-20
**Baseline:** `out/index.html` from the last committed build + a clean
`GITHUB_ACTIONS=true` build, so every claim below was checked against exported
HTML rather than against the source that was supposed to produce it.

---

## 1. Baseline: what was actually broken

| # | Finding | Evidence |
|---|---|---|
| 1 | **Canonical URL double-prefixed the deploy path.** `basePath` is `/DocHarvest` in CI, and the metadata also hardcoded `/DocHarvest/`, so the exported tag read `.../DocHarvest/DocHarvest/` — a 404 canonical. Local builds hid it because `basePath` is empty locally. | `out/index.html` from the CI-equivalent build |
| 2 | **`og:image` pointed at the file-convention route** (`/opengraph-image?hash`), which is exported *without a file extension*. GitHub Pages serves unknown extensions as `application/octet-stream`, so Slack, X and LinkedIn would reject the card. | `out/opengraph-image` (no extension) vs `out/assets/og-sheet.png` |
| 3 | **Open Graph and Twitter used different images** — `og:image` was the generated 1200×630 route, `twitter:image` was the static 1280×640 sheet. The same link previewed at two different crops depending on the platform. | exported `<head>` |
| 4 | **The site origin was copied into three files** (`layout.tsx`, `robots.ts`, `sitemap.ts`), which is how #1 survived: one copy got the basePath treatment and the others did not. | three `const SITE` literals |
| 5 | **No `viewport` export** → no `theme-color` and no `color-scheme`, so mobile browser chrome stayed default-white above a `#09090B` page. | exported `<head>` |
| 6 | **`.sr-only` was overridden into a no-op.** The global rule redefined it as `font-size: 0`, which — being unlayered CSS — beat Tailwind's utility. Seven table `<caption>`s stayed in the layout as blank strips. | `app/globals.css` + 7 captions |
| 7 | **No `scroll-padding-top`.** Every in-page anchor parked its heading underneath the sticky header. | `html` rule in `globals.css` |
| 8 | **Header nav overflowed at `lg`.** Eleven mono-caps labels need ~1,200px; at 1024px the row overran and collided with the Install button. | `Header.tsx` breakpoints |

---

## 2. SEO & metadata corrections

- **`docs/lib/site.ts` (new)** — one source of truth for the origin, the
  canonical URL, the `llms.txt` URL and the social card. Absolute URLs are used
  deliberately: Next.js prefixes `basePath` onto root-relative metadata URLs, so
  *any* hardcoded path would be prefixed twice in CI.
- **Canonical** now emits exactly `https://rohannshetty.github.io/DocHarvest/`.
- **Social card unified** — Open Graph and Twitter both use
  `/DocHarvest/assets/og-sheet.png` (1280×640, a real `.png` served as
  `image/png`), with width, height and alt on the OG side.
- **`app/opengraph-image.tsx` removed.** It competed with the metadata for the
  same slot (Next gives the file convention precedence), and its extensionless
  export is not a usable social asset on this host. The static sheet is also the
  asset `SEO_GUIDE.md` §5/§6 specifies, drawn from `brand/tokens.json`.
- **`viewport` export added** — `device-width`, `color-scheme: dark light`, and
  `theme-color` resolved from the two brand backgrounds (`#09090B` / `#FBFBFA`).
- **`og:locale` added** (`en_US`).
- **`llms.txt` advert** moved from a hand-written `<link>` in `<head>` to
  `alternates.types`, so it cannot drift from the canonical URL.
- **`robots.ts` / `sitemap.ts`** now import the shared constant instead of
  re-declaring the deploy path.
- **Structured data** — URLs re-pointed at the single constant; the
  `SoftwareApplication` / `WebSite` / `TechArticle` / `FAQPage` graph is
  unchanged, since it already matched the visible FAQ text.

Verified in the exported head:

```html
<link rel="canonical" href="https://rohannshetty.github.io/DocHarvest/"/>
<meta property="og:image" content="https://rohannshetty.github.io/DocHarvest/assets/og-sheet.png"/>
<meta name="twitter:image" content="https://rohannshetty.github.io/DocHarvest/assets/og-sheet.png"/>
<meta name="theme-color" content="#09090B" media="(prefers-color-scheme: dark)"/>
<link rel="alternate" type="text/plain" href="https://rohannshetty.github.io/DocHarvest/llms.txt"/>
```

---

## 3. Design & accessibility corrections

The page is already an art-directed system with a written direction contract
(`app/layout.tsx`), a token pipeline (`brand/tokens.json` → `brand-tokens.css`)
and a shared type scale. A from-scratch re-skin would have discarded that
investment and broken the brand `tests/test_brand_tokens.py` guards, so the
redesign is a **consistency pass against the page's own contract** rather than a
new visual language.

- **Hero heading re-entered the type system.** `text-4xl sm:text-5xl lg:text-6xl
  tracking-tight` is now `.sheet-display`, which carries the `-0.045em` tracking,
  the optical line-height and `text-wrap: balance` every other display heading
  already uses. The hero no longer reads lighter than the sections below it.
- **Hero H1 copy now states the category** — "Turn any docs site into context
  your agent can use." (the line the direction contract already names as the
  first viewport). The previous H1, "Clean, structured docs. Zero cloud lock-in.",
  contained neither the product category nor a query-relevant noun.
- **Sticky-header scroll offset** — `scroll-padding-top` (`7rem`, `5rem` at
  `lg`) so anchored sections land below the header instead of under it.
- **Screen-reader-only captions** — removed the broken `.sr-only` override so
  Tailwind's real visually-hidden utility applies; the seven table captions are
  still announced and no longer reserve blank rows.
- **Header responsive breakpoint** — full nav from `xl`, compact scrolling nav
  below it.

---

## 4. Deliberately not done

- **No new sections, copy or features.** Every change is a correction to an
  existing surface.
- **No third-party tags, analytics or fonts.** The local-first positioning in
  `SEO_GUIDE.md` §7.4 rules them out.
- **`meta keywords` kept.** It is ignored by Google, but it is a documented
  decision in `SEO_GUIDE.md` §2 (the "discovery layer" for scraper-adjacent
  queries) — removing it would contradict a written strategy rather than fix a
  bug.

---

## 5. Verification

- `GITHUB_ACTIONS=true NEXT_PUBLIC_BASE_PATH=/DocHarvest npm run build` — passes,
  TypeScript clean, 6 static routes exported.
- `out/index.html` head inspected: canonical, OG, Twitter, theme-color and
  `llms.txt` alternate all resolve to the deployed path.
- `out/sitemap.xml` and `out/robots.txt` point at
  `https://rohannshetty.github.io/DocHarvest/`.
- `npm run test:run` (vitest) — 10 files, 63 tests passing.

## 6. Files changed

| File | Change |
|---|---|
| `docs/lib/site.ts` | **new** — single source for origin, canonical, `llms.txt`, social card |
| `docs/app/layout.tsx` | viewport export, absolute canonical/OG/Twitter URLs, `og:locale`, `alternates.types`, shared constants |
| `docs/app/opengraph-image.tsx` | **removed** — competed with metadata; extensionless export is not a valid social image on GitHub Pages |
| `docs/app/robots.ts`, `docs/app/sitemap.ts` | import the shared constant instead of re-declaring the path |
| `docs/components/Hero.tsx` | H1 on `.sheet-display`, category-bearing copy |
| `docs/components/Header.tsx` | full nav from `xl`; no collision at 1024px |
| `docs/app/globals.css` | `.sr-only` override removed, `scroll-padding-top` added |
| `docs/REDESIGN_CHANGELOG.md` | **new** — this log |

**Owner steps that cannot be verified from this checkout:** re-validate the
JSON-LD at validator.schema.org after deploy, and refresh the GitHub repository
social preview with `assets/social-preview.png`.
