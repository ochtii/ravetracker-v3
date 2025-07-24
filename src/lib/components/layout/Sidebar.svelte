<script lang="ts">
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { userStore } from '$lib/stores/user';
	
	export let isOpen = false;
	
	$: user = $userStore;
	$: currentPath = $page.url.pathname;
	
	// Quick actions for authenticated users
	$: quickActions = user ? [
		{
			label: 'Create Event',
			href: '/events/create',
			icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
			color: 'from-purple-500 to-purple-600'
		},
		{
			label: 'Add Artist',
			href: '/artists/create',
			icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
			color: 'from-blue-500 to-blue-600'
		},
		{
			label: 'List Venue',
			href: '/venues/create',
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
			color: 'from-green-500 to-green-600'
		}
	] : [];
	
	// Recent activity items
	$: recentActivity = [
		{
			type: 'event',
			title: 'Tomorrowland 2024',
			subtitle: 'Added to favorites',
			time: '2 hours ago',
			href: '/events/tomorrowland-2024'
		},
		{
			type: 'artist',
			title: 'David Guetta',
			subtitle: 'New album released',
			time: '1 day ago',
			href: '/artists/david-guetta'
		},
		{
			type: 'venue',
			title: 'Privilege Ibiza',
			subtitle: 'Upcoming events',
			time: '3 days ago',
			href: '/venues/privilege-ibiza'
		}
	];
	
	// Trending categories
	const trendingCategories = [
		{ name: 'House', count: 142, href: '/events?genre=house' },
		{ name: 'Techno', count: 98, href: '/events?genre=techno' },
		{ name: 'Trance', count: 76, href: '/events?genre=trance' },
		{ name: 'Progressive', count: 54, href: '/events?genre=progressive' }
	];
	
	function isActive(href: string): boolean {
		return currentPath.startsWith(href);
	}
	
	function getActivityIcon(type: string): string {
		switch (type) {
			case 'event':
				return 'M8 7V3a1 1 0 012 0v4h4a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z';
			case 'artist':
				return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
			case 'venue':
				return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
			default:
				return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}
</script>

{#if isOpen}
	<aside
		class="fixed left-0 top-16 bottom-0 w-80 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 z-40 overflow-y-auto"
		transition:fly={{ x: -320, duration: 300, easing: quintOut }}
	>
		<div class="p-6 space-y-8">
			<!-- Quick Actions -->
			{#if user && quickActions.length > 0}
				<section>
					<h3 class="text-sm font-semibold text-white mb-4 flex items-center">
						<svg class="w-4 h-4 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
							<path d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						Quick Actions
					</h3>
					<div class="space-y-2">
						{#each quickActions as action, index}
							<a
								href={action.href}
								class="quick-action"
								in:fly={{ x: -20, duration: 200, delay: index * 50, easing: quintOut }}
							>
								<div class="w-10 h-10 bg-gradient-to-br {action.color} rounded-lg flex items-center justify-center">
									<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={action.icon} />
									</svg>
								</div>
								<span class="text-sm font-medium text-white">{action.label}</span>
								<svg class="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Trending Categories -->
			<section>
				<h3 class="text-sm font-semibold text-white mb-4 flex items-center">
					<svg class="w-4 h-4 mr-2 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
						<path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
					</svg>
					Trending Genres
				</h3>
				<div class="space-y-2">
					{#each trendingCategories as category, index}
						<a
							href={category.href}
							class="category-item"
							in:fly={{ x: -20, duration: 200, delay: index * 50, easing: quintOut }}
						>
							<span class="text-sm text-white">{category.name}</span>
							<span class="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full ml-auto">
								{category.count}
							</span>
						</a>
					{/each}
				</div>
			</section>

			<!-- Recent Activity -->
			{#if user}
				<section>
					<h3 class="text-sm font-semibold text-white mb-4 flex items-center">
						<svg class="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
						</svg>
						Recent Activity
					</h3>
					<div class="space-y-3">
						{#each recentActivity as activity, index}
							<a
								href={activity.href}
								class="activity-item"
								in:fly={{ x: -20, duration: 200, delay: index * 50, easing: quintOut }}
							>
								<div class="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
									<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
										<path d={getActivityIcon(activity.type)} />
									</svg>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm text-white font-medium truncate">{activity.title}</p>
									<p class="text-xs text-gray-400 truncate">{activity.subtitle}</p>
									<p class="text-xs text-gray-500">{activity.time}</p>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Stats Overview -->
			{#if user}
				<section>
					<h3 class="text-sm font-semibold text-white mb-4 flex items-center">
						<svg class="w-4 h-4 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
							<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						Your Stats
					</h3>
					<div class="grid grid-cols-2 gap-3">
						<div class="stat-card">
							<div class="text-2xl font-bold text-white">12</div>
							<div class="text-xs text-gray-400">Events Attended</div>
						</div>
						<div class="stat-card">
							<div class="text-2xl font-bold text-white">8</div>
							<div class="text-xs text-gray-400">Favorites</div>
						</div>
						<div class="stat-card">
							<div class="text-2xl font-bold text-white">24</div>
							<div class="text-xs text-gray-400">Following</div>
						</div>
						<div class="stat-card">
							<div class="text-2xl font-bold text-white">156</div>
							<div class="text-xs text-gray-400">Points</div>
						</div>
					</div>
				</section>
			{/if}

			<!-- Footer Links -->
			<section class="pt-4 border-t border-white/10">
				<div class="grid grid-cols-2 gap-2 text-xs">
					<a href="/about" class="footer-link">About</a>
					<a href="/help" class="footer-link">Help</a>
					<a href="/privacy" class="footer-link">Privacy</a>
					<a href="/terms" class="footer-link">Terms</a>
				</div>
				<div class="mt-4 text-center">
					<p class="text-xs text-gray-500">RaveTracker v3.0</p>
					<p class="text-xs text-gray-600">© 2024 All rights reserved</p>
				</div>
			</section>
		</div>
	</aside>
{/if}

<style>
	.quick-action {
		@apply flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-200;
	}
	
	.quick-action:hover svg {
		@apply transform scale-110;
	}
	
	.category-item {
		@apply flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors duration-200;
	}
	
	.activity-item {
		@apply flex items-start space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200;
	}
	
	.stat-card {
		@apply bg-white/5 rounded-lg p-3 text-center;
	}
	
	.footer-link {
		@apply text-gray-400 hover:text-white transition-colors duration-200 p-1;
	}
</style>
