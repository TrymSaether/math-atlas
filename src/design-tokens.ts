/**
 * Centralized Design Tokens
 * Single source of truth for all spacing, typography, animation, and layout values
 */

// ============================================================================
// SPACING SCALE (8px base unit)
// ============================================================================
export const spacing = {
  xs: "2px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  "3xl": "32px",
  "4xl": "40px",
  "5xl": "48px",
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================
export const typography = {
  // Sizes (in pixels)
  sizes: {
    xs: "9px",
    sm: "10px",
    base: "12px",
    md: "13px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "26px",
  },
  // Line height
  lineHeight: {
    tight: "1.2",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },
  // Letter spacing (in em)
  letterSpacing: {
    normal: "0em",
    wide: "0.18em",
    wider: "0.22em",
    widest: "0.28em",
  },
  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// ============================================================================
// BORDER RADIUS SCALE
// ============================================================================
export const borderRadius = {
  sm: "5px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  full: "9999px",
} as const;

// ============================================================================
// Z-INDEX SCALE (organized by layer)
// ============================================================================
export const zIndex = {
  // Background layers
  background: -10,
  // Canvas layers
  canvas: 0,
  // Content layers
  content: 10,
  // Overlays
  overlay: 40,
  // Modals & dialogs
  modal: 50,
  // Notifications & popovers
  popover: 60,
  // Tooltips (highest)
  tooltip: 70,
} as const;

// ============================================================================
// OPACITY SCALE
// ============================================================================
export const opacity = {
  0: "0",
  5: "0.05",
  10: "0.1",
  15: "0.15",
  20: "0.2",
  25: "0.25",
  30: "0.3",
  40: "0.4",
  50: "0.5",
  60: "0.6",
  70: "0.7",
  80: "0.8",
  90: "0.9",
  100: "1",
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================
export const animation = {
  // Duration (in milliseconds)
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 450,
    slowest: 600,
  },
  // Easing functions
  easing: {
    ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    easeIn: "cubic-bezier(0.42, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.58, 1)",
    easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
    sharp: "cubic-bezier(0.2, 0.7, 0.2, 1)", // Used in framer-motion animations
  },
  // Common transitions
  transitions: {
    fast: "all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    normal: "all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    smooth: "all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
} as const;

// ============================================================================
// LAYOUT CONSTANTS (Component-specific dimensions)
// ============================================================================
export const layout = {
  // Node sizing
  node: {
    primary: {
      width: 240,
      titleSize: typography.sizes.md,
      titleClamp: 2,
      padding: "px-3 py-2",
    },
    secondary: {
      width: 200,
      titleSize: typography.sizes.sm,
      titleClamp: 2,
      padding: "px-2.5 py-1.5",
    },
    compact: {
      width: 168,
      titleSize: typography.sizes.xs,
      titleClamp: 1,
      padding: "px-2 py-1",
    },
  },
  // Panel sizing
  panel: {
    nodePanel: {
      width: 400,
      maxWidthViewport: "42vw",
    },
    commandPalette: {
      width: 640,
      maxWidthViewport: "92vw",
      maxHeight: 420,
      topPosition: "18%",
    },
  },
  // Canvas/Graph dimensions
  canvas: {
    laneOffset: {
      x: -160,
      y: -20,
    },
    gridSize: 26,
    gridGap: 28,
    miniMapSize: 1,
    fitViewPadding: 0.18,
  },
  // Graph controls
  graph: {
    minZoom: 0.06,
    maxZoom: 2.4,
    centerAnimationDuration: 450,
    fitViewDuration: 600,
    initialAnimationDelay: 80,
  },
  // Background animation
  background: {
    particleCount: 140,
    particleRadiusMin: 0.3,
    particleRadiusMax: 1.4,
    particleZMin: 0.2,
    particleZMax: 1.0,
    animationSpeed: 0.0035,
    gradientRadius: 60,
    circleCount: 4,
    circleBaseRadius: 220,
    circleRadiusIncrement: 110,
  },
} as const;

// ============================================================================
// SHADOW & GLOW EFFECTS
// ============================================================================
export const shadows = {
  // Standard shadows
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  // Glow effects (defined in tailwind.config.js)
  glowCyan: "0 0 30px -6px rgba(92, 225, 255, 0.6)",
  glowViolet: "0 0 30px -6px rgba(167, 139, 255, 0.6)",
  glowBase: "0 0 40px -10px rgba(124, 160, 255, 0.55)",
} as const;

// ============================================================================
// BACKDROP & GLASS EFFECTS
// ============================================================================
export const backdrop = {
  blur: {
    sm: "blur(0.25px)",
    md: "blur(4px)",
    lg: "blur(8px)",
  },
  opacity: {
    light: "rgba(0, 0, 0, 0.6)",
    medium: "rgba(0, 0, 0, 0.7)",
    dark: "rgba(0, 0, 0, 0.9)",
  },
} as const;

// ============================================================================
// MOTION PRESETS
// ============================================================================
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: animation.duration.fast,
      ease: animation.easing.sharp,
    },
  },
  slideIn: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
    transition: {
      duration: animation.duration.normal,
      ease: animation.easing.sharp,
    },
  },
  scaleIn: {
    initial: { opacity: 0, y: -10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
    transition: {
      duration: animation.duration.fast,
      ease: animation.easing.sharp,
    },
  },
} as const;

export default {
  spacing,
  typography,
  borderRadius,
  zIndex,
  opacity,
  animation,
  layout,
  shadows,
  backdrop,
  motionPresets,
};
