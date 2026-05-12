# UX/UI Audit & Hardcoded Values Report

## Executive Summary

This audit identifies hardcoded colors, fonts, spacing, and other UI values scattered throughout the codebase that violate the centralized design system. While a good color system exists (`src/lib/colors.ts` and `src/themes.ts`), many components bypass this system with hardcoded rgba values, magic numbers, and inline styles.

---

## 1. HARDCODED COLORS & OPACITY VALUES

### ❌ Issues Found

#### 1.1 Hardcoded Text Colors (white/black shortcuts)

These are inconsistent with theme variables and don't respect theme switching:

**Location**: Multiple files in `src/components/`

```
// ❌ BAD - Components not using theme variables
text-white              // ~20+ occurrences
text-black              // Several instances
text-white/90           // Opacity using white instead of theme
text-white/80
text-white/60
text-white/50
text-white/40
text-white/30
text-white/15
text-white/10
border-white/10         // Border using white
bg-black/60
bg-black/20
bg-ink-900/80
bg-white/[0.03]
```

**Affected Files:**

- `src/components/TopoEdge.tsx:51` - `text-white/80 border border-white/15 bg-ink-900/80`
- `src/components/CommandPalette.tsx:42,51,54,59,63,65,75,84-86,93,107,126` - Multiple white/opacity
- `src/components/PathPanel.tsx:37,52,54,56` - Multiple white-based colors
- `src/components/NodePanel.tsx:32,36` - Uses `border-white/10`
- `src/App.tsx:50` - `border-white/10 bg-ink-950/30`

#### 1.2 Hardcoded RGBA Values in Canvas

Direct rgba() values used instead of CSS variables:

**Location**: `src/components/Background.tsx:45-68`

```javascript
// ❌ BAD - Hardcoded gradient colors
g.addColorStop(0, isDark ? "rgba(60,90,180,0.18)" : "rgba(37,99,235,0.10)");
g.addColorStop(0.4, isDark ? "rgba(20,28,70,0.10)" : "rgba(20,184,166,0.055)");
g.addColorStop(1, "rgba(0,0,0,0)");
ctx.strokeStyle = isDark
  ? `rgba(120,160,255,${alpha})`
  : `rgba(37,99,235,${alpha})`;
ctx.fillStyle = isDark
  ? `rgba(200,220,255,${alpha})`
  : `rgba(37,99,235,${alpha})`;
```

**Location**: `src/components/LaneNode.tsx:28,34`

```javascript
// ❌ BAD - Fallback colors not using theme system
style={{ color: data.palette?.label ?? "rgba(150,170,255,0.55)" }}
style={{ color: data.palette?.label ?? "rgba(150,170,255,0.4)" }}
```

#### 1.3 Hardcoded Accent Colors

Specific colors hardcoded in inline styles:

**Location**: `src/components/CommandPalette.tsx:126`

```javascript
aria-selected:shadow-[inset_0_0_0_1px_rgba(92,225,255,0.4)]
```

---

## 2. INCONSISTENT SPACING & SIZING

### ❌ Issues Found

#### 2.1 Magic Numbers in Layout

Hardcoded pixel values that should be design tokens:

**Location**: `src/components/GraphCanvas.tsx:191-218`

```javascript
// ❌ BAD - Magic numbers throughout
position: { x: -160, y: l.y - 20 }  // Why 160 and 20?
padding: 0.18,
duration: 600
rf.setCenter(node.position.x + 120, node.position.y + 46, { zoom: Math.max(0.9, rf.getZoom()), duration: 450 });
minZoom={0.06}
maxZoom={2.4}
gap={28}
size={1}
top-[18%]
```

#### 2.2 Inconsistent Text Sizes (Arbitrary Tailwind arbitrary values)

```javascript
// ❌ BAD - Using arbitrary sizes instead of design scale
text-[26px]   // LaneNode.tsx:27
text-[10px]   // Many places
text-[13px]   // NodePanel.tsx:55
text-[12px]   // TopoNode.tsx:29
text-[11px]   // Multiple locations
text-[9px]    // TopoEdge.tsx:51
```

#### 2.3 Inconsistent Padding/Margins

```javascript
// ❌ BAD - Non-standard padding values
px-1.5 py-0.5   // Multiple locations
px-2.5 py-1.5   // TopoNode.tsx:29
px-2 py-1       // TopoNode.tsx:30
px-3 py-2       // TopoNode.tsx:28
gap-1.5         // Multiple locations
gap-2           // Multiple locations
gap-3           // Multiple locations
```

---

## 3. HARDCODED FONTS & TYPOGRAPHY

### ❌ Issues Found

#### 3.1 Font Weights & Styling Scattered

```javascript
// ❌ BAD - Typography properties not centralized
tracking-[0.22em]      // NodePanel.tsx:36
tracking-[0.28em]      // LaneNode.tsx:33
tracking-[0.18em]      // TopoNode.tsx:73
tracking-[0.25em]      // Sidebar.tsx:69
tracking-widest        // Multiple locations
tracking-wider         // Sidebar.tsx:227
leading-tight          // LaneNode.tsx:27
leading-snug           // TopoNode.tsx:81
leading-relaxed        // NodePanel.tsx:55+
font-semibold          // Multiple locations
font-medium            // Multiple locations
font-serif             // NodePanel.tsx:55
font-mono              // Sidebar.tsx:105
font-display           // Used inconsistently
```

#### 3.2 Missing Typography Scale

No centralized typography scale exists for:

- Headings (h1, h2, h3, h4, h5, h6)
- Body text sizes
- Caption/label sizes
- Code text sizes

---

## 4. ANIMATION & MOTION HARDCODED VALUES

### ❌ Issues Found

**Location**: Multiple components

```javascript
// ❌ BAD - Animation durations & easing hardcoded
duration: 0.28; // NodePanel.tsx:24
duration: 0.18; // CommandPalette.tsx:48
duration: 450; // GraphCanvas.tsx:216
duration: 600; // GraphCanvas.tsx:205
ease: [0.2, 0.7, 0.2, 1]; // Hardcoded everywhere
```

---

## 5. LAYOUT CONSTANTS (Not In Design System)

### ❌ Issues Found

**Location**: `src/components/TopoNode.tsx:28-30`

```javascript
// ❌ BAD - Node sizing not centralized
primary: { w: 240, titleClamp: 2, titleSize: "text-[13px]", pad: "px-3 py-2" },
secondary: { w: 200, titleClamp: 2, titleSize: "text-[12px]", pad: "px-2.5 py-1.5" },
compact: { w: 168, titleClamp: 1, titleSize: "text-[11px]", pad: "px-2 py-1" },
```

**Location**: `src/components/CommandPalette.tsx:51`

```javascript
// ❌ BAD - Hard-coded modal sizing
w-[640px] max-w-[92vw]
top-[18%]
```

**Location**: `src/components/NodePanel.tsx:26`

```javascript
// ❌ BAD - Panel sizing
w-[400px] max-w-[42vw]
```

---

## 6. BORDER RADIUS INCONSISTENCIES

### ❌ Issues Found

```javascript
rounded-2xl      // Some panels
rounded-xl       // Some nodes
rounded-lg       // Some containers
rounded-md       // Multiple buttons
rounded-[5px]    // Arbitrary value (Sidebar.tsx:227)
rounded-full     // TopoEdge.tsx:51
rounded-sm       // NodePanel.tsx:37
```

---

## 7. SHADOW & GLOW EFFECTS

### ❌ Issues Found

Only partially centralized in `tailwind.config.js`:

```javascript
// ✅ GOOD - Some shadows defined
"glow": "0 0 40px -10px rgba(124,160,255,0.55)"
"glow-cyan": "0 0 30px -6px rgba(92,225,255,0.6)"

// ❌ BAD - Shadow values hardcoded in Tailwind arbitrary
shadow-2xl       // Multiple components
shadow-[inset_0_0_0_1px_rgba(92,225,255,0.4)]
```

---

## 8. OPACITY SCALE ISSUES

### ❌ Issues Found

No consistent opacity scale. Random values used:

```javascript
opacity - [0.55];
opacity - 70;
opacity - 80;
opacity - 90;
// And rgba values with arbitrary opacity: 0.06, 0.07, 0.08, 0.10, 0.12, etc.
```

---

## 9. BREAKPOINT & RESPONSIVE DESIGN GAPS

### ❌ Issues Found

Hard-coded responsive values instead of using Tailwind breakpoints:

```javascript
max-w-[92vw]     // CommandPalette.tsx:51
max-w-[42vw]     // NodePanel.tsx:26
max-w-[140px]    // CommandPalette.tsx:86
w-[640px]        // CommandPalette.tsx:51
w-[400px]        // NodePanel.tsx:26
```

**Issue**: No mobile-first responsive design pattern documented or consistently applied.

---

## 10. Z-INDEX MANAGEMENT

### ❌ Issues Found

Hard-coded z-index values without centralized management:

```javascript
z - 50; // Multiple overlays and modals
z - 20; // NodePanel.tsx
z -
  10 - // Various components
  z -
  10; // Background.tsx
zIndex: -1; // GraphCanvas.tsx
```

---

## 11. INCONSISTENT BLUR & BACKDROP EFFECTS

### ❌ Issues Found

```javascript
backdrop-filter: "blur(8px)"   // GraphCanvas.tsx:195
backdrop-blur-sm               // CommandPalette.tsx:42
backdropFilter: none           // index.css
```

---

## DETAILED ISSUE BREAKDOWN BY COMPONENT

### src/components/NodePanel.tsx

- Line 31-32: `border-white/10` - Should use `border-[var(--border)]`
- Line 36-37: Arbitrary `text-[10px]` and `rgba(var(--c),0.95)` - Should use design scale
- Line 153: `bg-[rgba(var(--c),1)]` - Duplicated pattern

### src/components/CommandPalette.tsx

- Line 42: `bg-black/60` - Should use `bg-[var(--paper)]/60`
- Line 51: `text-white/90`, `text-white/40` - Should use theme colors
- Line 126: `aria-selected:shadow-[inset_0_0_0_1px_rgba(92,225,255,0.4)]` - Hard-coded cyan color

### src/components/Background.tsx

- Lines 45-68: Canvas drawing uses hard-coded rgba colors instead of CSS variables
- Line 95: `backgroundSize: "26px 26px"` - Magic number, not defined as constant
- Line 102: `opacity-[0.55]` - Arbitrary opacity

### src/components/GraphCanvas.tsx

- Line 191: `position: { x: -160, y: l.y - 20 }` - Magic numbers
- Line 205: `duration: 600` - Hard-coded animation duration
- Line 210: `padding: 0.18` - Magic number
- Line 216: `duration: 450` - Hard-coded animation duration

### src/components/TopoEdge.tsx

- Line 51: `text-white/80`, `border-white/15`, `bg-ink-900/80`, `text-white/80` - Multiple hard-coded colors

### src/components/TopoNode.tsx

- Lines 28-30: Node sizing constants not centralized
- Line 73: `text-[10px]`, `tracking-[0.18em]` - Arbitrary typography values

### src/components/LaneNode.tsx

- Line 28: Default color fallback `"rgba(150,170,255,0.55)"` - Magic color, not in system

---

## RECOMMENDATIONS

### Phase 1: Critical (Foundation)

1. **Create Design Tokens File** (`src/design-tokens.ts`)
   - Define all colors, spacing, typography, shadows, animations
   - Replace all hardcoded values

2. **Replace white/black shortcuts**
   - Replace all `text-white`, `bg-black`, etc. with theme variables
   - Update `index.css` to expose all theme colors as Tailwind utilities

3. **Centralize Typography Scale**
   - Define xs, sm, base, lg, xl, 2xl, 3xl sizes
   - Define font weights and letter spacing as tokens
   - Export to Tailwind config

### Phase 2: High Priority (Consistency)

4. **Extract Layout Constants**
   - Create `src/constants/layout.ts` for:
     - Node dimensions
     - Panel sizes
     - Padding/margin scale
     - Border radius scale
     - Z-index scale

5. **Extract Animation Tokens**
   - Create `src/constants/animations.ts` for:
     - Duration values
     - Easing functions
     - Transition definitions

6. **Standardize Shadow/Glow System**
   - Expand `tailwind.config.js` shadows
   - Remove arbitrary shadow definitions

### Phase 3: Medium Priority (Structure)

7. **Extract Canvas/Background Constants**
   - Move all hardcoded canvas drawing values to constants
   - Make them responsive and theme-aware

8. **Create Responsive Breakpoint Helpers**
   - Define mobile, tablet, desktop breakpoints
   - Create helper utilities

9. **Implement Opacity Scale**
   - Define standard opacity values (0.05, 0.10, 0.20, 0.30, etc.)
   - Export to Tailwind

### Phase 4: Low Priority (Polish)

10. **Document Design System**
    - Update `docs/COLOR_SYSTEM.md` with typography, spacing, animations
    - Create component style guide

11. **Create Theme Builder Tool**
    - Allow runtime theme customization
    - Export theme as JSON/CSS

---

## FILES NEEDING REFACTORING

| File                                | Priority | Issues                                     |
| ----------------------------------- | -------- | ------------------------------------------ |
| `src/components/CommandPalette.tsx` | HIGH     | White/black colors, typography, sizing     |
| `src/components/Background.tsx`     | HIGH     | Hard-coded canvas colors, background sizes |
| `src/components/NodePanel.tsx`      | HIGH     | Border colors, text colors, opacity        |
| `src/components/GraphCanvas.tsx`    | MEDIUM   | Magic numbers, animation durations         |
| `src/components/TopoNode.tsx`       | MEDIUM   | Node sizing, typography scale              |
| `src/components/TopoEdge.tsx`       | MEDIUM   | Text colors, borders, opacity              |
| `src/components/LaneNode.tsx`       | MEDIUM   | Default colors, typography                 |
| `src/App.tsx`                       | LOW      | Border colors                              |
| `src/index.css`                     | HIGH     | Missing theme color utilities              |
| `tailwind.config.js`                | MEDIUM   | Incomplete color/shadow definitions        |

---

## EXISTING GOOD PRACTICES TO BUILD ON

✅ `src/lib/colors.ts` - Good foundation for node kind and relation colors  
✅ `src/themes.ts` - CSS variable system for themes  
✅ `src/themes.css` - Theme switching mechanism  
✅ COLOR_SYSTEM.md - Documentation exists but incomplete

---

## Next Steps

1. Create design tokens architecture
2. Implement Phase 1 changes
3. Update components systematically
4. Add Storybook for visual regression testing
5. Create style guide documentation
