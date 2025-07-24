// RaveTracker v3.0 - Security Types and Interfaces
// ===============================================
// TypeScript types for security and role management

export type UserRole = 'user' | 'organizer' | 'moderator' | 'admin' | 'super_admin'

export type SecurityEventType = 
  | 'role_promotion'
  | 'organizer_verification'  
  | 'role_change'
  | 'event_moderation'
  | 'image_moderation'
  | 'user_anonymization'
  | 'role_change_attempt'
  | 'event_status_change'
  | 'login_attempt'
  | 'permission_denied'

export type ModerationAction = 
  | 'approve'
  | 'reject' 
  | 'feature'
  | 'unfeature'
  | 'hide'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// =====================================================
// SECURITY AUDIT INTERFACES
// =====================================================

export interface SecurityAuditEntry {
  id: string
  event_type: SecurityEventType
  user_id: string | null
  resource_type: string | null
  resource_id: string | null
  action_type: string
  success: boolean
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface SecurityEvent {
  type: SecurityEventType
  userId: string
  resourceType?: string
  resourceId?: string
  action: string
  success: boolean
  details?: Record<string, any>
}

// =====================================================
// USER ROLE MANAGEMENT
// =====================================================

export interface UserRoleInfo {
  user_id: string
  username: string | null
  full_name: string | null
  role: UserRole
  is_organizer: boolean
  is_verified: boolean
  events_created: number
  events_attended: number
  created_at: string
  updated_at: string
}

export interface RolePermissions {
  canCreateEvents: boolean
  canModerateEvents: boolean
  canModerateImages: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canAccessAdmin: boolean
}

// =====================================================
// MODERATION INTERFACES
// =====================================================

export interface ModerationRequest {
  resourceType: 'event' | 'image' | 'profile'
  resourceId: string
  action: ModerationAction
  reason?: string
  moderatorId: string
}

export interface EventModerationData {
  eventId: string
  title: string
  organizer: {
    id: string
    name: string
    username: string
  }
  status: string
  reportCount?: number
  moderationHistory: ModerationHistoryEntry[]
}

export interface ImageModerationData {
  imageId: string
  eventId: string
  url: string
  isApproved: boolean
  reportCount?: number
  uploadedBy: string
  moderationHistory: ModerationHistoryEntry[]
}

export interface ModerationHistoryEntry {
  id: string
  action: ModerationAction
  moderator: {
    id: string
    name: string
  }
  reason?: string
  timestamp: string
}

// =====================================================
// SECURITY MONITORING
// =====================================================

export interface UserActivity {
  activity_type: string
  count: number
  latest_activity: string
}

export interface SuspiciousActivity {
  user_id: string
  activity_type: string
  count: number
  risk_score: number
}

export interface SecurityPattern {
  pattern_type: string
  user_id: string
  username: string
  event_count: number
  risk_level: RiskLevel
}

export interface RateLimitConfig {
  action: string
  maxActions: number
  timeWindow: string // ISO 8601 duration
}

// =====================================================
// ADMIN DASHBOARD INTERFACES
// =====================================================

export interface AdminDashboardData {
  userStats: {
    totalUsers: number
    newUsersToday: number
    organizers: number
    verifiedOrganizers: number
  }
  eventStats: {
    totalEvents: number
    publishedEvents: number
    pendingEvents: number
    featuredEvents: number
  }
  securityStats: {
    securityEventsToday: number
    failedAttempts: number
    suspiciousUsers: number
  }
  moderationQueue: {
    pendingEvents: number
    pendingImages: number
    recentReports: number
  }
}

export interface SecurityDashboardData {
  recentEvents: SecurityAuditEntry[]
  failedEvents: SecurityAuditEntry[]
  suspiciousPatterns: SecurityPattern[]
  riskMetrics: {
    highRiskUsers: number
    securityIncidents: number
    averageRiskScore: number
  }
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface PromoteUserRequest {
  userId: string
  role: UserRole
  reason?: string
}

export interface VerifyOrganizerRequest {
  userId: string
  notes?: string
}

export interface ModerateEventRequest {
  eventId: string
  action: ModerationAction
  reason?: string
}

export interface ModerateImageRequest {
  imageId: string
  approved: boolean
  reason?: string
}

export interface UserDataExportRequest {
  userId: string
  includeEvents: boolean
  includeAttendance: boolean
  includeNotifications: boolean
}

export interface UserDataExportResponse {
  profile: any
  events?: any[]
  attendance?: any[]
  notifications?: any[]
  exportedAt: string
}

// =====================================================
// PERMISSION CHECK TYPES
// =====================================================

export interface PermissionCheck {
  resource: string
  action: string
  userId?: string
  resourceId?: string
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
  requiredRole?: UserRole
}

// =====================================================
// RATE LIMITING TYPES
// =====================================================

export interface RateLimitStatus {
  action: string
  allowed: boolean
  current: number
  limit: number
  resetTime: string
  timeWindow: string
}

export interface RateLimitError {
  code: 'RATE_LIMIT_EXCEEDED'
  message: string
  action: string
  retryAfter: number
}

// =====================================================
// SECURITY CONFIGURATION
// =====================================================

export interface SecurityConfig {
  rateLimits: {
    eventCreation: RateLimitConfig
    attendanceChange: RateLimitConfig
    imageUpload: RateLimitConfig
    profileUpdate: RateLimitConfig
  }
  moderation: {
    autoApproveImages: boolean
    autoFeatureEvents: boolean
    requireApprovalForNewOrganizers: boolean
  }
  audit: {
    retentionDays: number
    logLevel: 'INFO' | 'WARN' | 'ERROR'
    enableDetailedLogging: boolean
  }
}

// =====================================================
// ERROR TYPES
// =====================================================

export class SecurityError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

export class PermissionError extends SecurityError {
  constructor(
    message: string,
    public requiredRole?: UserRole,
    public resource?: string
  ) {
    super('PERMISSION_DENIED', message, { requiredRole, resource })
    this.name = 'PermissionError'
  }
}

export class RateLimitError extends SecurityError {
  constructor(
    message: string,
    public action: string,
    public retryAfter: number
  ) {
    super('RATE_LIMIT_EXCEEDED', message, { action, retryAfter })
    this.name = 'RateLimitError'
  }
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type SecurityFunction<T = any> = (
  ...args: any[]
) => Promise<T>

export type SecurityMiddleware = (
  request: any,
  response: any,
  next: any
) => Promise<void>

export type PermissionValidator = (
  permission: PermissionCheck
) => Promise<PermissionResult>

// =====================================================
// SECURITY HOOKS AND COMPOSABLES
// =====================================================

export interface UseSecurityReturn {
  hasPermission: (permission: PermissionCheck) => Promise<boolean>
  checkRateLimit: (action: string) => Promise<RateLimitStatus>
  logSecurityEvent: (event: SecurityEvent) => Promise<void>
  getCurrentUserRole: () => Promise<UserRole>
  isAdmin: () => Promise<boolean>
  isModerator: () => Promise<boolean>
  isOrganizer: () => Promise<boolean>
}

export interface UseAdminReturn {
  promoteUser: (request: PromoteUserRequest) => Promise<boolean>
  verifyOrganizer: (request: VerifyOrganizerRequest) => Promise<boolean>
  moderateEvent: (request: ModerateEventRequest) => Promise<boolean>
  moderateImage: (request: ModerateImageRequest) => Promise<boolean>
  getUserActivity: (userId: string, days?: number) => Promise<UserActivity[]>
  getSuspiciousActivity: (hours?: number) => Promise<SuspiciousActivity[]>
  exportUserData: (request: UserDataExportRequest) => Promise<UserDataExportResponse>
  anonymizeUser: (userId: string, reason?: string) => Promise<boolean>
}

// =====================================================
// DATABASE FUNCTION TYPES
// =====================================================

export interface DatabaseSecurityFunctions {
  'auth.is_admin': {
    Args: { user_uuid?: string }
    Returns: boolean
  }
  'auth.is_moderator': {
    Args: { user_uuid?: string }
    Returns: boolean
  }
  'auth.is_verified_organizer': {
    Args: { user_uuid?: string }
    Returns: boolean
  }
  'auth.can_view_event': {
    Args: { event_uuid: string; user_uuid?: string }
    Returns: boolean
  }
  'auth.can_edit_event': {
    Args: { event_uuid: string; user_uuid?: string }
    Returns: boolean
  }
  'auth.check_rate_limit': {
    Args: { 
      user_uuid: string
      action_type: string
      max_actions: number
      time_window: string
    }
    Returns: boolean
  }
  'admin.promote_to_organizer': {
    Args: { target_user_id: string; admin_user_id?: string }
    Returns: boolean
  }
  'admin.verify_organizer': {
    Args: { target_user_id: string; admin_user_id?: string }
    Returns: boolean
  }
  'admin.set_user_role': {
    Args: { 
      target_user_id: string
      new_role: UserRole
      admin_user_id?: string
    }
    Returns: boolean
  }
  'admin.moderate_event': {
    Args: {
      event_uuid: string
      action: ModerationAction
      reason?: string
      moderator_user_id?: string
    }
    Returns: boolean
  }
  'admin.moderate_image': {
    Args: {
      image_uuid: string
      approved: boolean
      reason?: string
      moderator_user_id?: string
    }
    Returns: boolean
  }
  'admin.get_user_activity': {
    Args: { target_user_id: string; days_back?: number }
    Returns: UserActivity[]
  }
  'admin.get_suspicious_activity': {
    Args: { hours_back?: number }
    Returns: SuspiciousActivity[]
  }
  'admin.export_user_data': {
    Args: { target_user_id: string }
    Returns: Record<string, any>
  }
  'admin.anonymize_user_data': {
    Args: { target_user_id: string; admin_user_id?: string }
    Returns: boolean
  }
}
