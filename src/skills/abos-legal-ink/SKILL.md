---
name: abos-legal-ink
description: >-
  ABOS Marketspace unified "Legal Ink" design system — the mandatory visual
  standard for EVERY page and component in the platform. Automatically apply
  this skill whenever creating a new page, component, card, button, badge,
  modal, table, input, or any UI element — even if the user doesn't mention
  styling. Also use when the user asks to style, restyle, theme, unify, or
  audit any surface, or mentions "legal ink", "privacy policy style", "dot
  grid", "transparent cards", "ABOS design", "DS v3", or wants visual
  consistency. This skill ensures every new component inherits the dark,
  transparent, dot-grid aesthetic without re-explanation.
---

# ABOS Legal Ink — Unified Design System

Every new page and component in ABOS Marketspace MUST follow this visual
language. Apply these tokens and recipes automatically — do not ask the user
to confirm styling unless they explicitly request a deviation.

## Quick Application Rules

When creating a **new page**:
1. Root container: `background: "transparent"` — NEVER opaque. The global
   dot-grid + radial gradients (from Layout) show through.
2. Use `CoreCard`, `CoreButton`, `CoreBadge`, `CoreModal`, `CoreTable`,
   `CoreInput`, `CoreSelect` from `@/components/core/*` — they already match.
3. Text colors: white scale (w1/w2/w3) — never hardcoded black/dark text.
4. Accent colors: amber `#f5c242` (primary), teal `#5dcaa5` (positive),
   red `#e24b4a` (danger), blue `#4e8ef7` (info).

When creating a **new component**:
1. Card surface: `background: rgba(255,255,255,0.04)`,
   `border: 0.5px solid rgba(255,255,255,0.08)`, `borderRadius: 12px`.
2. Button: amber primary (`#f5c242` bg, `#04060a` text) or ghost
   (transparent, `0.5px solid` border).
3. Badge/chip: uppercase 9px, tinted bg (`<accent>Dim`), `0.5px` border,
   pill shape.
4. Input: `rgba(255,255,255,0.04)` bg, `0.5px` border, 8px radius.

## Design Tokens

```
INK (backgrounds)
  ink    #04060a   ← page canvas (deepest, owned by Layout)
  ink1   #0d1117   ← elevated surface / modal
  ink2   #111620   ← card
  ink3   #1a2235   ← nested card

ACCENTS
  amber  #f5c242   ← primary / gold (CTAs, highlights, tier: starter)
  teal   #5dcaa5   ← success / positive (tier: pro, "buy" band)
  red    #e24b4a   ← danger / caution (tier: caution band)
  blue   #4e8ef7   ← info / accent (tier: enterprise)

WHITE SCALE (text + borders)
  w1  rgba(255,255,255,0.90)  ← primary text / headings
  w2  rgba(255,255,255,0.60)  ← body text
  w3  rgba(255,255,255,0.35)  ← muted / labels / eyebrows
  w4  rgba(255,255,255,0.14)
  w5  rgba(255,255,255,0.06)  ← subtle tint
  border   rgba(255,255,255,0.08)   ← standard 0.5px border
  borderMd rgba(255,255,255,0.12)
  borderHv rgba(255,255,255,0.18)

DIMMED ACCENT BACKGROUNDS (chips/badges/tinted cards)
  amberDim  rgba(245,194,66,0.09)   amberBorder rgba(245,194,66,0.22)
  tealDim   rgba(93,202,165,0.09)   tealBorder  rgba(93,202,165,0.20)
  redDim    rgba(226,75,74,0.10)    redBorder   rgba(226,75,74,0.22)
  blueDim   rgba(78,142,247,0.09)   blueBorder  rgba(78,142,247,0.20)
```

## Page Background (global — owned by Layout)

The Layout component owns the canvas. Individual pages MUST be transparent
so the dot grid + radial gradients show through in gaps between cards.

```
background:     #04060a
backgroundImage:
  radial-gradient(ellipse at 8% 12%, rgba(245,194,66,0.14) 0%, transparent 52%),
  radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.12) 0%, transparent 52%),
  radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.07) 0%, transparent 40%)
```

Dot grid overlay (DotGrid component, opacity 0.18, 24px):
```
radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)
backgroundSize: 24px 24px
```

Watermark SVG (chart line + arrow) fixed center, rotated -8deg, opacity 0.055
— already in Layout, do NOT duplicate on pages.

## Component Recipes

### Card
```
background:   rgba(255,255,255,0.04)
border:       0.5px solid rgba(255,255,255,0.08)
borderRadius: 12px
```
Important card → add 2px accent line on top: `{ height: "2px", background: <accent> }`

### Button
| variant     | background                  | color      | border                          |
|-------------|-----------------------------|------------|---------------------------------|
| default     | #f5c242 (amber)             | #04060a    | none                            |
| secondary   | rgba(255,255,255,0.04)     | w1         | 0.5px solid border              |
| outline     | transparent                 | w1         | 0.5px solid border              |
| ghost       | transparent                 | w2         | none                            |
| destructive | redDim                      | red        | 0.5px solid redBorder           |
| teal        | tealDim                     | teal       | 0.5px solid tealBorder          |

All: `borderRadius: 8px`, `fontSize: 13px`, `fontWeight: 600`,
`letterSpacing: -0.01em`, `hover: opacity 0.9`.

### Badge / Chip
```
fontSize: 9px, fontWeight: 700, letterSpacing: 0.08em,
textTransform: uppercase, borderRadius: 9999px,
padding: 2px 10px, lineHeight: 1.6
background: <accent>Dim, color: <accent>, border: 0.5px solid <accent>Border
```
Variants: gold (amber), blue, teal, success (teal), danger (red), neutral (w5/w3/border).

### Modal
```
background:   rgba(13,17,23,0.95)   ← ink1 at 95% (readable but dark)
border:       0.5px solid rgba(255,255,255,0.08)
borderRadius: 12px
color:        w1
```

### Table
```
container: background rgba(255,255,255,0.02), border 0.5px solid border, radius 12px
header row: background rgba(255,255,255,0.03)
header text: w3, 10px, uppercase, tracking 0.08em, fontWeight 600
body text: w1/80
row border: 0.5px solid border
```

### Input / Select
```
background:   rgba(255,255,255,0.04)
border:       0.5px solid rgba(255,255,255,0.08)
borderRadius: 8px
color:        w1
focus:        borderColor → amberBorder, background → rgba(245,194,66,0.03)
```
Select dropdown: `rgba(13,17,23,0.98)` for readability.

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

## Mandatory Rules
1. **NEVER use opaque page backgrounds** — always `transparent`.
2. **Cards are translucent** (rgba 0.04) — dot grid faintly visible behind.
3. **Borders are 0.5px** white scale (0.08 default) — never thicker.
4. **No glassmorphism** — no heavy blur, no saturated backdrop. Flat layers.
5. **Accent lines** (2px) on top of cards signal importance / category.
6. **Watermark + dot grid live in Layout** — do NOT re-add on pages.
7. **Prefer core components** (`@/components/core/*`) over raw shadcn.
8. **Use `theme/glassmorphism.js`** exports for inline-styled components.
9. **Never use light-theme classes** (`bg-white`, `text-black`, `bg-[#F7F4EF]`,
   `text-[#1A1814]`, `text-[#6B6560]`) — these break the dark canvas.

## Existing Theme Files
- `theme/glassmorphism.js` — full token library + style factories (matches
  Legal Ink; use for inline-styled components).
- `theme/atiPremium.js` — ATI surfaces (same palette, already aligned).
- `theme/community.js` — transparent (unified with Legal Ink).

## Anti-Patterns to Fix on Sight
If you encounter these in existing code, convert them:
- `bg-white` / `bg-[#F7F4EF]` / `bg-[#111827]` → `rgba(255,255,255,0.04)` or transparent
- `text-[#1A1814]` / `text-[#6B6560]` / `text-[#AAA49C]` → w1 / w2 / w3
- `border-black/[0.07]` / `border-black/10` → `rgba(255,255,255,0.08)`
- `bg-[#0B2D5B]` / `bg-[#2563EB]` buttons → amber `#f5c242` with ink text
- `text-[#E8A83A]` / `text-[#D4A017]` → amber `#f5c242`
- `hover:bg-[#F7F4EF]` → `hover:bg-white/5