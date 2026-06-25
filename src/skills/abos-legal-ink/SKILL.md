---
name: abos-legal-ink
description: >-
  ABOS Marketspace unified "Legal Ink" design system — the dark, transparent,
  dot-grid aesthetic used across all platform surfaces (Core, ATI Premium,
  Community, Legal). Use this skill whenever the user asks to style, restyle,
  theme, or unify pages, cards, buttons, badges, modals, tables, inputs, or
  any UI component to match the Privacy Policy / Terms of Service look. Also
  use when the user mentions "legal ink style", "privacy policy style",
  "dot grid", "transparent cards", "unified design", "ABOS design system",
  "DS v3", or wants visual consistency across the platform. This is the single
  source of truth for the ABOS visual identity.
---

# ABOS Legal Ink — Unified Design System

The ABOS Marketspace platform uses one visual language across every surface:
**Legal Ink** — a dark, transparent, dot-grid aesthetic inspired by the
Privacy Policy and Terms of Service pages. This skill gives you the complete
token set and component recipes so you can apply it without re-explaining.

## Design Tokens

```
INK (backgrounds)
  ink    #04060a   ← page canvas (deepest)
  ink1   #0d1117   ← elevated surface
  ink2   #111620   ← card / modal
  ink3   #1a2235   ← nested card

ACCENTS
  amber  #f5c242   ← primary / gold (CTAs, highlights, tier: starter)
  teal   #5dcaa5   ← success / positive (tier: pro, "buy" band)
  red    #e24b4a   ← danger / caution (tier: caution band)
  blue   #4e8ef7   ← info / accent (tier: enterprise)

WHITE SCALE (text + borders)
  w1  rgba(255,255,255,0.90)  ← primary text
  w2  rgba(255,255,255,0.60)  ← body text
  w3  rgba(255,255,255,0.35)  ← muted / labels
  w4  rgba(255,255,255,0.14)
  w5  rgba(255,255,255,0.06)  ← subtle tint
  border   rgba(255,255,255,0.08)   ← standard 0.5px border
  borderMd rgba(255,255,255,0.12)
  borderHv rgba(255,255,255,0.18)

DIMMED ACCENT BACKGROUNDS (for chips/badges/tinted cards)
  amberDim  rgba(245,194,66,0.09)   amberBorder rgba(245,194,66,0.22)
  tealDim   rgba(93,202,165,0.09)   tealBorder  rgba(93,202,165,0.20)
  redDim    rgba(226,75,74,0.10)    redBorder   rgba(226,75,74,0.22)
  blueDim   rgba(78,142,247,0.09)   blueBorder  rgba(78,142,247,0.20)
```

## Page Background (global — applied in Layout)

The Layout component owns this; individual pages should be **transparent**
so the canvas shows through in the gaps between cards.

```
background:     #04060a
backgroundImage:
  radial-gradient(ellipse at 8% 12%, rgba(245,194,66,0.14) 0%, transparent 52%),
  radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.12) 0%, transparent 52%),
  radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.07) 0%, transparent 40%)
```

A **dot grid** overlay sits on top (DotGrid component, opacity 0.18, 24px
spacing):
```
radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)
backgroundSize: 24px 24px
```

A **watermark** SVG (chart line with arrow) is fixed center, rotated -8deg,
opacity 0.055 — already in Layout, do not duplicate on pages.

## Component Recipes

### Card (CoreCard)
```
background:   rgba(255,255,255,0.04)
border:       0.5px solid rgba(255,255,255,0.08)
borderRadius: 12px
```
For elevated/important cards, add a 2px accent line on top:
```
{ height: "2px", background: <accent color> }
```

### Button (CoreButton)
| variant      | background                  | color      | border                          |
|--------------|-----------------------------|------------|---------------------------------|
| default      | #f5c242 (amber)             | #04060a    | none                            |
| secondary    | rgba(255,255,255,0.04)      | w1         | 0.5px solid border              |
| outline      | transparent                 | w1         | 0.5px solid border              |
| ghost        | transparent                 | w2         | none                            |
| destructive  | redDim                      | red        | 0.5px solid redBorder           |
| teal         | tealDim                     | teal       | 0.5px solid tealBorder          |

All: `borderRadius: 8px`, `fontSize: 13px`, `fontWeight: 600`,
`letterSpacing: -0.01em`, `hover: opacity 0.9`.

### Badge / Chip (CoreBadge)
```
fontSize: 9px, fontWeight: 700, letterSpacing: 0.08em,
textTransform: uppercase, borderRadius: 9999px,
padding: 2px 10px, lineHeight: 1.6
background: <accent>Dim, color: <accent>, border: 0.5px solid <accent>Border
```
Variants: gold (amber), blue, teal, success (teal), danger (red), neutral (w5/w3/border).

### Modal (CoreModal)
```
background:   rgba(13,17,23,0.95)   ← ink1 at 95% (readable but dark)
border:       0.5px solid rgba(255,255,255,0.08)
borderRadius: 12px
color:        w1
```

### Table (CoreTable)
```
container: background rgba(255,255,255,0.02), border 0.5px solid border, radius 12px
header row: background rgba(255,255,255,0.03)
header text: w3, 10px, uppercase, tracking 0.08em, fontWeight 600
body text: w1/80
row border: 0.5px solid border
```

### Input / Select (CoreInput, CoreSelect)
```
background:   rgba(255,255,255,0.04)
border:       0.5px solid rgba(255,255,255,0.08)
borderRadius: 8px
color:        w1
focus:        borderColor → amberBorder, background → rgba(245,194,66,0.03)
```
Select dropdown content: `rgba(13,17,23,0.98)` for readability.

### Typography
```
h1:   clamp(28px,4vw,42px), fontWeight 500, letterSpacing -0.04em, lineHeight 1.06, color w1
h2:   22px, fontWeight 500, letterSpacing -0.04em, color w1
h3:   15px, fontWeight 600, letterSpacing -0.03em, color w1
body: 13px, fontWeight 400, letterSpacing -0.01em, lineHeight 1.55, color w2
eyebrow: 9px, fontWeight 600-700, letterSpacing 0.12em, uppercase, color w3 or accent
mono: 'Courier New', 13px, letterSpacing 0.06em, color w2
```

### Section Header
```
eyebrow tag: 9px, 700, 0.08em, uppercase, accent color,
  background accentDim, border 0.5px accentBorder, padding 2px 8px, radius 9999px
divider: 0.5px solid border
```

## ATI Score Bands
```
≥ 96  Strong Buy   teal
≥ 80  Buy          teal
≥ 60  Review       amber
< 60  Caution      red
```
Left-border accent: `3px solid <band color>` on listing rows.

## Tier Colors
```
free_explorer  w3 / w5 / border
starter        amber / amberDim / amberBorder
pro            teal / tealDim / tealBorder
enterprise     blue / blueDim / blueBorder
```

## Rules
1. **Never use opaque backgrounds** on page roots — always transparent so the
   global dot grid + radial gradients show through.
2. **Cards are translucent** (rgba 0.04), never solid ink — the dot grid
   should be faintly visible behind them.
3. **Borders are 0.5px** and use the white scale (0.08 default), never
   thicker unless explicitly requested.
4. **No glassmorphism** (no heavy blur, no saturated backdrop) — surfaces are
   flat translucent layers.
5. **Accent lines** (2px) on top of cards signal importance / category.
6. **Watermark + dot grid live in Layout** — do not re-add them on pages.
7. Use `theme/glassmorphism.js` exports (`COLORS`, `card()`, `btnPrimary()`,
   `chip`, etc.) for inline-styled components — they already match this system.
8. Core components (`components/core/*`) are the preferred primitives — use
   them instead of raw shadcn for new surfaces.

## Existing Theme Files
- `theme/glassmorphism.js` — full token library + style factories (matches
  Legal Ink exactly; use for inline-styled components).
- `theme/atiPremium.js` — ATI surfaces (same palette, already aligned).
- `theme/community.js` — now transparent (unified with Legal Ink).