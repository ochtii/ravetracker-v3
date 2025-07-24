<!--
Enhanced Error Display Component
===============================
-->

<script lang="ts">
	import type { DatabaseError } from '$lib/utils/database'
	import { createEventDispatcher } from 'svelte'
	import { AlertTriangle, RefreshCw, X, Wifi, WifiOff } from 'lucide-svelte'

	export let error: DatabaseError | null = null
	export let variant: 'toast' | 'banner' | 'card' | 'inline' = 'card'
	export let dismissible = true
	export let retryable = true
	export let className = ''
	export let title = ''

	const dispatch = createEventDispatcher<{
		retry: void
		dismiss: void
	}>()

	$: errorTitle = title || getErrorTitle(error?.code)
	$: errorMessage = getErrorMessage(error)
	$: errorIcon = getErrorIcon(error?.code)
	$: canRetry = retryable && shouldShowRetry(error?.code)

	function getErrorTitle(code?: string): string {
		switch (code) {
			case 'NETWORK_ERROR':
				return 'Connection Problem'
			case 'PERMISSION_DENIED':
				return 'Access Denied'
			case 'NOT_FOUND':
				return 'Not Found'
			case 'DUPLICATE_ERROR':
				return 'Already Exists'
			case 'VALIDATION_ERROR':
				return 'Invalid Data'
			case 'RATE_LIMIT':
				return 'Too Many Requests'
			case 'SERVER_ERROR':
				return 'Server Error'
			default:
				return 'Something went wrong'
		}
	}

	function getErrorMessage(error: DatabaseError | null): string {
		if (!error) return ''
		
		// Use custom message if provided, otherwise use default
		if (error.message) return error.message
		
		switch (error.code) {
			case 'NETWORK_ERROR':
				return 'Please check your internet connection and try again.'
			case 'PERMISSION_DENIED':
				return 'You do not have permission to perform this action.'
			case 'NOT_FOUND':
				return 'The requested resource could not be found.'
			case 'DUPLICATE_ERROR':
				return 'This item already exists. Please use a different name.'
			case 'VALIDATION_ERROR':
				return 'Please check your input and try again.'
			case 'RATE_LIMIT':
				return 'You are making requests too quickly. Please wait a moment.'
			case 'SERVER_ERROR':
				return 'Our servers are experiencing issues. Please try again later.'
			default:
				return 'An unexpected error occurred. Please try again.'
		}
	}

	function getErrorIcon(code?: string) {
		switch (code) {
			case 'NETWORK_ERROR':
				return WifiOff
			case 'PERMISSION_DENIED':
				return X
			default:
				return AlertTriangle
		}
	}

	function shouldShowRetry(code?: string): boolean {
		switch (code) {
			case 'NETWORK_ERROR':
			case 'SERVER_ERROR':
			case 'RATE_LIMIT':
				return true
			case 'PERMISSION_DENIED':
			case 'NOT_FOUND':
			case 'VALIDATION_ERROR':
				return false
			default:
				return true
		}
	}

	function handleRetry() {
		dispatch('retry')
	}

	function handleDismiss() {
		dispatch('dismiss')
	}
</script>

{#if error}
	{#if variant === 'toast'}
		<div class="fixed top-4 right-4 z-50 max-w-sm w-full {className}">
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<svelte:component this={errorIcon} class="h-5 w-5 text-red-400" />
					</div>
					<div class="ml-3 flex-1">
						<h3 class="text-sm font-medium text-red-800">{errorTitle}</h3>
						<p class="mt-1 text-sm text-red-700">{errorMessage}</p>
						{#if error.details}
							<p class="mt-1 text-xs text-red-600">{error.details}</p>
						{/if}
					</div>
					{#if dismissible}
						<button
							type="button"
							class="ml-3 flex-shrink-0 text-red-400 hover:text-red-600 focus:outline-none"
							on:click={handleDismiss}
						>
							<X class="h-4 w-4" />
						</button>
					{/if}
				</div>
				{#if canRetry}
					<div class="mt-3">
						<button
							type="button"
							class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							on:click={handleRetry}
						>
							<RefreshCw class="h-3 w-3 mr-1" />
							Try Again
						</button>
					</div>
				{/if}
			</div>
		</div>
	{:else if variant === 'banner'}
		<div class="bg-red-50 border-l-4 border-red-400 p-4 {className}">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<svelte:component this={errorIcon} class="h-5 w-5 text-red-400 mr-3" />
					<div>
						<h3 class="text-sm font-medium text-red-800">{errorTitle}</h3>
						<p class="text-sm text-red-700">{errorMessage}</p>
					</div>
				</div>
				<div class="flex items-center space-x-2">
					{#if canRetry}
						<button
							type="button"
							class="text-red-600 hover:text-red-800 focus:outline-none"
							on:click={handleRetry}
						>
							<RefreshCw class="h-4 w-4" />
						</button>
					{/if}
					{#if dismissible}
						<button
							type="button"
							class="text-red-400 hover:text-red-600 focus:outline-none"
							on:click={handleDismiss}
						>
							<X class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>
		</div>
	{:else if variant === 'card'}
		<div class="bg-white border border-red-200 rounded-lg shadow-sm p-6 {className}">
			<div class="text-center">
				<svelte:component this={errorIcon} class="h-12 w-12 text-red-400 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-gray-900 mb-2">{errorTitle}</h3>
				<p class="text-sm text-gray-600 mb-4">{errorMessage}</p>
				{#if error.details}
					<details class="mb-4">
						<summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
							Technical Details
						</summary>
						<p class="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
							{error.details}
						</p>
					</details>
				{/if}
				<div class="flex justify-center space-x-3">
					{#if canRetry}
						<button
							type="button"
							class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
							on:click={handleRetry}
						>
							<RefreshCw class="h-4 w-4 mr-2" />
							Try Again
						</button>
					{/if}
					{#if dismissible}
						<button
							type="button"
							class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
							on:click={handleDismiss}
						>
							Dismiss
						</button>
					{/if}
				</div>
			</div>
		</div>
	{:else if variant === 'inline'}
		<div class="flex items-center space-x-2 text-red-600 {className}">
			<svelte:component this={errorIcon} class="h-4 w-4 flex-shrink-0" />
			<span class="text-sm">{errorMessage}</span>
			{#if canRetry}
				<button
					type="button"
					class="text-red-600 hover:text-red-800 focus:outline-none"
					on:click={handleRetry}
				>
					<RefreshCw class="h-4 w-4" />
				</button>
			{/if}
		</div>
	{/if}
{/if}
