/**
 * Read the brand tokens at runtime.
 *
 * Canvas-rendered or SVG-string surfaces (Mermaid diagrams) cannot use Tailwind
 * classes, so they ask for the live CSS custom properties instead. The fallbacks
 * below are the last-resort values and are the only raw hexes allowed outside
 * src/styles/ - tests/test_brand_tokens.py enforces that.
 */
export const BRAND_FALLBACK = {
  bond: "#09090B",
  bond2: "#101013",
  bond3: "#18181B",
  rule: "#27272A",
  ruleStrong: "#3F3F46",
  ink: "#F4F4F5",
  ink2: "#A1A1AA",
  ink3: "#8A8A93",
  match: "#F59E0B",
  matchDeep: "#D97706",
  alert: "#EF4444",
  ok: "#34D399"
} as const

export type BrandTokens = Record<keyof typeof BRAND_FALLBACK, string>

const CSS_VAR: Record<keyof typeof BRAND_FALLBACK, string> = {
  bond: "--bond",
  bond2: "--bond-2",
  bond3: "--bond-3",
  rule: "--rule",
  ruleStrong: "--rule-strong",
  ink: "--ink",
  ink2: "--ink-2",
  ink3: "--ink-3",
  match: "--match",
  matchDeep: "--match-deep",
  alert: "--alert",
  ok: "--ok"
}

export function brandTokens(): BrandTokens {
  const out = { ...BRAND_FALLBACK } as BrandTokens
  if (typeof window === "undefined" || !document.documentElement) return out
  const computed = getComputedStyle(document.documentElement)
  for (const key of Object.keys(BRAND_FALLBACK) as (keyof typeof BRAND_FALLBACK)[]) {
    const value = computed.getPropertyValue(CSS_VAR[key]).trim()
    if (value) out[key] = value
  }
  return out
}
