/**
 * RaveTracker v3.0 - Invite System Type Definitions
 * =================================================
 * Comprehensive TypeScript interfaces for the invite system
 * with robust error handling and validation types
 */

// =====================================================
// BASE TYPES
// =====================================================

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'needs_info'
export type VerificationLevel = 'unverified' | 'verified' | 'trusted' | 'moderator' | 'admin'

// Raw database table types (will match Supabase generated types after migration)
export interface InviteRow {
  id: string
  code: string
  created_by: string
  used_by: string | null
  created_at: string
  used_at: string | null
  expires_at: string
  is_active: boolean
  is_action_code: boolean
  max_uses: number
  current_uses: number
}

export interface InviteSettingRow {
  id: string
  setting_key: string
  setting_value: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface InviteAttemptRow {
  id: string
  code_attempted: string
  ip_address: string
  email_attempted: string | null
  success: boolean
  attempted_at: string
  user_agent: string | null
}

export interface VerificationRequestRow {
  id: string
  user_id: string
  status: VerificationStatus
  request_message: string
  admin_notes: string | null
  recommended_by: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  updated_at: string
}

// =====================================================
// ENHANCED INVITE TYPES
// =====================================================

export interface Invite {
  id: string
  code: string
  createdBy: string
  usedBy?: string | null
  createdAt: Date
  usedAt?: Date | null
  expiresAt: Date
  isActive: boolean
  isActionCode: boolean
  maxUses: number
  currentUses: number
  
  // Computed properties
  isExpired: boolean
  isAvailable: boolean
  remainingUses: number
  
  // Optional related data
  creator?: {
    id: string
    username: string | null
    displayName: string | null
    verificationLevel: VerificationLevel
  }
  
  user?: {
    id: string
    username: string | null
    displayName: string | null
    registeredAt: Date
  }
}

export interface CreateInviteRequest {
  userId: string
  expiresInDays?: number
  maxUses?: number
  isActionCode?: boolean
  customCode?: string
}

export interface CreateInviteResponse {
  invite: Invite
  remainingCredits: number
}

// =====================================================
// VALIDATION TYPES
// =====================================================

export interface ValidationResult {
  isValid: boolean
  isActionCode: boolean
  remainingUses?: number
  expiresAt: Date
  rateLimitInfo: RateLimitInfo
  errorCode?: InviteErrorCode
  errorMessage?: string
}

export interface RateLimitInfo {
  attemptsRemaining: number
  timeUntilReset: number // in seconds
  isBlocked: boolean
  blockExpiresAt?: Date
}

export interface RateLimitResult {
  allowed: boolean
  rateLimitInfo: RateLimitInfo
  reason: string | null
  message: string | null
}

export interface CodeValidationRequest {
  code: string
  ipAddress: string
  userAgent?: string
  email?: string
}

// =====================================================
// VERIFICATION SYSTEM TYPES
// =====================================================

export interface VerificationRequest {
  id: string
  userId: string
  status: VerificationStatus
  requestMessage: string
  adminNotes?: string | null
  recommendedBy?: string | null
  createdAt: Date
  reviewedAt?: Date | null
  reviewedBy?: string | null
  updatedAt: Date
  
  // Related data
  user?: {
    id: string
    username: string | null
    displayName: string | null
    email: string | null
    verificationLevel: VerificationLevel
    accountAge: number // in days
    isEmailVerified: boolean
  }
  
  recommender?: {
    id: string
    username: string | null
    displayName: string | null
    verificationLevel: VerificationLevel
  }
  
  reviewer?: {
    id: string
    username: string | null
    displayName: string | null
    verificationLevel: VerificationLevel
  }
}

export interface EligibilityStatus {
  eligible: boolean
  reasons: EligibilityReason[]
  minimumWaitDays?: number
  canReapply?: boolean
  lastRequestDate?: Date
  cooldownExpiresAt?: Date
}

export interface EligibilityReason {
  type: 'account_age' | 'email_verification' | 'existing_request' | 'cooldown_period' | 'already_verified' | 'insufficient_activity'
  message: string
  met: boolean
  requiredValue?: string | number
  currentValue?: string | number
}

export interface CreateVerificationRequest {
  userId: string
  message: string
  recommendedBy?: string
}

export interface ReviewVerificationRequest {
  requestId: string
  decision: 'approved' | 'rejected' | 'needs_info'
  adminId: string
  notes?: string
  newVerificationLevel?: VerificationLevel
}

export interface VerificationStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  averageReviewTime: number // in hours
  approvalRate: number // percentage
  requestsThisWeek: number
  requestsThisMonth: number
}

// =====================================================
// INVITE STATISTICS TYPES
// =====================================================

export interface InviteStats {
  user: UserInviteStats
  global?: GlobalInviteStats
}

export interface UserInviteStats {
  totalInvitesCreated: number
  totalInvitesUsed: number
  activeInvites: number
  expiredInvites: number
  remainingCredits: number
  conversionRate: number // percentage
  invitedUsers: InvitedUser[]
  inviteHistory: InviteHistoryEntry[]
}

export interface GlobalInviteStats {
  totalUsers: number
  totalInvites: number
  activeInvites: number
  usedInvites: number
  expiredInvites: number
  actionCodes: number
  verifiedUsers: number
  pendingVerifications: number
  conversionRate: number
  registrationsToday: number
  inviteAttemptsToday: number
  failedAttemptsToday: number
  topInviters: TopInviter[]
  recentActivity: ActivityEntry[]
}

export interface InvitedUser {
  id: string
  username: string | null
  displayName: string | null
  inviteCode: string
  registeredAt: Date
  verificationLevel: VerificationLevel
  isActive: boolean
}

export interface InviteHistoryEntry {
  id: string
  code: string
  createdAt: Date
  usedAt?: Date | null
  expiresAt: Date
  isActionCode: boolean
  status: 'active' | 'used' | 'expired' | 'deleted'
}

export interface TopInviter {
  userId: string
  username: string | null
  displayName: string | null
  inviteCount: number
  conversionRate: number
  verificationLevel: VerificationLevel
}

export interface ActivityEntry {
  id: string
  type: 'invite_created' | 'invite_used' | 'user_verified' | 'verification_requested'
  description: string
  userId?: string
  username?: string | null
  timestamp: Date
  metadata?: Record<string, any>
}

// =====================================================
// SETTINGS TYPES
// =====================================================

export interface InviteSettings {
  inviteRateLimit: {
    perHour: number
    perDay: number
    perWeek: number
  }
  defaultValidityDays: number
  verificationCooldownDays: number
  minAccountAgeDays: number
  defaultInviteCredits: {
    unverified: number
    verified: number
    trusted: number
    moderator: number
    admin: number
  }
  maxCodeAttemptsPerHour: number
  maxCodeAttemptsPerDay: number
  ipBlockDurationMinutes: number
  suspiciousActivityThreshold: number
  autoCleanupEnabled: boolean
  autoCleanupIntervalHours: number
  notificationEnabled: boolean
  actionCodesEnabled: boolean
  codeLength: number
  codeCharset: string
  blacklistedCodes: string[]
  emailNotificationsEnabled: boolean
  inviteExpiryWarningDays: number
  verificationReminderDays: number
  analyticsEnabled: boolean
  detailedLoggingEnabled: boolean
  performanceMonitoringEnabled: boolean
}

export interface UpdateSettingsRequest {
  settings: Partial<InviteSettings>
  updatedBy: string
}

// =====================================================
// ACTION CODE TYPES
// =====================================================

export type ActionCodeType = 'campaign' | 'event' | 'partner' | 'emergency';

export interface ActionCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: ActionCodeType;
  
  // Configuration
  customCode?: string;
  codeLength: number;
  validityDays: number;
  maxUses: number; // -1 for unlimited
  bonusCredits: number;
  
  // Campaign & Partner Info
  campaign?: string;
  partner?: string;
  eventId?: string;
  
  // Status
  isActive: boolean;
  currentUses: number;
  successfulUses: number;
  
  // Timestamps
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  
  // Metadata
  createdBy: string;
  lastUsedAt?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  deactivationReason?: string;
}

export interface CreateActionCodeData {
  name: string;
  description?: string;
  type: ActionCodeType;
  customCode?: string;
  codeLength: number;
  validityDays: number;
  maxUses: number;
  bonusCredits: number;
  campaign?: string;
  partner?: string;
  eventId?: string;
}

export interface ActionCodeUsage {
  id: string;
  actionCodeId: string;
  userId: string;
  creditsAwarded: number;
  successful: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  usedAt: string;
}

export interface ActionCodeStats {
  totalUses: number;
  successfulUses: number;
  failedUses: number;
  uniqueUsers: number;
  totalCreditsIssued: number;
  averageCreditsPerUse: number;
  conversionRate: number;
  roi: number;
  
  // Time-based analytics
  hourlyUsage: Array<{
    hour: string;
    uses: number;
    uniqueUsers: number;
  }>;
  
  dailyUsage: Array<{
    date: string;
    uses: number;
    uniqueUsers: number;
  }>;
  
  peakUsageHour: string;
  peakUsageDay: string;
}

export interface ActionCodeDashboardStats {
  totalCodes: number;
  activeCodes: number;
  inactiveCodes: number;
  expiredCodes: number;
  totalUses: number;
  successfulUses: number;
  uniqueUsers: number;
  totalCreditsIssued: number;
  
  // Top performing codes
  topCodes: Array<{
    id: string;
    code: string;
    name: string;
    type: ActionCodeType;
    campaign?: string;
    currentUses: number;
    successfulUses: number;
    roi: number;
  }>;
  
  // Type distribution
  typeDistribution: Record<ActionCodeType, number>;
  
  // Recent activity
  recentActivity: Array<{
    type: 'created' | 'used' | 'deactivated' | 'extended';
    codeId: string;
    codeName: string;
    timestamp: string;
    details?: string;
  }>;
}

export interface ActionCodeDemographics {
  ageGroups: Record<string, number>;
  locations: Record<string, number>;
  deviceTypes: Record<string, number>;
  registrationSources: Record<string, number>;
  
  // Time-based patterns
  usageByHour: Record<string, number>;
  usageByWeekday: Record<string, number>;
  
  // User behavior
  averageSessionDuration: number;
  averageEventsPerSession: number;
  newVsReturningUsers: {
    new: number;
    returning: number;
  };
}

export interface ActionCodeFilters {
  type?: ActionCodeType;
  active?: boolean;
  campaign?: string;
  partner?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActionCodeListResponse {
  codes: ActionCode[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ActionCodeLog {
  id: string;
  actionCodeId: string;
  action: 'created' | 'used' | 'deactivated' | 'reactivated' | 'extended' | 'modified';
  performedBy: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Legacy compatibility - remove after migration
export interface CreateActionCodeRequest extends CreateActionCodeData {
  createdBy: string;
}

// =====================================================
// ERROR HANDLING TYPES
// =====================================================

export type InviteErrorCode = 
  | 'INVALID_CODE'
  | 'CODE_EXPIRED'
  | 'CODE_EXHAUSTED'
  | 'CODE_INACTIVE'
  | 'RATE_LIMITED'
  | 'IP_BLOCKED'
  | 'INSUFFICIENT_CREDITS'
  | 'INVALID_PERMISSIONS'
  | 'USER_NOT_FOUND'
  | 'INVITE_NOT_FOUND'
  | 'VERIFICATION_EXISTS'
  | 'VERIFICATION_NOT_ELIGIBLE'
  | 'SETTINGS_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

export interface InviteError extends Error {
  code: InviteErrorCode
  details?: Record<string, any>
  timestamp: Date
  userId?: string
  ipAddress?: string
}

export interface DatabaseResult<T> {
  data: T | null
  error: InviteError | null
  success: boolean
}

export interface ServiceResponse<T> {
  data: T | null
  error: InviteError | null
  success: boolean
  metadata?: {
    requestId: string
    timestamp: Date
    duration: number
    rateLimitInfo?: RateLimitInfo
  }
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, any>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  metadata?: {
    totalFiltered?: number
    queryDuration?: number
  }
}

export interface SearchParams {
  query?: string
  filters?: {
    verificationLevel?: VerificationLevel[]
    isActive?: boolean
    isExpired?: boolean
    isActionCode?: boolean
    createdAfter?: Date
    createdBefore?: Date
  }
  pagination: PaginationParams
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export interface NotificationData {
  type: 'invite_expiring' | 'invite_used' | 'verification_approved' | 'verification_rejected' | 'credits_restored'
  title: string
  message: string
  data?: {
    inviteCode?: string
    verificationLevel?: VerificationLevel
    creditsAdded?: number
    expiresAt?: Date
  }
  userId: string
  priority: 'low' | 'medium' | 'high'
  channels: ('email' | 'in_app' | 'push')[]
}

// =====================================================
// SECURITY TYPES
// =====================================================

export interface SecurityEvent {
  id: string
  type: 'suspicious_activity' | 'rate_limit_exceeded' | 'ip_blocked' | 'brute_force_attempt' | 'code_validation_failed' | 'email_pattern_detected' | 'system_emergency'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ipAddress: string
  userAgent?: string
  metadata: Record<string, any>
  timestamp: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

export interface IPBlock {
  ipAddress: string
  reason: string
  blockedAt: Date
  expiresAt: Date
  blockedBy: string
  isActive: boolean
}

export interface EmailBlock {
  id: string
  email: string
  reason: string
  blockedAt: Date
  blockedBy: string
  isActive: boolean
}

export interface SecurityDashboardStats {
  totalAttempts: number
  failedAttempts: number
  successRate: number
  uniqueIPs: number
  blockedIPs: number
  suspiciousActivities: number
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  systemStatus: 'normal' | 'elevated' | 'high' | 'emergency_locked'
  lastUpdated: Date
}

export interface ValidationAttempt {
  id: string
  codeAttempted: string
  ipAddress: string
  emailAttempted?: string
  success: boolean
  attemptedAt: Date
  userAgent?: string
  country?: string
  isSuspicious: boolean
  riskScore: number
  metadata: Record<string, any>
}

export interface ThreatAnalysis {
  level: 'low' | 'medium' | 'high' | 'critical'
  score: number
  indicators: Array<{
    type: 'ip_frequency' | 'email_pattern' | 'code_guessing' | 'timing_pattern' | 'geographic_anomaly'
    severity: 'low' | 'medium' | 'high'
    description: string
    count: number
  }>
  recommendations: string[]
  autoActions: Array<{
    action: 'block_ip' | 'rate_limit' | 'alert_admin' | 'emergency_lock'
    reason: string
    appliedAt?: Date
  }>
}

export interface SecurityReport {
  id: string
  reportType: 'weekly' | 'incident' | 'threat_assessment'
  title: string
  summary: string
  period: {
    start: Date
    end: Date
  }
  metrics: {
    totalAttempts: number
    blockedAttempts: number
    newThreats: number
    resolvedIncidents: number
    falsePositives: number
  }
  trends: Array<{
    metric: string
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }>
  threats: ThreatAnalysis[]
  recommendations: string[]
  generatedAt: Date
  generatedBy: string
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

export interface AnalyticsQuery {
  metric: 'invites' | 'registrations' | 'verifications' | 'attempts'
  period: 'day' | 'week' | 'month' | 'year'
  startDate: Date
  endDate: Date
  filters?: {
    verificationLevel?: VerificationLevel[]
    isActionCode?: boolean
    country?: string[]
  }
}

export interface AnalyticsResult {
  query: AnalyticsQuery
  data: Array<{
    date: string
    value: number
    metadata?: Record<string, any>
  }>
  summary: {
    total: number
    average: number
    peak: { date: string; value: number }
    trend: 'increasing' | 'decreasing' | 'stable'
    growthRate?: number
  }
}

// =====================================================
// AUDIT LOG TYPES
// =====================================================

export interface AuditLogEntry {
  id: string
  action: string
  entityType: 'invite' | 'user' | 'verification' | 'settings'
  entityId: string
  userId?: string
  adminId?: string
  changes: {
    before: Record<string, any>
    after: Record<string, any>
  }
  ipAddress: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, any>
}
