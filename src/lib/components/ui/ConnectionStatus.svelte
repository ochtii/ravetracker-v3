<!--
Connection Status Indicator
==========================
Shows real-time connection status with visual feedback
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { 
		connectionStatus, 
		isConnected, 
		isConnecting, 
		connectionError,
		activeSubscriptions,
		realtimeActions
	} from '$lib/stores/realtime'
	import { 
		Wifi, 
		WifiOff, 
		Loader2, 
		AlertCircle, 
		CheckCircle,
		RefreshCw,
		Settings,
		X
	} from 'lucide-svelte'

	// Props
	export let variant: 'full' | 'minimal' | 'dot' = 'minimal'
	export let showDetails = false
	export let position: 'fixed' | 'relative' = 'relative'

	// State
	let showDropdown = false
	let mounted = false

	// Reactive statements
	$: status = $connectionStatus
	$: connected = $isConnected
	$: connecting = $isConnecting
	$: error = $connectionError
	$: subscriptions = $activeSubscriptions

	$: statusColor = connected ? 'green' : connecting ? 'yellow' : 'red'
	$: statusText = connected ? 'Connected' : connecting ? 'Connecting...' : error ? 'Disconnected' : 'Offline'

	// Auto-hide dropdown after 5 seconds
	$: if (showDropdown) {
		const timeout = setTimeout(() => {
			showDropdown = false
		}, 5000)

		return () => clearTimeout(timeout)
	}

	// Functions
	function toggleDropdown() {
		showDropdown = !showDropdown
	}

	function handleReconnect() {
		realtimeActions.reconnect()
		showDropdown = false
	}

	function formatTime(date: Date | null): string {
		if (!date) return 'Never'
		return new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		}).format(date)
	}

	function getSubscriptionStatusColor(status: string): string {
		switch (status) {
			case 'connected': return 'text-green-600'
			case 'connecting': return 'text-yellow-600'
			case 'error': return 'text-red-600'
			case 'disconnected': return 'text-gray-600'
			default: return 'text-gray-400'
		}
	}

	// Lifecycle
	onMount(() => {
		mounted = true
	})

	onDestroy(() => {
		mounted = false
	})
</script>

<!-- Dot Variant -->
{#if variant === 'dot'}
	<div class="relative">
		<button
			on:click={toggleDropdown}
			class="flex items-center justify-center w-3 h-3 rounded-full transition-colors duration-200"
			class:bg-green-500={connected}
			class:bg-yellow-500={connecting}
			class:bg-red-500={!connected && !connecting}
			class:animate-pulse={connecting}
			title={statusText}
		>
			<span class="sr-only">{statusText}</span>
		</button>

		{#if showDropdown}
			<div class="absolute right-0 top-4 z-50 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium text-gray-900">Connection Status</span>
					<button
						on:click={() => showDropdown = false}
						class="text-gray-400 hover:text-gray-600"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
				<div class="text-xs text-gray-600">
					Status: {statusText}
					{#if status.lastConnected}
						<br />Last connected: {formatTime(status.lastConnected)}
					{/if}
				</div>
			</div>
		{/if}
	</div>

<!-- Minimal Variant -->
{:else if variant === 'minimal'}
	<div class="relative">
		<button
			on:click={toggleDropdown}
			class="flex items-center space-x-2 px-2 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
			class:text-green-600={connected}
			class:bg-green-50={connected}
			class:text-yellow-600={connecting}
			class:bg-yellow-50={connecting}
			class:text-red-600={!connected && !connecting}
			class:bg-red-50={!connected && !connecting}
			title={error || statusText}
		>
			{#if connected}
				<Wifi class="w-4 h-4" />
			{:else if connecting}
				<Loader2 class="w-4 h-4 animate-spin" />
			{:else}
				<WifiOff class="w-4 h-4" />
			{/if}
			
			{#if variant !== 'dot'}
				<span class="hidden sm:inline">{statusText}</span>
			{/if}
		</button>

		{#if showDropdown}
			<div 
				class="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200"
				class:fixed={position === 'fixed'}
				class:top-16={position === 'fixed'}
				class:right-4={position === 'fixed'}
			>
				<!-- Header -->
				<div class="flex items-center justify-between p-4 border-b border-gray-100">
					<h3 class="text-sm font-semibold text-gray-900">Real-time Status</h3>
					<button
						on:click={() => showDropdown = false}
						class="text-gray-400 hover:text-gray-600"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<!-- Connection Info -->
				<div class="p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">Status</span>
						<div class="flex items-center space-x-2">
							{#if connected}
								<CheckCircle class="w-4 h-4 text-green-600" />
								<span class="text-sm font-medium text-green-600">Connected</span>
							{:else if connecting}
								<Loader2 class="w-4 h-4 text-yellow-600 animate-spin" />
								<span class="text-sm font-medium text-yellow-600">Connecting</span>
							{:else}
								<AlertCircle class="w-4 h-4 text-red-600" />
								<span class="text-sm font-medium text-red-600">Disconnected</span>
							{/if}
						</div>
					</div>

					{#if status.lastConnected}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Last Connected</span>
							<span class="text-sm text-gray-900">{formatTime(status.lastConnected)}</span>
						</div>
					{/if}

					{#if status.reconnectAttempts > 0}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Reconnect Attempts</span>
							<span class="text-sm text-gray-900">{status.reconnectAttempts}</span>
						</div>
					{/if}

					{#if error}
						<div class="p-2 bg-red-50 rounded-lg">
							<p class="text-xs text-red-600">{error}</p>
						</div>
					{/if}
				</div>

				<!-- Subscriptions -->
				{#if subscriptions.length > 0}
					<div class="border-t border-gray-100">
						<div class="p-4">
							<h4 class="text-sm font-medium text-gray-900 mb-3">
								Active Subscriptions ({subscriptions.length})
							</h4>
							<div class="space-y-2 max-h-32 overflow-y-auto">
								{#each subscriptions as subscription}
									<div class="flex items-center justify-between text-xs">
										<span class="text-gray-600">{subscription.table}</span>
										<div class="flex items-center space-x-1">
											<div 
												class="w-2 h-2 rounded-full"
												class:bg-green-500={subscription.status === 'connected'}
												class:bg-yellow-500={subscription.status === 'connecting'}
												class:bg-red-500={subscription.status === 'error'}
												class:bg-gray-500={subscription.status === 'disconnected'}
											></div>
											<span class={getSubscriptionStatusColor(subscription.status)}>
												{subscription.status}
											</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex items-center justify-between p-4 bg-gray-50 rounded-b-lg">
					<button
						on:click={handleReconnect}
						disabled={connecting}
						class="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<RefreshCw class="w-3 h-3" class:animate-spin={connecting} />
						<span>Reconnect</span>
					</button>

					{#if showDetails}
						<button
							class="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
						>
							<Settings class="w-3 h-3" />
							<span>Settings</span>
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>

<!-- Full Variant -->
{:else if variant === 'full'}
	<div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-gray-900">Real-time Connection</h3>
			
			<div class="flex items-center space-x-2">
				{#if connected}
					<CheckCircle class="w-5 h-5 text-green-600" />
					<span class="text-sm font-medium text-green-600">Connected</span>
				{:else if connecting}
					<Loader2 class="w-5 h-5 text-yellow-600 animate-spin" />
					<span class="text-sm font-medium text-yellow-600">Connecting</span>
				{:else}
					<AlertCircle class="w-5 h-5 text-red-600" />
					<span class="text-sm font-medium text-red-600">Disconnected</span>
				{/if}
			</div>
		</div>

		<!-- Connection Details -->
		<div class="grid grid-cols-2 gap-4 mb-4">
			<div>
				<dt class="text-sm text-gray-600">Status</dt>
				<dd class="text-sm font-medium text-gray-900">{statusText}</dd>
			</div>
			
			{#if status.lastConnected}
				<div>
					<dt class="text-sm text-gray-600">Last Connected</dt>
					<dd class="text-sm font-medium text-gray-900">{formatTime(status.lastConnected)}</dd>
				</div>
			{/if}
			
			<div>
				<dt class="text-sm text-gray-600">Subscriptions</dt>
				<dd class="text-sm font-medium text-gray-900">{subscriptions.length}</dd>
			</div>
			
			{#if status.reconnectAttempts > 0}
				<div>
					<dt class="text-sm text-gray-600">Reconnect Attempts</dt>
					<dd class="text-sm font-medium text-gray-900">{status.reconnectAttempts}</dd>
				</div>
			{/if}
		</div>

		<!-- Error Display -->
		{#if error}
			<div class="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
				<div class="flex items-center space-x-2">
					<AlertCircle class="w-4 h-4 text-red-600" />
					<span class="text-sm font-medium text-red-600">Connection Error</span>
				</div>
				<p class="text-sm text-red-600 mt-1">{error}</p>
			</div>
		{/if}

		<!-- Subscriptions List -->
		{#if subscriptions.length > 0}
			<div class="mb-4">
				<h4 class="text-sm font-medium text-gray-900 mb-2">Active Subscriptions</h4>
				<div class="space-y-2">
					{#each subscriptions as subscription}
						<div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
							<div>
								<span class="text-sm font-medium text-gray-900">{subscription.table}</span>
								{#if subscription.lastActivity}
									<span class="text-xs text-gray-500 block">
										Last activity: {formatTime(subscription.lastActivity)}
									</span>
								{/if}
							</div>
							<div class="flex items-center space-x-2">
								<div 
									class="w-2 h-2 rounded-full"
									class:bg-green-500={subscription.status === 'connected'}
									class:bg-yellow-500={subscription.status === 'connecting'}
									class:bg-red-500={subscription.status === 'error'}
									class:bg-gray-500={subscription.status === 'disconnected'}
								></div>
								<span class="text-xs {getSubscriptionStatusColor(subscription.status)}">
									{subscription.status}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex items-center space-x-3">
			<button
				on:click={handleReconnect}
				disabled={connecting}
				class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<RefreshCw class="w-4 h-4" class:animate-spin={connecting} />
				<span>Reconnect</span>
			</button>

			<button
				class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
			>
				<Settings class="w-4 h-4" />
				<span>Settings</span>
			</button>
		</div>
	</div>
{/if}

<style>
	/* Custom dropdown animation */
	:global(.connection-dropdown) {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
