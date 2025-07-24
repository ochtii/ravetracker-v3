export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  href?: string
  type?: 'button' | 'submit' | 'reset'
  class?: string
  onclick?: (event: MouseEvent) => void
}

export interface CardProps {
  variant?: 'default' | 'glass' | 'solid' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  class?: string
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  value?: string | number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  label?: string
  hint?: string
  class?: string
  onchange?: (event: Event) => void
  oninput?: (event: Event) => void
}

export interface ModalProps {
  open?: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  backdrop?: 'blur' | 'dark' | 'transparent'
  class?: string
  onclose?: () => void
}

export interface NavigationItem {
  label: string
  href?: string
  icon?: string
  active?: boolean
  children?: NavigationItem[]
  onclick?: () => void
}

export interface NavigationProps {
  items: NavigationItem[]
  variant?: 'horizontal' | 'vertical' | 'mobile'
  class?: string
}

// Color system
export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e'
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
    900: '#701a75'
  },
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'
  },
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    black: 'rgba(0, 0, 0, 0.1)',
    primary: 'rgba(14, 165, 233, 0.1)',
    secondary: 'rgba(217, 70, 239, 0.1)'
  }
}

// Glassmorphism utilities
export const glassmorphism = {
  card: 'backdrop-blur-lg bg-white/10 border border-white/20',
  modal: 'backdrop-blur-xl bg-white/5 border border-white/10',
  button: 'backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20',
  input: 'backdrop-blur-sm bg-white/5 border border-white/10 focus:bg-white/10',
  navigation: 'backdrop-blur-xl bg-white/5 border-b border-white/10'
}

// Animation utilities
export const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  slideUp: 'animate-in slide-in-from-bottom duration-300',
  slideDown: 'animate-out slide-out-to-bottom duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200'
}

// Spacing system
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem'
}

// Typography
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace']
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
  }
}

// Utility functions
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getVariantClasses(variant: string, type: 'button' | 'card' | 'input'): string {
  const variantMap: Record<string, Record<string, string>> = {
    button: {
      primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25',
      secondary: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/25',
      ghost: 'text-white hover:bg-white/10 border border-white/20',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25',
      glass: glassmorphism.button + ' text-white hover:shadow-lg'
    },
    card: {
      default: glassmorphism.card + ' shadow-xl',
      glass: glassmorphism.card + ' shadow-2xl shadow-black/20',
      solid: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg',
      bordered: 'border-2 border-white/30 bg-transparent'
    },
    input: {
      default: glassmorphism.input + ' text-white placeholder-white/60 focus:border-white/30',
      solid: 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
    }
  }

  return variantMap[type]?.[variant] || ''
}

export function getSizeClasses(size: string, type: 'button' | 'input'): string {
  const sizeMap: Record<string, Record<string, string>> = {
    button: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    },
    input: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }
  }

  return sizeMap[type]?.[size] || ''
}
