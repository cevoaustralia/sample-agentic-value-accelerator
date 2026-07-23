# Tasks: Cevo Theme KYC Banking

## Task 1: Copy Cevo logo asset to public folder
Copy `theme/CevoLogo_WhiteOrange.png` to `applications/fsi_foundry/ui/kyc_banking/public/cevo-logo.png` so Vite can serve it as a static asset.

### Sub-tasks
- [x] Copy `theme/CevoLogo_WhiteOrange.png` to `applications/fsi_foundry/ui/kyc_banking/public/cevo-logo.png`

## Task 2: Update CSS variables and component classes in index.css
Replace all blue accent colour references in `index.css` with Cevo orange palette colours. This includes CSS custom properties, animation keyframes, and component class styles.

### Sub-tasks
- [x] Update `:root` variables: `--accent` to `#FF8F00`, `--accent-dim` to `#F05A2A`, `--accent-glow` to `rgba(255, 143, 0, 0.3)`, `--border-glow` to `rgba(255, 143, 0, 0.3)`
- [x] Update `@keyframes glow-pulse` from `rgba(59, 130, 246, X)` to `rgba(255, 143, 0, X)`
- [x] Update `.btn-primary:hover` box-shadow from `rgba(59, 130, 246, 0.5)` to `rgba(255, 143, 0, 0.5)`
- [x] Update `.btn-secondary:hover` background and box-shadow from blue to orange rgba
- [x] Update `.input-field:focus` box-shadow from `rgba(59, 130, 246, 0.1)` to `rgba(255, 143, 0, 0.1)`
- [x] Update `.card:hover` border-color from `rgba(59, 130, 246, 0.2)` to `rgba(255, 143, 0, 0.2)`
- [x] Update `.card-glow::before` gradient from `rgba(59, 130, 246, 0.03)` to `rgba(255, 143, 0, 0.03)`
- [x] Update `.bg-grid` lines from `rgba(59, 130, 246, 0.03)` to `rgba(255, 143, 0, 0.03)`
- [x] Update `.bg-mesh` first and third gradients from blue to orange rgba (keep second green gradient unchanged)

## Task 3: Update Navigation.tsx with Cevo logo and orange accents
Replace the shield SVG logo with the Cevo PNG wordmark and update all inline blue rgba styles to orange.

### Sub-tasks
- [x] Replace the shield SVG `<div>` with `<img src="/cevo-logo.png" alt="Cevo" className="h-8 w-auto" />`
- [x] Update nav link active state `rgba(59, 130, 246, 0.1)` to `rgba(255, 143, 0, 0.1)`

## Task 4: Update Home.tsx with Cevo gradient and orange accents
Update the hero gradient text, floating background orbs, agent card styles, hero badge, and architecture SVG inline colour references.

### Sub-tasks
- [x] Update hero "Customer" gradient from `linear-gradient(135deg, var(--accent) 0%, #10b981 100%)` to `linear-gradient(135deg, #FF8F00 0%, #191970 100%)`
- [x] Update hero badge `rgba(59, 130, 246, 0.08)` and border `rgba(59, 130, 246, 0.2)` to orange
- [x] Update floating orb gradient from `rgba(59, 130, 246, 0.06)` to `rgba(255, 143, 0, 0.06)`
- [x] Update AgentCard icon background/border from blue rgba to orange rgba
- [x] Update architecture SVG `rgba(59,130,246,X)` fill values to `rgba(255,143,0,X)`

## Task 5: Update AgentConsole.tsx with orange accents
Replace all inline `rgba(59, 130, 246, ...)` colour values with `rgba(255, 143, 0, ...)` in the AgentConsole component.

### Sub-tasks
- [x] Update AgentStatusCard icon container background/border from blue to orange rgba
- [x] Update running state orbit border from `rgba(59, 130, 246, 0.2)` to `rgba(255, 143, 0, 0.2)`
- [x] Update running state glow box background/border from blue to orange rgba
- [x] Update idle state floating icon background/border from blue to orange rgba

## Task 6: Update ResultsPanel.tsx with orange accents
Replace all inline `rgba(59, 130, 246, ...)` colour values with `rgba(255, 143, 0, ...)` in the ResultsPanel component.

### Sub-tasks
- [x] Update assessment complete card gradient from `rgba(59, 130, 246, 0.03)` to `rgba(255, 143, 0, 0.03)`
- [x] Update assessment complete card border from `rgba(59, 130, 246, 0.2)` to `rgba(255, 143, 0, 0.2)`

## Task 7: Update App.tsx loading spinner
Update the loading spinner in App.tsx from blue to orange.

### Sub-tasks
- [x] Replace `border-blue-600` class with appropriate orange border styling (e.g., inline style using `var(--accent)` or `border-orange-500`)

## Task 8: Build verification
Run `npm run build` to verify no TypeScript or build errors after all theming changes.

### Sub-tasks
- [x] Run `npm run build` in the kyc_banking directory and verify zero errors
