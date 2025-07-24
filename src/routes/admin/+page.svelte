<!--
Admin Dashboard
===============
Main admin dashboard with overview statistics and quick actions
-->

<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { user, isAdmin } from '$lib/stores/auth-enhanced'
	import { db } from '$lib/utils/database'
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte'
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte'
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
		Edit,
		Trash2,
		MoreHorizontal
	} from 'lucide-svelte'
	import { formatDistanceToNow, format } from 'date-fns'

	// Types
	interface DashboardStats {
		totalUsers: number
		totalEvents: number
		pendingEvents: number
		activeEvents: number
		todayRegistrations: number
		todayEvents: number
		growthStats: {
			usersGrowth: number
			eventsGrowth: number
		}
	}

	interface RecentActivity {
		id: string
		type: 'user_registered' | 'event_created' | 'event_published' | 'event_cancelled'
		description: string
		user?: any
		event?: any
		timestamp: Date
	}

	// State
	let loading = true
	let error: string | null = null
	let stats: DashboardStats = {
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
	let recentActivity: RecentActivity[] = []
	let pendingEvents: any[] = []

	// Functions
	async function loadDashboardData() {
		try {
			loading = true
			error = null

			// Load basic statistics
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
		// Get total users
		const { data: usersData, error: usersError } = await db.supabase
			.from('profiles')
			.select('id, created_at')

		if (usersError) throw usersError

		// Get total events
		const { data: eventsData, error: eventsError } = await db.supabase
			.from('events')
			.select('id, status, created_at, date')

		if (eventsError) throw eventsError

		// Calculate stats
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

		stats.totalUsers = usersData?.length || 0
		stats.totalEvents = eventsData?.length || 0
		stats.pendingEvents = eventsData?.filter(e => e.status === 'draft').length || 0
		stats.activeEvents = eventsData?.filter(e => e.status === 'published' && new Date(e.date) > now).length || 0
		
		stats.todayRegistrations = usersData?.filter(u => 
			new Date(u.created_at) >= today
		).length || 0

		stats.todayEvents = eventsData?.filter(e => 
			new Date(e.created_at) >= today
		).length || 0

		// Growth calculations
		const usersLastWeek = usersData?.filter(u => 
			new Date(u.created_at) >= lastWeek && new Date(u.created_at) < today
		).length || 0

		const eventsLastWeek = eventsData?.filter(e => 
			new Date(e.created_at) >= lastWeek && new Date(e.created_at) < today
		).length || 0

		stats.growthStats.usersGrowth = usersLastWeek > 0 
			? ((stats.todayRegistrations - usersLastWeek) / usersLastWeek) * 100 
			: 0

		stats.growthStats.eventsGrowth = eventsLastWeek > 0 
			? ((stats.todayEvents - eventsLastWeek) / eventsLastWeek) * 100 
			: 0
	}

	async function loadRecentActivity() {
		// This would typically come from an activity log table
		// For now, we'll simulate recent activity
		const { data: recentUsers } = await db.supabase
			.from('profiles')
			.select('id, display_name, email, created_at')
			.order('created_at', { ascending: false })
			.limit(5)

		const { data: recentEvents } = await db.supabase
			.from('events')
			.select('id, title, status, created_at, organizer_id')
			.order('created_at', { ascending: false })
			.limit(5)

		const activities: RecentActivity[] = []

		// Add user registrations
		recentUsers?.forEach(user => {
			activities.push({
				id: `user-${user.id}`,
				type: 'user_registered',
				description: `New user registered: ${user.display_name || user.email}`,
				user,
				timestamp: new Date(user.created_at)
			})
		})

		// Add event activities
		recentEvents?.forEach(event => {
			activities.push({
				id: `event-${event.id}`,
				type: event.status === 'published' ? 'event_published' : 'event_created',
				description: `Event ${event.status === 'published' ? 'published' : 'created'}: ${event.title}`,
				event,
				timestamp: new Date(event.created_at)
			})
		})

		// Sort by timestamp
		recentActivity = activities
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, 10)
	}

	async function loadPendingEvents() {
		const { data, error } = await db.supabase
			.from('events')
			.select(`
				id,
				title,
				description,
				date,
				location,
				created_at,
				organizer:organizer_id (
					id,
					display_name,
					email
				)
			`)
			.eq('status', 'draft')
			.order('created_at', { ascending: false })
			.limit(5)

		if (error) throw error
		pendingEvents = data || []
	}

	async function approveEvent(eventId: string) {
		try {
			const { error } = await db.supabase
				.from('events')
				.update({ 
					status: 'published',
					published_at: new Date().toISOString()
				})
				.eq('id', eventId)

			if (error) throw error

			// Reload data
			await loadDashboardData()
		} catch (err) {
			console.error('Failed to approve event:', err)
		}
	}

	async function rejectEvent(eventId: string) {
		try {
			const { error } = await db.supabase
				.from('events')
				.update({ 
					status: 'cancelled'
				})
				.eq('id', eventId)

			if (error) throw error

			// Reload data
			await loadDashboardData()
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
		Welcome back, {$user?.profile?.display_name || 'Admin'}. Here's what's happening on your platform.
	</p>
</div>

{#if loading}
	<LoadingSpinner variant="card" count={4} />
{:else if error}
	<ErrorDisplay 
		{error} 
		variant="banner"
		on:retry={loadDashboardData}
	/>
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
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
					<h2 class="text-lg font-semibold text-gray-900">Pending Events</h2>
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
										by {event.organizer?.display_name || event.organizer?.email}
									</p>
									<p class="text-xs text-gray-500 mt-1">
										{format(new Date(event.date), 'MMM d, yyyy • HH:mm')}
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
