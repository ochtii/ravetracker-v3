<!--
Analytics Dashboard
==================
Comprehensive analytics and insights for administrators
-->

<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { isAdmin, isOrganizer } from '$lib/stores/auth-enhanced'
	import { supabase } from '$lib/utils/supabase'
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte'
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte'
	import { 
		TrendingUp, 
		TrendingDown,
		Users, 
		Calendar, 
		MapPin,
		Clock,
		Eye,
		Heart,
		Share2,
		Download,
		Filter,
		BarChart3,
		PieChart,
		Activity,
		Target
	} from 'lucide-svelte'
	import { formatDistanceToNow, format, subDays, subWeeks, subMonths, isAfter } from 'date-fns'

	// Types
	interface AnalyticsData {
		overview: {
			totalUsers: number
			totalEvents: number
			totalAttendance: number
			activeUsers: number
			userGrowth: number
			eventGrowth: number
			attendanceGrowth: number
		}
		userMetrics: {
			dailySignups: Array<{ date: string; count: number }>
			usersByRole: Array<{ role: string; count: number }>
			userActivity: Array<{ date: string; active: number }>
			topLocations: Array<{ location: string; count: number }>
		}
		eventMetrics: {
			eventsByDate: Array<{ date: string; count: number }>
			eventsByLocation: Array<{ location: string; count: number }>
			eventsByCategory: Array<{ category: string; count: number }>
			averageAttendance: number
			popularVenues: Array<{ venue: string; count: number }>
		}
		engagement: {
			dailyActive: Array<{ date: string; count: number }>
			eventViews: Array<{ date: string; views: number }>
			attendanceRate: number
			retentionRate: number
		}
	}

	// State
	let loading = true
	let error: string | null = null
	let analytics: AnalyticsData | null = null
	let selectedTimeRange = '30d'
	let selectedMetric = 'overview'
	let lastUpdated: Date | null = null

	// Chart data
	let chartData: any = null
	let chartType = 'line'

	// Reactive statements
	$: timeRangeOptions = [
		{ value: '7d', label: 'Last 7 days' },
		{ value: '30d', label: 'Last 30 days' },
		{ value: '90d', label: 'Last 3 months' },
		{ value: '1y', label: 'Last year' }
	]

	$: metricOptions = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'users', label: 'User Analytics' },
		{ value: 'events', label: 'Event Analytics' },
		{ value: 'engagement', label: 'Engagement' }
	]

	// Functions
	function getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
		const endDate = new Date()
		let startDate: Date

		switch (timeRange) {
			case '7d':
				startDate = subDays(endDate, 7)
				break
			case '30d':
				startDate = subDays(endDate, 30)
				break
			case '90d':
				startDate = subDays(endDate, 90)
				break
			case '1y':
				startDate = subDays(endDate, 365)
				break
			default:
				startDate = subDays(endDate, 30)
		}

		return { startDate, endDate }
	}

	async function loadAnalytics() {
		try {
			loading = true
			error = null

			const { startDate, endDate } = getDateRange(selectedTimeRange)
			const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))

			// Load overview metrics
			const [
				{ data: totalUsers },
				{ data: totalEvents },
				{ data: totalAttendance },
				{ data: activeUsers },
				{ data: previousUsers },
				{ data: previousEvents },
				{ data: previousAttendance }
			] = await Promise.all([
				// Total users
				supabase.from('profiles').select('id', { count: 'exact', head: true }),
				
				// Total events
				supabase.from('events').select('id', { count: 'exact', head: true }),
				
				// Total attendance
				supabase.from('event_attendance').select('id', { count: 'exact', head: true }),
				
				// Active users in period
				supabase
					.from('profiles')
					.select('id', { count: 'exact', head: true })
					.gte('last_sign_in_at', startDate.toISOString()),
				
				// Previous period users for growth calculation
				supabase
					.from('profiles')
					.select('id', { count: 'exact', head: true })
					.gte('created_at', previousStartDate.toISOString())
					.lt('created_at', startDate.toISOString()),
				
				// Previous period events
				supabase
					.from('events')
					.select('id', { count: 'exact', head: true })
					.gte('created_at', previousStartDate.toISOString())
					.lt('created_at', startDate.toISOString()),
				
				// Previous period attendance
				supabase
					.from('event_attendance')
					.select('id', { count: 'exact', head: true })
					.gte('created_at', previousStartDate.toISOString())
					.lt('created_at', startDate.toISOString())
			])

			// Load detailed metrics
			const [
				{ data: dailySignups },
				{ data: usersByRole },
				{ data: eventsByDate },
				{ data: eventsByLocation },
				{ data: userLocations },
				{ data: venues },
				{ data: dailyActive }
			] = await Promise.all([
				// Daily signups
				supabase
					.from('profiles')
					.select('created_at')
					.gte('created_at', startDate.toISOString())
					.lte('created_at', endDate.toISOString())
					.order('created_at'),
				
				// Users by role
				supabase
					.from('profiles')
					.select('role'),
				
				// Events by date
				supabase
					.from('events')
					.select('created_at, date_time')
					.gte('created_at', startDate.toISOString())
					.lte('created_at', endDate.toISOString())
					.order('created_at'),
				
				// Events by location
				supabase
					.from('events')
					.select('location_city')
					.gte('created_at', startDate.toISOString())
					.lte('created_at', endDate.toISOString()),
				
				// User locations (from events they've attended)
				supabase
					.from('event_attendance')
					.select('events(location_city)')
					.gte('created_at', startDate.toISOString())
					.lte('created_at', endDate.toISOString()),
				
				// Popular venues
				supabase
					.from('events')
					.select('venue')
					.gte('created_at', startDate.toISOString())
					.lte('created_at', endDate.toISOString()),
				
				// Daily active users (approximated by event interactions)
				supabase
					.from('event_attendance')
					.select('created_at, user_id')
					.gte('created_at', startDate.toISOString())
					.lte('created_at', endDate.toISOString())
					.order('created_at')
			])

			// Process data
			const overview = {
				totalUsers: totalUsers?.length || 0,
				totalEvents: totalEvents?.length || 0,
				totalAttendance: totalAttendance?.length || 0,
				activeUsers: activeUsers?.length || 0,
				userGrowth: calculateGrowth(
					activeUsers?.length || 0, 
					previousUsers?.length || 0
				),
				eventGrowth: calculateGrowth(
					(eventsByDate || []).length,
					previousEvents?.length || 0
				),
				attendanceGrowth: calculateGrowth(
					(dailyActive || []).length,
					previousAttendance?.length || 0
				)
			}

			// Process daily signups
			const signupsByDate = groupByDate(dailySignups || [])
			
			// Process users by role
			const roleGroups = groupBy(usersByRole || [], 'role')
			const roleData = Object.entries(roleGroups).map(([role, users]) => ({
				role,
				count: users.length
			}))

			// Process events by date
			const eventsByDateGroups = groupByDate(eventsByDate || [])
			
			// Process events by location
			const locationGroups = groupBy(eventsByLocation || [], 'location_city')
			const locationData = Object.entries(locationGroups)
				.map(([location, events]) => ({ location, count: events.length }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10)

			// Process user locations
			const userLocationData = (userLocations || [])
				.map(item => item.events?.location_city)
				.filter(Boolean)
			const userLocationGroups = groupBy(
				userLocationData.map(location => ({ location })), 
				'location'
			)
			const topUserLocations = Object.entries(userLocationGroups)
				.map(([location, items]) => ({ location, count: items.length }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10)

			// Process venues
			const venueGroups = groupBy(venues || [], 'venue')
			const venueData = Object.entries(venueGroups)
				.map(([venue, events]) => ({ venue: venue || 'Unknown', count: events.length }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10)

			// Process daily active
			const activeByDate = groupByDate(dailyActive || [])

			// Calculate average attendance
			const totalEventsWithAttendance = eventsByDate?.length || 1
			const averageAttendance = Math.round((totalAttendance?.length || 0) / totalEventsWithAttendance)

			analytics = {
				overview,
				userMetrics: {
					dailySignups: signupsByDate,
					usersByRole: roleData,
					userActivity: activeByDate,
					topLocations: topUserLocations
				},
				eventMetrics: {
					eventsByDate: eventsByDateGroups,
					eventsByLocation: locationData,
					eventsByCategory: [], // Would need category field
					averageAttendance,
					popularVenues: venueData
				},
				engagement: {
					dailyActive: activeByDate,
					eventViews: [], // Would need view tracking
					attendanceRate: 0.75, // Placeholder
					retentionRate: 0.65 // Placeholder
				}
			}

			lastUpdated = new Date()

		} catch (err) {
			console.error('Failed to load analytics:', err)
			error = (err as Error).message
		} finally {
			loading = false
		}
	}

	function groupByDate(items: any[]): Array<{ date: string; count: number }> {
		const groups = new Map<string, number>()
		
		items.forEach(item => {
			const date = format(new Date(item.created_at), 'yyyy-MM-dd')
			groups.set(date, (groups.get(date) || 0) + 1)
		})

		return Array.from(groups.entries())
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => a.date.localeCompare(b.date))
	}

	function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
		return items.reduce((groups, item) => {
			const value = String(item[key] || 'Unknown')
			if (!groups[value]) {
				groups[value] = []
			}
			groups[value].push(item)
			return groups
		}, {} as Record<string, T[]>)
	}

	function calculateGrowth(current: number, previous: number): number {
		if (previous === 0) return current > 0 ? 100 : 0
		return Math.round(((current - previous) / previous) * 100)
	}

	function formatGrowth(growth: number): string {
		const sign = growth > 0 ? '+' : ''
		return `${sign}${growth}%`
	}

	function getGrowthColor(growth: number): string {
		if (growth > 0) return 'text-green-600'
		if (growth < 0) return 'text-red-600'
		return 'text-gray-600'
	}

	function getGrowthIcon(growth: number) {
		return growth >= 0 ? TrendingUp : TrendingDown
	}

	async function exportData() {
		if (!analytics) return

		try {
			const data = {
				exportDate: new Date().toISOString(),
				timeRange: selectedTimeRange,
				analytics
			}

			const blob = new Blob([JSON.stringify(data, null, 2)], { 
				type: 'application/json' 
			})
			
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)

		} catch (err) {
			console.error('Failed to export data:', err)
		}
	}

	// Lifecycle
	onMount(() => {
		loadAnalytics()
	})

	// Watch for time range changes
	$: if (selectedTimeRange) {
		loadAnalytics()
	}
</script>

<svelte:head>
	<title>Analytics Dashboard - Admin Panel</title>
</svelte:head>

<!-- Page Header -->
<div class="flex items-center justify-between mb-8">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
		<p class="text-gray-600 mt-2">
			Comprehensive insights and performance metrics
		</p>
		{#if lastUpdated}
			<p class="text-sm text-gray-500 mt-1">
				Last updated {formatDistanceToNow(lastUpdated)} ago
			</p>
		{/if}
	</div>

	<div class="flex items-center space-x-3">
		<select
			bind:value={selectedTimeRange}
			class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
		>
			{#each timeRangeOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>

		<button
			on:click={exportData}
			class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500"
		>
			<Download class="w-4 h-4 mr-2" />
			Export
		</button>

		<button
			on:click={loadAnalytics}
			class="flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500"
		>
			Refresh
		</button>
	</div>
</div>

{#if loading}
	<LoadingSpinner variant="card" count={8} />
{:else if error}
	<ErrorDisplay 
		{error} 
		variant="banner"
		on:retry={loadAnalytics}
	/>
{:else if analytics}
	<!-- Metric Tabs -->
	<div class="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
		{#each metricOptions as option}
			<button
				on:click={() => selectedMetric = option.value}
				class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors {
					selectedMetric === option.value
						? 'bg-white text-purple-700 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}"
			>
				{option.label}
			</button>
		{/each}
	</div>

	{#if selectedMetric === 'overview'}
		<!-- Overview Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Total Users</p>
						<p class="text-3xl font-bold text-gray-900">{analytics.overview.totalUsers.toLocaleString()}</p>
					</div>
					<div class="p-3 bg-blue-100 rounded-full">
						<Users class="w-6 h-6 text-blue-600" />
					</div>
				</div>
				<div class="mt-4 flex items-center text-sm">
					<svelte:component 
						this={getGrowthIcon(analytics.overview.userGrowth)} 
						class="w-4 h-4 mr-1 {getGrowthColor(analytics.overview.userGrowth)}" 
					/>
					<span class="{getGrowthColor(analytics.overview.userGrowth)}">
						{formatGrowth(analytics.overview.userGrowth)}
					</span>
					<span class="text-gray-600 ml-1">vs previous period</span>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Total Events</p>
						<p class="text-3xl font-bold text-gray-900">{analytics.overview.totalEvents.toLocaleString()}</p>
					</div>
					<div class="p-3 bg-purple-100 rounded-full">
						<Calendar class="w-6 h-6 text-purple-600" />
					</div>
				</div>
				<div class="mt-4 flex items-center text-sm">
					<svelte:component 
						this={getGrowthIcon(analytics.overview.eventGrowth)} 
						class="w-4 h-4 mr-1 {getGrowthColor(analytics.overview.eventGrowth)}" 
					/>
					<span class="{getGrowthColor(analytics.overview.eventGrowth)}">
						{formatGrowth(analytics.overview.eventGrowth)}
					</span>
					<span class="text-gray-600 ml-1">vs previous period</span>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Total Attendance</p>
						<p class="text-3xl font-bold text-gray-900">{analytics.overview.totalAttendance.toLocaleString()}</p>
					</div>
					<div class="p-3 bg-green-100 rounded-full">
						<Target class="w-6 h-6 text-green-600" />
					</div>
				</div>
				<div class="mt-4 flex items-center text-sm">
					<svelte:component 
						this={getGrowthIcon(analytics.overview.attendanceGrowth)} 
						class="w-4 h-4 mr-1 {getGrowthColor(analytics.overview.attendanceGrowth)}" 
					/>
					<span class="{getGrowthColor(analytics.overview.attendanceGrowth)}">
						{formatGrowth(analytics.overview.attendanceGrowth)}
					</span>
					<span class="text-gray-600 ml-1">vs previous period</span>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Active Users</p>
						<p class="text-3xl font-bold text-gray-900">{analytics.overview.activeUsers.toLocaleString()}</p>
					</div>
					<div class="p-3 bg-orange-100 rounded-full">
						<Activity class="w-6 h-6 text-orange-600" />
					</div>
				</div>
				<div class="mt-4 text-sm text-gray-600">
					{Math.round((analytics.overview.activeUsers / analytics.overview.totalUsers) * 100)}% of total users
				</div>
			</div>
		</div>

		<!-- Quick Charts -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- User Signups Chart -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Daily User Signups</h3>
				
				{#if analytics.userMetrics.dailySignups.length > 0}
					<div class="h-64 flex items-end justify-between space-x-1">
						{#each analytics.userMetrics.dailySignups as day}
							<div class="flex-1 flex flex-col items-center">
								<div 
									class="w-full bg-blue-500 rounded-t"
									style="height: {(day.count / Math.max(...analytics.userMetrics.dailySignups.map(d => d.count))) * 100}%"
									title="{day.count} signups on {format(new Date(day.date), 'MMM dd')}"
								></div>
								<span class="text-xs text-gray-600 mt-1">
									{format(new Date(day.date), 'MM/dd')}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="h-64 flex items-center justify-center text-gray-500">
						No signup data available
					</div>
				{/if}
			</div>

			<!-- User Roles Distribution -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">User Roles Distribution</h3>
				
				<div class="space-y-3">
					{#each analytics.userMetrics.usersByRole as role}
						{@const percentage = (role.count / analytics.overview.totalUsers) * 100}
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<div class="w-3 h-3 rounded-full {
									role.role === 'admin' ? 'bg-red-500' :
									role.role === 'organizer' ? 'bg-purple-500' :
									'bg-gray-500'
								}"></div>
								<span class="text-sm font-medium text-gray-900 capitalize">{role.role}</span>
							</div>
							
							<div class="flex items-center space-x-2">
								<div class="w-20 bg-gray-200 rounded-full h-2">
									<div 
										class="h-2 rounded-full {
											role.role === 'admin' ? 'bg-red-500' :
											role.role === 'organizer' ? 'bg-purple-500' :
											'bg-gray-500'
										}"
										style="width: {percentage}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 w-12 text-right">
									{role.count}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

	{:else if selectedMetric === 'users'}
		<!-- User Analytics -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
			<!-- Top Locations -->
			<div class="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Top User Locations</h3>
				
				<div class="space-y-3">
					{#each analytics.userMetrics.topLocations.slice(0, 8) as location}
						{@const maxCount = Math.max(...analytics.userMetrics.topLocations.map(l => l.count))}
						{@const percentage = (location.count / maxCount) * 100}
						
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<MapPin class="w-4 h-4 text-gray-400" />
								<span class="text-sm font-medium text-gray-900">{location.location}</span>
							</div>
							
							<div class="flex items-center space-x-3">
								<div class="w-24 bg-gray-200 rounded-full h-2">
									<div 
										class="h-2 bg-purple-500 rounded-full"
										style="width: {percentage}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 w-8 text-right">
									{location.count}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- User Activity -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
				
				<div class="space-y-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">
							{analytics.userMetrics.userActivity.reduce((sum, day) => sum + day.count, 0)}
						</div>
						<div class="text-sm text-gray-600">Total Active Users</div>
					</div>
					
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">
							{Math.round(analytics.userMetrics.userActivity.reduce((sum, day) => sum + day.count, 0) / analytics.userMetrics.userActivity.length) || 0}
						</div>
						<div class="text-sm text-gray-600">Average Daily Active</div>
					</div>
					
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">
							{Math.round((analytics.overview.activeUsers / analytics.overview.totalUsers) * 100)}%
						</div>
						<div class="text-sm text-gray-600">Activity Rate</div>
					</div>
				</div>
			</div>
		</div>

	{:else if selectedMetric === 'events'}
		<!-- Event Analytics -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
			<!-- Events by Location -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Events by Location</h3>
				
				<div class="space-y-3">
					{#each analytics.eventMetrics.eventsByLocation.slice(0, 8) as location}
						{@const maxCount = Math.max(...analytics.eventMetrics.eventsByLocation.map(l => l.count))}
						{@const percentage = (location.count / maxCount) * 100}
						
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<MapPin class="w-4 h-4 text-gray-400" />
								<span class="text-sm font-medium text-gray-900">{location.location}</span>
							</div>
							
							<div class="flex items-center space-x-3">
								<div class="w-24 bg-gray-200 rounded-full h-2">
									<div 
										class="h-2 bg-green-500 rounded-full"
										style="width: {percentage}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 w-8 text-right">
									{location.count}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Popular Venues -->
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Popular Venues</h3>
				
				<div class="space-y-3">
					{#each analytics.eventMetrics.popularVenues.slice(0, 8) as venue}
						{@const maxCount = Math.max(...analytics.eventMetrics.popularVenues.map(v => v.count))}
						{@const percentage = (venue.count / maxCount) * 100}
						
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-900 truncate">{venue.venue}</span>
							
							<div class="flex items-center space-x-3">
								<div class="w-16 bg-gray-200 rounded-full h-2">
									<div 
										class="h-2 bg-orange-500 rounded-full"
										style="width: {percentage}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 w-6 text-right">
									{venue.count}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Event Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
				<div class="text-3xl font-bold text-gray-900 mb-2">
					{analytics.eventMetrics.averageAttendance}
				</div>
				<div class="text-sm text-gray-600">Average Attendance</div>
			</div>
			
			<div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
				<div class="text-3xl font-bold text-gray-900 mb-2">
					{analytics.eventMetrics.eventsByDate.length}
				</div>
				<div class="text-sm text-gray-600">Events Created</div>
			</div>
			
			<div class="bg-white border border-gray-200 rounded-lg p-6 text-center">
				<div class="text-3xl font-bold text-gray-900 mb-2">
					{analytics.eventMetrics.eventsByLocation.length}
				</div>
				<div class="text-sm text-gray-600">Unique Locations</div>
			</div>
		</div>

	{:else if selectedMetric === 'engagement'}
		<!-- Engagement Analytics -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Attendance Rate</p>
						<p class="text-3xl font-bold text-gray-900">{Math.round(analytics.engagement.attendanceRate * 100)}%</p>
					</div>
					<div class="p-3 bg-green-100 rounded-full">
						<Target class="w-6 h-6 text-green-600" />
					</div>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Retention Rate</p>
						<p class="text-3xl font-bold text-gray-900">{Math.round(analytics.engagement.retentionRate * 100)}%</p>
					</div>
					<div class="p-3 bg-blue-100 rounded-full">
						<Activity class="w-6 h-6 text-blue-600" />
					</div>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Daily Active</p>
						<p class="text-3xl font-bold text-gray-900">
							{Math.round(analytics.engagement.dailyActive.reduce((sum, day) => sum + day.count, 0) / analytics.engagement.dailyActive.length) || 0}
						</p>
					</div>
					<div class="p-3 bg-purple-100 rounded-full">
						<Users class="w-6 h-6 text-purple-600" />
					</div>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Engagement Score</p>
						<p class="text-3xl font-bold text-gray-900">8.7</p>
					</div>
					<div class="p-3 bg-orange-100 rounded-full">
						<Heart class="w-6 h-6 text-orange-600" />
					</div>
				</div>
			</div>
		</div>

		<!-- Daily Active Users Chart -->
		<div class="bg-white border border-gray-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Active Users</h3>
			
			{#if analytics.engagement.dailyActive.length > 0}
				<div class="h-64 flex items-end justify-between space-x-1">
					{#each analytics.engagement.dailyActive as day}
						<div class="flex-1 flex flex-col items-center">
							<div 
								class="w-full bg-purple-500 rounded-t"
								style="height: {(day.count / Math.max(...analytics.engagement.dailyActive.map(d => d.count))) * 100}%"
								title="{day.count} active users on {format(new Date(day.date), 'MMM dd')}"
							></div>
							<span class="text-xs text-gray-600 mt-1">
								{format(new Date(day.date), 'MM/dd')}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="h-64 flex items-center justify-center text-gray-500">
					No activity data available
				</div>
			{/if}
		</div>
	{/if}
{/if}
