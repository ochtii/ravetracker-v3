<script lang="ts">
  import { cn, glassmorphism } from '../types'
  import type { NavigationProps, NavigationItem } from '../types'

  export let items: NavigationItem[]
  export let variant: NavigationProps['variant'] = 'horizontal'

  let className = ''
  export { className as class }

  $: navClass = cn(
    // Base styles
    'flex',
    // Variant styles
    getVariantClasses(variant || 'horizontal'),
    // Glassmorphism
    variant !== 'mobile' && glassmorphism.navigation,
    // Custom class
    className
  )

  function getVariantClasses(navVariant: NonNullable<NavigationProps['variant']>): string {
    const variantMap = {
      horizontal: 'flex-row items-center space-x-6 p-4',
      vertical: 'flex-col space-y-2 p-4',
      mobile: 'flex-col space-y-1 p-2'
    }
    return variantMap[navVariant] || ''
  }

  function handleItemClick(item: NavigationItem, event: MouseEvent) {
    if (item.onclick) {
      event.preventDefault()
      item.onclick()
    }
  }

  function isItemActive(item: NavigationItem): boolean {
    if (item.active !== undefined) {
      return item.active
    }
    
    // Check if current URL matches item href
    if (typeof window !== 'undefined' && item.href) {
      return window.location.pathname === item.href
    }
    
    return false
  }
</script>

<nav class={navClass} {...$$restProps}>
  {#each items as item}
    <div class="relative group">
      {#if item.href}
        <a
          href={item.href}
          class={cn(
            // Base link styles
            'flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200',
            // State styles
            isItemActive(item) 
              ? 'text-white bg-white/20 shadow-lg' 
              : 'text-white/80 hover:text-white hover:bg-white/10',
            // Mobile specific
            variant === 'mobile' && 'w-full justify-start'
          )}
          on:click={(event) => handleItemClick(item, event)}
        >
          {#if item.icon}
            <i class={cn('text-lg', item.icon)}></i>
          {/if}
          
          <span>{item.label}</span>
          
          {#if item.children && item.children.length > 0}
            <svg class="w-4 h-4 ml-auto transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          {/if}
        </a>
      {:else}
        <button
          type="button"
          class={cn(
            // Base button styles
            'flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200',
            // State styles
            isItemActive(item) 
              ? 'text-white bg-white/20 shadow-lg' 
              : 'text-white/80 hover:text-white hover:bg-white/10',
            // Mobile specific
            variant === 'mobile' && 'w-full justify-start'
          )}
          on:click={(event) => handleItemClick(item, event)}
        >
          {#if item.icon}
            <i class={cn('text-lg', item.icon)}></i>
          {/if}
          
          <span>{item.label}</span>
          
          {#if item.children && item.children.length > 0}
            <svg class="w-4 h-4 ml-auto transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          {/if}
        </button>
      {/if}

      <!-- Dropdown menu for children -->
      {#if item.children && item.children.length > 0}
        <div class={cn(
          'absolute top-full left-0 mt-1 min-w-[200px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50',
          glassmorphism.modal,
          variant === 'vertical' && 'left-full top-0 ml-1'
        )}>
          <div class="py-2">
            {#each item.children as child}
              {#if child.href}
                <a
                  href={child.href}
                  class="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  on:click={(event) => handleItemClick(child, event)}
                >
                  {#if child.icon}
                    <i class={cn('text-sm', child.icon)}></i>
                  {/if}
                  <span class="text-sm">{child.label}</span>
                </a>
              {:else}
                <button
                  type="button"
                  class="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
                  on:click={(event) => handleItemClick(child, event)}
                >
                  {#if child.icon}
                    <i class={cn('text-sm', child.icon)}></i>
                  {/if}
                  <span class="text-sm">{child.label}</span>
                </button>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</nav>
