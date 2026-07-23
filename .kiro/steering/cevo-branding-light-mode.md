---
inclusion: manual
---

# Cevo Branding — Light Mode Theme Guide

When asked to apply the Cevo theme or brand to any FSI Foundry use case UI (`applications/fsi_foundry/ui/<use_case>/`), follow this guide. The result should be a clean, professional light-mode UI using the Cevo colour palette.

## Brand Assets Location

All assets are in the `theme/` folder at the project root:

- `theme/CevoLogo_WhiteOrange.png` — Logo (white text + orange mark, works on dark navbars or can be used with a dark nav strip)
- `theme/icons/` — Cevo-branded PNGs for various capabilities (compliance, risk management, AI, etc.)

## Cevo Colour Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary Orange | `#FF8F00` | Primary accent, `--accent` variable, buttons, links, highlights |
| Accent Orange | `#F05A2A` | Secondary accent, `--accent-dim`, button gradient end, borders |
| Accent Pink | `#D3145A` | Tertiary accent for card borders, pipeline steps, differentiation |
| Accent Purple | `#7204B9` | Quaternary accent, compliance/security elements |
| Accent Blue | `#191970` | Gradient endpoint, deep accent for hero text gradients |

## AI & Agentic Systems Gradient

```css
background: linear-gradient(135deg, #FF8F00, #191970);
```

Use for hero text fills (with `-webkit-background-clip: text`), decorative headers, and feature highlights.

## Light Mode CSS Variables

Replace the entire `:root` block in `index.css` with:

```css
:root {
  --accent: #FF8F00;
  --accent-dim: #F05A2A;
  --accent-glow: rgba(255, 143, 0, 0.2);
  --accent-pink: #D3145A;
  --accent-purple: #7204B9;
  --accent-blue: #191970;
  --risk-low: #059669;
  --risk-medium: #d97706;
  --risk-high: #dc2626;
  --risk-critical: #b91c1c;
  --status-compliant: #059669;
  --status-non-compliant: #dc2626;
  --status-review: #d97706;
  --approve: #059669;
  --reject: #dc2626;
  --escalate: #d97706;
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-card: #ffffff;
  --bg-card-hover: #fafafa;
  --border: #e5e7eb;
  --border-glow: rgba(255, 143, 0, 0.2);
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;
}
```

## Key Design Principles

1. **White backgrounds** — `--bg-primary: #ffffff`, cards are white with subtle `box-shadow: 0 1px 3px rgba(0,0,0,0.04)`
2. **Dark text on light** — `--text-primary: #111827` for headings, `--text-secondary: #4b5563` for body
3. **Accent colours on cards** — Use coloured top borders (`borderTop: 3px solid <colour>`) or left borders (`borderLeft: 3px solid <colour>`) to add vibrancy to cards
4. **Solid gradient icon backgrounds** — Agent/feature icons use solid gradient fills (e.g., `linear-gradient(135deg, #FF8F00, #F05A2A)`) with white icon colour instead of transparent tinted backgrounds
5. **Cycle through the palette** — Pipeline steps, tech stack items, and feature cards should each use a different accent colour from the palette (orange → red → pink → purple → blue) for visual variety
6. **Hover states** — Cards get orange border (`rgba(255, 143, 0, 0.3)`) and subtle orange shadow on hover
7. **Input focus** — Orange border with subtle orange ring: `box-shadow: 0 0 0 3px rgba(255, 143, 0, 0.08)`

## Component Styling Rules

### Buttons
- **Primary**: `linear-gradient(135deg, #FF8F00 0%, #F05A2A 100%)` with white text and orange glow shadow
- **Secondary**: Transparent background, orange border (`1.5px solid var(--accent)`), orange text

### Cards
- White background, `1px solid #e5e7eb` border, `border-radius: 12px`
- On hover: orange-tinted border and shadow
- Use coloured accent borders (top or left) to differentiate sections

### Navigation
- White background with bottom border
- Cevo logo: `<img src="/cevo-logo.png" alt="Cevo" className="h-8 w-auto" />`
- Active nav link: `background: rgba(255, 143, 0, 0.08)`, `color: var(--accent)`

### Hero Section
- Gradient text (key word): `linear-gradient(135deg, #FF8F00 0%, #191970 100%)` with `WebkitBackgroundClip: 'text'`
- Badge/pill: `background: rgba(255, 143, 0, 0.08)`, `border: 1px solid rgba(255, 143, 0, 0.25)`

### Background Effects
- Subtle grid: `rgba(255, 143, 0, 0.04)` lines on 40px grid
- Mesh: radial gradients using `rgba(255, 143, 0, 0.06)`, `rgba(114, 4, 185, 0.04)`, `rgba(240, 90, 42, 0.04)`
- Floating orbs: `rgba(255, 143, 0, 0.06)` and `rgba(114, 4, 185, 0.04)`

### Architecture SVG Diagrams
- Connector lines and arrows: `stroke="#FF8F00"`, marker fill `#FF8F00`
- Box fills: `rgba(255,143,0,0.06)` for primary elements
- Use `#7204B9` for compliance/security-related boxes to differentiate
- Text labels for key components use the accent colour

### Animations
- `glow-pulse`: Use `rgba(255, 143, 0, 0.15/0.08/0.3)` values
- Shimmer, scan-line, orbit, pulse-ring remain structural (no blue colours)
- Loading spinners: `borderColor: '#FF8F00', borderTopColor: 'transparent'`

## Applying to a New Use Case

1. **Copy logo**: `cp theme/CevoLogo_WhiteOrange.png applications/fsi_foundry/ui/<use_case>/public/cevo-logo.png`
2. **Update `index.css`**: Replace `:root` variables with the light mode palette above. Replace all `rgba(59, 130, 246, ...)` (blue) values with `rgba(255, 143, 0, ...)` (orange) at the same alpha. Update background/card/text variables to light mode values.
3. **Update Navigation**: Replace any existing logo (usually an SVG shield icon) with `<img src="/cevo-logo.png" alt="Cevo" className="h-8 w-auto" />`. Update active link backgrounds from blue rgba to `rgba(255, 143, 0, 0.08)`.
4. **Update Home/Landing page**: Apply gradient text to the hero keyword. Add coloured accent borders to pipeline/feature cards. Use solid gradient icon backgrounds. Replace any `rgba(59, 130, 246, ...)` inline styles with orange equivalents.
5. **Update Console/Interactive components**: Replace blue rgba values in inline styles. Use orange for progress indicators, spinners, status dots.
6. **Update Results/Output panels**: Replace blue card borders/gradients. Keep risk/status colours (green/amber/red) unchanged.
7. **Verify**: Run `npm run build` in the use case UI directory to confirm zero errors.

## What NOT to Change

- Risk/status colours (green `#059669`, amber `#d97706`, red `#dc2626`) — these are semantic
- Layout structure (grid, flex, gap, padding, margin classes)
- Animation timing and behaviour
- Component logic and data flow
- API client configuration

## Reference Implementation

See `applications/fsi_foundry/ui/kyc_banking/` for a complete example of this theme applied to a use case.
