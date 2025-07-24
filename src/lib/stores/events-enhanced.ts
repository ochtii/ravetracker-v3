// Enhanced Events Store with Real-time Updates and Optimistic Updates
// ====================================================================

import { writable, derived, get } from 'svelte/store'
import { db, type DatabaseError } from '$lib/utils/database'
import { supabase } from '$lib/utils/supabase'
import { user } from './auth-enhanced'
import type { Database } from '$lib/types/database'

type Event = Database['public']['Tables']['events']['Row'] & {
	organizer?: any
	category?: any
	attendance_count?: number
	attendance?: any[]
	user_attendance?: any
}

type EventAttendance = Database['public']['Tables']['event_attendance']['Row']

interface EventsState {
	events: Event[]
	currentEvent: Event | null
	userEvents: Event[]
	userAttendance: EventAttendance[]
	filters: EventFilters
	pagination: {
		page: number
		limit: number
		total: number
		hasMore: boolean
	}
	loading: {
		events: boolean
		currentEvent: boolean
		userEvents: boolean
		attendance: boolean
		creating: boolean
		updating: boolean
	}
	error: DatabaseError | null
	realTimeEnabled: boolean
}

interface EventFilters {
	status?: string[]
	genres?: string[]
	location?: string
	dateFrom?: string
	dateTo?: string
	organizer?: string
	category?: string
	searchTerm?: string
}

// Create the events store
const createEventsStore = () => {
	const initialState: EventsState = {
		events: [],
		currentEvent: null,
		userEvents: [],
		userAttendance: [],
		filters: {},
		pagination: {
			page: 1,
			limit: 20,
			total: 0,
			hasMore: false
		},
		loading: {
			events: false,
			currentEvent: false,
			userEvents: false,
			attendance: false,
			creating: false,
			updating: false
		},
		error: null,
		realTimeEnabled: false
	}

	const { subscribe, set, update } = writable<EventsState>(initialState)

	// Real-time subscriptions
	let eventsSubscription: any = null
	let attendanceSubscription: any = null

	return {
		subscribe,
		
		// Actions
		actions: {
			setLoading: (key: keyof EventsState['loading'], loading: boolean) => {
				update(state => ({
					...state,
					loading: { ...state.loading, [key]: loading }
				}))
			},

			setError: (error: DatabaseError | null) => {
				update(state => ({ ...state, error }))
			},

			clearError: () => {
				update(state => ({ ...state, error: null }))
			},

			setEvents: (events: Event[], total?: number) => {
				update(state => ({
					...state,
					events,
					pagination: {
						...state.pagination,
						total: total ?? state.pagination.total,
						hasMore: events.length === state.pagination.limit
					}
				}))
			},

			addEvent: (event: Event) => {
				update(state => ({
					...state,
					events: [event, ...state.events]
				}))
			},

			updateEvent: (eventId: string, updates: Partial<Event>) => {
				update(state => ({
					...state,
					events: state.events.map(event =>
						event.id === eventId ? { ...event, ...updates } : event
					),
					currentEvent: state.currentEvent?.id === eventId
						? { ...state.currentEvent, ...updates }
						: state.currentEvent
				}))
			},

			removeEvent: (eventId: string) => {
				update(state => ({
					...state,
					events: state.events.filter(event => event.id !== eventId),
					currentEvent: state.currentEvent?.id === eventId ? null : state.currentEvent
				}))
			},

			setCurrentEvent: (event: Event | null) => {
				update(state => ({ ...state, currentEvent: event }))
			},

			setUserEvents: (events: Event[]) => {
				update(state => ({ ...state, userEvents: events }))
			},

			setUserAttendance: (attendance: EventAttendance[]) => {
				update(state => ({ ...state, userAttendance: attendance }))
			},

			updateUserAttendance: (eventId: string, attendance: EventAttendance | null) => {
				update(state => {
					const newAttendance = attendance
						? [...state.userAttendance.filter(a => a.event_id !== eventId), attendance]
						: state.userAttendance.filter(a => a.event_id !== eventId)

					return {
						...state,
						userAttendance: newAttendance,
						// Update current event if it matches
						currentEvent: state.currentEvent?.id === eventId
							? { ...state.currentEvent, user_attendance: attendance }
							: state.currentEvent
					}
				})
			},

			setFilters: (filters: EventFilters) => {
				update(state => ({ ...state, filters }))
			},

			setPagination: (updates: Partial<EventsState['pagination']>) => {
				update(state => ({
					...state,
					pagination: { ...state.pagination, ...updates }
				}))
			},

			nextPage: () => {
				update(state => ({
					...state,
					pagination: { ...state.pagination, page: state.pagination.page + 1 }
				}))
			},

			resetPagination: () => {
				update(state => ({
					...state,
					pagination: { ...state.pagination, page: 1, total: 0, hasMore: false }
				}))
			},

			enableRealTime: () => {
				update(state => ({ ...state, realTimeEnabled: true }))
				setupRealTimeSubscriptions()
			},

			disableRealTime: () => {
				update(state => ({ ...state, realTimeEnabled: false }))
				cleanupSubscriptions()
			}
		},

		// Cleanup function
		destroy: () => {
			cleanupSubscriptions()
		}
	}

	// Real-time subscription helpers
	function setupRealTimeSubscriptions() {
		// Events subscription
		eventsSubscription = supabase
			.channel('events_channel')
			.on('postgres_changes', {
				event: '*',
				schema: 'public',
				table: 'events'
			}, (payload) => {
				handleEventChange(payload)
			})
			.subscribe()

		// Attendance subscription
		attendanceSubscription = supabase
			.channel('attendance_channel')
			.on('postgres_changes', {
				event: '*',
				schema: 'public',
				table: 'event_attendance'
			}, (payload) => {
				handleAttendanceChange(payload)
			})
			.subscribe()
	}

	function handleEventChange(payload: any) {
		const { eventType, new: newRecord, old: oldRecord } = payload

		switch (eventType) {
			case 'INSERT':
				if (newRecord) {
					eventsStore.actions.addEvent(newRecord)
				}
				break
			case 'UPDATE':
				if (newRecord) {
					eventsStore.actions.updateEvent(newRecord.id, newRecord)
				}
				break
			case 'DELETE':
				if (oldRecord) {
					eventsStore.actions.removeEvent(oldRecord.id)
				}
				break
		}
	}

	function handleAttendanceChange(payload: any) {
		const { eventType, new: newRecord, old: oldRecord } = payload
		const currentUser = get(user)

		if (!currentUser) return

		const userId = currentUser.id

		switch (eventType) {
			case 'INSERT':
				if (newRecord && newRecord.user_id === userId) {
					eventsStore.actions.updateUserAttendance(newRecord.event_id, newRecord)
				}
				break
			case 'UPDATE':
				if (newRecord && newRecord.user_id === userId) {
					eventsStore.actions.updateUserAttendance(newRecord.event_id, newRecord)
				}
				break
			case 'DELETE':
				if (oldRecord && oldRecord.user_id === userId) {
					eventsStore.actions.updateUserAttendance(oldRecord.event_id, null)
				}
				break
		}
	}

	function cleanupSubscriptions() {
		if (eventsSubscription) {
			supabase.removeChannel(eventsSubscription)
			eventsSubscription = null
		}
		if (attendanceSubscription) {
			supabase.removeChannel(attendanceSubscription)
			attendanceSubscription = null
		}
	}
}

export const eventsStore = createEventsStore()

// Derived stores
export const events = derived(eventsStore, state => state.events)
export const currentEvent = derived(eventsStore, state => state.currentEvent)
export const userEvents = derived(eventsStore, state => state.userEvents)
export const userAttendance = derived(eventsStore, state => state.userAttendance)
export const eventsLoading = derived(eventsStore, state => state.loading)
export const eventsError = derived(eventsStore, state => state.error)
export const eventFilters = derived(eventsStore, state => state.filters)
export const eventsPagination = derived(eventsStore, state => state.pagination)

// Events operations
export const eventsActions = {
	// Load events with filters and pagination
	async loadEvents(refresh = false) {
		const state = get(eventsStore)
		
		if (refresh) {
			eventsStore.actions.resetPagination()
		}

		eventsStore.actions.setLoading('events', true)
		eventsStore.actions.clearError()

		try {
			const { data, error, count } = await db.events.list({
				pagination: {
					page: refresh ? 1 : state.pagination.page,
					limit: state.pagination.limit,
					orderBy: 'date_time',
					ascending: false
				},
				filters: state.filters,
				cache: { useCache: true, cacheTime: 2 * 60 * 1000 } // 2 minutes
			})

			if (error) {
				eventsStore.actions.setError(error)
				return { error }
			}

			if (refresh) {
				eventsStore.actions.setEvents(data, count)
			} else {
				// Append to existing events for pagination
				const existingEvents = get(events)
				eventsStore.actions.setEvents([...existingEvents, ...data], count)
			}

			return { error: null }
		} catch (error) {
			const dbError = { code: 'UNKNOWN', message: 'Unknown error' } as DatabaseError
			eventsStore.actions.setError(dbError)
			return { error: dbError }
		} finally {
			eventsStore.actions.setLoading('events', false)
		}
	},

	// Create new event
	async createEvent(eventData: any, optimistic = true) {
		const currentUser = get(user)
		if (!currentUser) {
			const error = { code: 'NO_AUTH', message: 'Authentication required' } as DatabaseError
			eventsStore.actions.setError(error)
			return { error }
		}

		eventsStore.actions.setLoading('creating', true)
		eventsStore.actions.clearError()

		// Optimistic update
		let optimisticEvent: Event | null = null
		if (optimistic) {
			optimisticEvent = {
				id: `temp-${Date.now()}`,
				...eventData,
				organizer_id: currentUser.id,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				view_count: 0,
				organizer: {
					id: currentUser.id,
				}
			} as Event

			eventsStore.actions.addEvent(optimisticEvent)
		}

		try {
			const { data, error } = await db.events.create({
				...eventData,
				organizer_id: currentUser.id
			})

			if (error) {
				// Revert optimistic update
				if (optimisticEvent) {
					eventsStore.actions.removeEvent(optimisticEvent.id)
				}
				eventsStore.actions.setError(error)
				return { error }
			}

			// Replace optimistic event with real data
			if (optimisticEvent) {
				eventsStore.actions.removeEvent(optimisticEvent.id)
			}
			eventsStore.actions.addEvent(data)

			return { data, error: null }
		} catch (error) {
			// Revert optimistic update
			if (optimisticEvent) {
				eventsStore.actions.removeEvent(optimisticEvent.id)
			}
			
			const dbError = { code: 'UNKNOWN', message: 'Unknown error' } as DatabaseError
			eventsStore.actions.setError(dbError)
			return { error: dbError }
		} finally {
			eventsStore.actions.setLoading('creating', false)
		}
	},

	// Event attendance operations
	async joinEvent(eventId: string, optimistic = true) {
		const currentUser = get(user)
		if (!currentUser) {
			const error = { code: 'NO_AUTH', message: 'Authentication required' } as DatabaseError
			eventsStore.actions.setError(error)
			return { error }
		}

		eventsStore.actions.setLoading('attendance', true)
		eventsStore.actions.clearError()

		// Optimistic update
		let optimisticAttendance: EventAttendance | null = null
		if (optimistic) {
			optimisticAttendance = {
				id: `temp-${Date.now()}`,
				user_id: currentUser.id,
				event_id: eventId,
				status: 'registered',
				registered_at: new Date().toISOString(),
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			} as EventAttendance

			eventsStore.actions.updateUserAttendance(eventId, optimisticAttendance)
		}

		try {
			const { data, error } = await db.attendance.create({
				user_id: currentUser.id,
				event_id: eventId,
				status: 'registered'
			})

			if (error) {
				// Revert optimistic update
				if (optimistic) {
					eventsStore.actions.updateUserAttendance(eventId, null)
				}
				eventsStore.actions.setError(error)
				return { error }
			}

			// Update with real data
			eventsStore.actions.updateUserAttendance(eventId, data)

			return { data, error: null }
		} catch (error) {
			// Revert optimistic update
			if (optimistic) {
				eventsStore.actions.updateUserAttendance(eventId, null)
			}
			
			const dbError = { code: 'UNKNOWN', message: 'Unknown error' } as DatabaseError
			eventsStore.actions.setError(dbError)
			return { error: dbError }
		} finally {
			eventsStore.actions.setLoading('attendance', false)
		}
	},

	// Filter operations
	setFilters(filters: EventFilters) {
		eventsStore.actions.setFilters(filters)
		eventsStore.actions.resetPagination()
		return this.loadEvents(true)
	},

	clearFilters() {
		eventsStore.actions.setFilters({})
		eventsStore.actions.resetPagination()
		return this.loadEvents(true)
	},

	// Real-time operations
	enableRealTime() {
		eventsStore.actions.enableRealTime()
	},

	disableRealTime() {
		eventsStore.actions.disableRealTime()
	}
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		eventsStore.destroy()
	})
}
