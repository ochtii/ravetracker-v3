/**
 * RaveTracker v3.0 - Development Realtime Configuration
 * ====================================================
 * Simplified realtime setup for development that avoids subscription errors
 */

import { writable, derived } from 'svelte/store'
import { browser } from '$app/environment'

// Basic realtime state for development
export interface DevRealtimeState {
	enabled: boolean
	connectionStatus: 'connected' | 'disconnected' | 'connecting'
	features: {
		notifications: boolean
		events: boolean
	}
}

// Store for development realtime state
export const devRealtimeState = writable<DevRealtimeState>({
	enabled: false,
	connectionStatus: 'disconnected',
	features: {
		notifications: false,
		events: false
	}
})

// Derived store for connection status
export const isRealtimeConnected = derived(
	devRealtimeState,
	($state) => $state.connectionStatus === 'connected'
)

// Development realtime manager
class DevRealtimeManager {
	private enabled = false

	async initialize(): Promise<void> {
		if (!browser) return

		console.log('🔧 Development realtime manager initialized')
		
		devRealtimeState.update(state => ({
			...state,
			connectionStatus: 'connected'
		}))
	}

	async enable(): Promise<void> {
		if (!browser) return

		this.enabled = true
		
		devRealtimeState.update(state => ({
			...state,
			enabled: true,
			connectionStatus: 'connected'
		}))

		console.log('✅ Development realtime enabled (no actual subscriptions)')
	}

	async disable(): Promise<void> {
		if (!browser) return

		this.enabled = false
		
		devRealtimeState.update(state => ({
			...state,
			enabled: false,
			connectionStatus: 'disconnected'
		}))

		console.log('❌ Development realtime disabled')
	}

	// Mock notification method for testing
	showMockNotification(title: string, message: string): void {
		if (!browser) return

		console.log(`📱 Mock notification: ${title} - ${message}`)
		
		// In development, just log instead of showing actual notifications
		if (Notification.permission === 'granted') {
			try {
				new Notification(title, {
					body: message,
					icon: '/icon-192x192.png'
				})
			} catch (error) {
				console.log('Notification display failed:', error)
			}
		}
	}

	// Mock subscription methods
	async subscribeToEvents(): Promise<void> {
		console.log('📡 Mock: Subscribed to events (development mode)')
	}

	async subscribeToNotifications(userId: string): Promise<void> {
		console.log(`📡 Mock: Subscribed to notifications for user ${userId} (development mode)`)
	}

	async unsubscribeAll(): Promise<void> {
		console.log('📡 Mock: Unsubscribed from all channels (development mode)')
	}
}

// Export singleton instance
export const devRealtimeManager = new DevRealtimeManager()

// Initialize on module load
if (browser) {
	devRealtimeManager.initialize()
}
