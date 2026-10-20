/**
 * The showcase's canonical origin and social-preview asset.
 *
 * These values used to be duplicated as string literals in `app/layout.tsx`,
 * `app/robots.ts` and `app/sitemap.ts`, which let the canonical URL, the
 * robots sitemap pointer and the structured-data URLs drift apart. GitHub Pages
 * serves this project under `/DocHarvest/`, so a single wrong copy turns into a
 * 404 that only shows up in production.
 */

export const SITE_URL = "https://rohannshetty.github.io";
export const SITE_PATH = "/DocHarvest/";
export const SITE_ORIGIN = `${SITE_URL}${SITE_PATH}`;

/*
 * Emit absolute URLs rather than site-root paths.
 *
 * Next.js prefixes `basePath` (`/DocHarvest`) onto root-relative metadata URLs
 * at build time. Passing "/DocHarvest/" as the canonical therefore exported
 * "https://rohannshetty.github.io/DocHarvest/DocHarvest/" — a 404 canonical that
 * only appeared in the CI build, because local builds run with an empty
 * basePath. Absolute URLs are passed through untouched, so the tag says the
 * same thing in every build.
 */
export const CANONICAL_URL = SITE_ORIGIN;
export const LLMS_URL = `${SITE_ORIGIN}llms.txt`;
export const OG_IMAGE_URL = `${SITE_ORIGIN}assets/og-sheet.png`;

/**
 * The social card. Regenerated from `brand/tokens.json` by
 * `node scripts/build-brand-kit.mjs` (see docs/SEO_GUIDE.md §6), so it carries
 * the real palette and type rather than a hand-drawn imitation.
 *
 * It is a real `.png` on disk, not `app/opengraph-image.tsx`: the file-convention
 * route is exported without a file extension, and GitHub Pages serves unknown
 * extensions as `application/octet-stream`. Twitter/X and Slack refuse to render
 * a card whose image is not served as `image/*`, so the static sheet is the
 * format that actually survives the host.
 */
export const OG_IMAGE = {
  url: OG_IMAGE_URL,
  width: 1280,
  height: 640,
  alt: "DocHarvest — documentation compiler for LLMs, RAG & FastMCP",
} as const;
