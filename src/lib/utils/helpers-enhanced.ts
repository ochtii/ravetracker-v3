// Enhanced Utility Functions for RaveTracker
// ==========================================

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
	immediate = false
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null
			if (!immediate) func(...args)
		}

		const callNow = immediate && !timeout
		if (timeout) clearTimeout(timeout)
		timeout = setTimeout(later, wait)

		if (callNow) func(...args)
	}
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean = false

	return function executedFunction(...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args)
			inThrottle = true
			setTimeout(() => inThrottle = false, limit)
		}
	}
}

// Format date helpers
export function formatDate(date: string | Date): string {
	const d = new Date(date)
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

export function formatDateTime(date: string | Date): string {
	const d = new Date(date)
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
}

export function formatRelativeTime(date: string | Date): string {
	const d = new Date(date)
	const now = new Date()
	const diffTime = d.getTime() - now.getTime()
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

	if (diffDays === 0) return 'Today'
	if (diffDays === 1) return 'Tomorrow'
	if (diffDays === -1) return 'Yesterday'
	if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
	if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
	
	return formatDate(date)
}

// Validation helpers
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
	try {
		new URL(url)
		return true
	} catch {
		return false
	}
}

// File helpers
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes'
	
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isValidImageFile(file: File): boolean {
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
	return validTypes.includes(file.type)
}

// String helpers
export function truncate(text: string, length: number, suffix = '...'): string {
	if (text.length <= length) return text
	return text.substring(0, length) + suffix
}

export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Local storage helpers
export function safeLocalStorage() {
	if (typeof window === 'undefined') {
		return {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {},
			clear: () => {}
		}
	}
	
	try {
		// Test if localStorage is available
		localStorage.setItem('test', 'test')
		localStorage.removeItem('test')
		return localStorage
	} catch {
		// Fallback for when localStorage is not available
		const fallback = new Map<string, string>()
		return {
			getItem: (key: string) => fallback.get(key) || null,
			setItem: (key: string, value: string) => fallback.set(key, value),
			removeItem: (key: string) => fallback.delete(key),
			clear: () => fallback.clear()
		}
	}
}

export function getStoredValue<T>(key: string, defaultValue: T): T {
	try {
		const stored = safeLocalStorage().getItem(key)
		return stored ? JSON.parse(stored) : defaultValue
	} catch {
		return defaultValue
	}
}

export function setStoredValue<T>(key: string, value: T): void {
	try {
		safeLocalStorage().setItem(key, JSON.stringify(value))
	} catch (error) {
		console.warn('Failed to store value:', error)
	}
}

// Clipboard helpers
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text)
			return true
		} else {
			// Fallback for older browsers
			const textArea = document.createElement('textarea')
			textArea.value = text
			textArea.style.position = 'absolute'
			textArea.style.left = '-999999px'
			textArea.style.top = '-999999px'
			document.body.appendChild(textArea)
			textArea.select()
			document.execCommand('copy')
			textArea.remove()
			return true
		}
	} catch (error) {
		console.error('Failed to copy text:', error)
		return false
	}
}

// Error helpers
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}
	if (typeof error === 'string') {
		return error
	}
	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message)
	}
	return 'An unknown error occurred'
}

// Device detection
export function isMobile(): boolean {
	if (typeof window === 'undefined') return false
	return window.innerWidth < 768
}

export function isTablet(): boolean {
	if (typeof window === 'undefined') return false
	return window.innerWidth >= 768 && window.innerWidth < 1024
}

export function isDesktop(): boolean {
	if (typeof window === 'undefined') return false
	return window.innerWidth >= 1024
}
