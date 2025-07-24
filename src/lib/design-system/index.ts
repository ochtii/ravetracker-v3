/**
 * RaveTracker v3.0 Design System - Main Index
 * ===========================================
 * Zentraler Export für das komplette Design System
 */

// Design Tokens
export { colors, getColorValue, type ColorKey, type BrandColorKey, type SemanticColorKey } from './tokens/colors.js';
export { 
  typography, 
  getFontFamily, 
  getTextStyle, 
  generateTypographyCSS,
  type TypographyStyle, 
  type FontFamily, 
  type FontSize, 
  type FontWeight 
} from './tokens/typography.js';
export { 
  spacing, 
  sizes, 
  borderRadius, 
  borderWidth, 
  zIndex, 
  breakpoints, 
  grid, 
  layout, 
  shadows,
  generateLayoutCSS,
  type SpacingKey, 
  type SizeKey, 
  type BorderRadiusKey, 
  type ShadowKey, 
  type ZIndexKey, 
  type BreakpointKey 
} from './tokens/layout.js';
export { 
  motion, 
  createTransition, 
  createAnimation, 
  generateMotionCSS, 
  generateKeyframesCSS,
  type EasingKey, 
  type DurationKey, 
  type DelayKey, 
  type TransitionKey, 
  type KeyframeKey, 
  type AnimationKey 
} from './tokens/motion.js';

// Design System Configuration
export const designSystem = {
  version: '3.0.0',
  name: 'RaveTracker Design System',
  description: 'Produktionsreifes Design System mit Glassmorphism-Ästhetik',
  
  // Theme Configuration
  theme: {
    defaultMode: 'dark' as const,
    colorMode: {
      light: 'light',
      dark: 'dark',
      auto: 'auto'
    },
    
    // Breakpoint Configuration
    responsive: {
      mobile: '640px',
      tablet: '768px',
      desktop: '1024px',
      wide: '1280px'
    },
    
    // Animation Preferences
    motion: {
      reducedMotion: false,
      defaultDuration: 'normal' as const,
      defaultEasing: 'rave-smooth' as const
    }
  },
  
  // Component Categories
  components: {
    layout: ['Container', 'Grid', 'Stack', 'Flex'],
    navigation: ['Header', 'Sidebar', 'Breadcrumb', 'Pagination'],
    forms: ['Input', 'Button', 'Select', 'Checkbox', 'Radio'],
    feedback: ['Alert', 'Toast', 'Modal', 'Tooltip'],
    display: ['Card', 'Badge', 'Avatar', 'Divider'],
    media: ['Image', 'Video', 'Audio', 'Icon']
  },
  
  // Glassmorphism Presets
  glass: {
    // Light glass effects
    light: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdrop: 'blur(10px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
    },
    
    // Medium glass effects
    medium: {
      background: 'rgba(255, 255, 255, 0.18)',
      backdrop: 'blur(15px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      shadow: '0 16px 64px 0 rgba(31, 38, 135, 0.5)'
    },
    
    // Heavy glass effects
    heavy: {
      background: 'rgba(255, 255, 255, 0.12)',
      backdrop: 'blur(20px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      shadow: '0 16px 64px 0 rgba(31, 38, 135, 0.5)'
    },
    
    // Dark glass effects
    dark: {
      background: 'rgba(0, 0, 0, 0.25)',
      backdrop: 'blur(10px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
    }
  }
} as const;

// CSS Custom Properties Generator
export const generateDesignSystemCSS = () => {
  return `
  :root {
    /* Design System Metadata */
    --ds-version: "${designSystem.version}";
    --ds-name: "${designSystem.name}";
    
    /* Color Tokens */
    ${generateColorCSS()}
    
    /* Typography Tokens */
    ${generateTypographyCSS()}
    
    /* Layout Tokens */
    ${generateLayoutCSS()}
    
    /* Motion Tokens */
    ${generateMotionCSS()}
    
    /* Glassmorphism Presets */
    ${generateGlassCSS()}
  }
  
  /* Keyframe Animations */
  ${generateKeyframesCSS()}
  
  /* Dark Theme */
  [data-theme="dark"] {
    ${generateDarkThemeCSS()}
  }
  
  /* Light Theme */
  [data-theme="light"] {
    ${generateLightThemeCSS()}
  }
  
  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    ${generateReducedMotionCSS()}
  }
  `;
};

// Helper functions for CSS generation
const generateColorCSS = () => {
  const css = [];
  
  // Brand colors
  const brandColors = {
    primary: {
      50: '#f0f4ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b'
    },
    secondary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e'
    }
  };
  
  for (const [category, shades] of Object.entries(brandColors)) {
    for (const [shade, value] of Object.entries(shades)) {
      css.push(`--color-${category}-${shade}: ${value};`);
    }
  }
  
  // Semantic colors
  const semanticColors = {
    success: { 500: '#22c55e' },
    warning: { 500: '#f59e0b' },
    danger: { 500: '#ef4444' },
    info: { 500: '#3b82f6' }
  };
  
  for (const [category, shades] of Object.entries(semanticColors)) {
    for (const [shade, value] of Object.entries(shades)) {
      css.push(`--color-${category}-${shade}: ${value};`);
    }
  }
  
  // Glass colors
  const glassColors = {
    white: {
      10: 'rgba(255, 255, 255, 0.1)',
      20: 'rgba(255, 255, 255, 0.2)',
      30: 'rgba(255, 255, 255, 0.3)'
    },
    black: {
      10: 'rgba(0, 0, 0, 0.1)',
      20: 'rgba(0, 0, 0, 0.2)',
      30: 'rgba(0, 0, 0, 0.3)'
    }
  };
  
  for (const [category, opacities] of Object.entries(glassColors)) {
    for (const [opacity, value] of Object.entries(opacities)) {
      css.push(`--color-glass-${category}-${opacity}: ${value};`);
    }
  }
  
  // Gradients
  const gradients = {
    rave: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    neon: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    cyber: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  };
  
  for (const [name, value] of Object.entries(gradients)) {
    css.push(`--gradient-${name}: ${value};`);
  }
  
  return css.join('\n    ');
};

const generateGlassCSS = () => {
  const css = [];
  
  for (const [name, preset] of Object.entries(designSystem.glass)) {
    css.push(`--glass-${name}-bg: ${preset.background};`);
    css.push(`--glass-${name}-backdrop: ${preset.backdrop};`);
    css.push(`--glass-${name}-border: ${preset.border};`);
    css.push(`--glass-${name}-shadow: ${preset.shadow};`);
  }
  
  return css.join('\n    ');
};

const generateDarkThemeCSS = () => {
  const css = [];
  
  const darkColors = {
    bg: {
      primary: '#0f0f0f',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
      glass: 'rgba(15, 15, 15, 0.8)'
    },
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      tertiary: '#737373',
      muted: '#525252'
    },
    border: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      focus: 'rgba(99, 102, 241, 0.5)'
    }
  };
  
  for (const [category, values] of Object.entries(darkColors)) {
    for (const [key, value] of Object.entries(values)) {
      css.push(`--color-${category}-${key}: ${value};`);
    }
  }
  
  return css.join('\n    ');
};

const generateLightThemeCSS = () => {
  const css = [];
  
  const lightColors = {
    bg: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      glass: 'rgba(255, 255, 255, 0.8)'
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      muted: '#94a3b8'
    },
    border: {
      primary: 'rgba(0, 0, 0, 0.1)',
      secondary: 'rgba(0, 0, 0, 0.05)',
      focus: 'rgba(99, 102, 241, 0.5)'
    }
  };
  
  for (const [category, values] of Object.entries(lightColors)) {
    for (const [key, value] of Object.entries(values)) {
      css.push(`--color-${category}-${key}: ${value};`);
    }
  }
  
  return css.join('\n    ');
};

const generateReducedMotionCSS = () => {
  return `
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  `;
};

// Utility Classes Generator
export const generateUtilityClasses = () => {
  return `
  /* Glassmorphism Utility Classes */
  .glass-light {
    background: var(--glass-light-bg);
    backdrop-filter: var(--glass-light-backdrop);
    border: var(--glass-light-border);
    box-shadow: var(--glass-light-shadow);
  }
  
  .glass-medium {
    background: var(--glass-medium-bg);
    backdrop-filter: var(--glass-medium-backdrop);
    border: var(--glass-medium-border);
    box-shadow: var(--glass-medium-shadow);
  }
  
  .glass-heavy {
    background: var(--glass-heavy-bg);
    backdrop-filter: var(--glass-heavy-backdrop);
    border: var(--glass-heavy-border);
    box-shadow: var(--glass-heavy-shadow);
  }
  
  .glass-dark {
    background: var(--glass-dark-bg);
    backdrop-filter: var(--glass-dark-backdrop);
    border: var(--glass-dark-border);
    box-shadow: var(--glass-dark-shadow);
  }
  
  /* Animation Utility Classes */
  .animate-fade-in {
    animation: var(--animation-enter-fade);
  }
  
  .animate-scale-in {
    animation: var(--animation-enter-scale);
  }
  
  .animate-slide-up {
    animation: var(--animation-enter-slide-up);
  }
  
  .animate-bounce {
    animation: var(--animation-bounce);
  }
  
  .animate-pulse {
    animation: var(--animation-pulse);
  }
  
  .animate-spin {
    animation: var(--animation-spin);
  }
  
  /* Gradient Utility Classes */
  .bg-gradient-rave {
    background: var(--gradient-rave);
  }
  
  .bg-gradient-neon {
    background: var(--gradient-neon);
  }
  
  .bg-gradient-cyber {
    background: var(--gradient-cyber);
  }
  
  .bg-gradient-sunset {
    background: var(--gradient-sunset);
  }
  
  .bg-gradient-ocean {
    background: var(--gradient-ocean);
  }
  
  .bg-gradient-matrix {
    background: var(--gradient-matrix);
  }
  `;
};

// Theme Utilities
export const setColorMode = (mode: 'light' | 'dark' | 'auto') => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('color-mode', mode);
  }
};

export const getColorMode = (): 'light' | 'dark' | 'auto' => {
  if (typeof document !== 'undefined') {
    return (localStorage.getItem('color-mode') as 'light' | 'dark' | 'auto') || 'auto';
  }
  return 'auto';
};

export const toggleColorMode = () => {
  const current = getColorMode();
  const next = current === 'light' ? 'dark' : 'light';
  setColorMode(next);
  return next;
};

// Type exports
export type DesignSystemConfig = typeof designSystem;
export type GlassPreset = keyof typeof designSystem.glass;
export type ComponentCategory = keyof typeof designSystem.components;
