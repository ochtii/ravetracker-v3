/**
 * Real-time Store for Global Real-time State Management
 * ====================================================
 * Manages real-time features, notifications, and live updates
 */

import { writable, derived, get } from 'svelte/store'
import { browser } from '$app/environment'
import { 
	realtimeManager, 
	connectionStatus,
	subscribeToEvents,
	subscribeToUserNotifications,
	unsubscribeFromTable,
	type SubscriptionConfig
} from '$lib/utils/realtime'
import { user } from '$lib/stores/auth-enhanced'

// Types
export interface RealtimeState {
	enabled: boolean
	features: {
		events: boolean
		notifications: boolean
		attendance: boolean
		presence: boolean
	}
	settings: {
		soundEnabled: boolean
		browserNotifications: boolean
		vibrationEnabled: boolean
		autoReconnect: boolean
	}
}

export interface LiveUpdate {
	id: string
	type: 'event' | 'notification' | 'attendance' | 'presence'
	action: 'INSERT' | 'UPDATE' | 'DELETE'
	data: any
	timestamp: Date
	acknowledged: boolean
}

export interface NotificationPermission {
	granted: boolean
	denied: boolean
	requested: boolean
}

// Stores
export const realtimeState = writable<RealtimeState>({
	enabled: false,
	features: {
		events: false,
		notifications: false,
		attendance: false,
		presence: false
	},
	settings: {
		soundEnabled: true,
		browserNotifications: true,
		vibrationEnabled: true,
		autoReconnect: true
	}
})

export const liveUpdates = writable<LiveUpdate[]>([])
export const notificationPermission = writable<NotificationPermission>({
	granted: false,
	denied: false,
	requested: false
})

// Derived stores
export const isConnected = derived(connectionStatus, $status => $status.connected)
export const isConnecting = derived(connectionStatus, $status => $status.connecting)
export const connectionError = derived(connectionStatus, $status => $status.error)
export const activeSubscriptions = derived(connectionStatus, $status => 
	Array.from($status.subscriptions.values())
)

export const unacknowledgedUpdates = derived(liveUpdates, $updates => 
	$updates.filter(update => !update.acknowledged)
)

export const hasUnreadNotifications = derived(unacknowledgedUpdates, $updates =>
	$updates.some(update => update.type === 'notification')
)

// Real-time Actions
class RealtimeActions {
	/**
	 * Initialize real-time features
	 */
	async initialize(): Promise<void> {
		if (!browser) return

		try {
			// Request notification permission
			await this.requestNotificationPermission()
			
			// Load settings from localStorage
			this.loadSettings()
			
			// Enable auto-reconnect if enabled
			const state = get(realtimeState)
			if (state.settings.autoReconnect) {
				await this.enableRealtime()
			}

		} catch (error) {
			console.error('Failed to initialize realtime:', error)
		}
	}

	/**
	 * Enable real-time features
	 */
	async enableRealtime(): Promise<void> {
		if (!browser) return

		try {
			realtimeState.update(state => ({ 
				...state, 
				enabled: true 
			}))

			// Subscribe to user-specific features if logged in
			const currentUser = get(user)
			if (currentUser) {
				await this.enableUserFeatures(currentUser.id)
			}

			// Subscribe to global events
			await this.enableEventUpdates()

		} catch (error) {
			console.error('Failed to enable realtime:', error)
			realtimeState.update(state => ({ 
				...state, 
				enabled: false 
			}))
		}
	}

	/**
	 * Disable real-time features
	 */
	async disableRealtime(): Promise<void> {
		if (!browser) return

		try {
			await realtimeManager.unsubscribeAll()
			
			realtimeState.update(state => ({
				...state,
				enabled: false,
				features: {
					events: false,
					notifications: false,
					attendance: false,
					presence: false
				}
			}))

			// Clear live updates
			liveUpdates.set([])

		} catch (error) {
			console.error('Failed to disable realtime:', error)
		}
	}

	/**
	 * Enable event updates
	 */
	async enableEventUpdates(): Promise<void> {
		if (!browser) return

		try {
			await subscribeToEvents(
				(payload) => this.handleEventUpdate(payload),
				(error) => console.error('Events subscription error:', error)
			)

			realtimeState.update(state => ({
				...state,
				features: { ...state.features, events: true }
			}))

		} catch (error) {
			console.error('Failed to enable event updates:', error)
		}
	}

	/**
	 * Enable user-specific features
	 */
	async enableUserFeatures(userId: string): Promise<void> {
		if (!browser) return

		try {
			// Subscribe to notifications
			await subscribeToUserNotifications(
				userId,
				(payload) => this.handleNotificationUpdate(payload),
				(error) => console.error('Notifications subscription error:', error)
			)

			realtimeState.update(state => ({
				...state,
				features: { 
					...state.features, 
					notifications: true 
				}
			}))

		} catch (error) {
			console.error('Failed to enable user features:', error)
		}
	}

	/**
	 * Subscribe to attendance updates for specific event
	 */
	async subscribeToEventAttendance(eventId: string): Promise<void> {
		if (!browser) return

		const subscriptionId = `attendance-${eventId}`
		
		try {
			await realtimeManager.subscribe(subscriptionId, {
				table: 'event_attendance',
				event: '*',
				filter: `event_id=eq.${eventId}`,
				callback: (payload) => this.handleAttendanceUpdate(payload),
				onError: (error) => console.error(`Attendance subscription error for event ${eventId}:`, error)
			})

			realtimeState.update(state => ({
				...state,
				features: { ...state.features, attendance: true }
			}))

		} catch (error) {
			console.error('Failed to subscribe to attendance:', error)
		}
	}

	/**
	 * Unsubscribe from attendance updates for specific event
	 */
	async unsubscribeFromEventAttendance(eventId: string): Promise<void> {
		if (!browser) return

		const subscriptionId = `attendance-${eventId}`
		await unsubscribeFromTable(subscriptionId)
	}

	/**
	 * Request browser notification permission
	 */
	async requestNotificationPermission(): Promise<boolean> {
		if (!browser || !('Notification' in window)) {
			return false
		}

		try {
			notificationPermission.update(state => ({ 
				...state, 
				requested: true 
			}))

			const permission = await Notification.requestPermission()
			
			const granted = permission === 'granted'
			const denied = permission === 'denied'

			notificationPermission.update(state => ({
				...state,
				granted,
				denied
			}))

			return granted

		} catch (error) {
			console.error('Failed to request notification permission:', error)
			return false
		}
	}

	/**
	 * Show browser notification
	 */
	showNotification(title: string, options?: NotificationOptions): void {
		if (!browser || !get(notificationPermission).granted) {
			return
		}

		const state = get(realtimeState)
		if (!state.settings.browserNotifications) {
			return
		}

		try {
			const notification = new Notification(title, {
				icon: '/icon-192x192.png',
				badge: '/icon-192x192.png',
				tag: 'ravetracker',
				renotify: true,
				requireInteraction: false,
				...options
			})

			// Auto-close after 5 seconds
			setTimeout(() => {
				notification.close()
			}, 5000)

			// Play sound if enabled
			if (state.settings.soundEnabled) {
				this.playNotificationSound()
			}

			// Vibrate if enabled and supported
			if (state.settings.vibrationEnabled && 'vibrate' in navigator) {
				navigator.vibrate([200, 100, 200])
			}

		} catch (error) {
			console.error('Failed to show notification:', error)
		}
	}

	/**
	 * Update settings
	 */
	updateSettings(settings: Partial<RealtimeState['settings']>): void {
		realtimeState.update(state => ({
			...state,
			settings: { ...state.settings, ...settings }
		}))

		// Save to localStorage
		this.saveSettings()
	}

	/**
	 * Acknowledge live update
	 */
	acknowledgeUpdate(updateId: string): void {
		liveUpdates.update(updates => 
			updates.map(update => 
				update.id === updateId 
					? { ...update, acknowledged: true }
					: update
			)
		)
	}

	/**
	 * Clear acknowledged updates
	 */
	clearAcknowledgedUpdates(): void {
		liveUpdates.update(updates => 
			updates.filter(update => !update.acknowledged)
		)
	}

	/**
	 * Force reconnection
	 */
	async reconnect(): Promise<void> {
		if (!browser) return

		try {
			await realtimeManager.forceReconnect()
		} catch (error) {
			console.error('Failed to reconnect:', error)
		}
	}

	// Private methods
	private handleEventUpdate(payload: any): void {
		const update: LiveUpdate = {
			id: `event-${payload.new?.id || payload.old?.id}-${Date.now()}`,
			type: 'event',
			action: payload.eventType,
			data: payload.new || payload.old,
			timestamp: new Date(),
			acknowledged: false
		}

		this.addLiveUpdate(update)

		// Show notification for new events
		if (payload.eventType === 'INSERT' && payload.new) {
			this.showNotification('New Event Available!', {
				body: `${payload.new.title} has been published`,
				data: { eventId: payload.new.id }
			})
		}
	}

	private handleNotificationUpdate(payload: any): void {
		const update: LiveUpdate = {
			id: `notification-${payload.new?.id || payload.old?.id}-${Date.now()}`,
			type: 'notification',
			action: payload.eventType,
			data: payload.new || payload.old,
			timestamp: new Date(),
			acknowledged: false
		}

		this.addLiveUpdate(update)

		// Show browser notification
		if (payload.eventType === 'INSERT' && payload.new) {
			this.showNotification(payload.new.title || 'New Notification', {
				body: payload.new.message,
				data: { notificationId: payload.new.id }
			})
		}
	}

	private handleAttendanceUpdate(payload: any): void {
		const update: LiveUpdate = {
			id: `attendance-${payload.new?.id || payload.old?.id}-${Date.now()}`,
			type: 'attendance',
			action: payload.eventType,
			data: payload.new || payload.old,
			timestamp: new Date(),
			acknowledged: false
		}

		this.addLiveUpdate(update)
	}

	private addLiveUpdate(update: LiveUpdate): void {
		liveUpdates.update(updates => {
			const newUpdates = [update, ...updates]
			
			// Keep only last 50 updates
			return newUpdates.slice(0, 50)
		})
	}

	private playNotificationSound(): void {
		try {
			const audio = new Audio('/sounds/notification.mp3')
			audio.volume = 0.3
			audio.play().catch(() => {
				// Ignore audio play errors (autoplay policy)
			})
		} catch (error) {
			// Audio not available
		}
	}

	private saveSettings(): void {
		if (!browser) return

		try {
			const state = get(realtimeState)
			localStorage.setItem('realtime-settings', JSON.stringify(state.settings))
		} catch (error) {
			console.error('Failed to save realtime settings:', error)
		}
	}

	private loadSettings(): void {
		if (!browser) return

		try {
			const saved = localStorage.getItem('realtime-settings')
			if (saved) {
				const settings = JSON.parse(saved)
				realtimeState.update(state => ({
					...state,
					settings: { ...state.settings, ...settings }
				}))
			}
		} catch (error) {
			console.error('Failed to load realtime settings:', error)
		}
	}
}

// Export actions
export const realtimeActions = new RealtimeActions()

// Auto-initialize when user changes
if (browser) {
	user.subscribe(async (currentUser) => {
		const state = get(realtimeState)
		
		if (currentUser && state.enabled) {
			// Enable user-specific features
			await realtimeActions.enableUserFeatures(currentUser.id)
		} else if (!currentUser && state.enabled) {
			// Disable user-specific features, keep global ones
			await unsubscribeFromTable('notifications-*')
			
			realtimeState.update(s => ({
				...s,
				features: { 
					...s.features, 
					notifications: false,
					attendance: false
				}
			}))
		}
	})

	// Initialize on module load
	realtimeActions.initialize()
}

// Cleanup on page unload
if (browser) {
	window.addEventListener('beforeunload', () => {
		realtimeActions.disableRealtime()
	})
}
