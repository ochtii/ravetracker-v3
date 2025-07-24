<!--
Real-time Settings Component
===========================
Configure real-time features and notification preferences
-->

<script lang="ts">
	import { onMount } from 'svelte'
	import { 
		realtimeState, 
		realtimeActions,
		notificationPermission,
		isConnected,
		connectionStatus,
		activeSubscriptions
	} from '$lib/stores/realtime'
	import { 
		Settings, 
		Bell, 
		Wifi, 
		Volume2, 
		Vibrate, 
		RefreshCw,
		ToggleLeft,
		ToggleRight,
		AlertCircle,
		CheckCircle,
		Info
	} from 'lucide-svelte'

	// Local state
	let showAdvanced = false

	// Reactive statements
	$: state = $realtimeState
	$: permission = $notificationPermission
	$: connected = $isConnected
	$: status = $connectionStatus
	$: subscriptions = $activeSubscriptions

	// Functions
	async function toggleRealtime() {
		if (state.enabled) {
			await realtimeActions.disableRealtime()
		} else {
			await realtimeActions.enableRealtime()
		}
	}

	async function requestNotifications() {
		await realtimeActions.requestNotificationPermission()
	}

	function updateSetting(key: keyof typeof state.settings, value: boolean) {
		realtimeActions.updateSettings({ [key]: value })
	}

	async function testNotification() {
		realtimeActions.showNotification('Test Notification', {
			body: 'This is a test notification from RaveTracker',
			icon: '/icon-192x192.png'
		})
	}

	function getConnectionStatusText(): string {
		if (connected) return 'Connected'
		if (status.connecting) return 'Connecting...'
		if (status.error) return `Error: ${status.error}`
		return 'Disconnected'
	}

	function getConnectionStatusColor(): string {
		if (connected) return 'text-green-600 bg-green-50'
		if (status.connecting) return 'text-yellow-600 bg-yellow-50'
		return 'text-red-600 bg-red-50'
	}
</script>

<div class="bg-white border border-gray-200 rounded-lg shadow-sm">
	<!-- Header -->
	<div class="flex items-center justify-between p-4 border-b border-gray-100">
		<div class="flex items-center space-x-2">
			<Settings class="w-5 h-5 text-gray-400" />
			<h2 class="text-lg font-semibold text-gray-900">Real-time Settings</h2>
		</div>
		
		<!-- Connection Status -->
		<div class="flex items-center space-x-2 text-sm {getConnectionStatusColor()} px-2 py-1 rounded-full">
			{#if connected}
				<Wifi class="w-4 h-4" />
			{:else}
				<AlertCircle class="w-4 h-4" />
			{/if}
			<span>{getConnectionStatusText()}</span>
		</div>
	</div>

	<div class="p-4 space-y-6">
		<!-- Master Toggle -->
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
					<Wifi class="w-5 h-5 text-purple-600" />
				</div>
				<div>
					<h3 class="text-base font-medium text-gray-900">Enable Real-time Features</h3>
					<p class="text-sm text-gray-600">Get live updates for events, notifications, and attendance</p>
				</div>
			</div>
			
			<button
				on:click={toggleRealtime}
				class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
				class:bg-purple-600={state.enabled}
				class:bg-gray-200={!state.enabled}
			>
				<span
					class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
					class:translate-x-6={state.enabled}
					class:translate-x-1={!state.enabled}
				></span>
			</button>
		</div>

		{#if state.enabled}
			<!-- Feature Toggles -->
			<div class="space-y-4">
				<h4 class="text-sm font-medium text-gray-900">Real-time Features</h4>
				
				<div class="space-y-3">
					<!-- Events -->
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 rounded-full {state.features.events ? 'bg-green-500' : 'bg-gray-400'}"></div>
							<div>
								<div class="text-sm font-medium text-gray-900">Event Updates</div>
								<div class="text-xs text-gray-600">Live updates when events are created or modified</div>
							</div>
						</div>
						<span class="text-xs {state.features.events ? 'text-green-600' : 'text-gray-500'}">
							{state.features.events ? 'Active' : 'Inactive'}
						</span>
					</div>

					<!-- Notifications -->
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 rounded-full {state.features.notifications ? 'bg-green-500' : 'bg-gray-400'}"></div>
							<div>
								<div class="text-sm font-medium text-gray-900">Notifications</div>
								<div class="text-xs text-gray-600">Real-time notifications and alerts</div>
							</div>
						</div>
						<span class="text-xs {state.features.notifications ? 'text-green-600' : 'text-gray-500'}">
							{state.features.notifications ? 'Active' : 'Inactive'}
						</span>
					</div>

					<!-- Attendance -->
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 rounded-full {state.features.attendance ? 'bg-green-500' : 'bg-gray-400'}"></div>
							<div>
								<div class="text-sm font-medium text-gray-900">Attendance Updates</div>
								<div class="text-xs text-gray-600">Live attendance changes for events you're viewing</div>
							</div>
						</div>
						<span class="text-xs {state.features.attendance ? 'text-green-600' : 'text-gray-500'}">
							{state.features.attendance ? 'Active' : 'Inactive'}
						</span>
					</div>
				</div>
			</div>

			<!-- Notification Settings -->
			<div class="space-y-4">
				<h4 class="text-sm font-medium text-gray-900">Notification Preferences</h4>
				
				<!-- Browser Notifications -->
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<Bell class="w-4 h-4 text-gray-400" />
						<div>
							<div class="text-sm font-medium text-gray-900">Browser Notifications</div>
							<div class="text-xs text-gray-600">
								{#if permission.granted}
									Show desktop notifications when new updates arrive
								{:else if permission.denied}
									Permission denied - notifications are blocked
								{:else}
									Enable browser notifications for instant alerts
								{/if}
							</div>
						</div>
					</div>
					
					{#if permission.granted}
						<button
							on:click={() => updateSetting('browserNotifications', !state.settings.browserNotifications)}
							class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
							class:bg-purple-600={state.settings.browserNotifications}
							class:bg-gray-200={!state.settings.browserNotifications}
						>
							<span
								class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
								class:translate-x-6={state.settings.browserNotifications}
								class:translate-x-1={!state.settings.browserNotifications}
							></span>
						</button>
					{:else}
						<button
							on:click={requestNotifications}
							class="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded hover:bg-purple-200 focus:ring-2 focus:ring-purple-500"
						>
							{permission.denied ? 'Blocked' : 'Enable'}
						</button>
					{/if}
				</div>

				<!-- Sound -->
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<Volume2 class="w-4 h-4 text-gray-400" />
						<div>
							<div class="text-sm font-medium text-gray-900">Sound Notifications</div>
							<div class="text-xs text-gray-600">Play sound when notifications arrive</div>
						</div>
					</div>
					
					<button
						on:click={() => updateSetting('soundEnabled', !state.settings.soundEnabled)}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
						class:bg-purple-600={state.settings.soundEnabled}
						class:bg-gray-200={!state.settings.soundEnabled}
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
							class:translate-x-6={state.settings.soundEnabled}
							class:translate-x-1={!state.settings.soundEnabled}
						></span>
					</button>
				</div>

				<!-- Vibration -->
				{#if 'vibrate' in navigator}
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<Vibrate class="w-4 h-4 text-gray-400" />
							<div>
								<div class="text-sm font-medium text-gray-900">Vibration</div>
								<div class="text-xs text-gray-600">Vibrate device for notifications</div>
							</div>
						</div>
						
						<button
							on:click={() => updateSetting('vibrationEnabled', !state.settings.vibrationEnabled)}
							class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
							class:bg-purple-600={state.settings.vibrationEnabled}
							class:bg-gray-200={!state.settings.vibrationEnabled}
						>
							<span
								class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
								class:translate-x-6={state.settings.vibrationEnabled}
								class:translate-x-1={!state.settings.vibrationEnabled}
							></span>
						</button>
					</div>
				{/if}

				<!-- Auto-reconnect -->
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<RefreshCw class="w-4 h-4 text-gray-400" />
						<div>
							<div class="text-sm font-medium text-gray-900">Auto-reconnect</div>
							<div class="text-xs text-gray-600">Automatically reconnect when connection is lost</div>
						</div>
					</div>
					
					<button
						on:click={() => updateSetting('autoReconnect', !state.settings.autoReconnect)}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
						class:bg-purple-600={state.settings.autoReconnect}
						class:bg-gray-200={!state.settings.autoReconnect}
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
							class:translate-x-6={state.settings.autoReconnect}
							class:translate-x-1={!state.settings.autoReconnect}
						></span>
					</button>
				</div>
			</div>

			<!-- Test Notification -->
			{#if permission.granted && state.settings.browserNotifications}
				<div class="pt-4 border-t border-gray-100">
					<button
						on:click={testNotification}
						class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 focus:ring-2 focus:ring-purple-500"
					>
						<Bell class="w-4 h-4 mr-2" />
						Test Notification
					</button>
				</div>
			{/if}

			<!-- Advanced Settings -->
			<div class="pt-4 border-t border-gray-100">
				<button
					on:click={() => showAdvanced = !showAdvanced}
					class="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
				>
					<svelte:component 
						this={showAdvanced ? ToggleRight : ToggleLeft} 
						class="w-4 h-4" 
					/>
					<span>Advanced Settings</span>
				</button>

				{#if showAdvanced}
					<div class="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
						<!-- Connection Info -->
						<div>
							<h5 class="text-sm font-medium text-gray-900 mb-2">Connection Details</h5>
							<div class="text-xs text-gray-600 space-y-1">
								<div>Status: {getConnectionStatusText()}</div>
								{#if status.lastConnected}
									<div>Last connected: {status.lastConnected.toLocaleString()}</div>
								{/if}
								{#if status.reconnectAttempts > 0}
									<div>Reconnect attempts: {status.reconnectAttempts}</div>
								{/if}
							</div>
						</div>

						<!-- Active Subscriptions -->
						{#if subscriptions.length > 0}
							<div>
								<h5 class="text-sm font-medium text-gray-900 mb-2">
									Active Subscriptions ({subscriptions.length})
								</h5>
								<div class="space-y-1">
									{#each subscriptions as subscription}
										<div class="flex items-center justify-between text-xs text-gray-600">
											<span>{subscription.table}</span>
											<span class="capitalize">{subscription.status}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Manual Reconnect -->
						<div>
							<button
								on:click={() => realtimeActions.reconnect()}
								disabled={status.connecting}
								class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
							>
								<RefreshCw class="w-4 h-4 mr-2 {status.connecting ? 'animate-spin' : ''}" />
								Force Reconnect
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Footer Info -->
	<div class="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
		<div class="flex items-start space-x-2 text-xs text-gray-600">
			<Info class="w-4 h-4 mt-0.5 flex-shrink-0" />
			<div>
				<p>Real-time features use WebSocket connections to provide instant updates. 
				   Disable them to reduce battery usage and data consumption.</p>
			</div>
		</div>
	</div>
</div>
