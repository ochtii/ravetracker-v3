import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

export function formatDate(dateString: string | null, locale = 'de-DE'): string {
  if (!dateString) return 'Nicht angegeben'
  
  try {
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return 'Ungültiges Datum'
  }
}

export function formatTime(dateString: string | null, locale = 'de-DE'): string {
  if (!dateString) return 'Nicht angegeben'
  
  try {
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Ungültige Zeit'
  }
}

export function formatPrice(price: number | null, currency = 'EUR', locale = 'de-DE'): string {
  if (price === null || price === 0) return 'Kostenlos'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(price)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

export function getImageUrl(imagePath: string | null, bucket = 'event-images'): string {
  if (!imagePath) return '/images/event-placeholder.jpg'
  if (imagePath.startsWith('http')) return imagePath
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${imagePath}`
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function generateRandomId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function isEventInPast(dateTime: string): boolean {
  return new Date(dateTime) < new Date()
}

export function isEventToday(dateTime: string): boolean {
  const eventDate = new Date(dateTime)
  const today = new Date()
  
  return eventDate.toDateString() === today.toDateString()
}

export function getEventStatus(event: { 
  date_time: string
  end_time?: string | null
  status: string 
}): 'upcoming' | 'live' | 'ended' | 'cancelled' {
  if (event.status === 'cancelled') return 'cancelled'
  
  const now = new Date()
  const startTime = new Date(event.date_time)
  const endTime = event.end_time ? new Date(event.end_time) : null
  
  if (now < startTime) return 'upcoming'
  if (endTime && now > endTime) return 'ended'
  if (now >= startTime) return 'live'
  
  return 'upcoming'
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }
  
  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      resolve()
    } catch (err) {
      document.body.removeChild(textArea)
      reject(err)
    }
  })
}
