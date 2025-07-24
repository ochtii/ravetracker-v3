/**
 * RaveTracker v3.0 Design System - Typography Tokens
 * =================================================
 * Produktionsreife Typographie mit mehreren Font-Stacks
 */

export const typography = {
  // Font Families
  fonts: {
    display: [
      'Inter Display',
      'SF Pro Display',
      '-apple-system',
      'BlinkMacSystemFont',
      'system-ui',
      'sans-serif'
    ],
    body: [
      'Inter',
      'SF Pro Text',
      '-apple-system',
      'BlinkMacSystemFont',
      'system-ui',
      'sans-serif'
    ],
    mono: [
      'SF Mono',
      'Monaco',
      'Inconsolata',
      'Roboto Mono',
      'Consolas',
      'monospace'
    ],
    brand: [
      'Space Grotesk',
      'Inter Display',
      'system-ui',
      'sans-serif'
    ]
  },

  // Font Sizes (rem-based)
  sizes: {
    '2xs': '0.625rem',   // 10px
    'xs': '0.75rem',     // 12px
    'sm': '0.875rem',    // 14px
    'base': '1rem',      // 16px
    'lg': '1.125rem',    // 18px
    'xl': '1.25rem',     // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
    '6xl': '3.75rem',    // 60px
    '7xl': '4.5rem',     // 72px
    '8xl': '6rem',       // 96px
    '9xl': '8rem'        // 128px
  },

  // Font Weights
  weights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  // Line Heights
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  },

  // Text Transforms
  textTransform: {
    none: 'none',
    capitalize: 'capitalize',
    uppercase: 'uppercase',
    lowercase: 'lowercase'
  },

  // Predefined Text Styles
  styles: {
    // Display Styles
    'display-2xl': {
      fontSize: '4.5rem',
      lineHeight: '1.1',
      fontWeight: '800',
      letterSpacing: '-0.025em',
      fontFamily: 'display'
    },
    'display-xl': {
      fontSize: '3.75rem',
      lineHeight: '1.1',
      fontWeight: '800',
      letterSpacing: '-0.025em',
      fontFamily: 'display'
    },
    'display-lg': {
      fontSize: '3rem',
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.025em',
      fontFamily: 'display'
    },
    'display-md': {
      fontSize: '2.25rem',
      lineHeight: '1.25',
      fontWeight: '700',
      letterSpacing: '-0.025em',
      fontFamily: 'display'
    },
    'display-sm': {
      fontSize: '1.875rem',
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '-0.025em',
      fontFamily: 'display'
    },

    // Heading Styles
    'heading-2xl': {
      fontSize: '1.5rem',
      lineHeight: '1.33',
      fontWeight: '700',
      letterSpacing: '-0.025em',
      fontFamily: 'body'
    },
    'heading-xl': {
      fontSize: '1.25rem',
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '-0.025em',
      fontFamily: 'body'
    },
    'heading-lg': {
      fontSize: '1.125rem',
      lineHeight: '1.44',
      fontWeight: '600',
      letterSpacing: '-0.025em',
      fontFamily: 'body'
    },
    'heading-md': {
      fontSize: '1rem',
      lineHeight: '1.5',
      fontWeight: '600',
      letterSpacing: '0em',
      fontFamily: 'body'
    },
    'heading-sm': {
      fontSize: '0.875rem',
      lineHeight: '1.43',
      fontWeight: '600',
      letterSpacing: '0em',
      fontFamily: 'body'
    },

    // Body Styles
    'body-2xl': {
      fontSize: '1.5rem',
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'body'
    },
    'body-xl': {
      fontSize: '1.25rem',
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'body'
    },
    'body-lg': {
      fontSize: '1.125rem',
      lineHeight: '1.56',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'body'
    },
    'body-md': {
      fontSize: '1rem',
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'body'
    },
    'body-sm': {
      fontSize: '0.875rem',
      lineHeight: '1.43',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'body'
    },
    'body-xs': {
      fontSize: '0.75rem',
      lineHeight: '1.33',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'body'
    },

    // Label Styles
    'label-lg': {
      fontSize: '1rem',
      lineHeight: '1.5',
      fontWeight: '500',
      letterSpacing: '0em',
      fontFamily: 'body'
    },
    'label-md': {
      fontSize: '0.875rem',
      lineHeight: '1.43',
      fontWeight: '500',
      letterSpacing: '0em',
      fontFamily: 'body'
    },
    'label-sm': {
      fontSize: '0.75rem',
      lineHeight: '1.33',
      fontWeight: '500',
      letterSpacing: '0em',
      fontFamily: 'body'
    },

    // Code Styles
    'code-lg': {
      fontSize: '1rem',
      lineHeight: '1.5',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'mono'
    },
    'code-md': {
      fontSize: '0.875rem',
      lineHeight: '1.43',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'mono'
    },
    'code-sm': {
      fontSize: '0.75rem',
      lineHeight: '1.33',
      fontWeight: '400',
      letterSpacing: '0em',
      fontFamily: 'mono'
    },

    // Brand Styles
    'brand-hero': {
      fontSize: '6rem',
      lineHeight: '1',
      fontWeight: '900',
      letterSpacing: '-0.05em',
      fontFamily: 'brand',
      textTransform: 'uppercase'
    },
    'brand-title': {
      fontSize: '3rem',
      lineHeight: '1.1',
      fontWeight: '800',
      letterSpacing: '-0.025em',
      fontFamily: 'brand'
    },
    'brand-subtitle': {
      fontSize: '1.5rem',
      lineHeight: '1.33',
      fontWeight: '600',
      letterSpacing: '0.025em',
      fontFamily: 'brand',
      textTransform: 'uppercase'
    }
  }
} as const;

// Typography Utilities
export const getFontFamily = (family: keyof typeof typography.fonts): string => {
  return typography.fonts[family].join(', ');
};

export const getTextStyle = (style: keyof typeof typography.styles) => {
  const styleConfig = typography.styles[style];
  return {
    ...styleConfig,
    fontFamily: getFontFamily(styleConfig.fontFamily as keyof typeof typography.fonts)
  };
};

// CSS Custom Properties Generator
export const generateTypographyCSS = () => {
  const css = [];
  
  // Font sizes
  for (const [name, size] of Object.entries(typography.sizes)) {
    css.push(`--font-size-${name}: ${size};`);
  }
  
  // Font weights
  for (const [name, weight] of Object.entries(typography.weights)) {
    css.push(`--font-weight-${name}: ${weight};`);
  }
  
  // Line heights
  for (const [name, height] of Object.entries(typography.lineHeights)) {
    css.push(`--line-height-${name}: ${height};`);
  }
  
  // Letter spacing
  for (const [name, spacing] of Object.entries(typography.letterSpacing)) {
    css.push(`--letter-spacing-${name}: ${spacing};`);
  }
  
  // Font families
  for (const [name, family] of Object.entries(typography.fonts)) {
    css.push(`--font-family-${name}: ${family.join(', ')};`);
  }
  
  return css.join('\n  ');
};

export type TypographyStyle = keyof typeof typography.styles;
export type FontFamily = keyof typeof typography.fonts;
export type FontSize = keyof typeof typography.sizes;
export type FontWeight = keyof typeof typography.weights;
