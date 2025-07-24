<!--
Enhanced Event Card with Optimistic Updates and Real-time Data
============================================================
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { Calendar, MapPin, Users, Heart, Share2, Eye } from 'lucide-svelte'
	import { eventsActions } from '$lib/stores/events-enhanced'
	import { user } from '$lib/stores/auth-enhanced'
	import LoadingSpinner from './LoadingSpinner.svelte'
	import ErrorDisplay from './ErrorDisplay.svelte'
	import type { Database } from '$lib/types/database'

	type Event = Database['public']['Tables']['events']['Row'] & {
		organizer?: any
		category?: any
		attendance_count?: number
		user_attendance?: any
	}

	export let event: Event
	export let variant: 'card' | 'list' | 'featured' = 'card'
	export let showActions = true
	export let loading = false
	export let error: any = null

	const dispatch = createEventDispatcher<{
		click: { event: Event }
		join: { event: Event }
		share: { event: Event }
	}>()

	let isJoining = false
	let isLiking = false
	let joinError: any = null

	$: isUserAttending = event.user_attendance?.status === 'registered'
	$: isUserEvent = $user && event.organizer_id === $user.id
	$: formattedDate = formatEventDate(event.date_time)
	$: eventStatus = getEventStatus(event.date_time, event.status)

	function formatEventDate(dateString: string): string {
		const date = new Date(dateString)
		const now = new Date()
		const diffTime = date.getTime() - now.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays === 0) return 'Today'
		if (diffDays === 1) return 'Tomorrow'
		if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
		
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		})
	}

	function getEventStatus(dateTime: string, status: string): {
		label: string
		color: string
	} {
		const eventDate = new Date(dateTime)
		const now = new Date()
		
		if (status === 'cancelled') {
			return { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
		}
		
		if (eventDate < now) {
			return { label: 'Past', color: 'bg-gray-100 text-gray-800' }
		}
		
		if (status === 'draft') {
			return { label: 'Draft', color: 'bg-yellow-100 text-yellow-800' }
		}
		
		const diffTime = eventDate.getTime() - now.getTime()
		const diffHours = diffTime / (1000 * 60 * 60)
		
		if (diffHours <= 24) {
			return { label: 'Starting Soon', color: 'bg-orange-100 text-orange-800' }
		}
		
		return { label: 'Upcoming', color: 'bg-green-100 text-green-800' }
	}

	async function handleJoin() {
		if (!$user || isJoining || isUserEvent) return

		isJoining = true
		joinError = null

		try {
			if (isUserAttending) {
				const { error } = await eventsActions.leaveEvent(event.id)
				if (error) {
					joinError = error
				}
			} else {
				const { error } = await eventsActions.joinEvent(event.id, true)
				if (error) {
					joinError = error
				} else {
					dispatch('join', { event })
				}
			}
		} catch (err) {
			joinError = { code: 'UNKNOWN', message: 'Failed to update attendance' }
		} finally {
			isJoining = false
		}
	}

	function handleClick() {
		if (!loading && !error) {
			dispatch('click', { event })
		}
	}

	function handleShare() {
		dispatch('share', { event })
		
		// Try to use Web Share API if available
		if (navigator.share) {
			navigator.share({
				title: event.title,
				text: event.description || `Join me at ${event.title}!`,
				url: `${window.location.origin}/events/${event.id}`
			}).catch(() => {
				// Fallback to copying to clipboard
				copyToClipboard(`${window.location.origin}/events/${event.id}`)
			})
		} else {
			// Fallback to copying to clipboard
			copyToClipboard(`${window.location.origin}/events/${event.id}`)
		}
	}

	function copyToClipboard(text: string) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text)
		}
	}

	function retryJoin() {
		joinError = null
		handleJoin()
	}
</script>

{#if variant === 'featured'}
	<div class="relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
		{#if loading}
			<div class="absolute inset-0 z-10">
				<LoadingSpinner variant="card" count={1} />
			</div>
		{/if}
		
		{#if error}
			<div class="p-6">
				<ErrorDisplay {error} variant="card" on:retry />
			</div>
		{:else}
			<!-- Cover Image -->
			{#if event.cover_image_url}
				<div class="relative h-48 bg-gray-200">
					<img 
						src={event.cover_image_url} 
						alt={event.title}
						class="w-full h-full object-cover"
						loading="lazy"
					/>
					<div class="absolute top-4 left-4">
						<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {eventStatus.color}">
							{eventStatus.label}
						</span>
					</div>
					{#if event.view_count}
						<div class="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center">
							<Eye class="h-3 w-3 mr-1" />
							{event.view_count}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Content -->
			<div class="p-6">
				<!-- Category -->
				{#if event.category}
					<div class="flex items-center mb-2">
						<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
							{event.category.name}
						</span>
					</div>
				{/if}

				<!-- Title and Description -->
				<button 
					type="button"
					class="text-left w-full group"
					on:click={handleClick}
					disabled={loading}
				>
					<h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
						{event.title}
					</h3>
					{#if event.description}
						<p class="text-gray-600 text-sm line-clamp-2 mb-4">
							{event.description}
						</p>
					{/if}
				</button>

				<!-- Event Details -->
				<div class="space-y-2 mb-4">
					<div class="flex items-center text-sm text-gray-600">
						<Calendar class="h-4 w-4 mr-2 text-gray-400" />
						<span>{formattedDate}</span>
					</div>
					{#if event.location_name}
						<div class="flex items-center text-sm text-gray-600">
							<MapPin class="h-4 w-4 mr-2 text-gray-400" />
							<span>{event.location_name}</span>
						</div>
					{/if}
					{#if event.attendance_count !== undefined}
						<div class="flex items-center text-sm text-gray-600">
							<Users class="h-4 w-4 mr-2 text-gray-400" />
							<span>{event.attendance_count} attending</span>
						</div>
					{/if}
				</div>

				<!-- Organizer -->
				{#if event.organizer}
					<div class="flex items-center mb-4">
						{#if event.organizer.avatar_url}
							<img 
								src={event.organizer.avatar_url} 
								alt={event.organizer.first_name || event.organizer.username}
								class="h-8 w-8 rounded-full mr-3"
							/>
						{:else}
							<div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
								<span class="text-xs font-medium text-gray-600">
									{(event.organizer.first_name || event.organizer.username || '?')[0].toUpperCase()}
								</span>
							</div>
						{/if}
						<div>
							<p class="text-sm font-medium text-gray-900">
								{event.organizer.first_name || event.organizer.username}
							</p>
							{#if event.organizer.is_verified}
								<p class="text-xs text-primary">Verified Organizer</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Actions -->
				{#if showActions && $user}
					<div class="flex items-center justify-between">
						{#if !isUserEvent}
							<button
								type="button"
								class="flex-1 mr-2 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-colors
									{isUserAttending 
										? 'bg-primary text-white border-primary hover:bg-primary/90' 
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
									}"
								on:click={handleJoin}
								disabled={isJoining || loading}
							>
								{#if isJoining}
									<LoadingSpinner size="sm" className="mr-2" />
								{/if}
								{isUserAttending ? 'Attending' : 'Join Event'}
							</button>
						{/if}

						<div class="flex space-x-2">
							<button
								type="button"
								class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
								on:click={handleShare}
								title="Share event"
							>
								<Share2 class="h-4 w-4" />
							</button>
						</div>
					</div>

					{#if joinError}
						<div class="mt-2">
							<ErrorDisplay 
								error={joinError} 
								variant="inline" 
								on:retry={retryJoin}
								on:dismiss={() => joinError = null}
							/>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
{:else if variant === 'list'}
	<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
		{#if loading}
			<LoadingSpinner variant="list" count={1} />
		{:else if error}
			<ErrorDisplay {error} variant="inline" on:retry />
		{:else}
			<button 
				type="button"
				class="w-full text-left group"
				on:click={handleClick}
			>
				<div class="flex items-center space-x-4">
					{#if event.cover_image_url}
						<img 
							src={event.cover_image_url} 
							alt={event.title}
							class="h-16 w-16 rounded-lg object-cover flex-shrink-0"
							loading="lazy"
						/>
					{:else}
						<div class="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
							<Calendar class="h-6 w-6 text-gray-400" />
						</div>
					{/if}

					<div class="flex-1 min-w-0">
						<div class="flex items-center space-x-2 mb-1">
							<h3 class="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
								{event.title}
							</h3>
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {eventStatus.color}">
								{eventStatus.label}
							</span>
						</div>
						<div class="space-y-1">
							<div class="flex items-center text-sm text-gray-600">
								<Calendar class="h-3 w-3 mr-1" />
								{formattedDate}
							</div>
							{#if event.location_name}
								<div class="flex items-center text-sm text-gray-600">
									<MapPin class="h-3 w-3 mr-1" />
									{event.location_name}
								</div>
							{/if}
						</div>
					</div>

					{#if showActions && $user && !isUserEvent}
						<div class="flex-shrink-0">
							<button
								type="button"
								class="px-3 py-1 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-colors
									{isUserAttending 
										? 'bg-primary text-white border-primary' 
										: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
									}"
								on:click|stopPropagation={handleJoin}
								disabled={isJoining}
							>
								{#if isJoining}
									<LoadingSpinner size="sm" />
								{:else}
									{isUserAttending ? 'Attending' : 'Join'}
								{/if}
							</button>
						</div>
					{/if}
				</div>
			</button>
		{/if}
	</div>
{:else}
	<!-- Default card variant -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
		{#if loading}
			<LoadingSpinner variant="card" count={1} />
		{:else if error}
			<div class="p-4">
				<ErrorDisplay {error} variant="card" on:retry />
			</div>
		{:else}
			{#if event.cover_image_url}
				<div class="relative h-32 bg-gray-200">
					<img 
						src={event.cover_image_url} 
						alt={event.title}
						class="w-full h-full object-cover"
						loading="lazy"
					/>
					<div class="absolute top-2 left-2">
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {eventStatus.color}">
							{eventStatus.label}
						</span>
					</div>
				</div>
			{/if}

			<div class="p-4">
				<button 
					type="button"
					class="text-left w-full group mb-3"
					on:click={handleClick}
				>
					<h3 class="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
						{event.title}
					</h3>
				</button>

				<div class="space-y-2 mb-4">
					<div class="flex items-center text-sm text-gray-600">
						<Calendar class="h-4 w-4 mr-2 text-gray-400" />
						<span>{formattedDate}</span>
					</div>
					{#if event.location_name}
						<div class="flex items-center text-sm text-gray-600">
							<MapPin class="h-4 w-4 mr-2 text-gray-400" />
							<span class="truncate">{event.location_name}</span>
						</div>
					{/if}
				</div>

				{#if showActions && $user && !isUserEvent}
					<button
						type="button"
						class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-colors
							{isUserAttending 
								? 'bg-primary text-white border-primary hover:bg-primary/90' 
								: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
							}"
						on:click={handleJoin}
						disabled={isJoining}
					>
						{#if isJoining}
							<LoadingSpinner size="sm" className="mr-2" />
						{/if}
						{isUserAttending ? 'Attending' : 'Join Event'}
					</button>

					{#if joinError}
						<div class="mt-2">
							<ErrorDisplay 
								error={joinError} 
								variant="inline" 
								on:retry={retryJoin}
								on:dismiss={() => joinError = null}
							/>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
