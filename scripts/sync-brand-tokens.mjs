#!/usr/bin/env node
/**
 * Generate the brand token surfaces from brand/tokens.json.
 *
 *   node scripts/sync-brand-tokens.mjs          # write every generated file
 *   node scripts/sync-brand-tokens.mjs --check   # exit 1 if any file is stale
 *
 * Three surfaces consume the same values:
 *   docs/app/brand-tokens.css             -> website (Next.js / Tailwind v4)
 *   frontend/src/styles/brand-tokens.css  -> desktop GUI (Vite / Tailwind v3)
 *   src/docharvest/brand_tokens.py        -> CLI / TUI / window chrome (Python)
 *
 * The website file holds the raw primitives only; the site maps them onto
 * Tailwind v4 theme variables itself. The GUI file additionally holds a
 * shadcn/ui semantic layer (--background, --primary, ...) because the component
 * primitives there read those names, plus HSL triplets so Tailwind's
 * `bg-primary/10` opacity modifier keeps working. The Python module carries the
 * primitives and font stacks as data, so `docharvest tui` and the PyWebView
 * window chrome name the brand instead of carrying private hex copies.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "brand/tokens.json"), "utf8"));

const BANNER = `/* GENERATED FILE - DO NOT EDIT.
   Source: brand/tokens.json   Regenerate: node scripts/sync-brand-tokens.mjs
   tests/test_brand_tokens.py fails if this file and the source disagree. */`;

const PY_BANNER = `"""GENERATED FILE - DO NOT EDIT.

Source: brand/tokens.json   Regenerate: node scripts/sync-brand-tokens.mjs
tests/test_brand_tokens.py fails if this file and the source disagree.
"""

from __future__ import annotations`;

/* ---------- colour maths ---------- */

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

/** hex -> "H S% L%" triplet (what `hsl(var(--x))` expects). */
function hexToHslTriplet(hex) {
  const [r0, g0, b0] = hexToRgb(hex);
  const [r, g, b] = [r0 / 255, g0 / 255, b0 / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${trim(h * 360)} ${trim(s * 100)}% ${trim(l * 100)}%`;
}

function trim(n) {
  return String(Math.round(n * 100) / 100);
}

/** Round-trip guard: the triplet must resolve back to the exact same 8-bit colour. */
function hslTripletToHex(triplet) {
  const [h, s, l] = triplet.split(/\s+/).map((v) => parseFloat(v));
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  const seg = Math.floor(h / 60) % 6;
  const rgb = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][seg].map((v) => (v + m) * 255);
  return rgbToHex(rgb);
}

const isHex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v.trim());

/** Resolve a shadcn variable for one mode: primitive name -> hex, or literal hex. */
function resolveShadcn(name, mode) {
  const spec = tokens.shadcn[name];
  if (spec == null) throw new Error(`shadcn.${name} is missing from brand/tokens.json`);
  if (typeof spec === "object") {
    if (!spec[mode]) throw new Error(`shadcn.${name}.${mode} is missing`);
    return spec[mode];
  }
  const primitives = tokens.primitives[mode];
  if (!(spec in primitives)) {
    throw new Error(`shadcn.${name} points at unknown primitive "${spec}"`);
  }
  return primitives[spec];
}

/* ---------- render ---------- */

function primitiveLines(mode, indent) {
  return Object.entries(tokens.primitives[mode]).map(
    ([k, v]) => `${indent}--${k}: ${v};`
  );
}

function fontLines(indent) {
  return [
    `${indent}--font-sans: ${tokens.fonts.sans.join(", ")};`,
    `${indent}--font-mono: ${tokens.fonts.mono.join(", ")};`,
  ];
}

function shadcnLines(mode, indent) {
  const names = Object.keys(tokens.shadcn).filter((k) => !k.startsWith("$"));
  return names.map((name) => {
    const hex = resolveShadcn(name, mode);
    if (!isHex(hex)) throw new Error(`shadcn.${name}.${mode} must be a hex colour, got "${hex}"`);
    const triplet = hexToHslTriplet(hex);
    const back = hslTripletToHex(triplet);
    if (back.toLowerCase() !== hex.toLowerCase()) {
      throw new Error(
        `precision loss for shadcn.${name}.${mode}: ${hex} -> ${triplet} -> ${back}`
      );
    }
    return `${indent}--${name}: ${triplet};`;
  });
}

const websiteCss = `${BANNER}

:root {
${primitiveLines("dark", "  ").join("\n")}
}

.light {
${primitiveLines("light", "  ").join("\n")}
}
`;

const guiCss = `${BANNER}
/* Loaded by src/index.css. Brand primitives (shared with the website) first,
   then the shadcn/ui semantic layer derived from them, so every primitive in
   src/components/ui reads the brand without a single component edit. */

:root,
.dark {
  /* --- brand primitives (identical values to docs/app/brand-tokens.css) --- */
${primitiveLines("dark", "  ").join("\n")}

  /* --- shadcn/ui semantic layer (HSL triplets: support bg-primary/10) --- */
${shadcnLines("dark", "  ").join("\n")}

  --radius: ${tokens.radius};
${fontLines("  ").join("\n")}
}

.light {
${primitiveLines("light", "  ").join("\n")}

${shadcnLines("light", "  ").join("\n")}

  --radius: ${tokens.radius};
${fontLines("  ").join("\n")}
}
`;

function pythonPrimitives(mode) {
  return Object.entries(tokens.primitives[mode])
    .map(([k, v]) => `        "${k}": "${v}",`)
    .join("\n");
}

function pythonTuple(values) {
  return `(\n${values.map((v) => `        "${v}",`).join("\n")}\n    )`;
}

const pythonModule = `${PY_BANNER}

#: Every corner in the brand is square.
RADIUS: str = "${tokens.radius}"

#: The two families the whole product is set in. A terminal or a native window
#: without them installed falls through the stack to the platform UI font rather
#: than rendering in a different voice.
FONTS: dict[str, tuple[str, ...]] = {
    "sans": ${pythonTuple(tokens.fonts.sans)},
    "mono": ${pythonTuple(tokens.fonts.mono)},
}

#: Brand primitives per mode. "dark" is the default world; "light" is a real
#: second palette, not an inversion of the first.
TOKENS: dict[str, dict[str, str]] = {
    "dark": {
${pythonPrimitives("dark")}
    },
    "light": {
${pythonPrimitives("light")}
    },
}


def token(name: str, mode: str = "dark") -> str:
    """Return one brand primitive: token("bond") or token("match", "light")."""
    try:
        return TOKENS[mode][name]
    except KeyError as exc:  # pragma: no cover - a typo at a call site
        raise KeyError(
            f"unknown brand token {name!r} for mode {mode!r}; "
            f"known modes: {sorted(TOKENS)}, known tokens: {sorted(TOKENS[mode])}"
        ) from exc


def font_stack(kind: str) -> str:
    """Return a CSS font stack for FONTS ("sans" or "mono")."""
    try:
        families = FONTS[kind]
    except KeyError as exc:  # pragma: no cover - a typo at a call site
        raise KeyError(
            f"unknown font stack {kind!r}; known stacks: {sorted(FONTS)}"
        ) from exc
    return ", ".join(f'"{name}"' if " " in name else name for name in families)
`;

const targets = [
  ["docs/app/brand-tokens.css", websiteCss],
  ["frontend/src/styles/brand-tokens.css", guiCss],
  ["src/docharvest/brand_tokens.py", pythonModule],
];

const check = process.argv.includes("--check");
let stale = 0;

// Compare with line endings normalized. Git checks the tree out with CRLF on
// Windows runners (`core.autocrlf=true`), so a byte-exact comparison against
// the LF-only generated string reports STALE on windows-latest while the file
// is perfectly correct — a check that fails only on one platform is noise.
// The written file still uses LF, which is what git stores.
const normalizeEol = (value) => value.replace(/\r\n/g, "\n");

for (const [rel, content] of targets) {
  const abs = join(root, rel);
  let current = null;
  try {
    current = normalizeEol(readFileSync(abs, "utf8"));
  } catch {
    current = null;
  }
  if (current === content) {
    console.log(`sync-brand-tokens: ${rel} up to date`);
    continue;
  }
  if (check) {
    stale++;
    console.error(`sync-brand-tokens: ${rel} is STALE`);
    continue;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
  console.log(
    `sync-brand-tokens: wrote ${rel} (${content.length} bytes, ${content.split("\n").length - 1} lines)`
  );
}

if (check && stale) {
  console.error(`sync-brand-tokens: ${stale} file(s) stale - run: node scripts/sync-brand-tokens.mjs`);
  process.exit(1);
}
console.log("sync-brand-tokens: ok");
