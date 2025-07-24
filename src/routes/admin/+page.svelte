<!--
Admin Dashboard
===============
Main admin dashboard with overview statistics and quick actions
-->

<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { user, isAdmin } from '$lib/stores/auth-enhanced'
	import { adminService } from '$lib/utils/admin-service'
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte'
	import { 
		Users, 
		Calendar, 
		TrendingUp, 
		AlertCircle,
		CheckCircle,
		Clock,
		BarChart3,
		Activity,
		Shield,
		Plus,
		Eye,
		Trash2
	} from 'lucide-svelte'
	import { formatDistanceToNow, format } from 'date-fns'
	import type { AdminStats, AdminActivity, AdminEvent } from '$lib/utils/admin-service'

	// State
	let loading = true
	let error: string | null = null
	let stats: AdminStats = {
		totalUsers: 0,
		totalEvents: 0,
		pendingEvents: 0,
		activeEvents: 0,
		todayRegistrations: 0,
		todayEvents: 0,
		growthStats: {
			usersGrowth: 0,
			eventsGrowth: 0
		}
	}
	let recentActivity: AdminActivity[] = []
	let pendingEvents: AdminEvent[] = []

	// Functions
	async function loadDashboardData() {
		try {
			loading = true
			error = null

			// Load data using admin service
			await Promise.all([
				loadStats(),
				loadRecentActivity(),
				loadPendingEvents()
			])

		} catch (err) {
			console.error('Failed to load dashboard data:', err)
			error = (err as Error).message
		} finally {
			loading = false
		}
	}

	async function loadStats() {
		try {
			stats = await adminService.getStats()
		} catch (err) {
			console.warn('Failed to load stats:', err)
			// Keep default empty stats
		}
	}

	async function loadRecentActivity() {
		try {
			recentActivity = await adminService.getRecentActivity()
		} catch (err) {
			console.warn('Failed to load recent activity:', err)
			recentActivity = []
		}
	}

	async function loadPendingEvents() {
		try {
			pendingEvents = await adminService.getPendingEvents()
		} catch (err) {
			console.warn('Failed to load pending events:', err)
			pendingEvents = []
		}
	}

	async function approveEvent(eventId: string) {
		try {
			const result = await adminService.approveEvent(eventId)
			if (result.error) {
				console.error('Failed to approve event:', result.error)
			} else {
				// Reload data on success
				await loadDashboardData()
			}
		} catch (err) {
			console.error('Failed to approve event:', err)
		}
	}

	async function rejectEvent(eventId: string) {
		try {
			const result = await adminService.rejectEvent(eventId)
			if (result.error) {
				console.error('Failed to reject event:', result.error)
			} else {
				// Reload data on success
				await loadDashboardData()
			}
		} catch (err) {
			console.error('Failed to reject event:', err)
		}
	}

	function getActivityIcon(type: string) {
		switch (type) {
			case 'user_registered': return Users
			case 'event_created': return Plus
			case 'event_published': return CheckCircle
			case 'event_cancelled': return AlertCircle
			default: return Activity
		}
	}

	function getActivityColor(type: string) {
		switch (type) {
			case 'user_registered': return 'text-blue-600 bg-blue-100'
			case 'event_created': return 'text-yellow-600 bg-yellow-100'
			case 'event_published': return 'text-green-600 bg-green-100'
			case 'event_cancelled': return 'text-red-600 bg-red-100'
			default: return 'text-gray-600 bg-gray-100'
		}
	}

	// Lifecycle
	onMount(() => {
		loadDashboardData()
	})
</script>

<svelte:head>
	<title>Admin Dashboard - RaveTracker</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-8">
	<h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
	<p class="text-gray-600">
		Welcome back, {$user?.email || 'Admin'}. Here's what's happening on your platform.
	</p>
	
	<!-- RLS Warning Banner -->
	<div class="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
		<div class="flex">
			<AlertCircle class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
			<div class="flex-1">
				<h3 class="text-sm font-medium text-yellow-800 mb-1">Database Policy Notice</h3>
				<p class="text-sm text-yellow-700">
					The events table has Row Level Security policy conflicts. Currently displaying demo data for events-related statistics and pending events. User data is loading normally.
				</p>
			</div>
		</div>
	</div>
</div>

{#if loading}
	<LoadingSpinner variant="card" count={4} />
{:else if error}
	<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
		<div class="flex">
			<AlertCircle class="w-5 h-5 text-red-600 mr-2" />
			<div class="flex-1">
				<h3 class="text-sm font-medium text-red-800 mb-1">Loading Error</h3>
				<p class="text-sm text-red-700">{error}</p>
				<button
					on:click={loadDashboardData}
					class="mt-2 text-sm text-red-600 underline hover:text-red-700"
				>
					Try again
				</button>
			</div>
		</div>
	</div>
{:else}
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<!-- Total Users -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Users</p>
					<p class="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
					{#if stats.growthStats.usersGrowth !== 0}
						<p class="text-sm text-green-600 mt-1">
							+{stats.growthStats.usersGrowth.toFixed(1)}% from last week
						</p>
					{/if}
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<Users class="w-6 h-6 text-blue-600" />
				</div>
			</div>
		</div>

		<!-- Total Events -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
			<div class="absolute top-2 right-2">
				<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
					Demo
				</span>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Events</p>
					<p class="text-3xl font-bold text-gray-900">{stats.totalEvents.toLocaleString()}</p>
					{#if stats.growthStats.eventsGrowth !== 0}
						<p class="text-sm text-green-600 mt-1">
							+{stats.growthStats.eventsGrowth.toFixed(1)}% from last week
						</p>
					{/if}
				</div>
				<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
					<Calendar class="w-6 h-6 text-purple-600" />
				</div>
			</div>
		</div>

		<!-- Pending Events -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
			<div class="absolute top-2 right-2">
				<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
					Demo
				</span>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Pending Approval</p>
					<p class="text-3xl font-bold text-gray-900">{stats.pendingEvents}</p>
					<p class="text-sm text-yellow-600 mt-1">Requires review</p>
				</div>
				<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
					<Clock class="w-6 h-6 text-yellow-600" />
				</div>
			</div>
		</div>

		<!-- Active Events -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
			<div class="absolute top-2 right-2">
				<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
					Demo
				</span>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Active Events</p>
					<p class="text-3xl font-bold text-gray-900">{stats.activeEvents}</p>
					<p class="text-sm text-green-600 mt-1">Currently live</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<TrendingUp class="w-6 h-6 text-green-600" />
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Pending Events -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200">
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<h2 class="text-lg font-semibold text-gray-900">Pending Events</h2>
						<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
							Demo Data
						</span>
					</div>
					<a
						href="/admin/events"
						class="text-sm text-purple-600 hover:text-purple-700"
					>
						View all
					</a>
				</div>
			</div>

			<div class="p-6">
				{#if pendingEvents.length === 0}
					<div class="text-center py-8">
						<CheckCircle class="w-12 h-12 text-green-400 mx-auto mb-4" />
						<h3 class="text-sm font-medium text-gray-900 mb-2">All caught up!</h3>
						<p class="text-sm text-gray-500">No events pending approval</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each pendingEvents as event}
							<div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
								<div class="flex-1 min-w-0">
									<h3 class="text-sm font-medium text-gray-900 truncate">
										{event.title}
									</h3>
									<p class="text-sm text-gray-600 mt-1">
										ID: {event.organizer_id}
									</p>
									<p class="text-xs text-gray-500 mt-1">
										{format(new Date(event.date_time), 'MMM d, yyyy • HH:mm')}
									</p>
								</div>
								
								<div class="flex items-center space-x-2">
									<button
										on:click={() => approveEvent(event.id)}
										class="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
										title="Approve"
									>
										<CheckCircle class="w-4 h-4" />
									</button>
									<button
										on:click={() => goto(`/admin/events?event=${event.id}`)}
										class="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
										title="View Details"
									>
										<Eye class="w-4 h-4" />
									</button>
									<button
										on:click={() => rejectEvent(event.id)}
										class="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
										title="Reject"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200">
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
					<button class="text-sm text-purple-600 hover:text-purple-700">
						View all
					</button>
				</div>
			</div>

			<div class="p-6">
				{#if recentActivity.length === 0}
					<div class="text-center py-8">
						<Activity class="w-12 h-12 text-gray-300 mx-auto mb-4" />
						<h3 class="text-sm font-medium text-gray-900 mb-2">No recent activity</h3>
						<p class="text-sm text-gray-500">Activity will appear here as it happens</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each recentActivity as activity}
							<div class="flex items-start space-x-3">
								<div class="w-8 h-8 rounded-full flex items-center justify-center {getActivityColor(activity.type)}">
									<svelte:component 
										this={getActivityIcon(activity.type)} 
										class="w-4 h-4" 
									/>
								</div>
								
								<div class="flex-1 min-w-0">
									<p class="text-sm text-gray-900">{activity.description}</p>
									<p class="text-xs text-gray-500 mt-1">
										{formatDistanceToNow(activity.timestamp)} ago
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
		
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<a
				href="/admin/users"
				class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
			>
				<Users class="w-5 h-5 text-blue-600 mr-3" />
				<span class="text-sm font-medium text-gray-900">Manage Users</span>
			</a>
			
			<a
				href="/admin/events"
				class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
			>
				<Calendar class="w-5 h-5 text-purple-600 mr-3" />
				<span class="text-sm font-medium text-gray-900">Moderate Events</span>
			</a>
			
			<a
				href="/admin/analytics"
				class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
			>
				<BarChart3 class="w-5 h-5 text-green-600 mr-3" />
				<span class="text-sm font-medium text-gray-900">View Analytics</span>
			</a>
			
			{#if $isAdmin}
				<a
					href="/admin/settings"
					class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
				>
					<Shield class="w-5 h-5 text-red-600 mr-3" />
					<span class="text-sm font-medium text-gray-900">System Settings</span>
				</a>
			{/if}
		</div>
	</div>
{/if}
