<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user';
	
	export let user: any;
	
	const dispatch = createEventDispatcher();
	
	let dropdownOpen = false;
	let dropdownElement: HTMLElement;
	
	$: userInitials = getUserInitials(user);
	$: userRole = user?.user_metadata?.role || user?.role || 'user';
	
	function getUserInitials(user: any): string {
		if (!user) return 'U';
		
		const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || '';
		const nameParts = name.split(' ');
		
		if (nameParts.length >= 2) {
			return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
		} else if (nameParts[0]) {
			return nameParts[0].slice(0, 2).toUpperCase();
		}
		
		return 'U';
	}
	
	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}
	
	function closeDropdown() {
		dropdownOpen = false;
	}
	
	async function handleLogout() {
		try {
			// Call your logout function here
			await userStore.logout();
			closeDropdown();
			goto('/');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
	
	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			closeDropdown();
		}
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDropdown();
		}
	}
	
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
	
	const menuItems = [
		{
			label: 'Profile',
			href: '/profile',
			icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
		},
		{
			label: 'Settings',
			href: '/settings',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
		},
		{
			label: 'My Events',
			href: '/my-events',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
		},
		{
			label: 'Favorites',
			href: '/favorites',
			icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
		}
	];
	
	$: adminItems = userRole === 'admin' || userRole === 'super_admin' ? [
		{
			label: 'Admin Panel',
			href: '/admin',
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
		}
	] : [];
</script>

<div class="relative" bind:this={dropdownElement}>
	<!-- User Avatar Button -->
	<button
		on:click={toggleDropdown}
		class="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group {dropdownOpen ? 'bg-white/10' : ''}"
		aria-label="User menu"
	>
		<!-- Avatar -->
		<div class="relative">
			<div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-200">
				{userInitials}
			</div>
			<!-- Online Status Indicator -->
			<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
		</div>
		
		<!-- User Info (Desktop) -->
		<div class="hidden sm:block text-left">
			<p class="text-sm font-medium text-white">
				{user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
			</p>
			<p class="text-xs text-gray-400 capitalize">{userRole}</p>
		</div>
		
		<!-- Dropdown Arrow -->
		<svg
			class="w-4 h-4 text-gray-400 transition-transform duration-200"
			class:rotate-180={dropdownOpen}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Dropdown Menu -->
	{#if dropdownOpen}
		<div
			class="absolute right-0 top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50"
			transition:fly={{ y: -10, duration: 200, easing: quintOut }}
		>
			<!-- User Info Header -->
			<div class="px-4 py-3 border-b border-white/10">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
						{userInitials}
					</div>
					<div>
						<p class="text-sm font-medium text-white">
							{user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
						</p>
						<p class="text-xs text-gray-400">{user?.email}</p>
						<div class="flex items-center space-x-1 mt-1">
							<span class="inline-block w-2 h-2 bg-green-400 rounded-full" />
							<span class="text-xs text-gray-400 capitalize">{userRole}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Menu Items -->
			<div class="py-2">
				{#each menuItems as item, index}
					<a
						href={item.href}
						class="dropdown-item"
						on:click={closeDropdown}
						in:fly={{ x: -10, duration: 150, delay: index * 30, easing: quintOut }}
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d={item.icon} />
						</svg>
						<span>{item.label}</span>
					</a>
				{/each}
				
				<!-- Admin Items -->
				{#each adminItems as item, index}
					<a
						href={item.href}
						class="dropdown-item admin"
						on:click={closeDropdown}
						in:fly={{ x: -10, duration: 150, delay: (menuItems.length + index) * 30, easing: quintOut }}
					>
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d={item.icon} />
						</svg>
						<span>{item.label}</span>
						<span class="admin-badge">Admin</span>
					</a>
				{/each}
			</div>

			<!-- Logout -->
			<div class="border-t border-white/10 py-2">
				<button
					on:click={handleLogout}
					class="dropdown-item logout w-full text-left"
					in:fly={{ x: -10, duration: 150, delay: (menuItems.length + adminItems.length) * 30, easing: quintOut }}
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
					<span>Sign Out</span>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.dropdown-item {
		@apply flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200;
	}
	
	.dropdown-item:hover svg {
		@apply transform scale-110;
	}
	
	.dropdown-item.admin {
		@apply relative;
	}
	
	.dropdown-item.logout {
		@apply text-red-400 hover:text-red-300 hover:bg-red-500/10;
	}
	
	.admin-badge {
		@apply ml-auto px-2 py-1 text-xs bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-full;
	}
</style>
