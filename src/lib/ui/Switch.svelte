<script lang="ts">
  export let checked = false
  export let disabled = false
  export let label = ''
  export let size: 'sm' | 'md' | 'lg' = 'md'

  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6'
  }

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  function toggle() {
    if (!disabled) {
      checked = !checked
    }
  }
</script>

<div class="flex items-center space-x-2">
  <button
    type="button"
    class="relative inline-flex {sizeClasses[size]} rounded-full border-2 transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 {
      checked
        ? 'bg-blue-600 border-blue-600'
        : 'bg-gray-200 border-gray-200'
    } {
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer'
    }"
    {disabled}
    on:click={toggle}
    role="switch"
    aria-checked={checked}
    aria-label={label}
  >
    <span
      class="pointer-events-none inline-block {thumbSizeClasses[size]} rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 {
        checked
          ? size === 'sm' ? 'translate-x-4' : size === 'md' ? 'translate-x-5' : 'translate-x-7'
          : 'translate-x-0'
      }"
    />
  </button>

  {#if label}
    <label
      class="text-sm font-medium text-gray-700 dark:text-gray-300 {
        disabled ? 'opacity-50' : 'cursor-pointer'
      }"
      on:click={toggle}
    >
      {label}
    </label>
  {/if}
</div>
