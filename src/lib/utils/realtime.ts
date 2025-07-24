/**
 * Real-time Subscription Manager for Supabase
 * ==========================================
 * Manages all real-time subscriptions with automatic reconnection,
 * error handling, and cleanup
 */

import { supabase } from './supabase'
import type { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'
import { browser } from '$app/environment'
import { writable, get } from 'svelte/store'

// Types
export interface SubscriptionConfig {
	table: string
	event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
	schema?: string
	filter?: string
	callback: (payload: any) => void
	onError?: (error: Error) => void
	onSubscribed?: () => void
	onUnsubscribed?: () => void
}

export interface ConnectionStatus {
	connected: boolean
	connecting: boolean
	error: string | null
	lastConnected: Date | null
	reconnectAttempts: number
	subscriptions: Map<string, SubscriptionInfo>
}

export interface SubscriptionInfo {
	id: string
	table: string
	status: 'connecting' | 'connected' | 'error' | 'disconnected'
	error?: string
	createdAt: Date
	lastActivity?: Date
}

// Connection status store
export const connectionStatus = writable<ConnectionStatus>({
	connected: false,
	connecting: false,
	error: null,
	lastConnected: null,
	reconnectAttempts: 0,
	subscriptions: new Map()
})

class RealtimeManager {
	private channels = new Map<string, RealtimeChannel>()
	private subscriptions = new Map<string, SubscriptionConfig>()
	private reconnectTimeout: NodeJS.Timeout | null = null
	private heartbeatInterval: NodeJS.Timeout | null = null
	private maxReconnectAttempts = 5
	private reconnectDelay = 1000
	private heartbeatInterval_ms = 30000

	constructor() {
		if (browser) {
			this.initializeConnectionMonitoring()
			this.setupEventListeners()
		}
	}

	/**
	 * Subscribe to real-time updates for a table
	 */
	async subscribe(id: string, config: SubscriptionConfig): Promise<void> {
		if (!browser) return

		try {
			// Update subscription info
			this.updateSubscriptionStatus(id, 'connecting')
			this.subscriptions.set(id, config)

			const channelName = this.getChannelName(config.table, config.filter)
			let channel = this.channels.get(channelName)

			// Create channel if it doesn't exist
			if (!channel) {
				channel = supabase.channel(channelName, {
					config: {
						broadcast: { self: true },
						presence: { key: id }
					}
				})

				this.channels.set(channelName, channel)
			}

			// Subscribe to table changes
			const subscription = channel.on(
				'postgres_changes',
				{
					event: config.event || '*',
					schema: config.schema || 'public',
					table: config.table,
					filter: config.filter
				},
				(payload) => {
					try {
						this.updateSubscriptionActivity(id)
						config.callback(payload)
					} catch (error) {
						console.error(`Error in subscription callback for ${id}:`, error)
						config.onError?.(error as Error)
					}
				}
			)

			// Subscribe to channel
			channel.subscribe((status) => {
				console.log(`Subscription ${id} status:`, status)
				
				switch (status) {
					case 'SUBSCRIBED':
						this.updateSubscriptionStatus(id, 'connected')
						config.onSubscribed?.()
						this.updateConnectionStatus(true)
						break
					case 'CHANNEL_ERROR':
						const error = new Error(`Channel error for subscription ${id}`)
						this.updateSubscriptionStatus(id, 'error', error.message)
						config.onError?.(error)
						this.handleReconnection()
						break
					case 'TIMED_OUT':
						const timeoutError = new Error(`Subscription ${id} timed out`)
						this.updateSubscriptionStatus(id, 'error', timeoutError.message)
						config.onError?.(timeoutError)
						this.handleReconnection()
						break
					case 'CLOSED':
						this.updateSubscriptionStatus(id, 'disconnected')
						config.onUnsubscribed?.()
						break
				}
			})

		} catch (error) {
			console.error(`Failed to subscribe to ${id}:`, error)
			this.updateSubscriptionStatus(id, 'error', (error as Error).message)
			config.onError?.(error as Error)
		}
	}

	/**
	 * Unsubscribe from real-time updates
	 */
	async unsubscribe(id: string): Promise<void> {
		if (!browser) return

		const config = this.subscriptions.get(id)
		if (!config) return

		try {
			const channelName = this.getChannelName(config.table, config.filter)
			const channel = this.channels.get(channelName)

			if (channel) {
				await channel.unsubscribe()
				
				// Remove channel if no other subscriptions use it
				const hasOtherSubscriptions = Array.from(this.subscriptions.values())
					.some(sub => 
						sub !== config && 
						this.getChannelName(sub.table, sub.filter) === channelName
					)

				if (!hasOtherSubscriptions) {
					this.channels.delete(channelName)
				}
			}

			this.subscriptions.delete(id)
			this.removeSubscriptionStatus(id)
			config.onUnsubscribed?.()

		} catch (error) {
			console.error(`Failed to unsubscribe from ${id}:`, error)
		}
	}

	/**
	 * Unsubscribe from all subscriptions
	 */
	async unsubscribeAll(): Promise<void> {
		if (!browser) return

		const subscriptionIds = Array.from(this.subscriptions.keys())
		await Promise.all(subscriptionIds.map(id => this.unsubscribe(id)))
		
		this.channels.clear()
		this.subscriptions.clear()
		this.clearReconnectTimeout()
		this.clearHeartbeat()
		
		this.updateConnectionStatus(false)
	}

	/**
	 * Send a message through a channel
	 */
	async broadcast(channelName: string, event: string, payload: any): Promise<RealtimeChannelSendResponse> {
		if (!browser) {
			throw new Error('Broadcast not available on server')
		}

		const channel = this.channels.get(channelName) || supabase.channel(channelName)
		return channel.send({
			type: 'broadcast',
			event,
			payload
		})
	}

	/**
	 * Get connection status
	 */
	getConnectionStatus(): ConnectionStatus {
		return get(connectionStatus)
	}

	/**
	 * Force reconnection
	 */
	async forceReconnect(): Promise<void> {
		if (!browser) return

		await this.unsubscribeAll()
		
		// Restart all subscriptions
		const configs = Array.from(this.subscriptions.entries())
		this.subscriptions.clear()
		
		for (const [id, config] of configs) {
			await this.subscribe(id, config)
		}
	}

	// Private methods
	private getChannelName(table: string, filter?: string): string {
		return filter ? `${table}:${filter}` : table
	}

	private updateConnectionStatus(connected: boolean, error?: string): void {
		connectionStatus.update(status => ({
			...status,
			connected,
			connecting: false,
			error: error || null,
			lastConnected: connected ? new Date() : status.lastConnected,
			reconnectAttempts: connected ? 0 : status.reconnectAttempts
		}))
	}

	private updateSubscriptionStatus(id: string, status: SubscriptionInfo['status'], error?: string): void {
		connectionStatus.update(connectionStatus => {
			const subscriptions = new Map(connectionStatus.subscriptions)
			const existing = subscriptions.get(id)
			
			subscriptions.set(id, {
				id,
				table: this.subscriptions.get(id)?.table || 'unknown',
				status,
				error,
				createdAt: existing?.createdAt || new Date(),
				lastActivity: status === 'connected' ? new Date() : existing?.lastActivity
			})

			return {
				...connectionStatus,
				subscriptions
			}
		})
	}

	private updateSubscriptionActivity(id: string): void {
		connectionStatus.update(connectionStatus => {
			const subscriptions = new Map(connectionStatus.subscriptions)
			const existing = subscriptions.get(id)
			
			if (existing) {
				subscriptions.set(id, {
					...existing,
					lastActivity: new Date()
				})
			}

			return {
				...connectionStatus,
				subscriptions
			}
		})
	}

	private removeSubscriptionStatus(id: string): void {
		connectionStatus.update(status => {
			const subscriptions = new Map(status.subscriptions)
			subscriptions.delete(id)
			return {
				...status,
				subscriptions
			}
		})
	}

	private initializeConnectionMonitoring(): void {
		// Start heartbeat
		this.startHeartbeat()

		// Monitor page visibility
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') {
				this.checkConnectionHealth()
			}
		})
	}

	private setupEventListeners(): void {
		// Online/offline events
		window.addEventListener('online', () => {
			console.log('Network back online, checking connections...')
			this.handleReconnection()
		})

		window.addEventListener('offline', () => {
			console.log('Network offline')
			this.updateConnectionStatus(false, 'Network offline')
		})

		// Cleanup on page unload
		window.addEventListener('beforeunload', () => {
			this.unsubscribeAll()
		})
	}

	private startHeartbeat(): void {
		this.heartbeatInterval = setInterval(() => {
			this.checkConnectionHealth()
		}, this.heartbeatInterval_ms)
	}

	private clearHeartbeat(): void {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval)
			this.heartbeatInterval = null
		}
	}

	private async checkConnectionHealth(): Promise<void> {
		if (!navigator.onLine) {
			this.updateConnectionStatus(false, 'Network offline')
			return
		}

		const status = get(connectionStatus)
		const hasActiveSubscriptions = status.subscriptions.size > 0
		
		if (hasActiveSubscriptions) {
			// Check if any subscriptions are in error state
			const errorSubscriptions = Array.from(status.subscriptions.values())
				.filter(sub => sub.status === 'error' || sub.status === 'disconnected')

			if (errorSubscriptions.length > 0) {
				console.log('Found unhealthy subscriptions, attempting reconnection...')
				this.handleReconnection()
			}
		}
	}

	private handleReconnection(): void {
		const status = get(connectionStatus)
		
		if (status.reconnectAttempts >= this.maxReconnectAttempts) {
			console.log('Max reconnection attempts reached')
			this.updateConnectionStatus(false, 'Max reconnection attempts reached')
			return
		}

		this.clearReconnectTimeout()
		
		const delay = this.reconnectDelay * Math.pow(2, status.reconnectAttempts)
		console.log(`Scheduling reconnection in ${delay}ms (attempt ${status.reconnectAttempts + 1})`)

		connectionStatus.update(s => ({
			...s,
			connecting: true,
			reconnectAttempts: s.reconnectAttempts + 1
		}))

		this.reconnectTimeout = setTimeout(async () => {
			try {
				await this.forceReconnect()
			} catch (error) {
				console.error('Reconnection failed:', error)
				this.updateConnectionStatus(false, (error as Error).message)
			}
		}, delay)
	}

	private clearReconnectTimeout(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout)
			this.reconnectTimeout = null
		}
	}
}

// Export singleton instance
export const realtimeManager = new RealtimeManager()

// Convenience functions
export const subscribeToTable = (id: string, config: SubscriptionConfig) => 
	realtimeManager.subscribe(id, config)

export const unsubscribeFromTable = (id: string) => 
	realtimeManager.unsubscribe(id)

export const unsubscribeAll = () => 
	realtimeManager.unsubscribeAll()

export const broadcastMessage = (channel: string, event: string, payload: any) => 
	realtimeManager.broadcast(channel, event, payload)

export const forceReconnect = () => 
	realtimeManager.forceReconnect()

// Helper functions for common subscription patterns
export const subscribeToEvents = (callback: (payload: any) => void, onError?: (error: Error) => void) => {
	return subscribeToTable('events', {
		table: 'events',
		event: '*',
		callback,
		onError,
		onSubscribed: () => console.log('Events subscription active'),
		onUnsubscribed: () => console.log('Events subscription ended')
	})
}

export const subscribeToEventAttendance = (eventId: string, callback: (payload: any) => void, onError?: (error: Error) => void) => {
	return subscribeToTable(`attendance-${eventId}`, {
		table: 'event_attendance',
		event: '*',
		filter: `event_id=eq.${eventId}`,
		callback,
		onError,
		onSubscribed: () => console.log(`Attendance subscription active for event ${eventId}`),
		onUnsubscribed: () => console.log(`Attendance subscription ended for event ${eventId}`)
	})
}

export const subscribeToUserNotifications = (userId: string, callback: (payload: any) => void, onError?: (error: Error) => void) => {
	return subscribeToTable(`notifications-${userId}`, {
		table: 'notifications',
		event: '*',
		filter: `user_id=eq.${userId}`,
		callback,
		onError,
		onSubscribed: () => console.log(`Notifications subscription active for user ${userId}`),
		onUnsubscribed: () => console.log(`Notifications subscription ended for user ${userId}`)
	})
}
