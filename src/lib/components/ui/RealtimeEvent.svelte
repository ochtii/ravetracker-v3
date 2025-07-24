<!--
Real-time Event Component
========================
Event display with live attendance updates and real-time features
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { createEventDispatcher } from 'svelte'
	import { 
		realtimeActions,
		liveUpdates,
		isConnected 
	} from '$lib/stores/realtime'
	import { user } from '$lib/stores/auth-enhanced'
	import { eventsActions } from '$lib/stores/events-enhanced'
	import { 
		Calendar, 
		MapPin, 
		Users, 
		Clock, 
		Share, 
		Heart,
		ExternalLink,
		Wifi,
		WifiOff,
		Loader2,
		CheckCircle,
		AlertCircle
	} from 'lucide-svelte'
	import { formatDistanceToNow, format } from 'date-fns'

	// Props
	export let event: any
	export let variant: 'card' | 'list' | 'detailed' = 'card'
	export let showAttendance = true
	export let enableRealtime = true

	// Component state
	let isJoining = false
	let isLeaving = false
	let attendanceCount = event.attendance_count || 0
	let userAttendance = event.user_attendance || null
	let realTimeEnabled = false
	let lastUpdate: Date | null = null

	const dispatch = createEventDispatcher()

	// Reactive statements
	$: isUserAttending = userAttendance?.status === 'attending'
	$: canJoin = $user && !isUserAttending && event.status === 'published'
	$: canLeave = $user && isUserAttending
	$: eventDate = new Date(event.date)
	$: isUpcoming = eventDate > new Date()
	$: isPast = eventDate < new Date()
	$: connected = $isConnected

	// Real-time updates handling
	$: if (enableRealtime && event.id) {
		// Filter updates for this specific event
		const eventUpdates = $liveUpdates.filter(update => 
			(update.type === 'event' && update.data?.id === event.id) ||
			(update.type === 'attendance' && update.data?.event_id === event.id)
		)

		if (eventUpdates.length > 0) {
			handleRealtimeUpdates(eventUpdates)
		}
	}

	// Functions
	async function handleJoinEvent() {
		if (!$user || isJoining || isUserAttending) return

		isJoining = true
		try {
			// Optimistic update
			userAttendance = {
				user_id: $user.id,
				event_id: event.id,
				status: 'attending',
				created_at: new Date().toISOString()
			}
			attendanceCount += 1

			// Make API call
			await eventsActions.joinEvent(event.id, true)
			
			dispatch('joined', { eventId: event.id, userId: $user.id })
			
		} catch (error) {
			console.error('Failed to join event:', error)
			
			// Rollback optimistic update
			userAttendance = null
			attendanceCount -= 1
			
			dispatch('error', { 
				message: 'Failed to join event. Please try again.',
				error 
			})
		} finally {
			isJoining = false
		}
	}

	async function handleLeaveEvent() {
		if (!$user || isLeaving || !isUserAttending) return

		isLeaving = true
		try {
			// Optimistic update
			const previousAttendance = userAttendance
			userAttendance = null
			attendanceCount -= 1

			// Make API call
			await eventsActions.leaveEvent(event.id, true)
			
			dispatch('left', { eventId: event.id, userId: $user.id })
			
		} catch (error) {
			console.error('Failed to leave event:', error)
			
			// Rollback optimistic update
			userAttendance = previousAttendance
			attendanceCount += 1
			
			dispatch('error', { 
				message: 'Failed to leave event. Please try again.',
				error 
			})
		} finally {
			isLeaving = false
		}
	}

	function handleRealtimeUpdates(updates: any[]) {
		updates.forEach(update => {
			if (!update.acknowledged) {
				switch (update.type) {
					case 'event':
						handleEventUpdate(update)
						break
					case 'attendance':
						handleAttendanceUpdate(update)
						break
				}
				lastUpdate = update.timestamp
			}
		})
	}

	function handleEventUpdate(update: any) {
		if (update.data?.id === event.id) {
			// Update event data
			Object.assign(event, update.data)
			
			dispatch('eventUpdated', { 
				event: update.data, 
				action: update.action 
			})
		}
	}

	function handleAttendanceUpdate(update: any) {
		if (update.data?.event_id === event.id) {
			switch (update.action) {
				case 'INSERT':
					if (update.data.user_id !== $user?.id) {
						attendanceCount += 1
					}
					break
				case 'DELETE':
					if (update.data.user_id !== $user?.id) {
						attendanceCount -= 1
					}
					break
				case 'UPDATE':
					// Handle status changes
					break
			}
			
			dispatch('attendanceUpdated', { 
				attendance: update.data, 
				action: update.action 
			})
		}
	}

	async function handleShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: event.title,
					text: event.description,
					url: `${window.location.origin}/events/${event.id}`
				})
			} catch (error) {
				// User cancelled sharing
			}
		} else {
			// Fallback to clipboard
			try {
				await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`)
				dispatch('shared', { eventId: event.id, method: 'clipboard' })
			} catch (error) {
				console.error('Failed to copy to clipboard:', error)
			}
		}
	}

	function handleClick() {
		dispatch('click', { event })
	}

	function formatEventDate(date: Date): string {
		if (variant === 'list') {
			return format(date, 'MMM d, HH:mm')
		}
		return format(date, 'EEEE, MMMM d, yyyy • HH:mm')
	}

	function getEventStatus(): { text: string; color: string; icon: any } {
		if (isPast) {
			return { text: 'Past Event', color: 'text-gray-500 bg-gray-100', icon: Clock }
		}
		
		switch (event.status) {
			case 'published':
				return { text: 'Live', color: 'text-green-600 bg-green-100', icon: CheckCircle }
			case 'cancelled':
				return { text: 'Cancelled', color: 'text-red-600 bg-red-100', icon: AlertCircle }
			case 'draft':
				return { text: 'Draft', color: 'text-yellow-600 bg-yellow-100', icon: Clock }
			default:
				return { text: 'Unknown', color: 'text-gray-500 bg-gray-100', icon: AlertCircle }
		}
	}

	// Lifecycle
	onMount(async () => {
		if (enableRealtime && event.id) {
			try {
				await realtimeActions.subscribeToEventAttendance(event.id)
				realTimeEnabled = true
			} catch (error) {
				console.error('Failed to enable realtime for event:', error)
			}
		}
	})

	onDestroy(async () => {
		if (realTimeEnabled && event.id) {
			try {
				await realtimeActions.unsubscribeFromEventAttendance(event.id)
			} catch (error) {
				console.error('Failed to disable realtime for event:', error)
			}
		}
	})

	$: status = getEventStatus()
</script>

<!-- Card Variant -->
{#if variant === 'card'}
	<article class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
		<!-- Event Image -->
		{#if event.image_url}
			<div class="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 relative overflow-hidden">
				<img 
					src={event.image_url} 
					alt={event.title}
					class="w-full h-full object-cover"
					loading="lazy"
				/>
				
				<!-- Real-time indicator -->
				{#if enableRealtime}
					<div class="absolute top-2 right-2 flex items-center space-x-1">
						{#if connected && realTimeEnabled}
							<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates enabled"></div>
						{:else}
							<div class="w-2 h-2 bg-gray-400 rounded-full" title="Offline"></div>
						{/if}
					</div>
				{/if}
				
				<!-- Status Badge -->
				<div class="absolute top-2 left-2">
					<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {status.color}">
						<svelte:component this={status.icon} class="w-3 h-3 mr-1" />
						{status.text}
					</span>
				</div>
			</div>
		{/if}

		<!-- Content -->
		<div class="p-4">
			<!-- Header -->
			<div class="flex items-start justify-between mb-3">
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-purple-600" 
					    on:click={handleClick}>
						{event.title}
					</h3>
					{#if event.genres && event.genres.length > 0}
						<div class="flex flex-wrap gap-1 mt-1">
							{#each event.genres.slice(0, 3) as genre}
								<span class="inline-block px-2 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 rounded">
									{genre}
								</span>
							{/each}
							{#if event.genres.length > 3}
								<span class="text-xs text-gray-500">+{event.genres.length - 3} more</span>
							{/if}
						</div>
					{/if}
				</div>
				
				<button
					on:click={handleShare}
					class="p-1 text-gray-400 hover:text-gray-600 ml-2"
					title="Share event"
				>
					<Share class="w-4 h-4" />
				</button>
			</div>

			<!-- Event Details -->
			<div class="space-y-2 mb-4">
				<div class="flex items-center text-sm text-gray-600">
					<Calendar class="w-4 h-4 mr-2 flex-shrink-0" />
					<span>{formatEventDate(eventDate)}</span>
				</div>
				
				{#if event.location}
					<div class="flex items-center text-sm text-gray-600">
						<MapPin class="w-4 h-4 mr-2 flex-shrink-0" />
						<span class="truncate">{event.location}</span>
					</div>
				{/if}
				
				{#if showAttendance}
					<div class="flex items-center text-sm text-gray-600">
						<Users class="w-4 h-4 mr-2 flex-shrink-0" />
						<span>{attendanceCount} attending</span>
						{#if lastUpdate}
							<span class="text-xs text-gray-400 ml-2">
								• Updated {formatDistanceToNow(lastUpdate)} ago
							</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Description -->
			{#if event.description}
				<p class="text-sm text-gray-600 line-clamp-2 mb-4">
					{event.description}
				</p>
			{/if}

			<!-- Actions -->
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-2">
					{#if canJoin}
						<button
							on:click={handleJoinEvent}
							disabled={isJoining || !connected}
							class="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if isJoining}
								<Loader2 class="w-4 h-4 mr-1 animate-spin" />
							{/if}
							Join Event
						</button>
					{:else if canLeave}
						<button
							on:click={handleLeaveEvent}
							disabled={isLeaving || !connected}
							class="flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if isLeaving}
								<Loader2 class="w-4 h-4 mr-1 animate-spin" />
							{/if}
							Leave Event
						</button>
					{:else if isUserAttending}
						<div class="flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-100 rounded-lg">
							<CheckCircle class="w-4 h-4 mr-1" />
							Attending
						</div>
					{/if}
				</div>

				<button
					on:click={handleClick}
					class="flex items-center text-sm text-gray-600 hover:text-gray-900"
				>
					View Details
					<ExternalLink class="w-3 h-3 ml-1" />
				</button>
			</div>
		</div>
	</article>

<!-- List Variant -->
{:else if variant === 'list'}
	<article class="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
		<!-- Event Image -->
		{#if event.image_url}
			<div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg overflow-hidden relative">
				<img 
					src={event.image_url} 
					alt={event.title}
					class="w-full h-full object-cover"
					loading="lazy"
				/>
				{#if connected && realTimeEnabled}
					<div class="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
				{/if}
			</div>
		{/if}

		<!-- Content -->
		<div class="flex-1 ml-4 min-w-0">
			<div class="flex items-center justify-between">
				<div class="flex-1 min-w-0">
					<h3 class="text-base font-medium text-gray-900 truncate cursor-pointer hover:text-purple-600" 
					    on:click={handleClick}>
						{event.title}
					</h3>
					
					<div class="flex items-center space-x-4 mt-1 text-sm text-gray-600">
						<span class="flex items-center">
							<Calendar class="w-3 h-3 mr-1" />
							{formatEventDate(eventDate)}
						</span>
						
						{#if event.location}
							<span class="flex items-center truncate">
								<MapPin class="w-3 h-3 mr-1 flex-shrink-0" />
								{event.location}
							</span>
						{/if}
						
						{#if showAttendance}
							<span class="flex items-center">
								<Users class="w-3 h-3 mr-1" />
								{attendanceCount}
							</span>
						{/if}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center space-x-2 ml-4">
					{#if canJoin}
						<button
							on:click={handleJoinEvent}
							disabled={isJoining || !connected}
							class="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
						>
							{#if isJoining}
								<Loader2 class="w-3 h-3 animate-spin" />
							{:else}
								Join
							{/if}
						</button>
					{:else if canLeave}
						<button
							on:click={handleLeaveEvent}
							disabled={isLeaving || !connected}
							class="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded hover:bg-purple-200 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
						>
							{#if isLeaving}
								<Loader2 class="w-3 h-3 animate-spin" />
							{:else}
								Leave
							{/if}
						</button>
					{:else if isUserAttending}
						<span class="px-3 py-1 text-sm font-medium text-green-600 bg-green-100 rounded">
							Attending
						</span>
					{/if}

					<button
						on:click={handleShare}
						class="p-1 text-gray-400 hover:text-gray-600"
						title="Share"
					>
						<Share class="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	</article>

<!-- Detailed Variant -->
{:else if variant === 'detailed'}
	<article class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<!-- Event Image -->
		{#if event.image_url}
			<div class="aspect-[2/1] bg-gradient-to-br from-purple-400 to-pink-400 relative overflow-hidden">
				<img 
					src={event.image_url} 
					alt={event.title}
					class="w-full h-full object-cover"
				/>
				
				<!-- Real-time status -->
				<div class="absolute top-4 right-4 flex items-center space-x-2">
					{#if connected && realTimeEnabled}
						<div class="flex items-center px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
							<Wifi class="w-3 h-3 mr-1" />
							Live
						</div>
					{:else}
						<div class="flex items-center px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
							<WifiOff class="w-3 h-3 mr-1" />
							Offline
						</div>
					{/if}
				</div>
				
				<!-- Status Badge -->
				<div class="absolute top-4 left-4">
					<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {status.color}">
						<svelte:component this={status.icon} class="w-4 h-4 mr-1" />
						{status.text}
					</span>
				</div>
			</div>
		{/if}

		<!-- Content -->
		<div class="p-6">
			<!-- Header -->
			<div class="flex items-start justify-between mb-4">
				<div class="flex-1 min-w-0">
					<h1 class="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
					
					{#if event.genres && event.genres.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each event.genres as genre}
								<span class="inline-block px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-full">
									{genre}
								</span>
							{/each}
						</div>
					{/if}
				</div>
				
				<button
					on:click={handleShare}
					class="p-2 text-gray-400 hover:text-gray-600 ml-4"
					title="Share event"
				>
					<Share class="w-5 h-5" />
				</button>
			</div>

			<!-- Event Info Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<div class="space-y-4">
					<div class="flex items-start space-x-3">
						<Calendar class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
						<div>
							<div class="font-medium text-gray-900">{formatEventDate(eventDate)}</div>
							<div class="text-sm text-gray-600">
								{isUpcoming ? `In ${formatDistanceToNow(eventDate)}` : 'Past event'}
							</div>
						</div>
					</div>
					
					{#if event.location}
						<div class="flex items-start space-x-3">
							<MapPin class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
							<div>
								<div class="font-medium text-gray-900">{event.location}</div>
								{#if event.venue}
									<div class="text-sm text-gray-600">{event.venue}</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				{#if showAttendance}
					<div class="flex items-start space-x-3">
						<Users class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
						<div>
							<div class="font-medium text-gray-900">{attendanceCount} attending</div>
							{#if lastUpdate}
								<div class="text-sm text-gray-600">
									Last updated {formatDistanceToNow(lastUpdate)} ago
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Description -->
			{#if event.description}
				<div class="mb-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-2">About this event</h3>
					<div class="prose prose-sm text-gray-600">
						{event.description}
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex items-center justify-between pt-4 border-t border-gray-100">
				<div class="flex items-center space-x-3">
					{#if canJoin}
						<button
							on:click={handleJoinEvent}
							disabled={isJoining || !connected}
							class="flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if isJoining}
								<Loader2 class="w-5 h-5 mr-2 animate-spin" />
							{/if}
							Join Event
						</button>
					{:else if canLeave}
						<button
							on:click={handleLeaveEvent}
							disabled={isLeaving || !connected}
							class="flex items-center px-6 py-3 text-base font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if isLeaving}
								<Loader2 class="w-5 h-5 mr-2 animate-spin" />
							{/if}
							Leave Event
						</button>
					{:else if isUserAttending}
						<div class="flex items-center px-6 py-3 text-base font-medium text-green-600 bg-green-100 rounded-lg">
							<CheckCircle class="w-5 h-5 mr-2" />
							You're attending
						</div>
					{/if}
				</div>

				{#if !connected}
					<div class="flex items-center text-sm text-gray-500">
						<WifiOff class="w-4 h-4 mr-1" />
						Offline mode
					</div>
				{/if}
			</div>
		</div>
	</article>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.prose {
		max-width: none;
	}
</style>
