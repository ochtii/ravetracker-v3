<script lang="ts">
  export let variant: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default'
  export let size: 'sm' | 'md' | 'lg' = 'md'
  export let rounded = false

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }
</script>

<span
  class="inline-flex items-center font-medium {variantClasses[variant]} {sizeClasses[size]} {
    rounded ? 'rounded-full' : 'rounded'
  }"
  {...$$restProps}
>
  <slot />
</span>
