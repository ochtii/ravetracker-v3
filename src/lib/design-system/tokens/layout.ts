/**
 * RaveTracker v3.0 Design System - Spacing & Layout Tokens
 * ========================================================
 * Produktionsreife Spacing-System mit 8pt Grid
 */

export const spacing = {
  // Base unit: 4px (0.25rem)
  // Following 8pt grid system for consistency
  
  // Spacing Scale
  0: '0',
  px: '1px',
  0.5: '0.125rem',    // 2px
  1: '0.25rem',       // 4px
  1.5: '0.375rem',    // 6px
  2: '0.5rem',        // 8px
  2.5: '0.625rem',    // 10px
  3: '0.75rem',       // 12px
  3.5: '0.875rem',    // 14px
  4: '1rem',          // 16px
  5: '1.25rem',       // 20px
  6: '1.5rem',        // 24px
  7: '1.75rem',       // 28px
  8: '2rem',          // 32px
  9: '2.25rem',       // 36px
  10: '2.5rem',       // 40px
  11: '2.75rem',      // 44px
  12: '3rem',         // 48px
  14: '3.5rem',       // 56px
  16: '4rem',         // 64px
  18: '4.5rem',       // 72px
  20: '5rem',         // 80px
  24: '6rem',         // 96px
  28: '7rem',         // 112px
  32: '8rem',         // 128px
  36: '9rem',         // 144px
  40: '10rem',        // 160px
  44: '11rem',        // 176px
  48: '12rem',        // 192px
  52: '13rem',        // 208px
  56: '14rem',        // 224px
  60: '15rem',        // 240px
  64: '16rem',        // 256px
  72: '18rem',        // 288px
  80: '20rem',        // 320px
  96: '24rem'         // 384px
} as const;

export const sizes = {
  ...spacing,
  
  // Viewport-based sizes
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '2/6': '33.333333%',
  '3/6': '50%',
  '4/6': '66.666667%',
  '5/6': '83.333333%',
  
  // Viewport units
  'screen-w': '100vw',
  'screen-h': '100vh',
  'screen-min': '100vmin',
  'screen-max': '100vmax',
  
  // Container sizes
  'container-xs': '20rem',      // 320px
  'container-sm': '24rem',      // 384px
  'container-md': '28rem',      // 448px
  'container-lg': '32rem',      // 512px
  'container-xl': '36rem',      // 576px
  'container-2xl': '42rem',     // 672px
  'container-3xl': '48rem',     // 768px
  'container-4xl': '56rem',     // 896px
  'container-5xl': '64rem',     // 1024px
  'container-6xl': '72rem',     // 1152px
  'container-7xl': '80rem',     // 1280px
  
  // Component-specific sizes
  'button-sm': '2rem',          // 32px
  'button-md': '2.5rem',        // 40px
  'button-lg': '3rem',          // 48px
  'button-xl': '3.5rem',        // 56px
  
  'input-sm': '2rem',           // 32px
  'input-md': '2.5rem',         // 40px
  'input-lg': '3rem',           // 48px
  
  'avatar-xs': '1.5rem',        // 24px
  'avatar-sm': '2rem',          // 32px
  'avatar-md': '2.5rem',        // 40px
  'avatar-lg': '3rem',          // 48px
  'avatar-xl': '4rem',          // 64px
  'avatar-2xl': '5rem',         // 80px
  
  // Icon sizes
  'icon-xs': '0.75rem',         // 12px
  'icon-sm': '1rem',            // 16px
  'icon-md': '1.25rem',         // 20px
  'icon-lg': '1.5rem',          // 24px
  'icon-xl': '2rem',            // 32px
  'icon-2xl': '2.5rem'          // 40px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',               // 2px
  DEFAULT: '0.25rem',           // 4px
  md: '0.375rem',               // 6px
  lg: '0.5rem',                 // 8px
  xl: '0.75rem',                // 12px
  '2xl': '1rem',                // 16px
  '3xl': '1.5rem',              // 24px
  full: '9999px',
  
  // Component-specific radius
  'button': '0.5rem',           // 8px
  'card': '1rem',               // 16px
  'modal': '1.5rem',            // 24px
  'input': '0.5rem',            // 8px
  'badge': '9999px',            // pill
  'avatar': '9999px'            // circle
} as const;

export const borderWidth = {
  0: '0',
  DEFAULT: '1px',
  2: '2px',
  4: '4px',
  8: '8px'
} as const;

export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  
  // Component z-indexes
  'dropdown': '1000',
  'sticky': '1020',
  'fixed': '1030',
  'modal-backdrop': '1040',
  'modal': '1050',
  'popover': '1060',
  'tooltip': '1070',
  'toast': '1080'
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Grid system
export const grid = {
  columns: {
    1: 'repeat(1, minmax(0, 1fr))',
    2: 'repeat(2, minmax(0, 1fr))',
    3: 'repeat(3, minmax(0, 1fr))',
    4: 'repeat(4, minmax(0, 1fr))',
    5: 'repeat(5, minmax(0, 1fr))',
    6: 'repeat(6, minmax(0, 1fr))',
    7: 'repeat(7, minmax(0, 1fr))',
    8: 'repeat(8, minmax(0, 1fr))',
    9: 'repeat(9, minmax(0, 1fr))',
    10: 'repeat(10, minmax(0, 1fr))',
    11: 'repeat(11, minmax(0, 1fr))',
    12: 'repeat(12, minmax(0, 1fr))'
  },
  span: {
    1: 'span 1 / span 1',
    2: 'span 2 / span 2',
    3: 'span 3 / span 3',
    4: 'span 4 / span 4',
    5: 'span 5 / span 5',
    6: 'span 6 / span 6',
    7: 'span 7 / span 7',
    8: 'span 8 / span 8',
    9: 'span 9 / span 9',
    10: 'span 10 / span 10',
    11: 'span 11 / span 11',
    12: 'span 12 / span 12',
    full: '1 / -1'
  }
} as const;

// Layout utilities
export const layout = {
  container: {
    center: true,
    padding: {
      DEFAULT: '1rem',
      sm: '2rem',
      lg: '4rem',
      xl: '5rem',
      '2xl': '6rem'
    }
  },
  
  // Common layout patterns
  stack: {
    xs: spacing[2],    // 8px
    sm: spacing[4],    // 16px
    md: spacing[6],    // 24px
    lg: spacing[8],    // 32px
    xl: spacing[12]    // 48px
  },
  
  inline: {
    xs: spacing[1],    // 4px
    sm: spacing[2],    // 8px
    md: spacing[3],    // 12px
    lg: spacing[4],    // 16px
    xl: spacing[6]     // 24px
  }
} as const;

// Shadow tokens
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Glassmorphism shadows
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
  'glass-lg': '0 16px 64px 0 rgba(31, 38, 135, 0.5)',
  
  // Colored shadows
  'primary': '0 10px 15px -3px rgba(99, 102, 241, 0.3), 0 4px 6px -2px rgba(99, 102, 241, 0.15)',
  'secondary': '0 10px 15px -3px rgba(217, 70, 239, 0.3), 0 4px 6px -2px rgba(217, 70, 239, 0.15)',
  'success': '0 10px 15px -3px rgba(34, 197, 94, 0.3), 0 4px 6px -2px rgba(34, 197, 94, 0.15)',
  'warning': '0 10px 15px -3px rgba(245, 158, 11, 0.3), 0 4px 6px -2px rgba(245, 158, 11, 0.15)',
  'danger': '0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.15)'
} as const;

// CSS Custom Properties Generator
export const generateLayoutCSS = () => {
  const css = [];
  
  // Spacing
  for (const [name, value] of Object.entries(spacing)) {
    css.push(`--spacing-${name}: ${value};`);
  }
  
  // Border radius
  for (const [name, value] of Object.entries(borderRadius)) {
    css.push(`--radius-${name}: ${value};`);
  }
  
  // Shadows
  for (const [name, value] of Object.entries(shadows)) {
    css.push(`--shadow-${name}: ${value};`);
  }
  
  // Z-index
  for (const [name, value] of Object.entries(zIndex)) {
    css.push(`--z-${name}: ${value};`);
  }
  
  return css.join('\n  ');
};

export type SpacingKey = keyof typeof spacing;
export type SizeKey = keyof typeof sizes;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
export type ZIndexKey = keyof typeof zIndex;
export type BreakpointKey = keyof typeof breakpoints;
