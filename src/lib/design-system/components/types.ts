/**
 * RaveTracker v3.0 Design System - Glassmorphism Components
 * ========================================================
 * Produktionsreife Glassmorphism-Komponenten für das UI
 */

import type { GlassPreset } from '../index.js';

export interface GlassCardProps {
  variant?: GlassPreset;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hover?: boolean;
  clickable?: boolean;
  as?: 'div' | 'article' | 'section' | 'aside';
}

export interface GlassButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface GlassModalProps {
  open?: boolean;
  variant?: GlassPreset;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  closeOnOverlay?: boolean;
  title?: string;
  className?: string;
}

export interface GlassInputProps {
  value?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  className?: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
}

export interface GlassNavbarProps {
  variant?: GlassPreset;
  sticky?: boolean;
  bordered?: boolean;
  className?: string;
}

export interface GlassDropdownProps {
  trigger?: 'click' | 'hover';
  placement?: 'bottom' | 'top' | 'left' | 'right';
  variant?: GlassPreset;
  className?: string;
  disabled?: boolean;
}

export interface GlassToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface GlassBadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export interface GlassProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

export interface GlassAvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

export interface GlassTabsProps {
  value?: string;
  variant?: 'line' | 'card' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export interface GlassAccordionProps {
  multiple?: boolean;
  variant?: GlassPreset;
  className?: string;
}

export interface GlassSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export interface GlassToggleProps {
  checked?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  label?: string;
}

export interface GlassCheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  label?: string;
}

export interface GlassRadioProps {
  checked?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  label?: string;
  value?: string;
  name?: string;
}

export interface GlassSelectProps {
  value?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
  multiple?: boolean;
  className?: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
}

export interface GlassTextareaProps {
  value?: string;
  placeholder?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  className?: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
}

export interface GlassDatePickerProps {
  value?: Date;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  size?: 'sm' | 'md' | 'lg';
  format?: string;
  placeholder?: string;
  className?: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
}

export interface GlassTimePickerProps {
  value?: string;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  size?: 'sm' | 'md' | 'lg';
  format?: '12' | '24';
  placeholder?: string;
  className?: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
}

export interface GlassColorPickerProps {
  value?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  format?: 'hex' | 'rgb' | 'hsl';
  presets?: string[];
  className?: string;
  label?: string;
}

export interface GlassFileUploadProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSize?: number;
  maxFiles?: number;
  preview?: boolean;
  className?: string;
  label?: string;
  hint?: string;
  errorMessage?: string;
}

export interface GlassPaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  variant?: GlassPreset;
  className?: string;
}

export interface GlassTreeProps {
  data: Array<{
    key: string;
    title: string;
    children?: Array<any>;
    disabled?: boolean;
    checkable?: boolean;
  }>;
  checkable?: boolean;
  multiple?: boolean;
  expandedKeys?: string[];
  checkedKeys?: string[];
  selectedKeys?: string[];
  variant?: GlassPreset;
  className?: string;
}

export interface GlassTransferProps {
  dataSource: Array<{
    key: string;
    title: string;
    description?: string;
    disabled?: boolean;
  }>;
  targetKeys?: string[];
  selectedKeys?: string[];
  searchable?: boolean;
  variant?: GlassPreset;
  className?: string;
}

export interface GlassTimelineProps {
  items: Array<{
    title: string;
    description?: string;
    timestamp?: string;
    icon?: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }>;
  mode?: 'left' | 'alternate' | 'right';
  variant?: GlassPreset;
  className?: string;
}

export interface GlassStepsProps {
  current?: number;
  direction?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  status?: 'wait' | 'process' | 'finish' | 'error';
  items: Array<{
    title: string;
    description?: string;
    icon?: string;
    disabled?: boolean;
  }>;
  variant?: GlassPreset;
  className?: string;
}

export interface GlassCarouselProps {
  autoplay?: boolean;
  duration?: number;
  dots?: boolean;
  arrows?: boolean;
  infinite?: boolean;
  fade?: boolean;
  variant?: GlassPreset;
  className?: string;
}

export interface GlassImageProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  fit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  lazy?: boolean;
  preview?: boolean;
  fallback?: string;
  className?: string;
}

export interface GlassVideoProps {
  src: string;
  poster?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export interface GlassAudioProps {
  src: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  className?: string;
}

// Component Base Classes
export const glassBaseClasses = {
  card: 'rounded-lg backdrop-blur-md border border-white/20 shadow-glass',
  button: 'inline-flex items-center justify-center rounded-md backdrop-blur-md border border-white/20 font-medium transition-all duration-200',
  input: 'w-full rounded-md backdrop-blur-md border border-white/20 bg-white/10 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
  modal: 'fixed inset-0 z-50 flex items-center justify-center p-4',
  dropdown: 'absolute z-50 min-w-48 rounded-md backdrop-blur-md border border-white/20 bg-white/10 shadow-glass',
  navbar: 'w-full backdrop-blur-md border-b border-white/20',
  toast: 'fixed z-50 max-w-sm rounded-md backdrop-blur-md border border-white/20 shadow-glass',
  badge: 'inline-flex items-center rounded-full backdrop-blur-md border border-white/20',
  progress: 'w-full rounded-full overflow-hidden backdrop-blur-md border border-white/20',
  avatar: 'relative inline-flex items-center justify-center rounded-full overflow-hidden backdrop-blur-md border border-white/20',
  tabs: 'w-full',
  accordion: 'w-full space-y-2',
  slider: 'relative w-full',
  toggle: 'relative inline-flex items-center',
  checkbox: 'relative inline-flex items-center',
  radio: 'relative inline-flex items-center',
  select: 'relative w-full',
  textarea: 'w-full rounded-md backdrop-blur-md border border-white/20 bg-white/10 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
  datePicker: 'relative w-full',
  timePicker: 'relative w-full',
  colorPicker: 'relative inline-flex items-center',
  fileUpload: 'relative w-full',
  pagination: 'flex items-center space-x-1',
  tree: 'w-full',
  transfer: 'flex space-x-4',
  timeline: 'relative',
  steps: 'flex',
  carousel: 'relative w-full overflow-hidden',
  image: 'relative overflow-hidden',
  video: 'relative overflow-hidden',
  audio: 'w-full'
} as const;

// Size Classes
export const sizeClasses = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-6 py-3',
  xl: 'text-xl px-8 py-4'
} as const;

// Color Classes
export const colorClasses = {
  primary: 'bg-primary-500/20 border-primary-500/40 text-primary-100',
  secondary: 'bg-secondary-500/20 border-secondary-500/40 text-secondary-100',
  success: 'bg-success-500/20 border-success-500/40 text-success-100',
  warning: 'bg-warning-500/20 border-warning-500/40 text-warning-100',
  error: 'bg-danger-500/20 border-danger-500/40 text-danger-100',
  info: 'bg-info-500/20 border-info-500/40 text-info-100',
  glass: 'bg-white/10 border-white/20 text-white'
} as const;

// Glass Variant Classes
export const glassVariantClasses = {
  light: 'bg-white/25 backdrop-blur-[10px] border-white/18',
  medium: 'bg-white/18 backdrop-blur-[15px] border-white/15',
  heavy: 'bg-white/12 backdrop-blur-[20px] border-white/12',
  dark: 'bg-black/25 backdrop-blur-[10px] border-white/10'
} as const;

// Utility Functions
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getGlassClasses = (variant: GlassPreset = 'medium'): string => {
  return glassVariantClasses[variant];
};

export const getSizeClasses = (size: 'sm' | 'md' | 'lg' | 'xl' = 'md'): string => {
  return sizeClasses[size];
};

export const getColorClasses = (color: keyof typeof colorClasses = 'glass'): string => {
  return colorClasses[color];
};

// Animation Classes
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  scaleIn: 'animate-scale-in',
  slideUp: 'animate-slide-up',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  float: 'animate-float',
  glow: 'animate-glow'
} as const;

// Responsive Classes
export const responsiveClasses = {
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
  '2xl': '2xl:'
} as const;

// Focus Classes
export const focusClasses = {
  default: 'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
  error: 'focus:outline-none focus:ring-2 focus:ring-danger-500/50 focus:border-danger-500/50',
  success: 'focus:outline-none focus:ring-2 focus:ring-success-500/50 focus:border-success-500/50'
} as const;

// Hover Classes
export const hoverClasses = {
  default: 'hover:bg-white/20 hover:border-white/30',
  primary: 'hover:bg-primary-500/30 hover:border-primary-500/50',
  secondary: 'hover:bg-secondary-500/30 hover:border-secondary-500/50',
  ghost: 'hover:bg-white/10'
} as const;

// Type exports for component props
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';
export type ComponentColor = keyof typeof colorClasses;
export type ComponentVariant = GlassPreset;
export type AnimationClass = keyof typeof animationClasses;
