# Working with shadcn/ui in this repo

The desktop GUI (`frontend/`) uses [shadcn/ui](https://ui.shadcn.com) — which is not a
dependency you install but a set of component sources you own. They live in
`frontend/src/components/ui/` and are built on Radix primitives via
`class-variance-authority`. This file records the conventions that keep them consistent
with the brand and with each other.

Read `docs/brand/BRAND.md` §6.1 for the design rules; this file is the practical how-to.

---

## The one rule that matters

**Theme with tokens, never with colours.** Every shadcn variable
(`--background`, `--primary`, `--border`, …) is generated from `brand/tokens.json` into
`frontend/src/styles/brand-tokens.css`. Components read *roles*, not hues:

```tsx
/* yes */  <div className="border border-border bg-card text-muted-foreground" />
/* no  */  <div className="border border-slate-800 bg-zinc-900 text-slate-400" />
/* no  */  <div style={{ color: "#a1a1aa" }} />
```

Changing the palette is then a one-line edit in `brand/tokens.json` plus
`node scripts/sync-brand-tokens.mjs` — the website, the GUI and the README move together,
and `tests/test_brand_tokens.py` fails if a component goes back to naming a colour.

## Adding a component

```bash
cd frontend
npx shadcn@latest add table        # fetches the current upstream source
```

Then reconcile it with the brand, because upstream defaults assume the stock theme:

1. Replace any palette utility with the semantic equivalent (`text-foreground`,
   `bg-muted`, `border-border`, `text-primary`, `text-success`, `text-destructive`).
2. Remove decorative depth: `shadow-*`, `backdrop-blur-*`, gradients. Depth here is a
   1px hairline plus one step up the `--bond` ramp.
3. Leave `--radius`-driven classes alone — `rounded-md`/`rounded-lg`/`rounded-xl` all
   resolve to `0px` through the config.
4. Keep the Radix wiring exactly as generated (ports, `asChild`, `data-state`). The
   accessibility behaviour comes from Radix; restyling must not strip it.
5. Keep the focus ring. `focus-visible:ring-1 focus-visible:ring-ring` is not optional.
6. Run `npm run lint && npm run typecheck && npm run build`.

## Patterns we rely on

| Need | Use |
|---|---|
| Conditional classes | `cn()` from `@/lib/utils` — never string concatenation |
| Component variants | `cva()` in the component file, e.g. `buttonVariants`, `badgeVariants` |
| Composing onto a link/button | `asChild` (Radix `Slot`), not a wrapper element |
| Overlays, focus trapping, escape handling | the Radix primitive (`Dialog`, `Popover`, `Select`) |
| Toasts | `sonner` (already wired as `components/ui/sonner`) |
| Icons | `lucide-react`, sized by the parent (`[&_svg]:size-4`), coloured `text-muted-foreground` |
| Canvas / SVG colour that cannot use classes | `brandTokens()` from `@/lib/brand` (reads the live CSS variables) |

## Traps that have already bitten this repo

- **`hsl(var(--x))` without `<alpha-value>` silences opacity.** With
  `colors.primary = "hsl(var(--primary))"`, `bg-primary/10` renders fully opaque. The
  config uses `hsl(var(--primary) / <alpha-value>)` for exactly this reason. If you add
  a colour, add the placeholder.
- **Negative radii.** `calc(var(--radius) - 2px)` is invalid once `--radius` is `0px`,
  and the declaration is dropped. The radius scale maps straight to `var(--radius)`.
- **Translucent surfaces without blur read as muddy.** Flat design here means solid
  fills: `bg-card`, not `bg-card/80`.
- **One colour per icon looks like a different product.** Icons are structural; they
  are `text-muted-foreground` unless they carry a status.
- **Don't fetch fonts at runtime.** The desktop app must render offline; fonts are
  bundled through `@fontsource-variable/*`.
- **Props drift silently.** Changing a variant's class string is fine; renaming a
  variant (`emerald:` → `success:`) needs a call-site sweep — the badge component
  already carries a dead-variant lesson from this.

## Editing the primitives

`src/components/ui/*` is our code, so it can be changed — but only for a reason that
applies to *every* use of the component (a brand rule, a bug, an a11y fix), never to
fix one screen. A one-off adjustment belongs in the call site via `className`.
