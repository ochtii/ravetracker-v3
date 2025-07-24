<script lang="ts">
  import { cn, getVariantClasses } from '../types'
  import type { CardProps } from '../types'

  export let variant: CardProps['variant'] = 'default'
  export let padding: CardProps['padding'] = 'md'

  let className = ''
  export { className as class }

  $: computedClass = cn(
    // Base styles
    'rounded-xl overflow-hidden',
    // Variant styles
    getVariantClasses(variant || 'default', 'card'),
    // Padding styles
    getPaddingClasses(padding || 'md'),
    // Custom class
    className
  )

  function getPaddingClasses(paddingSize: NonNullable<CardProps['padding']>): string {
    const paddingMap = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }
    return paddingMap[paddingSize] || ''
  }
</script>

<div class={computedClass} {...$$restProps}>
  <slot />
</div>
