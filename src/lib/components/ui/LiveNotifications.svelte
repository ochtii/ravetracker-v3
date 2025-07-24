<!--
Live Notifications Component
===========================
Real-time notification display with toast and persistent notifications
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { fade, fly } from 'svelte/transition'
	import { 
		liveUpdates, 
		unacknowledgedUpdates, 
		hasUnreadNotifications,
		realtimeActions,
		notificationPermission
	} from '$lib/stores/realtime'
	import { 
		Bell, 
		X, 
		Calendar, 
		Users, 
		AlertCircle, 
		CheckCircle,
		Info,
		Settings
	} from 'lucide-svelte'

	// Props
	export let variant: 'toast' | 'dropdown' | 'panel' = 'toast'
	export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right'
	export let maxVisible = 3
	export let autoHide = true
	export let hideDelay = 5000

	// State
	let showDropdown = false
	let showPanel = false

	// Reactive statements
	$: updates = $liveUpdates
	$: unread = $unacknowledgedUpdates
	$: hasUnread = $hasUnreadNotifications
	$: unreadCount = unread.length

	// Toast notifications (auto-hiding)
	$: toastUpdates = variant === 'toast' 
		? unread.slice(0, maxVisible)
		: []

	// Functions
	function getUpdateIcon(type: string) {
		switch (type) {
			case 'event': return Calendar
			case 'attendance': return Users
			case 'notification': return Bell
			default: return Info
		}
	}

	function getUpdateColor(action: string) {
		switch (action) {
			case 'INSERT': return 'text-green-600 bg-green-50 border-green-200'
			case 'UPDATE': return 'text-blue-600 bg-blue-50 border-blue-200'
			case 'DELETE': return 'text-red-600 bg-red-50 border-red-200'
			default: return 'text-gray-600 bg-gray-50 border-gray-200'
		}
	}

	function getActionText(action: string, type: string) {
		switch (action) {
			case 'INSERT':
				return type === 'event' ? 'New event' : 
				       type === 'attendance' ? 'Someone joined' : 'New notification'
			case 'UPDATE':
				return type === 'event' ? 'Event updated' : 
				       type === 'attendance' ? 'Attendance changed' : 'Notification updated'
			case 'DELETE':
				return type === 'event' ? 'Event cancelled' : 
				       type === 'attendance' ? 'Someone left' : 'Notification removed'
			default:
				return 'Update'
		}
	}

	function formatTime(date: Date): string {
		const now = new Date()
		const diff = now.getTime() - date.getTime()
		const minutes = Math.floor(diff / 60000)
		const seconds = Math.floor(diff / 1000)

		if (minutes > 60) {
			return new Intl.DateTimeFormat('en-US', {
				hour: '2-digit',
				minute: '2-digit'
			}).format(date)
		} else if (minutes > 0) {
			return `${minutes}m ago`
		} else {
			return `${seconds}s ago`
		}
	}

	function handleAcknowledge(updateId: string) {
		realtimeActions.acknowledgeUpdate(updateId)
	}

	function handleAcknowledgeAll() {
		unread.forEach(update => {
			realtimeActions.acknowledgeUpdate(update.id)
		})
	}

	function handleClearAll() {
		realtimeActions.clearAcknowledgedUpdates()
	}

	function toggleDropdown() {
		showDropdown = !showDropdown
	}

	function togglePanel() {
		showPanel = !showPanel
	}

	// Auto-hide toasts
	function scheduleAutoHide(updateId: string) {
		if (!autoHide) return

		setTimeout(() => {
			handleAcknowledge(updateId)
		}, hideDelay)
	}

	// Position classes
	function getPositionClasses(pos: typeof position): string {
		switch (pos) {
			case 'top-right': return 'top-4 right-4'
			case 'top-left': return 'top-4 left-4'
			case 'bottom-right': return 'bottom-4 right-4'
			case 'bottom-left': return 'bottom-4 left-4'
			default: return 'top-4 right-4'
		}
	}

	// Lifecycle
	onMount(() => {
		// Schedule auto-hide for existing unread updates
		if (autoHide && variant === 'toast') {
			unread.forEach(update => {
				scheduleAutoHide(update.id)
			})
		}
	})

	// Watch for new updates to schedule auto-hide
	$: if (autoHide && variant === 'toast' && toastUpdates.length > 0) {
		toastUpdates.forEach(update => {
			if (!update.acknowledged) {
				scheduleAutoHide(update.id)
			}
		})
	}
</script>

<!-- Toast Notifications -->
{#if variant === 'toast'}
	<div class="fixed z-50 {getPositionClasses(position)} space-y-2 w-80">
		{#each toastUpdates as update (update.id)}
			<div
				in:fly={{ x: 300, duration: 300 }}
				out:fade={{ duration: 200 }}
				class="bg-white border rounded-lg shadow-lg p-4 {getUpdateColor(update.action)}"
			>
				<div class="flex items-start space-x-3">
					<div class="flex-shrink-0">
						<svelte:component 
							this={getUpdateIcon(update.type)} 
							class="w-5 h-5" 
						/>
					</div>
					
					<div class="flex-1 min-w-0">
						<div class="flex items-center justify-between">
							<h4 class="text-sm font-semibold">
								{getActionText(update.action, update.type)}
							</h4>
							<button
								on:click={() => handleAcknowledge(update.id)}
								class="text-gray-400 hover:text-gray-600"
							>
								<X class="w-4 h-4" />
							</button>
						</div>
						
						{#if update.data?.title}
							<p class="text-sm text-gray-700 mt-1 truncate">
								{update.data.title}
							</p>
						{/if}
						
						{#if update.data?.message}
							<p class="text-sm text-gray-600 mt-1 line-clamp-2">
								{update.data.message}
							</p>
						{/if}
						
						<p class="text-xs text-gray-500 mt-2">
							{formatTime(update.timestamp)}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>

<!-- Dropdown Notifications -->
{:else if variant === 'dropdown'}
	<div class="relative">
		<button
			on:click={toggleDropdown}
			class="relative p-2 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-purple-500 rounded-lg"
		>
			<Bell class="w-5 h-5" />
			{#if unreadCount > 0}
				<span class="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
					{unreadCount > 99 ? '99+' : unreadCount}
				</span>
			{/if}
		</button>

		{#if showDropdown}
			<div 
				class="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
				in:fly={{ y: -10, duration: 200 }}
				out:fade={{ duration: 150 }}
			>
				<!-- Header -->
				<div class="flex items-center justify-between p-4 border-b border-gray-100">
					<h3 class="text-sm font-semibold text-gray-900">
						Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
					</h3>
					<div class="flex items-center space-x-2">
						{#if unreadCount > 0}
							<button
								on:click={handleAcknowledgeAll}
								class="text-xs text-blue-600 hover:text-blue-800"
							>
								Mark all read
							</button>
						{/if}
						<button
							on:click={() => showDropdown = false}
							class="text-gray-400 hover:text-gray-600"
						>
							<X class="w-4 h-4" />
						</button>
					</div>
				</div>

				<!-- Notifications List -->
				<div class="max-h-80 overflow-y-auto">
					{#if updates.length === 0}
						<div class="p-8 text-center">
							<Bell class="w-8 h-8 text-gray-300 mx-auto mb-2" />
							<p class="text-sm text-gray-500">No notifications yet</p>
						</div>
					{:else}
						{#each updates.slice(0, 10) as update (update.id)}
							<div
								class="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
								class:bg-blue-50={!update.acknowledged}
							>
								<div class="flex items-start space-x-3">
									<div class="flex-shrink-0 mt-0.5">
										<svelte:component 
											this={getUpdateIcon(update.type)} 
											class="w-4 h-4 text-gray-500" 
										/>
									</div>
									
									<div class="flex-1 min-w-0">
										<div class="flex items-center justify-between">
											<h4 class="text-sm font-medium text-gray-900">
												{getActionText(update.action, update.type)}
											</h4>
											{#if !update.acknowledged}
												<button
													on:click={() => handleAcknowledge(update.id)}
													class="text-blue-600 hover:text-blue-800"
												>
													<CheckCircle class="w-4 h-4" />
												</button>
											{/if}
										</div>
										
										{#if update.data?.title}
											<p class="text-sm text-gray-700 truncate">
												{update.data.title}
											</p>
										{/if}
										
										{#if update.data?.message}
											<p class="text-xs text-gray-600 mt-1 line-clamp-2">
												{update.data.message}
											</p>
										{/if}
										
										<p class="text-xs text-gray-500 mt-1">
											{formatTime(update.timestamp)}
										</p>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Footer -->
				{#if updates.length > 0}
					<div class="p-3 bg-gray-50 rounded-b-lg">
						<div class="flex items-center justify-between">
							<button
								on:click={handleClearAll}
								class="text-xs text-gray-600 hover:text-gray-800"
							>
								Clear history
							</button>
							<button
								on:click={togglePanel}
								class="text-xs text-blue-600 hover:text-blue-800"
							>
								View all
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

<!-- Panel Notifications -->
{:else if variant === 'panel'}
	<div class="bg-white border border-gray-200 rounded-lg shadow-sm">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-gray-100">
			<h2 class="text-lg font-semibold text-gray-900">Live Updates</h2>
			<div class="flex items-center space-x-3">
				{#if hasUnread}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
						{unreadCount} unread
					</span>
				{/if}
				
				{#if !$notificationPermission.granted && !$notificationPermission.denied}
					<button
						on:click={() => realtimeActions.requestNotificationPermission()}
						class="text-xs text-blue-600 hover:text-blue-800"
					>
						Enable browser notifications
					</button>
				{/if}
			</div>
		</div>

		<!-- Updates List -->
		<div class="max-h-96 overflow-y-auto">
			{#if updates.length === 0}
				<div class="p-8 text-center">
					<Bell class="w-12 h-12 text-gray-300 mx-auto mb-4" />
					<h3 class="text-sm font-medium text-gray-900 mb-2">No live updates</h3>
					<p class="text-sm text-gray-500">
						When events, notifications, or attendance changes occur, they'll appear here.
					</p>
				</div>
			{:else}
				{#each updates as update (update.id)}
					<div
						class="p-4 border-b border-gray-50 transition-colors"
						class:bg-blue-50={!update.acknowledged}
						class:hover:bg-gray-50={update.acknowledged}
					>
						<div class="flex items-start space-x-4">
							<div class="flex-shrink-0">
								<div class="w-8 h-8 rounded-full flex items-center justify-center {getUpdateColor(update.action)}">
									<svelte:component 
										this={getUpdateIcon(update.type)} 
										class="w-4 h-4" 
									/>
								</div>
							</div>
							
							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between">
									<h3 class="text-sm font-semibold text-gray-900">
										{getActionText(update.action, update.type)}
									</h3>
									<div class="flex items-center space-x-2">
										<span class="text-xs text-gray-500">
											{formatTime(update.timestamp)}
										</span>
										{#if !update.acknowledged}
											<button
												on:click={() => handleAcknowledge(update.id)}
												class="text-blue-600 hover:text-blue-800"
												title="Mark as read"
											>
												<CheckCircle class="w-4 h-4" />
											</button>
										{/if}
									</div>
								</div>
								
								{#if update.data?.title}
									<h4 class="text-sm font-medium text-gray-800 mt-1">
										{update.data.title}
									</h4>
								{/if}
								
								{#if update.data?.message}
									<p class="text-sm text-gray-600 mt-1">
										{update.data.message}
									</p>
								{/if}
								
								{#if update.data?.event_id}
									<div class="mt-2">
										<a
											href="/events/{update.data.event_id}"
											class="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
										>
											View event
										</a>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Footer Actions -->
		{#if updates.length > 0}
			<div class="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100">
				<button
					on:click={handleClearAll}
					class="text-sm text-gray-600 hover:text-gray-800"
				>
					Clear history
				</button>
				
				<div class="flex items-center space-x-3">
					{#if unreadCount > 0}
						<button
							on:click={handleAcknowledgeAll}
							class="text-sm text-blue-600 hover:text-blue-800"
						>
							Mark all as read ({unreadCount})
						</button>
					{/if}
					
					<button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800">
						<Settings class="w-4 h-4" />
						<span>Settings</span>
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
