/**
 * RaveTracker v3.0 Design System - Tailwind CSS Configuration
 * ==========================================================
 * Produktionsreife Tailwind-Konfiguration mit Design System Integration
 */

import type { Config } from 'tailwindcss';
import { colors } from './src/lib/design-system/tokens/colors.js';
import { typography } from './src/lib/design-system/tokens/typography.js';
import { spacing, sizes, borderRadius, shadows, zIndex } from './src/lib/design-system/tokens/layout.js';
import { motion } from './src/lib/design-system/tokens/motion.js';

const config: Config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/lib/design-system/**/*.{js,ts,svelte}'
  ],
  
  darkMode: ['class', '[data-theme="dark"]'],
  
  theme: {
    extend: {
      // Colors from Design System
      colors: {
        // Brand colors
        primary: colors.brand.primary,
        secondary: colors.brand.secondary,
        accent: colors.brand.accent,
        
        // Semantic colors
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        danger: colors.semantic.danger,
        info: colors.semantic.info,
        
        // Dark theme colors
        'dark-bg': colors.dark.bg,
        'dark-text': colors.dark.text,
        'dark-border': colors.dark.border,
        
        // Light theme colors
        'light-bg': colors.light.bg,
        'light-text': colors.light.text,
        'light-border': colors.light.border,
        
        // Glass colors for utilities
        'glass-white': {
          10: 'rgba(255, 255, 255, 0.1)',
          20: 'rgba(255, 255, 255, 0.2)',
          30: 'rgba(255, 255, 255, 0.3)',
          40: 'rgba(255, 255, 255, 0.4)',
          50: 'rgba(255, 255, 255, 0.5)'
        },
        'glass-black': {
          10: 'rgba(0, 0, 0, 0.1)',
          20: 'rgba(0, 0, 0, 0.2)',
          30: 'rgba(0, 0, 0, 0.3)',
          40: 'rgba(0, 0, 0, 0.4)',
          50: 'rgba(0, 0, 0, 0.5)'
        }
      },
      
      // Typography from Design System
      fontFamily: {
        display: [...typography.fonts.display],
        body: [...typography.fonts.body],
        mono: [...typography.fonts.mono],
        brand: [...typography.fonts.brand]
      },
      
      fontSize: typography.sizes,
      fontWeight: typography.weights,
      lineHeight: typography.lineHeights,
      letterSpacing: typography.letterSpacing,
      
      // Spacing from Design System
      spacing: spacing,
      
      // Sizes from Design System
      width: sizes,
      height: sizes,
      maxWidth: sizes,
      maxHeight: sizes,
      minWidth: sizes,
      minHeight: sizes,
      
      // Border Radius from Design System
      borderRadius: borderRadius,
      
      // Shadows from Design System
      boxShadow: shadows,
      
      // Z-Index from Design System
      zIndex: zIndex,
      
      // Background Images (Gradients)
      backgroundImage: {
        'gradient-rave': colors.gradients.rave,
        'gradient-neon': colors.gradients.neon,
        'gradient-cyber': colors.gradients.cyber,
        'gradient-sunset': colors.gradients.sunset,
        'gradient-ocean': colors.gradients.ocean,
        'gradient-matrix': colors.gradients.matrix,
        
        // Glass gradients
        'glass-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.1) 100%)'
      },
      
      // Animation & Transitions from Design System
      transitionDuration: motion.duration,
      transitionDelay: motion.delay,
      transitionTimingFunction: motion.easing,
      
      // Animation keyframes
      keyframes: motion.keyframes,
      animation: motion.animations,
      
      // Backdrop Blur for Glassmorphism
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px'
      },
      
      // Custom Glass Blur Values
      blur: {
        'glass-sm': '8px',
        'glass': '16px',
        'glass-lg': '24px',
        'glass-xl': '32px'
      },
      
      // Custom Saturate Values for Glass Effect
      saturate: {
        '125': '1.25',
        '150': '1.5',
        '175': '1.75',
        '200': '2'
      },
      
      // Container Configuration
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem'
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px'
        }
      },
      
      // Grid Template Configuration
      gridTemplateColumns: {
        'rave': 'repeat(auto-fit, minmax(300px, 1fr))',
        'cards': 'repeat(auto-fill, minmax(280px, 1fr))',
        'sidebar': '240px 1fr',
        'dashboard': '280px 1fr 320px'
      },
      
      // Aspect Ratio
      aspectRatio: {
        'rave': '16 / 9',
        'square': '1 / 1',
        'portrait': '3 / 4',
        'landscape': '4 / 3'
      },
      
      // Custom breakpoints for media queries
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px'
      }
    }
  },
  
  plugins: [
    // Custom Plugin for Glassmorphism Utilities
    function({ addUtilities, addComponents, theme }) {
      // Glassmorphism Utilities
      addUtilities({
        '.glass-light': {
          'background-color': 'rgba(255, 255, 255, 0.25)',
          'backdrop-filter': 'blur(10px) saturate(180%)',
          'border': '1px solid rgba(255, 255, 255, 0.18)',
          'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        },
        '.glass-medium': {
          'background-color': 'rgba(255, 255, 255, 0.18)',
          'backdrop-filter': 'blur(15px) saturate(180%)',
          'border': '1px solid rgba(255, 255, 255, 0.15)',
          'box-shadow': '0 16px 64px 0 rgba(31, 38, 135, 0.5)'
        },
        '.glass-heavy': {
          'background-color': 'rgba(255, 255, 255, 0.12)',
          'backdrop-filter': 'blur(20px) saturate(200%)',
          'border': '1px solid rgba(255, 255, 255, 0.12)',
          'box-shadow': '0 16px 64px 0 rgba(31, 38, 135, 0.5)'
        },
        '.glass-dark': {
          'background-color': 'rgba(0, 0, 0, 0.25)',
          'backdrop-filter': 'blur(10px) saturate(180%)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        },
        
        // Text Gradients
        '.text-gradient-rave': {
          'background': colors.gradients.rave,
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent'
        },
        '.text-gradient-neon': {
          'background': colors.gradients.neon,
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent'
        },
        '.text-gradient-cyber': {
          'background': colors.gradients.cyber,
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent'
        },
        
        // Rave-specific utilities
        '.glow-primary': {
          'box-shadow': `0 0 20px ${theme('colors.primary.500')}40, 0 0 40px ${theme('colors.primary.500')}20`
        },
        '.glow-secondary': {
          'box-shadow': `0 0 20px ${theme('colors.secondary.500')}40, 0 0 40px ${theme('colors.secondary.500')}20`
        },
        '.glow-accent': {
          'box-shadow': `0 0 20px ${theme('colors.accent.500')}40, 0 0 40px ${theme('colors.accent.500')}20`
        }
      });
      
      // Component Base Classes
      addComponents({
        '.btn-glass': {
          '@apply inline-flex items-center justify-center px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 bg-white/10 text-white font-medium transition-all duration-200 hover:bg-white/15 hover:border-white/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500/50': {}
        },
        '.card-glass': {
          '@apply backdrop-blur-md border border-white/20 bg-white/10 rounded-lg shadow-glass': {}
        },
        '.input-glass': {
          '@apply w-full rounded-md backdrop-blur-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50': {}
        }
      });
    },
    
    // Typography Plugin
    function({ addUtilities }) {
      const textStyles = {};
      
      for (const [name, style] of Object.entries(typography.styles)) {
        textStyles[`.text-${name}`] = {
          'font-size': style.fontSize,
          'line-height': style.lineHeight,
          'font-weight': style.fontWeight,
          'letter-spacing': style.letterSpacing,
          'font-family': typography.fonts[style.fontFamily as keyof typeof typography.fonts].join(', ')
        };
      }
      
      addUtilities(textStyles);
    }
  ]
};

export default config;
