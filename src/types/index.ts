/**
 * LoopPulse Pro (formerly AegisRewards)
 * Complete TypeScript Types & Schema Definitions
 */

export type AuthStateType = 
  | 'Unauthenticated'
  | 'Authenticating'
  | 'Authenticated'
  | 'EmailVerificationRequired'
  | 'Error';

export interface UserSession {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  deviceId: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  uid: string;
  name: string;
  displayName: string;
  email: string;
  avatar: string;
  avatarUrl: string;
  points: number;
  pointsBalance: number;
  coins: number;
  coinsBalance: number;
  premium: boolean;
  isPremium: boolean;
  premiumExpiry: string | null;
  referralCode: string;
  referredBy: string | null;
  totalEarned: number;
  totalWithdrawn: number;
  status: 'ACTIVE' | 'SUSPENDED';
  isSuspended: boolean;
  online: boolean;
  lastSeen: string;
  lastActiveAt: string;
  emailVerified: boolean;
  riskScore: number;
  role: 'user' | 'admin';
  createdAt: string;
  dailyTasksCompleted: number;
  notes?: string[];
}

export type LinkType = 'Adsterra' | 'Blogger' | 'DirectLink' | 'Banner' | 'Video';
export type LinkStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED';

export interface UserLink {
  id: string;
  userId: string;
  url: string;
  type: LinkType;
  campaignType: string;
  title: string;
  status: LinkStatus;
  targetViews: number;
  completedViews: number;
  lastServedAt: string | null;
  serveCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface UserCampaign {
  id: string;
  userId: string;
  type: LinkType;
  selectedLinks: string[]; // up to 8 link IDs
  targetViews: number;
  completedViews: number;
  pointsCost: number;
  status: CampaignStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CampaignPackage {
  id: string;
  targetViews: number;
  pointsCost: number;
  label: string;
  isPopular?: boolean;
}

export interface TaskDefinition {
  id: string;
  taskIndex: number;
  name: string;
  title: string;
  description: string;
  category: 'ADSTERRA' | 'BLOGGER' | 'CONFIGURABLE_CUSTOM' | 'DIRECT_LINK' | 'BANNER' | 'VIDEO';
  url?: string;
  reward: number;
  rewardPoints: number;
  cooldownSeconds: number;
  dailyLimit: number;
  icon: string;
  isActive: boolean;
  minDurationSeconds: number;
  requiredDurationMs: number;
}

export type TaskSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'REJECTED' | 'REVOKED';

export interface TaskSession {
  taskSessionId: string;
  userId: string;
  taskId: string;
  deviceId: string;
  startedAt: string;
  startedAtMs: number;
  expiresAt: string;
  expiresAtMs: number;
  status: TaskSessionStatus;
  verificationToken: string;
  campaignLinkId?: string;
  campaignLinkUrl?: string;
  completedAt?: string;
  rejectionReason?: string;
}

export type TransactionType = 
  | 'TASK_REWARD'
  | 'CAMPAIGN_SPEND'
  | 'REFERRAL_REWARD'
  | 'BONUS'
  | 'PREMIUM_BONUS'
  | 'ADMIN_ADJUSTMENT'
  | 'ADMIN_REVERSAL';

export interface PointsTransaction {
  id: string;
  transactionId: string;
  user_id: string;
  userId: string;
  task_session_id?: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balanceBefore: number;
  balance_after: number;
  balanceAfter: number;
  source: string;
  description: string;
  idempotency_key: string;
  idempotencyKey: string;
  created_at: string;
  createdAt: string;
  note?: string;
}

export interface PremiumPackage {
  packageId: string;
  name: string;
  priceCoins: number;
  priceUSD: number;
  durationDays: number;
  benefits: string[];
  active: boolean;
  badge: string;
}

export interface AppConfig {
  minimumDailyTasksRequired: number;
  enforceDailyTaskRequirement: boolean;
  maintenanceMode: boolean;
  appVersion: string;
  minSupportedVersion: string;
  quickActions: {
    rewards: boolean;
    api: boolean;
    refer: boolean;
    support: boolean;
    buyCoin: boolean;
  };
  campaignPackages: CampaignPackage[];
}

export interface RealtimeAnalytics {
  adsterraTasksCompleted: number;
  adsterraTasksRemaining: number;
  activeAdsterraCampaigns: number;
  bloggerTasksCompleted: number;
  bloggerTasksRemaining: number;
  activeBloggerCampaigns: number;
  onlineMembersCount: number;
}

export interface AppAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT' | 'MAINTENANCE';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: 
    | 'AUTH_LOGIN'
    | 'AUTH_LOGOUT'
    | 'AUTH_REGISTER'
    | 'TASK_STARTED'
    | 'TASK_COMPLETED'
    | 'REWARD_ISSUED'
    | 'REWARD_REJECTED'
    | 'CAMPAIGN_CREATED'
    | 'CAMPAIGN_COMPLETED'
    | 'LINK_ADDED'
    | 'LINK_ROTATED'
    | 'PREMIUM_PURCHASED'
    | 'REFERRAL_REWARD'
    | 'SUSPICIOUS_ACTIVITY'
    | 'ADMIN_ACTION'
    | 'DEVICE_BLOCKED'
    | 'INTEGRITY_VIOLATION';
  userId?: string;
  deviceId?: string;
  ipAddress?: string;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export interface FraudRiskMetrics {
  totalBlockedAttempts: number;
  suspiciousUsersCount: number;
  replayAttacksBlocked: number;
  speedViolationsBlocked: number;
  duplicateRewardsBlocked: number;
  activeSuspendedUsers: number;
  blockedDevicesCount: number;
  totalReversedPoints: number;
}

export interface ReleaseChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'FIREBASE' | 'SECURITY' | 'GRADLE_R8' | 'INTEGRITY' | 'ANTI_FRAUD' | 'QUALITY';
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
}

export type SupportedLanguage = 'en' | 'bn';
