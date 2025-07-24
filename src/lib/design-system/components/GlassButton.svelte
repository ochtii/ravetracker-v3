<!--
  RaveTracker v3.0 - Glass Button Component
  ========================================
  Produktionsreife Glassmorphism-Button Komponente
-->

<script lang="ts">
  import type { GlassButtonProps } from './types.js';
  import { cn, getSizeClasses, getColorClasses } from './types.js';

  type $$Props = GlassButtonProps & {
    [key: string]: any;
  };

  export let variant: GlassButtonProps['variant'] = 'glass';
  export let size: GlassButtonProps['size'] = 'md';
  export let disabled: GlassButtonProps['disabled'] = false;
  export let loading: GlassButtonProps['loading'] = false;
  export let fullWidth: GlassButtonProps['fullWidth'] = false;
  export let className: GlassButtonProps['className'] = '';
  export let type: GlassButtonProps['type'] = 'button';

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-500/30 to-primary-600/30 border-primary-500/50 text-primary-100 hover:from-primary-500/50 hover:to-primary-600/50 hover:border-primary-400/70',
    secondary: 'bg-gradient-to-r from-secondary-500/30 to-secondary-600/30 border-secondary-500/50 text-secondary-100 hover:from-secondary-500/50 hover:to-secondary-600/50 hover:border-secondary-400/70',
    ghost: 'bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30',
    glass: 'bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-base min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
    xl: 'px-8 py-4 text-xl min-h-[56px]'
  };

  // Build classes
  $: classes = cn(
    // Base classes
    'relative',
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'font-medium',
    'rounded-lg',
    'backdrop-blur-md',
    'border',
    'transition-all',
    'duration-200',
    'select-none',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500/50',
    'focus:ring-offset-2',
    'focus:ring-offset-transparent',
    
    // Variant styles
    variantClasses[variant],
    
    // Size styles
    sizeClasses[size],
    
    // States
    fullWidth && 'w-full',
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    loading && 'cursor-wait',
    
    // Interactive effects
    !disabled && !loading && 'active:scale-95 hover:shadow-lg hover:shadow-primary-500/25',
    
    // Custom classes
    className
  );
</script>

<button
  {type}
  {disabled}
  class={classes}
  on:click
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  {...$$restProps}
>
  {#if loading}
    <!-- Loading spinner -->
    <svg 
      class="animate-spin w-4 h-4" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="4" 
        stroke-dasharray="32" 
        stroke-dashoffset="32" 
        opacity="0.3"
      />
      <path 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
        fill="currentColor"
      />
    </svg>
  {/if}
  
  <slot />
  
  <!-- Glow effect -->
  <div class="glass-button-glow"></div>
</button>

<style>
  /* Enhanced glassmorphism button effects */
  button {
    position: relative;
    overflow: hidden;
  }

  button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0.02) 100%
    );
    border-radius: inherit;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  button:hover::before {
    opacity: 1.5;
  }

  button:active::before {
    opacity: 0.5;
  }

  /* Glow effect */
  .glass-button-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      rgba(99, 102, 241, 0.3) 0%,
      transparent 70%
    );
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  button:hover .glass-button-glow {
    opacity: 1;
  }

  /* Ripple effect */
  button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
    pointer-events: none;
  }

  button:active::after {
    width: 200px;
    height: 200px;
  }

  /* Dark theme adjustments */
  :global([data-theme="dark"]) button {
    backdrop-filter: blur(16px) saturate(180%);
  }

  /* Focus ring enhancement */
  button:focus {
    box-shadow: 
      0 0 0 2px rgba(99, 102, 241, 0.5),
      0 8px 32px rgba(31, 38, 135, 0.3);
  }

  /* Disabled state */
  button:disabled {
    backdrop-filter: blur(8px) saturate(100%);
  }

  /* Loading state */
  button:is([disabled]) .glass-button-glow {
    opacity: 0;
  }
</style>
