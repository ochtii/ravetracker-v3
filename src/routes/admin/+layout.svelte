<!--
Admin Panel Layout
=================
Main layout for admin panel with navigation and access control
-->

<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { user, isAdmin, isOrganizer } from '$lib/stores/auth-enhanced'
	import { realtimeActions } from '$lib/stores/realtime'
	import ConnectionStatus from '$lib/components/ui/ConnectionStatus.svelte'
	import LiveNotifications from '$lib/components/ui/LiveNotifications.svelte'
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte'
	import { 
		LayoutDashboard, 
		Users, 
		Calendar, 
		BarChart3, 
		Settings, 
		Shield, 
		Bell,
		Menu,
		X,
		LogOut,
		Home,
		ChevronRight,
		AlertTriangle
	} from 'lucide-svelte'

	// State
	let sidebarOpen = false
	let loading = true
	let accessDenied = false

	// Navigation items
	const navigationItems = [
		{
			name: 'Dashboard',
			href: '/admin',
			icon: LayoutDashboard,
			adminOnly: false
		},
		{
			name: 'User Management',
			href: '/admin/users',
			icon: Users,
			adminOnly: true
		},
		{
			name: 'Event Moderation',
			href: '/admin/events',
			icon: Calendar,
			adminOnly: false
		},
		{
			name: 'Analytics',
			href: '/admin/analytics',
			icon: BarChart3,
			adminOnly: false
		},
		{
			name: 'System Settings',
			href: '/admin/settings',
			icon: Settings,
			adminOnly: true
		},
		{
			name: 'Role Management',
			href: '/admin/roles',
			icon: Shield,
			adminOnly: true
		}
	]

	// Reactive statements
	$: currentPath = $page.url.pathname
	$: userRole = $user?.role || 'user'
	$: hasAdminAccess = $isAdmin
	$: hasOrganizerAccess = $isOrganizer || $isAdmin
	$: filteredNavigation = navigationItems.filter(item => 
		!item.adminOnly || hasAdminAccess
	)

	// Functions
	function isActiveRoute(href: string): boolean {
		if (href === '/admin') {
			return currentPath === '/admin'
		}
		return currentPath.startsWith(href)
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen
	}

	function closeSidebar() {
		sidebarOpen = false
	}

	async function handleLogout() {
		// Implement logout logic
		await goto('/login')
	}

	function getBreadcrumbs() {
		const segments = currentPath.split('/').filter(Boolean)
		const breadcrumbs = [
			{ name: 'Home', href: '/' }
		]

		let path = ''
		segments.forEach((segment, index) => {
			path += `/${segment}`
			
			if (segment === 'admin') {
				breadcrumbs.push({ name: 'Admin', href: '/admin' })
			} else if (index > 0) {
				const name = segment.charAt(0).toUpperCase() + segment.slice(1)
				breadcrumbs.push({ name, href: path })
			}
		})

		return breadcrumbs
	}

	// Access control
	function checkAccess() {
		if (!$user) {
			accessDenied = true
			loading = false
			return
		}

		// Check if user has any admin/organizer permissions
		if (!hasAdminAccess && !hasOrganizerAccess) {
			accessDenied = true
			loading = false
			return
		}

		// Check specific route permissions
		const currentRoute = navigationItems.find(item => 
			currentPath.startsWith(item.href)
		)

		if (currentRoute?.adminOnly && !hasAdminAccess) {
			accessDenied = true
			loading = false
			return
		}

		loading = false
	}

	// Lifecycle
	onMount(async () => {
		// Wait for auth to load
		if ($user === undefined) {
			const unsubscribe = user.subscribe(($user) => {
				if ($user !== undefined) {
					unsubscribe()
					checkAccess()
				}
			})
		} else {
			checkAccess()
		}

		// Enable admin real-time features
		await realtimeActions.enableRealtime()
	})

	// Watch for route changes
	$: if (currentPath) {
		checkAccess()
		closeSidebar()
	}
</script>

<svelte:head>
	<title>Admin Panel - RaveTracker</title>
	<meta name="description" content="Admin panel for RaveTracker platform management" />
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<LoadingSpinner variant="spinner" />
	</div>
{:else if accessDenied}
	<!-- Access Denied -->
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
			<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<AlertTriangle class="w-8 h-8 text-red-600" />
			</div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
			<p class="text-gray-600 mb-6">
				You don't have permission to access the admin panel. 
				Please contact an administrator if you believe this is an error.
			</p>
			<div class="space-y-3">
				<a
					href="/"
					class="block w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500"
				>
					Return to Home
				</a>
				<button
					on:click={handleLogout}
					class="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
				>
					Sign Out
				</button>
			</div>
		</div>
	</div>
{:else}
	<!-- Admin Panel Layout -->
	<div class="min-h-screen bg-gray-50 flex">
		<!-- Sidebar -->
		<div 
			class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0"
			class:-translate-x-full={!sidebarOpen}
			class:translate-x-0={sidebarOpen}
		>
			<!-- Sidebar Header -->
			<div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
				<div class="flex items-center space-x-2">
					<div class="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
						<Shield class="w-5 h-5 text-white" />
					</div>
					<span class="text-lg font-semibold text-gray-900">Admin Panel</span>
				</div>
				
				<button
					on:click={closeSidebar}
					class="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 px-4 py-6 space-y-2">
				{#each filteredNavigation as item}
					<a
						href={item.href}
						class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
						class:bg-purple-100={isActiveRoute(item.href)}
						class:text-purple-700={isActiveRoute(item.href)}
						class:text-gray-600={!isActiveRoute(item.href)}
						class:hover:bg-gray-100={!isActiveRoute(item.href)}
						class:hover:text-gray-900={!isActiveRoute(item.href)}
					>
						<svelte:component this={item.icon} class="w-5 h-5 mr-3" />
						{item.name}
						{#if item.adminOnly}
							<span class="ml-auto text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
								Admin
							</span>
						{/if}
					</a>
				{/each}
			</nav>

			<!-- User Info -->
			<div class="p-4 border-t border-gray-200">
				<div class="flex items-center space-x-3 mb-3">
					<div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
						<span class="text-sm font-medium text-gray-700">
							{$user?.email?.charAt(0).toUpperCase() || 'U'}
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-gray-900 truncate">
							{$user?.profile?.display_name || $user?.email}
						</p>
						<p class="text-xs text-gray-500 capitalize">{userRole}</p>
					</div>
				</div>
				
				<div class="flex items-center justify-between">
					<ConnectionStatus variant="minimal" />
					<button
						on:click={handleLogout}
						class="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 rounded"
						title="Sign Out"
					>
						<LogOut class="w-3 h-3" />
						<span class="hidden sm:inline">Sign Out</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Overlay for mobile -->
		{#if sidebarOpen}
			<div 
				class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
				on:click={closeSidebar}
				role="button"
				tabindex="0"
				on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
			></div>
		{/if}

		<!-- Main Content -->
		<div class="flex-1 flex flex-col min-w-0">
			<!-- Top Bar -->
			<header class="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
				<div class="flex items-center space-x-4">
					<!-- Mobile menu button -->
					<button
						on:click={toggleSidebar}
						class="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
					>
						<Menu class="w-5 h-5" />
					</button>

					<!-- Breadcrumbs -->
					<nav class="flex items-center space-x-2 text-sm">
						{#each getBreadcrumbs() as crumb, index}
							{#if index > 0}
								<ChevronRight class="w-4 h-4 text-gray-400" />
							{/if}
							<a
								href={crumb.href}
								class="text-gray-600 hover:text-gray-900"
								class:text-gray-900={index === getBreadcrumbs().length - 1}
								class:font-medium={index === getBreadcrumbs().length - 1}
							>
								{crumb.name}
							</a>
						{/each}
					</nav>
				</div>

				<!-- Top Bar Actions -->
				<div class="flex items-center space-x-4">
					<LiveNotifications variant="dropdown" />
					
					<a
						href="/"
						class="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
						title="Back to App"
					>
						<Home class="w-4 h-4" />
						<span class="hidden sm:inline">Back to App</span>
					</a>
				</div>
			</header>

			<!-- Page Content -->
			<main class="flex-1 overflow-auto">
				<div class="p-6">
					<slot />
				</div>
			</main>
		</div>
	</div>
{/if}

<style>
	/* Ensure sidebar scrolling works properly */
	nav {
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: #d1d5db #f9fafb;
	}

	nav::-webkit-scrollbar {
		width: 6px;
	}

	nav::-webkit-scrollbar-track {
		background: #f9fafb;
	}

	nav::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}

	nav::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>
