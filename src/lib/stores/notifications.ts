import { writable } from 'svelte/store';

// Notification interface
export interface Notification {
	id: string;
	type: 'event' | 'follow' | 'like' | 'comment' | 'system';
	title: string;
	message: string;
	timestamp: string;
	read: boolean;
	data?: Record<string, any>;
}

// Create the notifications store
function createNotificationStore() {
	const { subscribe, set, update } = writable<Notification[]>([]);

	return {
		subscribe,

		// Add a new notification
		addNotification(notification: Omit<Notification, 'id' | 'read'>) {
			const newNotification: Notification = {
				...notification,
				id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				read: false
			};

			update(notifications => [newNotification, ...notifications]);
			return newNotification.id;
		},

		// Mark a notification as read
		markAsRead(notificationId: string) {
			update(notifications =>
				notifications.map(notification =>
					notification.id === notificationId
						? { ...notification, read: true }
						: notification
				)
			);
		},

		// Mark all notifications as read
		markAllAsRead() {
			update(notifications =>
				notifications.map(notification => ({ ...notification, read: true }))
			);
		},

		// Remove a notification
		remove(notificationId: string) {
			update(notifications =>
				notifications.filter(notification => notification.id !== notificationId)
			);
		},

		// Clear all notifications
		clear() {
			set([]);
		},

		// Get unread count
		getUnreadCount() {
			let count = 0;
			subscribe(notifications => {
				count = notifications.filter(n => !n.read).length;
			})();
			return count;
		},

		// Load notifications from storage (for persistence)
		loadFromStorage() {
			if (typeof window !== 'undefined') {
				try {
					const stored = localStorage.getItem('ravetracker_notifications');
					if (stored) {
						const notifications = JSON.parse(stored);
						set(notifications);
					}
				} catch (error) {
					console.error('Failed to load notifications from storage:', error);
				}
			}
		},

		// Save notifications to storage
		saveToStorage() {
			if (typeof window !== 'undefined') {
				subscribe(notifications => {
					try {
						localStorage.setItem('ravetracker_notifications', JSON.stringify(notifications));
					} catch (error) {
						console.error('Failed to save notifications to storage:', error);
					}
				})();
			}
		}
	};
}

export const notificationStore = createNotificationStore();

// Auto-save to localStorage when notifications change
if (typeof window !== 'undefined') {
	notificationStore.subscribe(() => {
		notificationStore.saveToStorage();
	});

	// Load from localStorage on startup
	notificationStore.loadFromStorage();
}
