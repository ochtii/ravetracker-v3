import type { PageServerLoad } from './$types'

export interface PageData {
  inviteCode: string
  prevalidationResult: import('$lib/types/invite').ValidationResult | null
  rateLimitInfo: {
    remaining: number
    resetTime: Date
    isBlocked: boolean
  } | null
}
