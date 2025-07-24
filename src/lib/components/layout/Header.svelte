<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Navigation from './Navigation.svelte';
	import UserDropdown from './UserDropdown.svelte';
	import SearchBar from './SearchBar.svelte';
	import NotificationBell from './NotificationBell.svelte';
	import { user } from '$lib/stores/auth';
	import { notificationStore } from '$lib/stores/notifications';
	
	let mobileMenuOpen = false;
	let searchVisible = false;
	let scrollY = 0;
	let headerElement: HTMLElement;
	
	// Subscribe to stores
	$: currentUser = $user;
	$: notifications = $notificationStore;
	$: unreadCount = notifications.filter(n => !n.read).length;
	
	// Header blur effect on scroll
	$: headerBlur = scrollY > 20;
	
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function toggleSearch() {
		searchVisible = !searchVisible;
	}
	
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			mobileMenuOpen = false;
			searchVisible = false;
		}
		// Search shortcut
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			toggleSearch();
		}
	}
	
	onMount(() => {
		// Close mobile menu on route change
		const unsubscribe = page.subscribe(() => {
			mobileMenuOpen = false;
		});
		
		return unsubscribe;
	});
</script>

<svelte:window bind:scrollY on:keydown={handleKeydown} />

<header
	bind:this={headerElement}
	class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
	class:glass-blur={headerBlur}
	class:bg-transparent={!headerBlur}
>
	<!-- Glassmorphism Background -->
	<div class="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-xl border-b border-white/10" />
	
	<!-- Header Content -->
	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo & Brand -->
			<div class="flex items-center space-x-4">
				<a href="/" class="flex items-center space-x-3 group">
					<div class="relative">
						<div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
							<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
							</svg>
						</div>
						<!-- Glow effect -->
						<div class="absolute inset-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-200" />
					</div>
					<div class="hidden sm:block">
						<h1 class="text-xl font-bold text-white">RaveTracker</h1>
						<p class="text-xs text-gray-300">v3.0</p>
					</div>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden lg:block">
				<Navigation />
			</div>

			<!-- Search Bar (Desktop) -->
			<div class="hidden md:block flex-1 max-w-md mx-8">
				<SearchBar />
			</div>

			<!-- Right Side Actions -->
			<div class="flex items-center space-x-4">
				<!-- Search Toggle (Mobile) -->
				<button
					on:click={toggleSearch}
					class="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
					aria-label="Toggle search"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</button>

				<!-- Notifications -->
				{#if currentUser}
					<NotificationBell {unreadCount} />
				{/if}

				<!-- User Dropdown -->
				{#if currentUser}
					<UserDropdown user={currentUser} />
				{:else}
					<div class="flex items-center space-x-2">
						<a
							href="/auth/login"
							class="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
						>
							Login
						</a>
						<a
							href="/auth/register"
							class="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105"
						>
							Sign Up
						</a>
					</div>
				{/if}

				<!-- Mobile Menu Toggle -->
				<button
					on:click={toggleMobileMenu}
					class="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
					aria-label="Toggle mobile menu"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if mobileMenuOpen}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						{/if}
					</svg>
				</button>
			</div>
		</div>

		<!-- Mobile Search Bar -->
		{#if searchVisible}
			<div
				class="md:hidden py-4 border-t border-white/10"
				transition:fly={{ y: -20, duration: 200, easing: quintOut }}
			>
				<SearchBar mobile />
			</div>
		{/if}
	</div>
</header>

<!-- Mobile Menu Overlay -->
{#if mobileMenuOpen}
	<div
		class="fixed inset-0 z-40 lg:hidden"
		transition:fade={{ duration: 200 }}
		on:click={closeMobileMenu}
		on:keydown={(e) => e.key === 'Enter' && closeMobileMenu()}
		role="button"
		tabindex="0"
	>
		<!-- Backdrop -->
		<div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
		
		<!-- Mobile Menu Panel -->
		<div
			class="fixed top-16 left-0 right-0 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl"
			transition:fly={{ y: -20, duration: 300, easing: quintOut }}
		>
			<div class="px-4 py-6 space-y-6">
				<!-- Mobile Navigation -->
				<Navigation mobile on:navigate={closeMobileMenu} />
				
				{#if !user}
					<!-- Auth Buttons for Mobile -->
					<div class="pt-6 border-t border-white/10 space-y-3">
						<a
							href="/auth/login"
							class="block w-full px-4 py-3 text-center text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-200"
							on:click={closeMobileMenu}
						>
							Login
						</a>
						<a
							href="/auth/register"
							class="block w-full px-4 py-3 text-center text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200"
							on:click={closeMobileMenu}
						>
							Sign Up
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.glass-blur {
		@apply bg-gray-900/80 backdrop-blur-xl border-b border-white/10;
	}
</style>
