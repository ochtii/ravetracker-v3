/**
 * RaveTracker v3.0 Design System - Motion & Animation Tokens
 * =========================================================
 * Produktionsreife Animations-System für UI/UX
 */

export const motion = {
  // Easing Functions
  easing: {
    // Standard easing curves
    linear: 'linear',
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    
    // Custom cubic-bezier curves
    'ease-in-sine': 'cubic-bezier(0.12, 0, 0.39, 0)',
    'ease-out-sine': 'cubic-bezier(0.61, 1, 0.88, 1)',
    'ease-in-out-sine': 'cubic-bezier(0.37, 0, 0.63, 1)',
    
    'ease-in-quad': 'cubic-bezier(0.11, 0, 0.5, 0)',
    'ease-out-quad': 'cubic-bezier(0.5, 1, 0.89, 1)',
    'ease-in-out-quad': 'cubic-bezier(0.45, 0, 0.55, 1)',
    
    'ease-in-cubic': 'cubic-bezier(0.32, 0, 0.67, 0)',
    'ease-out-cubic': 'cubic-bezier(0.33, 1, 0.68, 1)',
    'ease-in-out-cubic': 'cubic-bezier(0.65, 0, 0.35, 1)',
    
    'ease-in-quart': 'cubic-bezier(0.5, 0, 0.75, 0)',
    'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
    'ease-in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
    
    'ease-in-expo': 'cubic-bezier(0.7, 0, 0.84, 0)',
    'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
    'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
    
    'ease-in-back': 'cubic-bezier(0.36, 0, 0.66, -0.56)',
    'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'ease-in-out-back': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    
    // Rave-specific easing
    'rave-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'rave-elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    'rave-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },

  // Duration Scale
  duration: {
    'instant': '0ms',
    'fast': '100ms',
    'normal': '200ms',
    'slow': '300ms',
    'slower': '500ms',
    'slowest': '1000ms',
    
    // Component-specific durations
    'tooltip': '100ms',
    'dropdown': '200ms',
    'modal': '300ms',
    'page': '500ms',
    'loading': '1000ms'
  },

  // Delay Scale
  delay: {
    'none': '0ms',
    'short': '50ms',
    'medium': '100ms',
    'long': '200ms',
    'longer': '300ms'
  },

  // Transition Presets
  transitions: {
    // Basic transitions
    'all': 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'colors': 'color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'opacity': 'opacity 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'shadow': 'box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'transform': 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    
    // Interactive transitions
    'button': 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'button-hover': 'transform 100ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'input': 'border-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'card': 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    
    // Glassmorphism transitions
    'glass': 'backdrop-filter 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'glass-hover': 'backdrop-filter 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },

  // Animation Keyframes
  keyframes: {
    // Fade animations
    'fade-in': {
      from: { opacity: '0' },
      to: { opacity: '1' }
    },
    'fade-out': {
      from: { opacity: '1' },
      to: { opacity: '0' }
    },
    'fade-in-up': {
      from: { opacity: '0', transform: 'translateY(10px)' },
      to: { opacity: '1', transform: 'translateY(0)' }
    },
    'fade-in-down': {
      from: { opacity: '0', transform: 'translateY(-10px)' },
      to: { opacity: '1', transform: 'translateY(0)' }
    },
    'fade-in-left': {
      from: { opacity: '0', transform: 'translateX(-10px)' },
      to: { opacity: '1', transform: 'translateX(0)' }
    },
    'fade-in-right': {
      from: { opacity: '0', transform: 'translateX(10px)' },
      to: { opacity: '1', transform: 'translateX(0)' }
    },

    // Scale animations
    'scale-in': {
      from: { opacity: '0', transform: 'scale(0.95)' },
      to: { opacity: '1', transform: 'scale(1)' }
    },
    'scale-out': {
      from: { opacity: '1', transform: 'scale(1)' },
      to: { opacity: '0', transform: 'scale(0.95)' }
    },

    // Slide animations
    'slide-in-up': {
      from: { transform: 'translateY(100%)' },
      to: { transform: 'translateY(0)' }
    },
    'slide-in-down': {
      from: { transform: 'translateY(-100%)' },
      to: { transform: 'translateY(0)' }
    },
    'slide-in-left': {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0)' }
    },
    'slide-in-right': {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' }
    },

    // Rotate animations
    'spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    },
    'spin-reverse': {
      from: { transform: 'rotate(360deg)' },
      to: { transform: 'rotate(0deg)' }
    },

    // Bounce animations
    'bounce': {
      '0%, 100%': { transform: 'translateY(-25%)', 'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)' },
      '50%': { transform: 'translateY(0)', 'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)' }
    },
    'bounce-in': {
      '0%': { opacity: '0', transform: 'scale(0.3)' },
      '50%': { opacity: '1', transform: 'scale(1.1)' },
      '70%': { transform: 'scale(0.9)' },
      '100%': { opacity: '1', transform: 'scale(1)' }
    },

    // Pulse animations
    'pulse': {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' }
    },
    'pulse-scale': {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' }
    },

    // Shake animation
    'shake': {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' }
    },

    // Rave-specific animations
    'rave-glow': {
      '0%, 100%': { 'box-shadow': '0 0 20px rgba(99, 102, 241, 0.5)' },
      '50%': { 'box-shadow': '0 0 40px rgba(99, 102, 241, 0.8), 0 0 60px rgba(217, 70, 239, 0.4)' }
    },
    'rave-float': {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-10px)' }
    },
    'rave-rainbow': {
      '0%': { 'background-position': '0% 50%' },
      '50%': { 'background-position': '100% 50%' },
      '100%': { 'background-position': '0% 50%' }
    }
  },

  // Animation Presets
  animations: {
    // Entrance animations
    'enter-fade': 'fade-in 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'enter-scale': 'scale-in 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'enter-slide-up': 'slide-in-up 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'enter-bounce': 'bounce-in 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    
    // Exit animations
    'exit-fade': 'fade-out 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'exit-scale': 'scale-out 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    
    // Loading animations
    'spin': 'spin 1s linear infinite',
    'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    'bounce': 'bounce 1s infinite',
    
    // Interactive animations
    'hover-float': 'rave-float 2s ease-in-out infinite',
    'hover-glow': 'rave-glow 2s ease-in-out infinite',
    'shake': 'shake 0.5s ease-in-out',
    
    // Background animations
    'rainbow': 'rave-rainbow 3s ease infinite'
  },

  // Reduced motion alternatives
  reducedMotion: {
    'enter-fade': 'opacity 0ms',
    'enter-scale': 'opacity 0ms',
    'enter-slide-up': 'opacity 0ms',
    'exit-fade': 'opacity 0ms',
    'exit-scale': 'opacity 0ms',
    'spin': 'opacity 0ms',
    'pulse': 'opacity 0ms',
    'bounce': 'opacity 0ms'
  }
} as const;

// Utility functions
export const createTransition = (
  property: string | string[],
  duration: keyof typeof motion.duration = 'normal',
  easing: keyof typeof motion.easing = 'rave-smooth',
  delay: keyof typeof motion.delay = 'none'
): string => {
  const properties = Array.isArray(property) ? property : [property];
  const durationValue = motion.duration[duration];
  const easingValue = motion.easing[easing];
  const delayValue = motion.delay[delay];
  
  return properties
    .map(prop => `${prop} ${durationValue} ${easingValue} ${delayValue}`)
    .join(', ');
};

export const createAnimation = (
  keyframe: keyof typeof motion.keyframes,
  duration: keyof typeof motion.duration = 'normal',
  easing: keyof typeof motion.easing = 'rave-smooth',
  iteration: number | 'infinite' = 1,
  delay: keyof typeof motion.delay = 'none'
): string => {
  const durationValue = motion.duration[duration];
  const easingValue = motion.easing[easing];
  const delayValue = motion.delay[delay];
  
  return `${keyframe} ${durationValue} ${easingValue} ${delayValue} ${iteration}`;
};

// CSS Custom Properties Generator
export const generateMotionCSS = () => {
  const css = [];
  
  // Durations
  for (const [name, value] of Object.entries(motion.duration)) {
    css.push(`--duration-${name}: ${value};`);
  }
  
  // Delays
  for (const [name, value] of Object.entries(motion.delay)) {
    css.push(`--delay-${name}: ${value};`);
  }
  
  // Easing
  for (const [name, value] of Object.entries(motion.easing)) {
    css.push(`--easing-${name}: ${value};`);
  }
  
  // Transitions
  for (const [name, value] of Object.entries(motion.transitions)) {
    css.push(`--transition-${name}: ${value};`);
  }
  
  return css.join('\n  ');
};

// Generate keyframes CSS
export const generateKeyframesCSS = () => {
  let css = '';
  
  for (const [name, keyframe] of Object.entries(motion.keyframes)) {
    css += `@keyframes ${name} {\n`;
    
    for (const [key, styles] of Object.entries(keyframe)) {
      css += `  ${key} {\n`;
      
      if (typeof styles === 'object') {
        for (const [prop, value] of Object.entries(styles)) {
          css += `    ${prop}: ${value};\n`;
        }
      }
      
      css += `  }\n`;
    }
    
    css += `}\n\n`;
  }
  
  return css;
};

export type EasingKey = keyof typeof motion.easing;
export type DurationKey = keyof typeof motion.duration;
export type DelayKey = keyof typeof motion.delay;
export type TransitionKey = keyof typeof motion.transitions;
export type KeyframeKey = keyof typeof motion.keyframes;
export type AnimationKey = keyof typeof motion.animations;
