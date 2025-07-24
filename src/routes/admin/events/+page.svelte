<!--
Event Moderation Page
====================
Admin interface for moderating events, reviewing submissions, and managing content
-->

<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { isAdmin, isOrganizer } from '$lib/stores/auth-enhanced'
	import { db } from '$lib/utils/database'
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte'
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte'
	import { 
		Calendar, 
		Search, 
		Filter, 
		MoreHorizontal,
		Eye,
		Check,
		X,
		AlertTriangle,
		Flag,
		Clock,
		MapPin,
		Users,
		Image,
		FileText,
		ExternalLink,
		MessageSquare
	} from 'lucide-svelte'
	import { formatDistanceToNow, format } from 'date-fns'

	// Types
	interface EventModeration {
		id: string
		title: string
		description: string
		date_time: string
		location_city: string
		venue: string
		organizer_id: string
		organizer: {
			display_name: string | null
			email: string
		}
		status: 'pending' | 'approved' | 'rejected' | 'under_review'
		moderation_status: 'pending' | 'approved' | 'rejected' | 'flagged'
		created_at: string
		updated_at: string
		image_url: string | null
		website_url: string | null
		ticket_url: string | null
		capacity: number | null
		age_restriction: string | null
		ticket_price_min: number | null
		ticket_price_max: number | null
		reported_count: number
		reports?: EventReport[]
		attendance_count?: number
	}

	interface EventReport {
		id: string
		reason: string
		description: string | null
		reporter_id: string
		reporter: {
			display_name: string | null
			email: string
		}
		created_at: string
	}

	// State
	let loading = true
	let error: string | null = null
	let events: EventModeration[] = []
	let filteredEvents: EventModeration[] = []
	let searchTerm = ''
	let selectedStatus: string = 'all'
	let selectedModeration: string = 'pending'
	let showFilters = false
	let selectedEvents = new Set<string>()
	let currentPage = 1
	let eventsPerPage = 10
	let totalEvents = 0
	let showReportsOnly = false

	// Detail modal state
	let selectedEvent: EventModeration | null = null
	let showEventModal = false
	let moderationNote = ''

	// Reactive statements
	$: filteredEvents = filterEvents(events, searchTerm, selectedStatus, selectedModeration, showReportsOnly)
	$: paginatedEvents = paginate(filteredEvents, currentPage, eventsPerPage)
	$: totalPages = Math.ceil(filteredEvents.length / eventsPerPage)
	$: hasSelection = selectedEvents.size > 0

	// Functions
	function filterEvents(
		events: EventModeration[], 
		search: string, 
		status: string, 
		moderation: string,
		reportsOnly: boolean
	): EventModeration[] {
		return events.filter(event => {
			const matchesSearch = !search || 
				event.title.toLowerCase().includes(search.toLowerCase()) ||
				event.organizer.display_name?.toLowerCase().includes(search.toLowerCase()) ||
				event.organizer.email.toLowerCase().includes(search.toLowerCase())
			
			const matchesStatus = status === 'all' || event.status === status
			const matchesModeration = moderation === 'all' || event.moderation_status === moderation
			const matchesReports = !reportsOnly || (event.reported_count && event.reported_count > 0)

			return matchesSearch && matchesStatus && matchesModeration && matchesReports
		})
	}

	function paginate<T>(items: T[], page: number, perPage: number): T[] {
		const start = (page - 1) * perPage
		return items.slice(start, start + perPage)
	}

	async function loadEvents() {
		try {
			loading = true
			error = null

			// Load events with organizer and report data
			const { data: eventsData, error: eventsError } = await supabase
				.from('events')
				.select(`
					*,
					organizer:profiles!organizer_id (
						display_name,
						email
					)
				`)
				.order('created_at', { ascending: false })

			if (eventsError) throw eventsError

			// Load event reports
			const eventIds = eventsData?.map(e => e.id) || []
			
			const { data: reportsData, error: reportsError } = await supabase
				.from('event_reports')
				.select(`
					*,
					reporter:profiles!reporter_id (
						display_name,
						email
					)
				`)
				.in('event_id', eventIds)

			// Load attendance counts
			const { data: attendanceData, error: attendanceError } = await supabase
				.from('event_attendance')
				.select('event_id')
				.in('event_id', eventIds)

			// Group reports by event
			const reportsByEvent = new Map<string, EventReport[]>()
			const reportCounts = new Map<string, number>()

			reportsData?.forEach(report => {
				if (!reportsByEvent.has(report.event_id)) {
					reportsByEvent.set(report.event_id, [])
				}
				reportsByEvent.get(report.event_id)?.push(report)
				reportCounts.set(report.event_id, (reportCounts.get(report.event_id) || 0) + 1)
			})

			// Count attendance by event
			const attendanceCounts = new Map<string, number>()
			attendanceData?.forEach(attendance => {
				const count = attendanceCounts.get(attendance.event_id) || 0
				attendanceCounts.set(attendance.event_id, count + 1)
			})

			// Combine data
			events = (eventsData || []).map(event => ({
				...event,
				reported_count: reportCounts.get(event.id) || 0,
				reports: reportsByEvent.get(event.id) || [],
				attendance_count: attendanceCounts.get(event.id) || 0
			}))

			totalEvents = events.length

		} catch (err) {
			console.error('Failed to load events:', err)
			error = (err as Error).message
		} finally {
			loading = false
		}
	}

	async function updateEventModerationStatus(
		eventId: string, 
		status: 'approved' | 'rejected' | 'flagged' | 'under_review',
		note?: string
	) {
		try {
			const updates: any = { 
				moderation_status: status,
				updated_at: new Date().toISOString()
			}

			if (note) {
				updates.moderation_note = note
			}

			// If approving, also set event status to approved
			if (status === 'approved') {
				updates.status = 'approved'
			} else if (status === 'rejected') {
				updates.status = 'rejected'
			}

			const { error } = await supabase
				.from('events')
				.update(updates)
				.eq('id', eventId)

			if (error) throw error

			// Update local state
			events = events.map(event => 
				event.id === eventId ? { 
					...event, 
					moderation_status: status,
					status: updates.status || event.status
				} : event
			)

		} catch (err) {
			console.error('Failed to update event moderation status:', err)
			error = (err as Error).message
		}
	}

	async function bulkUpdateModerationStatus(status: 'approved' | 'rejected' | 'flagged') {
		try {
			const eventIds = Array.from(selectedEvents)
			
			const updates: any = { 
				moderation_status: status,
				updated_at: new Date().toISOString()
			}

			if (status === 'approved') {
				updates.status = 'approved'
			} else if (status === 'rejected') {
				updates.status = 'rejected'
			}

			const { error } = await supabase
				.from('events')
				.update(updates)
				.in('id', eventIds)

			if (error) throw error

			// Update local state
			events = events.map(event => 
				selectedEvents.has(event.id) ? { 
					...event, 
					moderation_status: status,
					status: updates.status || event.status
				} : event
			)

			clearSelection()

		} catch (err) {
			console.error('Failed to bulk update moderation status:', err)
			error = (err as Error).message
		}
	}

	async function deleteEvent(eventId: string) {
		if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
			return
		}

		try {
			const { error } = await supabase
				.from('events')
				.delete()
				.eq('id', eventId)

			if (error) throw error

			// Remove from local state
			events = events.filter(event => event.id !== eventId)

		} catch (err) {
			console.error('Failed to delete event:', err)
			error = (err as Error).message
		}
	}

	function toggleEventSelection(eventId: string) {
		const newSelection = new Set(selectedEvents)
		if (newSelection.has(eventId)) {
			newSelection.delete(eventId)
		} else {
			newSelection.add(eventId)
		}
		selectedEvents = newSelection
	}

	function selectAllEvents() {
		selectedEvents = new Set(paginatedEvents.map(e => e.id))
	}

	function clearSelection() {
		selectedEvents = new Set()
	}

	function openEventModal(event: EventModeration) {
		selectedEvent = event
		showEventModal = true
		moderationNote = ''
	}

	function closeEventModal() {
		selectedEvent = null
		showEventModal = false
		moderationNote = ''
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'approved': return 'text-green-600 bg-green-100'
			case 'rejected': return 'text-red-600 bg-red-100'
			case 'pending': return 'text-yellow-600 bg-yellow-100'
			case 'under_review': return 'text-purple-600 bg-purple-100'
			case 'flagged': return 'text-orange-600 bg-orange-100'
			default: return 'text-gray-600 bg-gray-100'
		}
	}

	function getModerationColor(status: string): string {
		switch (status) {
			case 'approved': return 'text-green-600 bg-green-100'
			case 'rejected': return 'text-red-600 bg-red-100'
			case 'pending': return 'text-yellow-600 bg-yellow-100'
			case 'flagged': return 'text-red-600 bg-red-100'
			default: return 'text-gray-600 bg-gray-100'
		}
	}

	function getPriorityScore(event: EventModeration): number {
		let score = 0
		
		// Reports increase priority
		score += (event.reported_count || 0) * 10
		
		// Pending events have higher priority
		if (event.moderation_status === 'pending') score += 5
		
		// Recent events have higher priority
		const hoursOld = (Date.now() - new Date(event.created_at).getTime()) / (1000 * 60 * 60)
		if (hoursOld < 24) score += 3
		
		return score
	}

	// Lifecycle
	onMount(() => {
		loadEvents()
	})
</script>

<svelte:head>
	<title>Event Moderation - Admin Panel</title>
</svelte:head>

<!-- Page Header -->
<div class="flex items-center justify-between mb-8">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Event Moderation</h1>
		<p class="text-gray-600 mt-2">
			Review and moderate event submissions and reported content
		</p>
	</div>

	<div class="flex items-center space-x-3">
		{#if hasSelection}
			<span class="text-sm text-gray-600">
				{selectedEvents.size} selected
			</span>
		{/if}
		
		<label class="flex items-center space-x-2 text-sm">
			<input
				type="checkbox"
				bind:checked={showReportsOnly}
				class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
			/>
			<span>Show reported only</span>
		</label>
		
		<button
			on:click={() => showFilters = !showFilters}
			class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500"
		>
			<Filter class="w-4 h-4 mr-2" />
			Filters
		</button>
	</div>
</div>

{#if loading}
	<LoadingSpinner variant="card" count={4} />
{:else if error}
	<ErrorDisplay 
		{error} 
		variant="banner"
		on:retry={loadEvents}
	/>
{:else}
	<!-- Filters -->
	{#if showFilters}
		<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Search events..."
							bind:value={searchTerm}
							class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						/>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Event Status</label>
					<select
						bind:value={selectedStatus}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					>
						<option value="all">All Statuses</option>
						<option value="pending">Pending</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Moderation Status</label>
					<select
						bind:value={selectedModeration}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					>
						<option value="all">All Moderation</option>
						<option value="pending">Pending Review</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
						<option value="flagged">Flagged</option>
						<option value="under_review">Under Review</option>
					</select>
				</div>
			</div>
		</div>
	{/if}

	<!-- Bulk Actions -->
	{#if hasSelection}
		<div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-gray-900">
					{selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
				</span>
				
				<div class="flex items-center space-x-3">
					<button
						on:click={() => bulkUpdateModerationStatus('approved')}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 focus:ring-2 focus:ring-green-500"
					>
						<Check class="w-4 h-4 mr-1" />
						Approve
					</button>
					
					<button
						on:click={() => bulkUpdateModerationStatus('rejected')}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 focus:ring-2 focus:ring-red-500"
					>
						<X class="w-4 h-4 mr-1" />
						Reject
					</button>
					
					<button
						on:click={() => bulkUpdateModerationStatus('flagged')}
						class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200 focus:ring-2 focus:ring-orange-500"
					>
						<Flag class="w-4 h-4 mr-1" />
						Flag
					</button>
					
					<button
						on:click={clearSelection}
						class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
					>
						Clear
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Events List -->
	<div class="space-y-4">
		{#each paginatedEvents as event (event.id)}
			<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
				<div class="flex items-start space-x-4">
					<input
						type="checkbox"
						checked={selectedEvents.has(event.id)}
						on:change={() => toggleEventSelection(event.id)}
						class="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
					/>

					<!-- Event Image -->
					<div class="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
						{#if event.image_url}
							<img 
								src={event.image_url} 
								alt={event.title}
								class="w-full h-full object-cover"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center">
								<Image class="w-8 h-8 text-gray-400" />
							</div>
						{/if}
					</div>

					<!-- Event Info -->
					<div class="flex-1 min-w-0">
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center space-x-3 mb-2">
									<h3 class="text-lg font-semibold text-gray-900 truncate">
										{event.title}
									</h3>
									
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(event.status)}">
										{event.status}
									</span>
									
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getModerationColor(event.moderation_status)}">
										{event.moderation_status}
									</span>

									{#if event.reported_count > 0}
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">
											<Flag class="w-3 h-3 mr-1" />
											{event.reported_count} report{event.reported_count !== 1 ? 's' : ''}
										</span>
									{/if}

									{#if getPriorityScore(event) > 10}
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-orange-700 bg-orange-100">
											<AlertTriangle class="w-3 h-3 mr-1" />
											High Priority
										</span>
									{/if}
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
									<div class="flex items-center space-x-2">
										<Calendar class="w-4 h-4" />
										<span>{format(new Date(event.date_time), 'MMM dd, yyyy')}</span>
									</div>
									
									<div class="flex items-center space-x-2">
										<MapPin class="w-4 h-4" />
										<span class="truncate">{event.venue || event.location}</span>
									</div>
									
									<div class="flex items-center space-x-2">
										<Users class="w-4 h-4" />
										<span>{event.attendance_count || 0} attending</span>
									</div>
									
									<div class="flex items-center space-x-2">
										<Clock class="w-4 h-4" />
										<span>Created {formatDistanceToNow(new Date(event.created_at))} ago</span>
									</div>
								</div>

								<div class="mt-3 text-sm text-gray-600">
									<span class="font-medium">Organizer:</span> 
									{event.organizer.display_name || 'No name'} ({event.organizer.email})
								</div>

								{#if event.description}
									<p class="mt-2 text-sm text-gray-600 line-clamp-2">
										{event.description}
									</p>
								{/if}
							</div>

							<!-- Quick Actions -->
							<div class="flex items-center space-x-2 ml-4">
								<button
									on:click={() => openEventModal(event)}
									class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
									title="View Details"
								>
									<Eye class="w-4 h-4" />
								</button>

								{#if event.moderation_status === 'pending'}
									<button
										on:click={() => updateEventModerationStatus(event.id, 'approved')}
										class="p-2 text-green-600 hover:bg-green-100 rounded"
										title="Approve"
									>
										<Check class="w-4 h-4" />
									</button>
									
									<button
										on:click={() => updateEventModerationStatus(event.id, 'rejected')}
										class="p-2 text-red-600 hover:bg-red-100 rounded"
										title="Reject"
									>
										<X class="w-4 h-4" />
									</button>
								{/if}

								<div class="relative">
									<button
										class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
										title="More Actions"
									>
										<MoreHorizontal class="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="mt-8 flex items-center justify-between">
			<div class="text-sm text-gray-700">
				Showing {(currentPage - 1) * eventsPerPage + 1} to {Math.min(currentPage * eventsPerPage, filteredEvents.length)} of {filteredEvents.length} results
			</div>
			
			<div class="flex items-center space-x-2">
				<button
					on:click={() => currentPage = Math.max(1, currentPage - 1)}
					disabled={currentPage === 1}
					class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Previous
				</button>
				
				<span class="px-3 py-1.5 text-sm font-medium text-gray-700">
					{currentPage} of {totalPages}
				</span>
				
				<button
					on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
					disabled={currentPage === totalPages}
					class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next
				</button>
			</div>
		</div>
	{/if}
{/if}

<!-- Event Detail Modal -->
{#if showEventModal && selectedEvent}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Event Moderation</h2>
					<button
						on:click={closeEventModal}
						class="text-gray-400 hover:text-gray-600"
					>
						<X class="w-6 h-6" />
					</button>
				</div>
			</div>
			
			<div class="p-6 space-y-6">
				<!-- Event Header -->
				<div class="flex items-start space-x-4">
					{#if selectedEvent.image_url}
						<img 
							src={selectedEvent.image_url} 
							alt={selectedEvent.title}
							class="w-32 h-32 object-cover rounded-lg"
						/>
					{/if}
					
					<div class="flex-1">
						<h3 class="text-2xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h3>
						
						<div class="flex items-center space-x-3 mb-4">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(selectedEvent.status)}">
								{selectedEvent.status}
							</span>
							
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getModerationColor(selectedEvent.moderation_status)}">
								{selectedEvent.moderation_status}
							</span>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
							<div class="flex items-center space-x-2">
								<Calendar class="w-4 h-4" />
								<span>{format(new Date(selectedEvent.date_time), 'EEEE, MMMM dd, yyyy')}</span>
							</div>
							
							<div class="flex items-center space-x-2">
								<MapPin class="w-4 h-4" />
								<span>{selectedEvent.venue} - {selectedEvent.location_city}</span>
							</div>
							
							<div class="flex items-center space-x-2">
								<Users class="w-4 h-4" />
								<span>{selectedEvent.attendance_count || 0} attending</span>
								{#if selectedEvent.capacity}
									<span>/ {selectedEvent.capacity} capacity</span>
								{/if}
							</div>
							
							<div class="flex items-center space-x-2">
								<Clock class="w-4 h-4" />
								<span>Created {formatDistanceToNow(new Date(selectedEvent.created_at))} ago</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Event Description -->
				{#if selectedEvent.description}
					<div>
						<h4 class="text-lg font-semibold text-gray-900 mb-2">Description</h4>
						<p class="text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</p>
					</div>
				{/if}

				<!-- Event Details -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h4 class="text-lg font-semibold text-gray-900 mb-3">Event Details</h4>
						<dl class="space-y-2 text-sm">
							<div>
								<dt class="font-medium text-gray-700">Organizer</dt>
								<dd class="text-gray-600">{selectedEvent.organizer.display_name || 'No name'} ({selectedEvent.organizer.email})</dd>
							</div>
							
							{#if selectedEvent.age_restriction}
								<div>
									<dt class="font-medium text-gray-700">Age Restriction</dt>
									<dd class="text-gray-600">{selectedEvent.age_restriction}</dd>
								</div>
							{/if}
							
							{#if selectedEvent.ticket_price_min || selectedEvent.ticket_price_max}
								<div>
									<dt class="font-medium text-gray-700">Ticket Price</dt>
									<dd class="text-gray-600">
										{#if selectedEvent.ticket_price_min === selectedEvent.ticket_price_max}
											€{selectedEvent.ticket_price_min}
										{:else}
											€{selectedEvent.ticket_price_min || 0} - €{selectedEvent.ticket_price_max || 0}
										{/if}
									</dd>
								</div>
							{/if}
							
							{#if selectedEvent.website_url}
								<div>
									<dt class="font-medium text-gray-700">Website</dt>
									<dd class="text-gray-600">
										<a href={selectedEvent.website_url} target="_blank" class="text-purple-600 hover:underline flex items-center">
											{selectedEvent.website_url}
											<ExternalLink class="w-3 h-3 ml-1" />
										</a>
									</dd>
								</div>
							{/if}
							
							{#if selectedEvent.ticket_url}
								<div>
									<dt class="font-medium text-gray-700">Tickets</dt>
									<dd class="text-gray-600">
										<a href={selectedEvent.ticket_url} target="_blank" class="text-purple-600 hover:underline flex items-center">
											{selectedEvent.ticket_url}
											<ExternalLink class="w-3 h-3 ml-1" />
										</a>
									</dd>
								</div>
							{/if}
						</dl>
					</div>

					<!-- Reports -->
					{#if selectedEvent.reports && selectedEvent.reports.length > 0}
						<div>
							<h4 class="text-lg font-semibold text-gray-900 mb-3">
								Reports ({selectedEvent.reports.length})
							</h4>
							
							<div class="space-y-3 max-h-60 overflow-y-auto">
								{#each selectedEvent.reports as report}
									<div class="bg-red-50 border border-red-200 rounded-lg p-3">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<div class="text-sm font-medium text-red-800">
													{report.reason}
												</div>
												{#if report.description}
													<div class="text-sm text-red-700 mt-1">
														{report.description}
													</div>
												{/if}
											</div>
										</div>
										
										<div class="text-xs text-red-600 mt-2">
											Reported by {report.reporter.display_name || report.reporter.email} 
											• {formatDistanceToNow(new Date(report.created_at))} ago
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Moderation Actions -->
				<div class="border-t pt-6">
					<h4 class="text-lg font-semibold text-gray-900 mb-3">Moderation Actions</h4>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Moderation Note (Optional)
							</label>
							<textarea
								bind:value={moderationNote}
								placeholder="Add a note explaining your decision..."
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
							></textarea>
						</div>

						<div class="flex items-center space-x-3">
							<button
								on:click={() => {
									updateEventModerationStatus(selectedEvent.id, 'approved', moderationNote)
									closeEventModal()
								}}
								class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
							>
								<Check class="w-4 h-4 mr-2" />
								Approve Event
							</button>
							
							<button
								on:click={() => {
									updateEventModerationStatus(selectedEvent.id, 'rejected', moderationNote)
									closeEventModal()
								}}
								class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500"
							>
								<X class="w-4 h-4 mr-2" />
								Reject Event
							</button>
							
							<button
								on:click={() => {
									updateEventModerationStatus(selectedEvent.id, 'flagged', moderationNote)
									closeEventModal()
								}}
								class="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 focus:ring-2 focus:ring-orange-500"
							>
								<Flag class="w-4 h-4 mr-2" />
								Flag for Review
							</button>
							
							<button
								on:click={() => {
									updateEventModerationStatus(selectedEvent.id, 'under_review', moderationNote)
									closeEventModal()
								}}
								class="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 focus:ring-2 focus:ring-purple-500"
							>
								<AlertTriangle class="w-4 h-4 mr-2" />
								Mark Under Review
							</button>

							{#if $isAdmin}
								<button
									on:click={() => {
										deleteEvent(selectedEvent.id)
										closeEventModal()
									}}
									class="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 focus:ring-2 focus:ring-red-500"
								>
									Delete Event
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
