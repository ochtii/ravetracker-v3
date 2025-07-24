/**
 * RaveTracker v3.0 Design System - Color Tokens
 * ============================================
 * Produktionsreife Farbpalette mit Glassmorphism-Support
 */

export const colors = {
  // Brand Colors - Rave-inspirierte Primärfarben
  brand: {
    primary: {
      50: '#f0f4ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Hauptfarbe
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
      500: '#d946ef', // Neon Pink
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e'
    },
    accent: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6', // Cyan/Teal
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e'
    }
  },

  // Glassmorphism Colors
  glass: {
    white: {
      10: 'rgba(255, 255, 255, 0.1)',
      20: 'rgba(255, 255, 255, 0.2)',
      30: 'rgba(255, 255, 255, 0.3)',
      40: 'rgba(255, 255, 255, 0.4)',
      50: 'rgba(255, 255, 255, 0.5)'
    },
    black: {
      10: 'rgba(0, 0, 0, 0.1)',
      20: 'rgba(0, 0, 0, 0.2)',
      30: 'rgba(0, 0, 0, 0.3)',
      40: 'rgba(0, 0, 0, 0.4)',
      50: 'rgba(0, 0, 0, 0.5)'
    },
    primary: {
      10: 'rgba(99, 102, 241, 0.1)',
      20: 'rgba(99, 102, 241, 0.2)',
      30: 'rgba(99, 102, 241, 0.3)',
      40: 'rgba(99, 102, 241, 0.4)',
      50: 'rgba(99, 102, 241, 0.5)'
    }
  },

  // Semantic Colors
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f'
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    }
  },

  // Background Gradients
  gradients: {
    rave: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    neon: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    cyber: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ocean: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    matrix: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)'
  },

  // Dark Theme
  dark: {
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
  },

  // Light Theme
  light: {
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
  }
} as const;

// Color Utilities
export const getColorValue = (colorPath: string, opacity?: number) => {
  const keys = colorPath.split('.');
  let value: any = colors;
  
  for (const key of keys) {
    value = value[key];
    if (!value) return null;
  }
  
  if (opacity && typeof value === 'string' && value.startsWith('#')) {
    // Convert hex to rgba with opacity
    const hex = value.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return value;
};

export type ColorKey = keyof typeof colors;
export type BrandColorKey = keyof typeof colors.brand;
export type SemanticColorKey = keyof typeof colors.semantic;
