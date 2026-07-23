# Requirements: Cevo Theme KYC Banking

## Requirement 1: CSS Accent Colour Variables
### Requirement
Update all CSS custom property accent colours in `index.css` from the current blue palette to Cevo brand orange palette.

### Acceptance Criteria
- GIVEN the `:root` CSS variables WHEN the theme is applied THEN `--accent` equals `#FF8F00`, `--accent-dim` equals `#F05A2A`, `--accent-glow` equals `rgba(255, 143, 0, 0.3)`, and `--border-glow` equals `rgba(255, 143, 0, 0.3)`
- GIVEN the `:root` CSS variables WHEN the theme is applied THEN all `--risk-*`, `--status-*`, `--approve`, `--reject`, `--escalate`, `--bg-*`, `--border`, and `--text-*` variables remain unchanged

## Requirement 2: CSS Component Class Colours
### Requirement
Update all hardcoded `rgba(59, 130, 246, ...)` colour values in CSS component classes (buttons, cards, grids, mesh backgrounds) and animation keyframes to use `rgba(255, 143, 0, ...)` with the same alpha values.

### Acceptance Criteria
- GIVEN the `.btn-primary:hover` class WHEN the theme is applied THEN box-shadow uses `rgba(255, 143, 0, 0.5)`
- GIVEN the `.btn-secondary:hover` class WHEN the theme is applied THEN background uses `rgba(255, 143, 0, 0.08)` and box-shadow uses `rgba(255, 143, 0, 0.15)`
- GIVEN the `.input-field:focus` class WHEN the theme is applied THEN box-shadow uses `rgba(255, 143, 0, 0.1)`
- GIVEN the `.card:hover` class WHEN the theme is applied THEN border-color uses `rgba(255, 143, 0, 0.2)`
- GIVEN the `.card-glow::before` pseudo-element WHEN the theme is applied THEN gradient uses `rgba(255, 143, 0, 0.03)`
- GIVEN the `.bg-grid` class WHEN the theme is applied THEN grid lines use `rgba(255, 143, 0, 0.03)`
- GIVEN the `.bg-mesh` class WHEN the theme is applied THEN first radial gradient uses `rgba(255, 143, 0, 0.08)` and third uses `rgba(255, 143, 0, 0.04)` while second (green) remains unchanged
- GIVEN the `@keyframes glow-pulse` animation WHEN the theme is applied THEN all rgba values use `255, 143, 0` instead of `59, 130, 246`

## Requirement 3: Logo Replacement
### Requirement
Replace the shield SVG icon in the Navigation component with the Cevo PNG wordmark logo, and copy the logo asset to the public folder.

### Acceptance Criteria
- GIVEN the `theme/CevoLogo_WhiteOrange.png` file WHEN the theme is applied THEN it is copied to `applications/fsi_foundry/ui/kyc_banking/public/cevo-logo.png`
- GIVEN the Navigation component WHEN rendered THEN it displays an `<img>` element with `src="/cevo-logo.png"` and `alt="Cevo"` instead of the shield SVG
- GIVEN the Navigation logo WHEN rendered THEN the image has appropriate height constraint (`h-8`) for the nav bar
- GIVEN the Navigation component WHEN rendered THEN the logo still links to `/`

## Requirement 4: Hero Gradient Text
### Requirement
Update the gradient text on the "Customer" word in the Home page hero section to use the Cevo AI & Agentic Systems gradient (Primary Orange → Accent Blue).

### Acceptance Criteria
- GIVEN the hero "Customer" text WHEN the theme is applied THEN background uses `linear-gradient(135deg, #FF8F00 0%, #191970 100%)`
- GIVEN the hero "Customer" text WHEN rendered THEN `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent` are preserved

## Requirement 5: Inline Style Colour Replacement
### Requirement
Replace all hardcoded inline `rgba(59, 130, 246, ...)` values in React component style props with `rgba(255, 143, 0, ...)` preserving the same alpha values.

### Acceptance Criteria
- GIVEN Navigation.tsx WHEN the theme is applied THEN all `rgba(59, 130, 246, X)` inline styles are replaced with `rgba(255, 143, 0, X)`
- GIVEN Home.tsx WHEN the theme is applied THEN all `rgba(59, 130, 246, X)` inline styles are replaced with `rgba(255, 143, 0, X)` including floating orbs and architecture diagram SVG fills
- GIVEN AgentConsole.tsx WHEN the theme is applied THEN all `rgba(59, 130, 246, X)` inline styles are replaced with `rgba(255, 143, 0, X)`
- GIVEN ResultsPanel.tsx WHEN the theme is applied THEN all `rgba(59, 130, 246, X)` inline styles are replaced with `rgba(255, 143, 0, X)`
- GIVEN any component WHEN the theme is applied THEN no `rgba(16, 185, 129`, `rgba(239, 68, 68`, or `rgba(245, 158, 11` values are modified

## Requirement 6: Layout and Animation Preservation
### Requirement
All layout structure, Tailwind utility classes for positioning/sizing, and CSS animations must remain unchanged after theming.

### Acceptance Criteria
- GIVEN any themed component WHEN rendered THEN all Tailwind layout classes (grid, flex, gap-*, p-*, m-*, w-*, h-*, max-w-*, rounded-*) are identical to the original
- GIVEN any themed component WHEN rendered THEN all CSS animations (fadeIn, shimmer, scan-line, orbit, wave, pulse-ring, float, pulse-dot, spin) function correctly
- GIVEN the App.tsx loading spinner WHEN the theme is applied THEN the `border-blue-600` class is updated to use orange styling

## Requirement 7: No Residual Blue References
### Requirement
After theming is complete, no blue accent colour references should remain in any of the modified source files.

### Acceptance Criteria
- GIVEN the modified source files WHEN searched THEN no occurrence of `rgba(59, 130, 246` exists
- GIVEN the modified source files WHEN searched THEN no occurrence of `#3b82f6` or `#2563eb` exists
- GIVEN the modified source files WHEN searched THEN no occurrence of `border-blue-600` exists
