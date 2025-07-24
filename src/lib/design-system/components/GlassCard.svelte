<!--
  RaveTracker v3.0 - Glass Card Component
  ======================================
  Produktionsreife Glassmorphism-Card Komponente
-->

<script lang="ts">
  import type { GlassCardProps } from './types.js';
  import { cn, getGlassClasses } from './types.js';

  type $$Props = GlassCardProps & {
    [key: string]: any;
  };

  export let variant: GlassCardProps['variant'] = 'medium';
  export let className: GlassCardProps['className'] = '';
  export let padding: GlassCardProps['padding'] = 'md';
  export let rounded: GlassCardProps['rounded'] = 'lg';
  export let hover: GlassCardProps['hover'] = false;
  export let clickable: GlassCardProps['clickable'] = false;
  export let as: GlassCardProps['as'] = 'div';

  // Padding classes
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  // Rounded classes
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  // Build classes
  $: classes = cn(
    // Base classes
    'relative',
    'backdrop-blur-md',
    'border',
    'shadow-lg',
    'transition-all',
    'duration-300',
    
    // Glass variant
    getGlassClasses(variant),
    
    // Padding
    paddingClasses[padding],
    
    // Rounded
    roundedClasses[rounded],
    
    // Interactive states
    hover && 'hover:shadow-xl hover:scale-[1.02] hover:backdrop-blur-lg',
    clickable && 'cursor-pointer select-none',
    clickable && 'active:scale-[0.98]',
    
    // Custom classes
    className
  );
</script>

<svelte:element
  this={as}
  class={classes}
  on:click
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  {...$$restProps}
>
  <slot />
</svelte:element>

<style>
  /* Enhanced glassmorphism effects */
  :global(.glass-card) {
    backdrop-filter: blur(16px) saturate(180%);
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 8px 32px 0 rgba(31, 38, 135, 0.37),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
    position: relative;
  }

  :global(.glass-card::before) {
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
  }

  :global(.glass-card:hover) {
    backdrop-filter: blur(20px) saturate(200%);
    background-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 
      0 16px 64px 0 rgba(31, 38, 135, 0.5),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
  }

  /* Dark theme adjustments */
  :global([data-theme="dark"] .glass-card) {
    background-color: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }

  :global([data-theme="dark"] .glass-card:hover) {
    background-color: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.15);
  }

  /* Animation for content */
  :global(.glass-card) :global(*) {
    position: relative;
    z-index: 1;
  }
</style>
