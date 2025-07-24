<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { userStore } from '$lib/stores/user';
	import { notificationStore } from '$lib/stores/notifications';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	
	let sidebarOpen = false;
	let pageLoading = false;
	
	// Subscribe to stores
	$: user = $userStore;
	$: currentPath = $page.url.pathname;
	
	// Determine if sidebar should be shown
	$: showSidebar = user && !isAuthPage(currentPath);
	
	function isAuthPage(path: string): boolean {
		return path.startsWith('/auth/') || path === '/auth';
	}
	
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
	
	function closeSidebar() {
		sidebarOpen = false;
	}
	
	// Handle route changes
	$: {
		if (currentPath) {
			pageLoading = false;
			closeSidebar();
		}
	}
	
	// Initialize stores on mount
	onMount(async () => {
		// Initialize user store
		await userStore.initialize();
		
		// Load mock notifications for demo
		if ($userStore) {
			notificationStore.addNotification({
				type: 'event',
				title: 'New Event Alert',
				message: 'Tomorrowland 2024 tickets are now available!',
				timestamp: new Date().toISOString()
			});
			
			notificationStore.addNotification({
				type: 'follow',
				title: 'New Follower',
				message: 'DJ Martin Garrix started following you',
				timestamp: new Date(Date.now() - 3600000).toISOString()
			});
		}
	});
	
	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Toggle sidebar with Ctrl/Cmd + B
		if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
			event.preventDefault();
			if (showSidebar) {
				toggleSidebar();
			}
		}
		
		// Close modals with Escape
		if (event.key === 'Escape') {
			closeSidebar();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
	<!-- Background Pattern -->
	<div class="fixed inset-0 opacity-20">
		<div class="absolute inset-0" style="background-image: radial-gradient(circle at 25px 25px, rgba(255,255,255,.1) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255,255,255,.05) 2px, transparent 0); background-size: 100px 100px;" />
	</div>
	
	<!-- Header -->
	<Header />
	
	<!-- Sidebar -->
	{#if showSidebar}
		<Sidebar bind:isOpen={sidebarOpen} />
	{/if}
	
	<!-- Sidebar Toggle Button (Desktop) -->
	{#if showSidebar}
		<button
			on:click={toggleSidebar}
			class="fixed left-4 top-20 z-30 p-2 bg-gray-900/80 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-gray-800/80 transition-all duration-200 hidden lg:block"
			class:translate-x-80={sidebarOpen}
			aria-label="Toggle sidebar"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if sidebarOpen}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
				{/if}
			</svg>
		</button>
	{/if}
	
	<!-- Sidebar Overlay (Mobile) -->
	{#if sidebarOpen && showSidebar}
		<div
			class="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
			on:click={closeSidebar}
			on:keydown={(e) => e.key === 'Enter' && closeSidebar()}
			role="button"
			tabindex="0"
		/>
	{/if}
	
	<!-- Main Content -->
	<main
		class="relative z-10 pt-16 min-h-screen transition-all duration-300"
		class:lg:pl-80={sidebarOpen && showSidebar}
	>
		<!-- Page Loading Indicator -->
		{#if pageLoading}
			<div class="fixed top-16 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 animate-pulse z-50" />
		{/if}
		
		<!-- Page Content -->
		<div class="relative">
			<slot />
		</div>
		
		<!-- Footer -->
		<footer class="relative mt-20 border-t border-white/10 bg-black/20 backdrop-blur-sm">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
					<!-- Brand -->
					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
								</svg>
							</div>
							<h3 class="text-lg font-bold text-white">RaveTracker</h3>
						</div>
						<p class="text-sm text-gray-400">
							The ultimate platform for electronic music events, artists, and venues.
						</p>
						<div class="flex space-x-4">
							<a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">
								<span class="sr-only">Twitter</span>
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
								</svg>
							</a>
							<a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">
								<span class="sr-only">Instagram</span>
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path fill-rule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323C6.001 8.198 7.152 7.708 8.449 7.708s2.448.49 3.323 1.416c.875.875 1.416 2.026 1.416 3.323s-.541 2.448-1.416 3.323c-.875.807-2.026 1.218-3.323 1.218z" clip-rule="evenodd" />
								</svg>
							</a>
							<a href="#" class="text-gray-400 hover:text-white transition-colors duration-200">
								<span class="sr-only">Discord</span>
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
								</svg>
							</a>
						</div>
					</div>
					
					<!-- Quick Links -->
					<div class="space-y-4">
						<h4 class="text-sm font-semibold text-white">Platform</h4>
						<ul class="space-y-2 text-sm">
							<li><a href="/events" class="text-gray-400 hover:text-white transition-colors duration-200">Events</a></li>
							<li><a href="/artists" class="text-gray-400 hover:text-white transition-colors duration-200">Artists</a></li>
							<li><a href="/venues" class="text-gray-400 hover:text-white transition-colors duration-200">Venues</a></li>
							<li><a href="/community" class="text-gray-400 hover:text-white transition-colors duration-200">Community</a></li>
						</ul>
					</div>
					
					<!-- Resources -->
					<div class="space-y-4">
						<h4 class="text-sm font-semibold text-white">Resources</h4>
						<ul class="space-y-2 text-sm">
							<li><a href="/help" class="text-gray-400 hover:text-white transition-colors duration-200">Help Center</a></li>
							<li><a href="/api" class="text-gray-400 hover:text-white transition-colors duration-200">API Docs</a></li>
							<li><a href="/blog" class="text-gray-400 hover:text-white transition-colors duration-200">Blog</a></li>
							<li><a href="/status" class="text-gray-400 hover:text-white transition-colors duration-200">Status</a></li>
						</ul>
					</div>
					
					<!-- Legal -->
					<div class="space-y-4">
						<h4 class="text-sm font-semibold text-white">Legal</h4>
						<ul class="space-y-2 text-sm">
							<li><a href="/privacy" class="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</a></li>
							<li><a href="/terms" class="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</a></li>
							<li><a href="/cookies" class="text-gray-400 hover:text-white transition-colors duration-200">Cookie Policy</a></li>
							<li><a href="/contact" class="text-gray-400 hover:text-white transition-colors duration-200">Contact</a></li>
						</ul>
					</div>
				</div>
				
				<div class="mt-8 pt-8 border-t border-white/10">
					<p class="text-center text-sm text-gray-400">
						© 2024 RaveTracker. All rights reserved. Made with ❤️ for the electronic music community.
					</p>
				</div>
			</div>
		</footer>
	</main>
</div>
