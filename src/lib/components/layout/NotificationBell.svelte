<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { notificationStore } from '$lib/stores/notifications';
	
	export let unreadCount = 0;
	
	let showDropdown = false;
	let dropdownElement: HTMLElement;
	
	$: notifications = $notificationStore;
	$: hasUnread = unreadCount > 0;
	
	function toggleDropdown() {
		showDropdown = !showDropdown;
	}
	
	function closeDropdown() {
		showDropdown = false;
	}
	
	function markAsRead(notificationId: string) {
		notificationStore.markAsRead(notificationId);
	}
	
	function markAllAsRead() {
		notificationStore.markAllAsRead();
	}
	
	function deleteNotification(notificationId: string) {
		notificationStore.remove(notificationId);
	}
	
	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			closeDropdown();
		}
	}
	
	function getNotificationIcon(type: string): string {
		switch (type) {
			case 'event':
				return 'M8 7V3a1 1 0 012 0v4h4a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z';
			case 'follow':
				return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
			case 'like':
				return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
			case 'comment':
				return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
			case 'system':
				return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
			default:
				return 'M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V5a2 2 0 012-2h6l6 6v4';
		}
	}
	
	function getNotificationColor(type: string): string {
		switch (type) {
			case 'event':
				return 'from-purple-500 to-purple-600';
			case 'follow':
				return 'from-blue-500 to-blue-600';
			case 'like':
				return 'from-red-500 to-red-600';
			case 'comment':
				return 'from-green-500 to-green-600';
			case 'system':
				return 'from-gray-500 to-gray-600';
			default:
				return 'from-cyan-500 to-cyan-600';
		}
	}
	
	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		
		return date.toLocaleDateString();
	}
	
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="relative" bind:this={dropdownElement}>
	<!-- Notification Bell Button -->
	<button
		on:click={toggleDropdown}
		class="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group {showDropdown ? 'bg-white/10' : ''}"
		aria-label="Notifications"
	>
		<!-- Bell Icon -->
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V5a2 2 0 012-2h6l6 6v4" />
		</svg>
		
		<!-- Notification Badge -->
		{#if hasUnread}
			<div
				class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1"
				in:scale={{ duration: 200, easing: quintOut }}
			>
				{unreadCount > 99 ? '99+' : unreadCount}
			</div>
		{/if}
		
		<!-- Pulse Animation for New Notifications -->
		{#if hasUnread}
			<div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-20" />
		{/if}
	</button>

	<!-- Notification Dropdown -->
	{#if showDropdown}
		<div
			class="absolute right-0 top-full mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
			transition:fly={{ y: -10, duration: 200, easing: quintOut }}
		>
			<!-- Header -->
			<div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
				<h3 class="text-sm font-semibold text-white">Notifications</h3>
				{#if hasUnread}
					<button
						on:click={markAllAsRead}
						class="text-xs text-purple-400 hover:text-purple-300 transition-colors duration-200"
					>
						Mark all read
					</button>
				{/if}
			</div>

			<!-- Notifications List -->
			<div class="max-h-80 overflow-y-auto">
				{#if notifications.length > 0}
					{#each notifications.slice(0, 10) as notification, index}
						<div
							class="notification-item"
							class:unread={!notification.read}
							in:fly={{ x: -10, duration: 150, delay: index * 30, easing: quintOut }}
						>
							<!-- Icon -->
							<div class="flex-shrink-0">
								<div class="w-10 h-10 bg-gradient-to-br {getNotificationColor(notification.type)} rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
										<path d={getNotificationIcon(notification.type)} />
									</svg>
								</div>
							</div>

							<!-- Content -->
							<div class="flex-1 min-w-0">
								<p class="text-sm text-white font-medium">{notification.title}</p>
								<p class="text-xs text-gray-400 mt-1 line-clamp-2">{notification.message}</p>
								<div class="flex items-center justify-between mt-2">
									<span class="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
									<div class="flex items-center space-x-1">
										{#if !notification.read}
											<button
												on:click={() => markAsRead(notification.id)}
												class="text-xs text-purple-400 hover:text-purple-300 transition-colors duration-200"
											>
												Mark read
											</button>
										{/if}
										<button
											on:click={() => deleteNotification(notification.id)}
											class="text-xs text-gray-500 hover:text-red-400 transition-colors duration-200"
											aria-label="Delete notification"
										>
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
												<path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
											</svg>
										</button>
									</div>
								</div>
							</div>

							<!-- Unread Indicator -->
							{#if !notification.read}
								<div class="absolute top-3 right-3 w-2 h-2 bg-purple-500 rounded-full" />
							{/if}
						</div>
					{/each}
					
					<!-- View All Link -->
					{#if notifications.length > 10}
						<div class="border-t border-white/10 p-3">
							<a
								href="/notifications"
								class="block w-full text-center text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200"
								on:click={closeDropdown}
							>
								View all notifications ({notifications.length})
							</a>
						</div>
					{/if}
				{:else}
					<!-- Empty State -->
					<div class="p-8 text-center">
						<svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
						</svg>
						<p class="text-sm text-gray-400">No notifications yet</p>
						<p class="text-xs text-gray-500 mt-1">You'll see updates about events, artists, and more here</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.notification-item {
		@apply relative flex items-start space-x-3 p-4 hover:bg-white/5 transition-colors duration-200 cursor-pointer;
	}
	
	.notification-item.unread {
		@apply bg-purple-500/5 border-l-2 border-purple-500;
	}
	
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
