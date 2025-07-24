<script lang="ts">
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import { userStore } from '$lib/stores/user';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	
	export let mobile = false;
	
	const dispatch = createEventDispatcher();
	
	$: user = $userStore;
	$: currentPath = $page.url.pathname;
	
	// Navigation items based on user role
	$: navigationItems = getNavigationItems(user);
	
	function getNavigationItems(user: any) {
		const baseItems = [
			{
				label: 'Dashboard',
				href: '/dashboard',
				icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-2 2V6H5v14h6.586l-2 2H4a1 1 0 01-1-1V4z',
				public: false
			},
			{
				label: 'Events',
				href: '/events',
				icon: 'M8 7V3a1 1 0 012 0v4h4a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z',
				public: true
			},
			{
				label: 'Artists',
				href: '/artists',
				icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
				public: true
			},
			{
				label: 'Venues',
				href: '/venues',
				icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
				public: true
			},
			{
				label: 'Community',
				href: '/community',
				icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
				public: true
			}
		];
		
		const userItems = [
			{
				label: 'My Events',
				href: '/my-events',
				icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
				public: false
			},
			{
				label: 'Favorites',
				href: '/favorites',
				icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
				public: false
			},
			{
				label: 'Profile',
				href: '/profile',
				icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
				public: false
			}
		];
		
		const adminItems = [
			{
				label: 'Admin',
				href: '/admin',
				icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
				public: false,
				adminOnly: true
			}
		];
		
		let items = [...baseItems];
		
		if (user) {
			items = [...items, ...userItems];
			
			if (user.role === 'admin' || user.role === 'super_admin') {
				items = [...items, ...adminItems];
			}
		}
		
		return items.filter(item => item.public || user);
	}
	
	function isActive(href: string): boolean {
		if (href === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(href);
	}
	
	function handleNavigate() {
		if (mobile) {
			dispatch('navigate');
		}
	}
</script>

<nav class={mobile ? 'mobile-nav' : 'desktop-nav'}>
	{#if mobile}
		<!-- Mobile Navigation -->
		<div class="space-y-2">
			{#each navigationItems as item, index}
				<div
					in:fly={{ x: -20, duration: 200, delay: index * 50, easing: quintOut }}
				>
					<a
						href={item.href}
						class="nav-item mobile"
						class:active={isActive(item.href)}
						on:click={handleNavigate}
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d={item.icon} />
						</svg>
						<span>{item.label}</span>
						
						{#if isActive(item.href)}
							<div class="active-indicator" />
						{/if}
					</a>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Desktop Navigation -->
		<div class="flex items-center space-x-1">
			{#each navigationItems as item}
				<a
					href={item.href}
					class="nav-item desktop"
					class:active={isActive(item.href)}
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d={item.icon} />
					</svg>
					<span>{item.label}</span>
					
					{#if isActive(item.href)}
						<div class="active-indicator" />
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</nav>

<style>
	.nav-item {
		@apply relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200;
	}
	
	.nav-item.desktop {
		@apply text-gray-300 hover:text-white hover:bg-white/10;
	}
	
	.nav-item.mobile {
		@apply text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3;
	}
	
	.nav-item.active {
		@apply text-white bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30;
	}
	
	.active-indicator {
		@apply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full;
	}
	
	.nav-item.mobile .active-indicator {
		@apply top-1/2 -translate-y-1/2 left-1 w-1 h-6;
	}
	
	.nav-item svg {
		@apply flex-shrink-0;
	}
	
	.nav-item:hover svg {
		@apply transform scale-110;
	}
	
	.nav-item.active svg {
		@apply text-purple-400;
	}
</style>
