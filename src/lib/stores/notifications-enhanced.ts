// Enhanced Notifications Store with Real-time Updates
// ==================================================

import { writable, derived, get } from 'svelte/store'
import { db, type DatabaseError } from '$lib/utils/database'
import { supabase } from '$lib/utils/supabase'
import { user } from './auth-enhanced'
import type { Database } from '$lib/types/database'

type Notification = Database['public']['Tables']['notifications']['Row'] & {
	event?: any
}

interface NotificationsState {
	notifications: Notification[]
	unreadCount: number
	loading: {
		notifications: boolean
		markingRead: boolean
		markingAllRead: boolean
	}
	error: DatabaseError | null
	realTimeEnabled: boolean
	lastChecked: Date | null
}

// Create notifications store
const createNotificationsStore = () => {
	const initialState: NotificationsState = {
		notifications: [],
		unreadCount: 0,
		loading: {
			notifications: false,
			markingRead: false,
			markingAllRead: false
		},
		error: null,
		realTimeEnabled: false,
		lastChecked: null
	}

	const { subscribe, update } = writable<NotificationsState>(initialState)

	// Real-time subscription
	let notificationsSubscription: any = null

	return {
		subscribe,
		
		actions: {
			setLoading: (key: keyof NotificationsState['loading'], loading: boolean) => {
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

			setNotifications: (notifications: Notification[]) => {
				update(state => ({ ...state, notifications }))
			},

			addNotification: (notification: Notification) => {
				update(state => ({
					...state,
					notifications: [notification, ...state.notifications],
					unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount
				}))
			},

			updateNotification: (id: string, updates: Partial<Notification>) => {
				update(state => {
					const notifications = state.notifications.map(notification =>
						notification.id === id ? { ...notification, ...updates } : notification
					)
					
					// Update unread count if read status changed
					let unreadCount = state.unreadCount
					if (updates.read !== undefined) {
						const notification = state.notifications.find(n => n.id === id)
						if (notification && !notification.read && updates.read) {
							unreadCount = Math.max(0, unreadCount - 1)
						} else if (notification && notification.read && !updates.read) {
							unreadCount = unreadCount + 1
						}
					}

					return {
						...state,
						notifications,
						unreadCount
					}
				})
			},

			setUnreadCount: (count: number) => {
				update(state => ({ ...state, unreadCount: count }))
			},

			markAllAsRead: () => {
				update(state => ({
					...state,
					notifications: state.notifications.map(notification => ({
						...notification,
						read: true,
						read_at: notification.read_at || new Date().toISOString()
					})),
					unreadCount: 0
				}))
			},

			setLastChecked: () => {
				update(state => ({ ...state, lastChecked: new Date() }))
			},

			enableRealTime: () => {
				update(state => ({ ...state, realTimeEnabled: true }))
				setupRealTimeSubscription()
			},

			disableRealTime: () => {
				update(state => ({ ...state, realTimeEnabled: false }))
				cleanupSubscription()
			}
		},

		destroy: () => {
			cleanupSubscription()
		}
	}

	function setupRealTimeSubscription() {
		const currentUser = get(user)
		if (!currentUser) return

		notificationsSubscription = supabase
			.channel('notifications_channel')
			.on('postgres_changes', {
				event: '*',
				schema: 'public',
				table: 'notifications',
				filter: `user_id=eq.${currentUser.id}`
			}, (payload) => {
				handleNotificationChange(payload)
			})
			.subscribe()
	}

	function handleNotificationChange(payload: any) {
		const { eventType, new: newRecord } = payload

		switch (eventType) {
			case 'INSERT':
				if (newRecord) {
					notificationsStore.actions.addNotification(newRecord)
					
					// Show browser notification if supported and permitted
					if ('Notification' in window && Notification.permission === 'granted') {
						new Notification(newRecord.title || 'New notification', {
							body: newRecord.message,
							icon: '/favicon.ico'
						})
					}
				}
				break
			case 'UPDATE':
				if (newRecord) {
					notificationsStore.actions.updateNotification(newRecord.id, newRecord)
				}
				break
		}
	}

	function cleanupSubscription() {
		if (notificationsSubscription) {
			supabase.removeChannel(notificationsSubscription)
			notificationsSubscription = null
		}
	}
}

export const notificationsStore = createNotificationsStore()

// Derived stores
export const notifications = derived(notificationsStore, state => state.notifications)
export const unreadCount = derived(notificationsStore, state => state.unreadCount)
export const notificationsLoading = derived(notificationsStore, state => state.loading)
export const notificationsError = derived(notificationsStore, state => state.error)
export const hasUnreadNotifications = derived(unreadCount, count => count > 0)

// Notifications operations
export const notificationsActions = {
	// Load notifications
	async loadNotifications(limit = 20) {
		const currentUser = get(user)
		if (!currentUser) {
			const error = { code: 'NO_AUTH', message: 'Authentication required' } as DatabaseError
			notificationsStore.actions.setError(error)
			return { error }
		}

		notificationsStore.actions.setLoading('notifications', true)
		notificationsStore.actions.clearError()

		try {
			const { data, error } = await db.notifications.getByUserId(currentUser.id, limit)

			if (error) {
				notificationsStore.actions.setError(error)
				return { error }
			}

			notificationsStore.actions.setNotifications(data)
			notificationsStore.actions.setLastChecked()

			return { error: null }
		} catch (error) {
			const dbError = { code: 'UNKNOWN', message: 'Unknown error' } as DatabaseError
			notificationsStore.actions.setError(dbError)
			return { error: dbError }
		} finally {
			notificationsStore.actions.setLoading('notifications', false)
		}
	},

	// Enable real-time notifications
	enableRealTime() {
		notificationsStore.actions.enableRealTime()
	},

	// Disable real-time notifications
	disableRealTime() {
		notificationsStore.actions.disableRealTime()
	}
}

// Auto-setup when user changes
user.subscribe(currentUser => {
	if (currentUser) {
		// Load notifications
		notificationsActions.loadNotifications()
		
		// Enable real-time updates
		notificationsActions.enableRealTime()
	} else {
		// Disable real-time when user logs out
		notificationsActions.disableRealTime()
	}
})
