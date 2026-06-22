# Bubblespace Web — Design System (MASTER)

> Global source of truth for UI work in `BUBBLESPACE/frontend`. Page-specific deviations go in `design-system/pages/<page>.md` and override this file.
> **Live tokens** are defined in [`src/index.css`](../src/index.css) (shadcn/Radix + Tailwind v4 `@theme`). This doc summarizes intent — when they disagree, `src/index.css` wins; update both together.

## Product
Bubblespace — a friendly team **chat + calling/collaboration** workspace (LiveKit-powered). Tone: warm, modern, playful-but-professional. Not a marketing landing page — these are app-internal surfaces (chat, calls, calendar, groups, settings).

## Brand & Color
Lavender-purple "bubble" identity with a warm orange action accent. Light and dark are both first-class (`next-themes`, `.dark` variant).

| Role | Light | Dark | Token |
|------|-------|------|-------|
| Primary (brand) | `oklch(0.62 0.21 290)` ≈ `#6c5ce7` | `oklch(0.75 0.18 295)` | `--primary` |
| Accent (action) | `#f4663b` | `#f4663b` | `--color-accent-orange` |
| Background | `oklch(0.98 0.015 290)` | `oklch(0.14 0.03 285)` | `--background` |
| Card | `#ffffff` | `oklch(0.2 0.04 285)` | `--card` |
| Text (ink) | `oklch(0.18 0.04 280)` ≈ `#1f2030` | `oklch(0.97 0.01 290)` | `--foreground` |
| Muted text | `oklch(0.5 0.05 285)` | `oklch(0.7 0.04 285)` | `--muted-foreground` |
| Border | `oklch(0.9 0.03 290)` | `oklch(1 0 0 / 0.1)` | `--border` |
| Destructive | `oklch(0.62 0.24 27)` | — | `--destructive` |

Signature gradients/shadows (use sparingly, for hero/bubble moments): `--gradient-hero`, `--gradient-primary`, `--gradient-bubble`, `--shadow-glow`, `--shadow-bubble`.

## Typography
- **Body / UI:** Poppins (`--font-sans` → `--font-poppins`)
- **Display / headings:** Space Grotesk (`--font-display`)
- **Mono:** Geist Mono (`--font-mono`)
- Keep headings tight and confident; body comfortable. Don't introduce new families — reuse these three.

## Shape, Spacing, Motion
- **Radius:** generous/rounded ("bubble" feel) — base `--radius: 1rem`, scale `--radius-sm..3xl`. Default to `rounded-lg`/`rounded-xl` on cards, inputs, buttons.
- **Spacing:** Tailwind scale; comfortable padding on cards/lists.
- **Motion:** smooth 150–300ms transitions; respect `prefers-reduced-motion`. Reserve glow/gradient flourish for one signature element per view, not everywhere.

## Components
Built on **shadcn/ui + Radix primitives** (already installed: dialog, dropdown, popover, tabs, tooltip, etc.) + **lucide-react** icons. Reuse these — do not hand-roll primitives. `tailwind-merge` for class composition.

## Anti-patterns (avoid)
- Emojis as icons — use lucide-react SVGs.
- New color hues or font families outside the tokens above.
- Neon/sports palettes, AI purple→pink gradients, generic "App Store landing" layouts — this is an app, not a marketing page.
- Hardcoded hex in components — use the CSS variables / Tailwind tokens so dark mode stays correct.

## Pre-delivery checklist
- [ ] Tokens used (no stray hex); dark mode verified.
- [ ] `cursor-pointer` + visible focus states on all interactive elements.
- [ ] Hover/active states with 150–300ms transitions.
- [ ] Text contrast ≥ 4.5:1 (light and dark).
- [ ] `prefers-reduced-motion` respected.
- [ ] Responsive at 375 / 768 / 1024 / 1440px.
- [ ] Icons from lucide-react; no emoji glyphs.

---
*Generated with the `ui-ux-pro-max` skill as a reference, tailored to this repo's actual tokens. Regenerate fresh recommendations any time with:*
`python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain style`
