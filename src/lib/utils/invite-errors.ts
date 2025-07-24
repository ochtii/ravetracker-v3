/**
 * RaveTracker v3.0 - Invite System Error Handling Utilities
 * =========================================================
 * Robust error handling and validation utilities for the invite system
 */

import type { 
  InviteError, 
  InviteErrorCode, 
  DatabaseResult, 
  ServiceResponse,
  RateLimitInfo 
} from '$lib/types/invite'

// =====================================================
// ERROR CREATION UTILITIES
// =====================================================

export class InviteSystemError extends Error implements InviteError {
  public code: InviteErrorCode
  public details?: Record<string, any>
  public timestamp: Date
  public userId?: string
  public ipAddress?: string

  constructor(
    code: InviteErrorCode,
    message: string,
    details?: Record<string, any>,
    userId?: string,
    ipAddress?: string
  ) {
    super(message)
    this.name = 'InviteSystemError'
    this.code = code
    this.details = details
    this.timestamp = new Date()
    this.userId = userId
    this.ipAddress = ipAddress

    // Maintain proper stack trace (for V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InviteSystemError)
    }
  }

  /**
   * Convert to a plain object for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      userId: this.userId,
      ipAddress: this.ipAddress,
      stack: this.stack
    }
  }

  /**
   * Check if error is of a specific type
   */
  is(code: InviteErrorCode): boolean {
    return this.code === code
  }

  /**
   * Check if error is user-facing (should be shown to user)
   */
  isUserFacing(): boolean {
    const userFacingCodes: InviteErrorCode[] = [
      'INVALID_CODE',
      'CODE_EXPIRED',
      'CODE_EXHAUSTED',
      'RATE_LIMITED',
      'INSUFFICIENT_CREDITS',
      'VERIFICATION_NOT_ELIGIBLE'
    ]
    return userFacingCodes.includes(this.code)
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(): string {
    const messages: Record<InviteErrorCode, string> = {
      'INVALID_CODE': 'Der eingegebene Invite-Code ist ungültig.',
      'CODE_EXPIRED': 'Dieser Invite-Code ist abgelaufen.',
      'CODE_EXHAUSTED': 'Dieser Invite-Code wurde bereits verwendet.',
      'CODE_INACTIVE': 'Dieser Invite-Code ist nicht mehr aktiv.',
      'RATE_LIMITED': 'Zu viele Versuche. Bitte warte einen Moment.',
      'IP_BLOCKED': 'Deine IP-Adresse wurde temporär gesperrt.',
      'INSUFFICIENT_CREDITS': 'Du hast nicht genügend Einladungs-Credits.',
      'INVALID_PERMISSIONS': 'Du hast keine Berechtigung für diese Aktion.',
      'USER_NOT_FOUND': 'Benutzer nicht gefunden.',
      'INVITE_NOT_FOUND': 'Einladung nicht gefunden.',
      'VERIFICATION_EXISTS': 'Du hast bereits einen Verifizierungsantrag gestellt.',
      'VERIFICATION_NOT_ELIGIBLE': 'Du erfüllst die Voraussetzungen für die Verifizierung noch nicht.',
      'SETTINGS_NOT_FOUND': 'Einstellungen konnten nicht geladen werden.',
      'DATABASE_ERROR': 'Ein Datenbankfehler ist aufgetreten.',
      'VALIDATION_ERROR': 'Die eingegebenen Daten sind ungültig.',
      'UNKNOWN_ERROR': 'Ein unbekannter Fehler ist aufgetreten.'
    }

    return messages[this.code] || messages['UNKNOWN_ERROR']
  }
}

// =====================================================
// ERROR FACTORY FUNCTIONS
// =====================================================

export const createInviteError = {
  invalidCode: (details?: Record<string, any>, userId?: string, ipAddress?: string) =>
    new InviteSystemError('INVALID_CODE', 'Invalid invite code provided', details, userId, ipAddress),

  codeExpired: (code: string, expiresAt: Date, userId?: string, ipAddress?: string) =>
    new InviteSystemError('CODE_EXPIRED', `Invite code ${code} expired at ${expiresAt.toISOString()}`, {
      code,
      expiresAt: expiresAt.toISOString()
    }, userId, ipAddress),

  codeExhausted: (code: string, maxUses: number, userId?: string, ipAddress?: string) =>
    new InviteSystemError('CODE_EXHAUSTED', `Invite code ${code} has reached maximum uses (${maxUses})`, {
      code,
      maxUses
    }, userId, ipAddress),

  rateLimited: (rateLimitInfo: RateLimitInfo, userId?: string, ipAddress?: string) =>
    new InviteSystemError('RATE_LIMITED', 'Rate limit exceeded', {
      rateLimitInfo
    }, userId, ipAddress),

  insufficientCredits: (currentCredits: number, required: number, userId?: string) =>
    new InviteSystemError('INSUFFICIENT_CREDITS', `Insufficient invite credits: ${currentCredits}/${required}`, {
      currentCredits,
      required
    }, userId),

  invalidPermissions: (requiredLevel: string, currentLevel: string, userId?: string) =>
    new InviteSystemError('INVALID_PERMISSIONS', `Required ${requiredLevel}, but user has ${currentLevel}`, {
      requiredLevel,
      currentLevel
    }, userId),

  databaseError: (originalError: Error, operation: string) =>
    new InviteSystemError('DATABASE_ERROR', `Database operation failed: ${operation}`, {
      originalError: originalError.message,
      operation
    }),

  validationError: (field: string, value: any, reason: string) =>
    new InviteSystemError('VALIDATION_ERROR', `Validation failed for ${field}: ${reason}`, {
      field,
      value,
      reason
    })
}

// =====================================================
// RESULT WRAPPER UTILITIES
// =====================================================

/**
 * Create a successful database result
 */
export function createSuccessResult<T>(data: T): DatabaseResult<T> {
  return {
    data,
    error: null,
    success: true
  }
}

/**
 * Create a failed database result
 */
export function createErrorResult<T>(error: InviteError): DatabaseResult<T> {
  return {
    data: null,
    error,
    success: false
  }
}

/**
 * Create a successful service response
 */
export function createSuccessResponse<T>(
  data: T,
  metadata?: ServiceResponse<T>['metadata']
): ServiceResponse<T> {
  return {
    data,
    error: null,
    success: true,
    metadata: {
      requestId: crypto.randomUUID(),
      timestamp: new Date(),
      duration: 0,
      ...metadata
    }
  }
}

/**
 * Create a failed service response
 */
export function createErrorResponse<T>(
  error: InviteError,
  metadata?: Partial<ServiceResponse<T>['metadata']>
): ServiceResponse<T> {
  return {
    data: null,
    error,
    success: false,
    metadata: {
      requestId: crypto.randomUUID(),
      timestamp: new Date(),
      duration: 0,
      ...metadata
    }
  }
}

// =====================================================
// ERROR HANDLING MIDDLEWARE
// =====================================================

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<DatabaseResult<R>> => {
    try {
      const data = await fn(...args)
      return createSuccessResult(data)
    } catch (error) {
      console.error(`Error in ${context || 'operation'}:`, error)
      
      if (error instanceof InviteSystemError) {
        return createErrorResult(error)
      }
      
      // Convert unknown errors to InviteSystemError
      const inviteError = new InviteSystemError(
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        { originalError: error, context }
      )
      
      return createErrorResult(inviteError)
    }
  }
}

/**
 * Retry wrapper for database operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) {
        break
      }
      
      // Don't retry certain types of errors
      if (error instanceof InviteSystemError) {
        const nonRetryableCodes: InviteErrorCode[] = [
          'INVALID_CODE',
          'CODE_EXPIRED',
          'CODE_EXHAUSTED',
          'INVALID_PERMISSIONS',
          'VALIDATION_ERROR'
        ]
        
        if (nonRetryableCodes.includes(error.code)) {
          throw error
        }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
}

// =====================================================
// VALIDATION UTILITIES
// =====================================================

/**
 * Validate invite code format
 */
export function validateInviteCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false
  }
  
  // Must be 6 characters, alphanumeric, uppercase
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase())
}

/**
 * Sanitize and validate invite code
 */
export function sanitizeInviteCode(code: string): string {
  if (!code || typeof code !== 'string') {
    throw createInviteError.validationError('code', code, 'Code must be a string')
  }
  
  const sanitized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  if (!validateInviteCodeFormat(sanitized)) {
    throw createInviteError.validationError('code', code, 'Code must be 6 alphanumeric characters')
  }
  
  return sanitized
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// =====================================================
// LOGGING UTILITIES
// =====================================================

/**
 * Log error with proper context
 */
export function logError(error: InviteError, context?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    context: context || 'Unknown',
    error: error.toJSON(),
    level: 'error'
  }
  
  console.error('Invite System Error:', logData)
  
  // In production, you might want to send this to an external logging service
  // Example: sendToLoggingService(logData)
}

/**
 * Log warning
 */
export function logWarning(message: string, data?: Record<string, any>) {
  const logData = {
    timestamp: new Date().toISOString(),
    message,
    data,
    level: 'warning'
  }
  
  console.warn('Invite System Warning:', logData)
}

/**
 * Log info
 */
export function logInfo(message: string, data?: Record<string, any>) {
  const logData = {
    timestamp: new Date().toISOString(),
    message,
    data,
    level: 'info'
  }
  
  console.info('Invite System Info:', logData)
}

// =====================================================
// PERFORMANCE MONITORING
// =====================================================

/**
 * Simple performance timer
 */
export class PerformanceTimer {
  private startTime: number
  private context: string

  constructor(context: string) {
    this.context = context
    this.startTime = performance.now()
  }

  end(): number {
    const duration = performance.now() - this.startTime
    logInfo(`Performance: ${this.context}`, { duration: `${duration.toFixed(2)}ms` })
    return duration
  }
}

/**
 * Wrap function with performance monitoring
 */
export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R> => {
    const timer = new PerformanceTimer(context)
    try {
      const result = await fn(...args)
      timer.end()
      return result
    } catch (error) {
      timer.end()
      throw error
    }
  }
}

// =====================================================
// RATE LIMITING UTILITIES
// =====================================================

/**
 * Calculate time until rate limit reset
 */
export function calculateRateLimitReset(
  attempts: number,
  maxAttempts: number, 
  windowSizeMs: number,
  lastAttemptTime: Date
): number {
  if (attempts < maxAttempts) {
    return 0
  }
  
  const timeSinceLastAttempt = Date.now() - lastAttemptTime.getTime()
  const timeUntilReset = windowSizeMs - timeSinceLastAttempt
  
  return Math.max(0, timeUntilReset)
}

/**
 * Create rate limit info object
 */
export function createRateLimitInfo(
  attempts: number,
  maxAttempts: number,
  windowSizeMs: number,
  lastAttemptTime?: Date
): RateLimitInfo {
  const attemptsRemaining = Math.max(0, maxAttempts - attempts)
  const isBlocked = attemptsRemaining === 0
  
  let timeUntilReset = 0
  let blockExpiresAt: Date | undefined
  
  if (isBlocked && lastAttemptTime) {
    timeUntilReset = Math.ceil(calculateRateLimitReset(attempts, maxAttempts, windowSizeMs, lastAttemptTime) / 1000)
    blockExpiresAt = new Date(lastAttemptTime.getTime() + windowSizeMs)
  }
  
  return {
    attemptsRemaining,
    timeUntilReset,
    isBlocked,
    blockExpiresAt
  }
}
