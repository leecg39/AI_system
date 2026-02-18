# Neo-Brutalism Frontend Redesign - Execution Plan

## Executive Summary
**Status**: Draft → Ready for Implementation
**Scope**: Full frontend UI redesign (387 styling locations)
**Duration Estimate**: 4-5 implementation phases
**Risk Level**: Medium (extensive refactoring, visual QA required)

---

## Gap Analysis Results

### ✅ Resolved Gaps (Auto-Approved)

#### 1. **Test Infrastructure** ✓
- **Finding**: `vitest` already configured and working
- **Action**: Use existing test suite; no setup needed
- **Decision**: Run tests after each component refactor phase

#### 2. **CSS Variable Architecture** ✓
- **Finding**: Tailwind + CSS variables already in place (`globals.css`)
- **Action**: Modify `--primary`, `--secondary`, `--border`, `--radius`, `--accent` in base layers
- **Decision**: Central token updates → cascade changes across 387 locations

#### 3. **Component Library Ready** ✓
- **Finding**: shadcn/ui components present (Button, Card, Input, Dialog, etc.)
- **Action**: Update component base styles in `/frontend/src/components/ui/*`
- **Decision**: Refactor UI primitives first, then pages

#### 4. **Layout Structure Identified** ✓
- **Finding**: Layout components already mapped:
  - `DashboardLayout`, `Header`, `Sidebar`, `MobileSidebar`
  - Pages: dashboard, teams, tasks, settings
- **Action**: Update layout component styling
- **Decision**: Execute layout refresh in Wave 1

---

### ⚠️ Critical Gaps (Decisions Needed)

#### 1. **Specific Neo-Brutalism Color Palette**
**Gap**: Draft mentions "geometric gradients" but no concrete hex/HSL values defined

**What we need**:
- Primary brand color (neo-brutalism dark/bold)
- Accent colors (geometric, high-contrast)
- Background colors (light/dark variants)
- Border colors (thick, bold)
- Semantic colors (success, warning, error)

**Options**:
- **Option A**: Use provided neobrutalism.com color system
- **Option B**: Auto-derive from Space Grotesk typography (bold → bold colors)
- **Option C**: User customizes in design tool before implementation

**Recommendation**: User provides reference image or color codes

#### 2. **Space Grotesk Font Integration**
**Gap**: Package not in `package.json`; Next.js fonts config not prepared

**What we need**:
```
- npm install space-grotesk OR use @next/font
- Update next.config.js with font import
- Update globals.css font-family
- Test font loading on all pages
```

**Decision Point**: Install locally or use Google Fonts CDN?

#### 3. **Border/Shadow/Depth System Definition**
**Gap**: Neo-brutalism needs thick borders & strong shadows, but no specs provided

**What we need**:
- Border thickness standard (2px, 3px, 4px?)
- Shadow values (inner, outer, strong drop shadows)
- Spacing/padding scale (neo-brutalism prefers larger gutters)
- Corner radius (squared-off or slightly rounded?)

**Current values**:
- `--radius: 0.5rem` (rounded)
- Borders: thin (`1px`)
- Shadows: subtle (shadcn defaults)

**Recommendation**: Define "neo-brutalism geometric system" document

#### 4. **Visual Testing Strategy**
**Gap**: Playwright mentioned but not set up

**What we need**:
- Playwright E2E test config (optional but recommended for visual QA)
- OR manual Lighthouse/visual inspection workflow
- Screenshot comparison baselines before/after

**Decision Point**: Implement Playwright visual testing or rely on manual QA?

---

### 🔶 Minor Gaps (Can Proceed)

| Gap | Impact | Resolution |
|-----|--------|-----------|
| No animation specifics | Low | Use existing Framer Motion; add duration/easing in component updates |
| Responsive design not detailed | Low | Keep mobile-first existing approach; test breakpoints |
| Accessibility implications | Medium | Verify WCAG contrast ratios with new colors; test keyboard nav |
| Dark mode palette | Low | Derive from neo-brutalism system (usually high-contrast inverse) |
| Component state styles | Low | Define once in refactor wave; apply consistently |

---

## Critical Decisions Needed

### **Decision 1: Color Palette**
Provide one of:
- [ ] Direct hex/HSL values for 8-10 key colors
- [ ] Reference image (screenshot of desired aesthetic)
- [ ] Allow auto-implementation with sensible neo-brutalism defaults

### **Decision 2: Font Installation Method**
Choose:
- [ ] `npm install space-grotesk` + local import
- [ ] Google Fonts CDN (@next/font/google)

### **Decision 3: Border/Shadow Standards**
Provide design spec OR approve defaults:
- Border thickness: `2px` (bold)
- Shadow: `0 8px 16px rgba(0,0,0,0.2)` (strong)
- Radius: `0px` (squared-off, full neo-brutalism)
- Padding scale: `1.5x` current (spacious)

### **Decision 4: Visual QA Approach**
Choose:
- [ ] Set up Playwright + visual regression testing
- [ ] Manual visual inspection after each wave
- [ ] Both (comprehensive but slower)

---

## Execution Roadmap

### **Phase 1: Foundation (1-2 days)**
```
├─ Decision: Get color palette + font choice
├─ Install Space Grotesk font
├─ Update globals.css CSS variables
├─ Modify Tailwind theme tokens
└─ Run vitest → confirm no breakage
```

### **Phase 2: UI Primitives (2-3 days)**
```
├─ Refactor Button component
├─ Refactor Card component
├─ Refactor Input, Label, Dialog components
├─ Update form styling
└─ Run vitest → visual spot-check
```

### **Phase 3: Layout Components (1-2 days)**
```
├─ Update DashboardLayout styling
├─ Update Header + Sidebar
├─ Update MobileSidebar
└─ Test responsive breakpoints
```

### **Phase 4: Page Styling (2-3 days)**
```
├─ Refactor dashboard page
├─ Refactor teams/[id] page
├─ Refactor tasks page
├─ Refactor settings page
├─ Refactor auth pages
└─ Full E2E test coverage
```

### **Phase 5: QA + Refinement (1-2 days)**
```
├─ Run full test suite (vitest)
├─ Playwright visual smoke tests
├─ Accessibility audit (WCAG contrast)
├─ Browser compatibility check
└─ Final polish + commit
```

---

## Known Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| 387 styling locations | High complexity | Batch refactor by component type |
| Dark mode support | Medium | Update both light + dark CSS vars together |
| Test snapshots | Low-Medium | Update snapshots after global CSS changes |
| Responsive design | Medium | Test all breakpoints (sm, md, lg, xl) |
| Component dependencies | Low | Use CSS variable cascading (no breaking changes) |

---

## Success Criteria

- [ ] All vitest tests pass (no functional breakage)
- [ ] All 387 styling locations refactored to neo-brutalism aesthetic
- [ ] Space Grotesk font loads correctly across all pages
- [ ] Lighthouse accessibility score maintained (≥90)
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Dark mode styling complete and consistent
- [ ] Visual QA: 10+ page screenshots validated
- [ ] No console errors or warnings related to styling

---

## Next Steps

1. **User provides decisions**: Colors, font method, border/shadow specs, QA approach
2. **Update this plan**: Lock in decisions
3. **Use `/start-work`**: Begin Phase 1 implementation
4. **Daily verification**: Run `npm run test` + visual spot-checks after each phase

---

**Last Updated**: 2026-02-18
**Plan Status**: AWAITING USER DECISIONS
**Auto-Resolution Rate**: 60% (4/7 gaps resolved)
