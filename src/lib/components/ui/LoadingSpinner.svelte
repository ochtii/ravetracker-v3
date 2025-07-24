<!--
Enhanced Loading Components with Skeleton Loading
===============================================
-->

<script lang="ts">
	export let variant: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'card' | 'list' | 'text' = 'spinner'
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md'
	export let color: 'primary' | 'secondary' | 'accent' | 'gray' = 'primary'
	export let fullscreen = false
	export let overlay = false
	export let count = 1
	export let className = ''
	export let message = ''

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
		xl: 'h-12 w-12'
	}

	const colorClasses = {
		primary: 'text-primary border-primary',
		secondary: 'text-secondary border-secondary',
		accent: 'text-accent border-accent',
		gray: 'text-gray-400 border-gray-300'
	}
</script>

{#if fullscreen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
		<div class="text-center">
			<svelte:self {variant} {size} {color} />
			{#if message}
				<p class="mt-4 text-sm text-gray-600">{message}</p>
			{/if}
		</div>
	</div>
{:else if overlay}
	<div class="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-lg">
		<svelte:self {variant} {size} {color} />
	</div>
{:else if variant === 'spinner'}
	<div class="animate-spin rounded-full border-2 border-t-transparent {sizeClasses[size]} {colorClasses[color]} {className}"></div>
{:else if variant === 'dots'}
	<div class="flex space-x-1 {className}">
		{#each Array(3) as _, i}
			<div 
				class="rounded-full {colorClasses[color]} bg-current {size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-6 w-6'}"
				style="animation: bounce 1.4s ease-in-out {i * 0.16}s infinite both;"
			></div>
		{/each}
	</div>
{:else if variant === 'pulse'}
	<div class="animate-pulse {sizeClasses[size]} {colorClasses[color]} bg-current rounded {className}"></div>
{:else if variant === 'skeleton'}
	<div class="animate-pulse space-y-4 {className}">
		{#each Array(count) as _}
			<div class="space-y-2">
				<div class="h-4 bg-gray-200 rounded w-3/4"></div>
				<div class="h-4 bg-gray-200 rounded w-1/2"></div>
			</div>
		{/each}
	</div>
{:else if variant === 'card'}
	<div class="animate-pulse {className}">
		{#each Array(count) as _}
			<div class="border border-gray-200 rounded-lg p-6 mb-4">
				<!-- Header -->
				<div class="flex items-center space-x-4 mb-4">
					<div class="rounded-full bg-gray-200 h-12 w-12"></div>
					<div class="space-y-2 flex-1">
						<div class="h-4 bg-gray-200 rounded w-1/4"></div>
						<div class="h-3 bg-gray-200 rounded w-1/6"></div>
					</div>
				</div>
				
				<!-- Content -->
				<div class="space-y-3">
					<div class="h-4 bg-gray-200 rounded"></div>
					<div class="h-4 bg-gray-200 rounded w-5/6"></div>
					<div class="h-4 bg-gray-200 rounded w-4/6"></div>
				</div>
				
				<!-- Image placeholder -->
				<div class="mt-4 h-48 bg-gray-200 rounded-lg"></div>
				
				<!-- Footer -->
				<div class="flex items-center justify-between mt-4">
					<div class="flex space-x-2">
						<div class="h-8 bg-gray-200 rounded w-16"></div>
						<div class="h-8 bg-gray-200 rounded w-16"></div>
					</div>
					<div class="h-8 bg-gray-200 rounded w-20"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if variant === 'list'}
	<div class="animate-pulse space-y-3 {className}">
		{#each Array(count) as _}
			<div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
				<div class="rounded-full bg-gray-200 h-10 w-10 flex-shrink-0"></div>
				<div class="flex-1 space-y-2">
					<div class="h-4 bg-gray-200 rounded w-1/4"></div>
					<div class="h-3 bg-gray-200 rounded w-1/3"></div>
				</div>
				<div class="h-8 bg-gray-200 rounded w-16"></div>
			</div>
		{/each}
	</div>
{:else if variant === 'text'}
	<div class="animate-pulse space-y-2 {className}">
		{#each Array(count) as _}
			<div class="h-4 bg-gray-200 rounded w-full"></div>
		{/each}
		<div class="h-4 bg-gray-200 rounded w-2/3"></div>
	</div>
{/if}

<style>
	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}
</style>
