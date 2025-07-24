import { z } from 'zod';

// Basic Action Code Types
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

// Statistics and Analytics
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

// Filter and Query Types
export interface ActionCodeFilters {
  type?: ActionCodeType;
  active?: boolean;
  campaign?: string;
  partner?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ActionCodeAnalyticsQuery {
  codeId?: string;
  timeRange: '24h' | '7d' | '30d' | '90d' | 'all';
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

// API Response Types
export interface ActionCodeListResponse {
  codes: ActionCode[];
  total: number;
  page: number;
  totalPages: number;
}

// Validation Schemas
export const createActionCodeSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['campaign', 'event', 'partner', 'emergency']),
  customCode: z.string().regex(/^[A-Z0-9]*$/, 'Nur Großbuchstaben und Zahlen erlaubt').max(20).optional(),
  codeLength: z.number().min(6).max(12),
  validityDays: z.number().min(1).max(365),
  maxUses: z.number().min(-1), // -1 for unlimited
  bonusCredits: z.number().min(0).max(1000),
  campaign: z.string().max(50).optional(),
  partner: z.string().max(50).optional(),
  eventId: z.string().uuid().optional()
});

export const actionCodeUsageSchema = z.object({
  code: z.string().min(6).max(20),
  userId: z.string().uuid()
});

// Action Code Log Types
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

// Event Integration Types
export interface EventActionCode {
  id: string;
  eventId: string;
  actionCodeId: string;
  isRequired: boolean;
  maxUsesPerEvent: number;
  createdAt: string;
}

// Campaign Integration Types
export interface CampaignActionCode {
  id: string;
  campaignName: string;
  actionCodeIds: string[];
  startDate: string;
  endDate: string;
  targetAudience?: string;
  expectedReach?: number;
  actualReach?: number;
  budget?: number;
  cost?: number;
  roi?: number;
  createdAt: string;
  updatedAt: string;
}
