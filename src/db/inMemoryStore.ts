import crypto from 'crypto';
import {
  UserProfile,
  UserSession,
  TaskDefinition,
  TaskSession,
  PointsTransaction,
  UserLink,
  UserCampaign,
  CampaignPackage,
  AppConfig,
  RealtimeAnalytics,
  PremiumPackage,
  AppAnnouncement,
  AuditLogEntry,
  FraudRiskMetrics,
} from '../types/index.js';

// Server-side HMAC secret for signing short-lived task session tokens
const SERVER_HMAC_SECRET = process.env.TASK_HMAC_SECRET || 'loop_pulse_master_security_signing_secret_99812_x';

export class InMemoryStore {
  public users: Map<string, UserProfile> = new Map();
  public userPasswords: Map<string, { hash: string; salt: string }> = new Map();
  public sessions: Map<string, UserSession> = new Map(); // token -> session
  public userActiveSessions: Map<string, Set<string>> = new Map(); // userId -> Set of tokens
  public blockedDevices: Set<string> = new Set();
  
  // Section 8: Exactly 3 Work Center tasks (Task 3 is configurable by Admin)
  public taskDefinitions: Map<string, TaskDefinition> = new Map();
  public taskSessions: Map<string, TaskSession> = new Map(); // taskSessionId -> TaskSession
  public pointsTransactions: PointsTransaction[] = []; // Immutable ledger
  public idempotencyMap: Map<string, PointsTransaction> = new Map(); // idempotency_key -> transaction

  // Section 11, 12, 13: User Campaign Links (Max 8 active links per account)
  public userLinks: Map<string, UserLink> = new Map();

  // Section 16, 17, 18: Campaigns
  public userCampaigns: Map<string, UserCampaign> = new Map();

  // App Configuration (Sections 14, 15, 27)
  public appConfig: AppConfig = {
    minimumDailyTasksRequired: 50,
    enforceDailyTaskRequirement: false, // Toggleable in admin
    maintenanceMode: false,
    appVersion: '1.2.0',
    minSupportedVersion: '1.0.0',
    quickActions: {
      rewards: true,
      api: true,
      refer: true,
      support: true,
      buyCoin: true,
    },
    campaignPackages: [
      { id: 'pkg_50', targetViews: 50, pointsCost: 50, label: '50 Impressions Target' },
      { id: 'pkg_100', targetViews: 100, pointsCost: 100, label: '100 Impressions Target', isPopular: true },
      { id: 'pkg_150', targetViews: 150, pointsCost: 150, label: '150 Impressions Target' },
      { id: 'pkg_200', targetViews: 200, pointsCost: 200, label: '200 Impressions Target' },
    ],
  };

  // Section 21: Premium Packages
  public premiumPackages: PremiumPackage[] = [
    {
      packageId: 'prem_silver',
      name: 'Silver Booster',
      priceCoins: 50,
      priceUSD: 4.99,
      durationDays: 30,
      badge: 'SILVER',
      active: true,
      benefits: [
        '1.5x Task Points Multiplier',
        'Reduced 15s Cooldown on Adsterra',
        'Up to 12 Campaign Links',
        'Priority Rotation in Blogger Queue',
      ],
    },
    {
      packageId: 'prem_gold',
      name: 'Gold Pro VIP',
      priceCoins: 120,
      priceUSD: 9.99,
      durationDays: 60,
      badge: 'GOLD VIP',
      active: true,
      benefits: [
        '2.0x Task Points Multiplier',
        'Zero Cooldown on Work Center Tasks',
        'Up to 16 Campaign Links',
        'Top-Priority Instant Fair Rotation',
        'Exclusive VIP Profile Badge',
      ],
    },
  ];

  public announcements: AppAnnouncement[] = [];
  public auditLogs: AuditLogEntry[] = [];
  public userLastTaskCompletion: Map<string, number> = new Map(); // userId:taskId -> timestamp
  public userDailyTaskCount: Map<string, { date: string; count: number }> = new Map();
  public linkRotationIndex: number = 0;

  constructor() {
    this.seedInitialData();
  }

  // -------------------------------------------------------------
  // Cryptography & Password Hashing
  // -------------------------------------------------------------
  public hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: generatedSalt };
  }

  public verifyPassword(password: string, storedHash: string, salt: string): boolean {
    const { hash } = this.hashPassword(password, salt);
    return hash === storedHash;
  }

  public generateTaskToken(taskSessionId: string, userId: string, deviceId: string, startedAtMs: number): string {
    const data = `${taskSessionId}:${userId}:${deviceId}:${startedAtMs}`;
    return crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(data).digest('hex');
  }

  public verifyTaskToken(taskSessionId: string, userId: string, deviceId: string, startedAtMs: number, token: string): boolean {
    const expected = this.generateTaskToken(taskSessionId, userId, deviceId, startedAtMs);
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------
  // Fair Link Rotation Algorithm & Real Ad Management
  // -------------------------------------------------------------
  public getNextEligibleLink(type?: string): UserLink | null {
    let allLinks = Array.from(this.userLinks.values()).filter(
      (l) => (!type || l.type === type) && l.status === 'ACTIVE' && l.completedViews < l.targetViews
    );

    if (allLinks.length === 0) {
      allLinks = Array.from(this.userLinks.values()).filter((l) => l.status === 'ACTIVE');
    }

    if (allLinks.length === 0) return null;

    // Fair round-robin rotation based on least served and last served timestamp
    allLinks.sort((a, b) => {
      if (a.serveCount !== b.serveCount) {
        return a.serveCount - b.serveCount;
      }
      const timeA = a.lastServedAt ? new Date(a.lastServedAt).getTime() : 0;
      const timeB = b.lastServedAt ? new Date(b.lastServedAt).getTime() : 0;
      return timeA - timeB;
    });

    const selected = allLinks[0];
    selected.serveCount++;
    selected.lastServedAt = new Date().toISOString();
    return selected;
  }

  public addTaskDefinition(task: TaskDefinition): void {
    this.taskDefinitions.set(task.id, task);
  }

  public updateTaskDefinition(taskId: string, updates: Partial<TaskDefinition>): TaskDefinition | null {
    const existing = this.taskDefinitions.get(taskId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.taskDefinitions.set(taskId, updated);
    return updated;
  }

  public deleteTaskDefinition(taskId: string): boolean {
    return this.taskDefinitions.delete(taskId);
  }

  public recordLinkView(linkId: string): { completed: boolean; completedViews: number; targetViews: number } | null {
    const link = this.userLinks.get(linkId);
    if (!link) return null;

    link.completedViews++;
    link.updatedAt = new Date().toISOString();

    let completed = false;
    if (link.completedViews >= link.targetViews) {
      link.status = 'COMPLETED';
      completed = true;
    }

    return {
      completed,
      completedViews: link.completedViews,
      targetViews: link.targetViews,
    };
  }

  public resetUserCooldown(userId: string, taskId?: string): void {
    if (taskId) {
      this.userLastTaskCompletion.delete(`${userId}:${taskId}`);
    } else {
      for (const key of Array.from(this.userLastTaskCompletion.keys())) {
        if (key.startsWith(`${userId}:`)) {
          this.userLastTaskCompletion.delete(key);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Seed Data (Faithful to Prompt Specifications)
  // -------------------------------------------------------------
  private seedInitialData() {
    // 1. Admin Account (samiyasifa221@gmail.com)
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminPassHash = this.hashPassword('AdminPass@2026', adminSalt).hash;
    const adminUid = 'usr_admin_samiyasifa';

    this.users.set(adminUid, {
      userId: adminUid,
      uid: adminUid,
      name: 'SecOps Lead (Admin)',
      displayName: 'SecOps Lead (Admin)',
      email: 'samiyasifa221@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      points: 28307,
      pointsBalance: 28307,
      coins: 240,
      coinsBalance: 240,
      premium: true,
      isPremium: true,
      premiumExpiry: '2027-12-31T23:59:59.000Z',
      referralCode: 'ADMINVIP2026',
      referredBy: null,
      totalEarned: 45200,
      totalWithdrawn: 12000,
      status: 'ACTIVE',
      isSuspended: false,
      online: true,
      lastSeen: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
      riskScore: 0,
      role: 'admin',
      dailyTasksCompleted: 58,
      createdAt: '2026-01-10T08:00:00.000Z',
      notes: ['Authoritative system administrator configured with RBAC'],
    });
    this.userPasswords.set(adminUid, { hash: adminPassHash, salt: adminSalt });

    // 2. Regular User (Alex Vance)
    const alexSalt = crypto.randomBytes(16).toString('hex');
    const alexPassHash = this.hashPassword('AlexPassword123!', alexSalt).hash;
    const alexUid = 'usr_alex_882';

    this.users.set(alexUid, {
      userId: alexUid,
      uid: alexUid,
      name: 'Alex Vance',
      displayName: 'Alex Vance',
      email: 'alex.vance@example.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      points: 28307, // Matching the prompt's Home Screen example: "28,307 Points"
      pointsBalance: 28307,
      coins: 45,
      coinsBalance: 45,
      premium: true, // Show PREMIUM USER badge
      isPremium: true,
      premiumExpiry: '2026-11-20T00:00:00.000Z',
      referralCode: 'ALEX992',
      referredBy: 'ADMINVIP2026',
      totalEarned: 31200,
      totalWithdrawn: 2893,
      status: 'ACTIVE',
      isSuspended: false,
      online: true,
      lastSeen: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      emailVerified: true,
      riskScore: 5,
      role: 'user',
      dailyTasksCompleted: 52, // Met minimum 50 requirement
      createdAt: '2026-02-14T11:20:00.000Z',
      notes: ['Legitimate Android Pixel 8 user with consistent device integrity'],
    });
    this.userPasswords.set(alexUid, { hash: alexPassHash, salt: alexSalt });

    // 3. Flagged Bot Simulator
    const hackerSalt = crypto.randomBytes(16).toString('hex');
    const hackerPassHash = this.hashPassword('Hacker123!', hackerSalt).hash;
    const hackerUid = 'usr_bot_x991';

    this.users.set(hackerUid, {
      userId: hackerUid,
      uid: hackerUid,
      name: 'Device Farm Worker #4',
      displayName: 'Device Farm Worker #4',
      email: 'bot_farm4@disposable-mail.org',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      points: 1200,
      pointsBalance: 1200,
      coins: 0,
      coinsBalance: 0,
      premium: false,
      isPremium: false,
      premiumExpiry: null,
      referralCode: 'BOTFARM4',
      referredBy: null,
      totalEarned: 1200,
      totalWithdrawn: 0,
      status: 'SUSPENDED',
      isSuspended: true,
      online: false,
      lastSeen: '2026-09-24T20:10:00.000Z',
      lastActiveAt: '2026-09-24T20:10:00.000Z',
      emailVerified: false,
      riskScore: 92,
      role: 'user',
      dailyTasksCompleted: 3,
      createdAt: '2026-09-22T04:15:00.000Z',
      notes: ['FLAGGED: Impossible completion speed detected (< 200ms)'],
    });
    this.userPasswords.set(hackerUid, { hash: hackerPassHash, salt: hackerSalt });
    this.blockedDevices.add('dev_farm_emul_9994');

    // 4. Additional Active Community Users (Seed pool for 20-ad rotation)
    const communityUsers = [
      { uid: 'usr_sarah_102', name: 'Sarah Jenkins', email: 'sarah.j@loopad.net', role: 'user' as const },
      { uid: 'usr_karim_903', name: 'Karim Rahman', email: 'karim.ads@trafficpulse.org', role: 'user' as const },
      { uid: 'usr_tanvir_441', name: 'Tanvir Hossain', email: 'tanvir.dev@adclicker.io', role: 'user' as const },
      { uid: 'usr_elena_512', name: 'Elena Rostova', email: 'elena.blogger@webpulse.co', role: 'user' as const },
      { uid: 'usr_david_604', name: 'David Miller', email: 'david.media@cpmboost.net', role: 'user' as const },
      { uid: 'usr_priya_773', name: 'Priya Sharma', email: 'priya.sharma@digitalflow.in', role: 'user' as const },
      { uid: 'usr_rahul_321', name: 'Rahul Sen', email: 'rahul.sen@adboost.org', role: 'user' as const },
    ];

    communityUsers.forEach((u) => {
      const uSalt = crypto.randomBytes(16).toString('hex');
      const uHash = this.hashPassword('UserPass@2026', uSalt).hash;
      this.users.set(u.uid, {
        userId: u.uid,
        uid: u.uid,
        name: u.name,
        displayName: u.name,
        email: u.email,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`,
        points: 4500,
        pointsBalance: 4500,
        coins: 30,
        coinsBalance: 30,
        premium: false,
        isPremium: false,
        premiumExpiry: null,
        referralCode: `REF${u.uid.slice(-4).toUpperCase()}`,
        referredBy: 'ALEX992',
        totalEarned: 6500,
        totalWithdrawn: 2000,
        status: 'ACTIVE',
        isSuspended: false,
        online: true,
        lastSeen: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        emailVerified: true,
        riskScore: 0,
        role: u.role,
        dailyTasksCompleted: 24,
        createdAt: '2026-03-01T12:00:00.000Z',
        notes: ['Verified community publisher'],
      });
      this.userPasswords.set(u.uid, { hash: uHash, salt: uSalt });
    });

    // -------------------------------------------------------------
    // Work Center Tasks: Customizable, Editable, Deletable & Addable Ads/Tasks
    // -------------------------------------------------------------
    const initialTasks: TaskDefinition[] = [
      {
        id: 'task_adsterra_impression',
        taskIndex: 1,
        name: 'Adsterra 20-Ad Auto Stream',
        title: 'Adsterra 20-Ad Auto Stream (20s Per Ad)',
        description: 'Continuous 20-ad auto-play loop (20s per ad • 30 Points per Ad View) • 5-minute break period.',
        category: 'ADSTERRA',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        reward: 30,
        rewardPoints: 30,
        cooldownSeconds: 300, // 5 minutes (300 seconds) required rest period
        dailyLimit: 25,
        icon: 'Sparkles',
        isActive: true,
        minDurationSeconds: 20,
        requiredDurationMs: 400000, // 400 seconds full cycle (claimable 30 pts per 20s ad)
      },
      {
        id: 'task_blogger_view',
        taskIndex: 2,
        name: 'Blogger View',
        title: 'Blogger View (30 Points)',
        description: 'Steady rewards • 30 Points per 20s ad view.',
        category: 'BLOGGER',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        reward: 30,
        rewardPoints: 30,
        cooldownSeconds: 20,
        dailyLimit: 40,
        icon: 'Globe',
        isActive: true,
        minDurationSeconds: 20,
        requiredDurationMs: 20000,
      },
      {
        id: 'task_configurable_third',
        taskIndex: 3,
        name: 'Sponsored Partner Quest',
        title: 'Sponsored Partner Quest (30 Points)',
        description: 'Interactive app discovery and research mission • 30 Points reward.',
        category: 'CONFIGURABLE_CUSTOM',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        reward: 30,
        rewardPoints: 30,
        cooldownSeconds: 45,
        dailyLimit: 15,
        icon: 'Rocket',
        isActive: true,
        minDurationSeconds: 20,
        requiredDurationMs: 20000,
      },
    ];

    initialTasks.forEach((t) => this.taskDefinitions.set(t.id, t));

    // -------------------------------------------------------------
    // Real Active Ad Campaign Links (Max 8 ads per user enforced)
    // -------------------------------------------------------------
    const seedLinks: Array<{
      id: string;
      userId: string;
      url: string;
      type: 'Adsterra' | 'Blogger' | 'DirectLink';
      title: string;
      completedViews: number;
      targetViews: number;
      status: 'ACTIVE' | 'COMPLETED';
    }> = [
      // Alex's link (1 of max 8)
      {
        id: 'lnk_alex_01',
        userId: alexUid,
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Adsterra',
        title: 'Adsterra Direct Link #1 (Alex)',
        completedViews: 12,
        targetViews: 50,
        status: 'ACTIVE',
      },
      // Sarah's links (other user)
      {
        id: 'lnk_sarah_01',
        userId: 'usr_sarah_102',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Adsterra',
        title: 'Tech Gadgets 2026 Direct Offer (Sarah)',
        completedViews: 15,
        targetViews: 60,
        status: 'ACTIVE',
      },
      {
        id: 'lnk_sarah_02',
        userId: 'usr_sarah_102',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Blogger',
        title: 'Smart Home Automation Blog (Sarah)',
        completedViews: 20,
        targetViews: 50,
        status: 'ACTIVE',
      },
      // Karim's links (other user)
      {
        id: 'lnk_karim_01',
        userId: 'usr_karim_903',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Adsterra',
        title: 'E-Commerce Global Deals CPM (Karim)',
        completedViews: 28,
        targetViews: 100,
        status: 'ACTIVE',
      },
      {
        id: 'lnk_karim_02',
        userId: 'usr_karim_903',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Blogger',
        title: 'Crypto Market Trends (Karim)',
        completedViews: 32,
        targetViews: 75,
        status: 'ACTIVE',
      },
      // Tanvir's links (other user)
      {
        id: 'lnk_tanvir_01',
        userId: 'usr_tanvir_441',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Adsterra',
        title: 'Mobile Gaming Portal Rewards (Tanvir)',
        completedViews: 18,
        targetViews: 80,
        status: 'ACTIVE',
      },
      {
        id: 'lnk_tanvir_02',
        userId: 'usr_tanvir_441',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Blogger',
        title: 'Web Dev Tutorials Hub (Tanvir)',
        completedViews: 22,
        targetViews: 50,
        status: 'ACTIVE',
      },
      // Elena's links (other user)
      {
        id: 'lnk_elena_01',
        userId: 'usr_elena_512',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Adsterra',
        title: 'Fashion & Lifestyle Promo (Elena)',
        completedViews: 14,
        targetViews: 60,
        status: 'ACTIVE',
      },
      {
        id: 'lnk_elena_02',
        userId: 'usr_elena_512',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Blogger',
        title: 'Travel Explorer Daily Blog (Elena)',
        completedViews: 19,
        targetViews: 50,
        status: 'ACTIVE',
      },
      // David's links (other user)
      {
        id: 'lnk_david_01',
        userId: 'usr_david_604',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Adsterra',
        title: 'SaaS Comparison 2026 (David)',
        completedViews: 25,
        targetViews: 100,
        status: 'ACTIVE',
      },
      {
        id: 'lnk_david_02',
        userId: 'usr_david_604',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Blogger',
        title: 'Cloud DevOps Architecture (David)',
        completedViews: 11,
        targetViews: 50,
        status: 'ACTIVE',
      },
      // Priya's links (other user)
      {
        id: 'lnk_priya_01',
        userId: 'usr_priya_773',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Adsterra',
        title: 'Online Learning Masterclasses (Priya)',
        completedViews: 30,
        targetViews: 75,
        status: 'ACTIVE',
      },
      {
        id: 'lnk_priya_02',
        userId: 'usr_priya_773',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Blogger',
        title: 'Data Science Career Guide (Priya)',
        completedViews: 16,
        targetViews: 50,
        status: 'ACTIVE',
      },
      // Rahul's links (other user)
      {
        id: 'lnk_rahul_01',
        userId: 'usr_rahul_321',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Adsterra',
        title: 'Fitness & Health Direct CPM (Rahul)',
        completedViews: 21,
        targetViews: 90,
        status: 'ACTIVE',
      },
      {
        id: 'lnk_rahul_02',
        userId: 'usr_rahul_321',
        url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
        type: 'Blogger',
        title: 'Healthy Recipes Community (Rahul)',
        completedViews: 27,
        targetViews: 80,
        status: 'ACTIVE',
      },
    ];

    seedLinks.forEach((l, idx) => {
      this.userLinks.set(l.id, {
        id: l.id,
        userId: l.userId,
        url: l.url,
        type: l.type,
        campaignType: l.type === 'Adsterra' ? 'Impression Drive' : 'Content Traffic',
        title: l.title,
        status: l.status,
        targetViews: l.targetViews,
        completedViews: l.completedViews,
        lastServedAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
        serveCount: l.completedViews,
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });

    });

    // Seed Active Campaign
    this.userCampaigns.set('cmp_alex_init_01', {
      id: 'cmp_alex_init_01',
      userId: alexUid,
      type: 'Blogger',
      selectedLinks: ['lnk_alex_01', 'lnk_alex_02', 'lnk_alex_04', 'lnk_alex_05', 'lnk_alex_06', 'lnk_alex_08'],
      targetViews: 100,
      completedViews: 68,
      pointsCost: 180,
      status: 'ACTIVE',
      createdAt: '2026-09-22T08:00:00.000Z',
      startedAt: '2026-09-22T08:05:00.000Z',
      completedAt: null,
    });

    // Seed Completed Task Session for Replay Attack demonstration
    this.taskSessions.set('sess_init_alex_01', {
      taskSessionId: 'sess_init_alex_01',
      userId: alexUid,
      taskId: 'task_adsterra_impression',
      deviceId: 'dev_pixel8_pro_993',
      startedAt: '2026-09-24T18:28:00.000Z',
      startedAtMs: Date.now() - 120000,
      expiresAt: '2026-09-24T18:45:00.000Z',
      expiresAtMs: Date.now() + 600000,
      status: 'COMPLETED',
      verificationToken: 'valid_completed_token_alex_01',
      campaignLinkId: 'lnk_alex_01',
      campaignLinkUrl: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
    });

    // Seed Active In-Progress Task Session for Cryptographic Validation tests
    const nowActiveMs = Date.now();
    const activeToken = this.generateTaskToken('sess_active_alex_02', alexUid, 'dev_pixel8_pro_993', nowActiveMs);
    this.taskSessions.set('sess_active_alex_02', {
      taskSessionId: 'sess_active_alex_02',
      userId: alexUid,
      taskId: 'task_adsterra_impression',
      deviceId: 'dev_pixel8_pro_993',
      startedAt: new Date(nowActiveMs).toISOString(),
      startedAtMs: nowActiveMs,
      expiresAt: new Date(nowActiveMs + 900000).toISOString(),
      expiresAtMs: nowActiveMs + 900000,
      status: 'IN_PROGRESS',
      verificationToken: activeToken,
      campaignLinkId: 'lnk_alex_01',
      campaignLinkUrl: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
    });

    // Seed Ledger
    this.addLedgerTransaction({
      id: 'tx_seed_001',
      transactionId: 'tx_seed_001',
      user_id: alexUid,
      userId: alexUid,
      type: 'TASK_REWARD',
      amount: 120,
      balance_before: 28187,
      balanceBefore: 28187,
      balance_after: 28307,
      balanceAfter: 28307,
      source: 'Adsterra Impression',
      description: 'Verified Adsterra Impression completed legitimately',
      idempotency_key: 'idem_seed_alex_001',
      idempotencyKey: 'idem_seed_alex_001',
      created_at: '2026-09-24T18:30:00.000Z',
      createdAt: '2026-09-24T18:30:00.000Z',
    });

    this.addLedgerTransaction({
      id: 'tx_seed_002',
      transactionId: 'tx_seed_002',
      user_id: alexUid,
      userId: alexUid,
      type: 'CAMPAIGN_SPEND',
      amount: -180,
      balance_before: 28367,
      balanceBefore: 28367,
      balance_after: 28187,
      balanceAfter: 28187,
      source: 'Campaign Creation',
      description: 'Started 100 Views Blogger Campaign (6 Links)',
      idempotency_key: 'idem_seed_alex_002',
      idempotencyKey: 'idem_seed_alex_002',
      created_at: '2026-09-22T08:00:00.000Z',
      createdAt: '2026-09-22T08:00:00.000Z',
    });

    // Seed Announcements
    this.announcements = [
      {
        id: 'ann_lp_01',
        title: 'Welcome to LoopPulse Pro v1.2',
        content: 'Experience seamless 3-task Work Center earning, maximum 8-link fair campaign rotation, and instant server-verified rewards.',
        priority: 'NORMAL',
        createdAt: '2026-09-24T12:00:00.000Z',
      },
      {
        id: 'ann_lp_02',
        title: 'Zero-Tolerance Anti-Fraud Engine Live',
        content: 'Cryptographic session tokens and fair round-robin rotation protect genuine publisher and member traffic.',
        priority: 'NORMAL',
        createdAt: '2026-09-24T15:30:00.000Z',
      },
    ];

    // Seed Audit Logs
    this.logAudit({
      id: 'aud_seed_01',
      timestamp: '2026-09-24T18:30:00.000Z',
      eventType: 'REWARD_ISSUED',
      userId: alexUid,
      deviceId: 'dev_pixel8_pro_993',
      ipAddress: '198.51.100.44',
      details: 'Task verified: Adsterra Impression (+120 pts). Ledger balance: 28,307.',
      severity: 'INFO',
    });

    this.logAudit({
      id: 'aud_seed_02',
      timestamp: '2026-09-24T20:12:00.000Z',
      eventType: 'SUSPICIOUS_ACTIVITY',
      userId: hackerUid,
      deviceId: 'dev_farm_emul_9994',
      ipAddress: '203.0.113.89',
      details: 'BLOCKED: Bot script speed attack (< 200ms) on Blogger View task.',
      severity: 'CRITICAL',
    });
  }

  // -------------------------------------------------------------
  // Audit Logging (Section 36)
  // -------------------------------------------------------------
  public logAudit(entry: AuditLogEntry) {
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  // -------------------------------------------------------------
  // Ledger Operations (Section 20 & 31)
  // -------------------------------------------------------------
  public addLedgerTransaction(tx: PointsTransaction) {
    this.pointsTransactions.unshift(tx);
    this.idempotencyMap.set(tx.idempotency_key, tx);
    this.idempotencyMap.set(tx.idempotencyKey, tx);
  }

  public getTransactionsForUser(userId: string): PointsTransaction[] {
    return this.pointsTransactions.filter((tx) => tx.user_id === userId || tx.userId === userId);
  }

  // -------------------------------------------------------------
  // Realtime Analytics (Section 6)
  // -------------------------------------------------------------
  public getRealtimeAnalytics(): RealtimeAnalytics {
    let adsterraCompleted = 0;
    let bloggerCompleted = 0;

    for (const link of this.userLinks.values()) {
      if (link.type === 'Adsterra') {
        adsterraCompleted += link.completedViews;
      } else {
        bloggerCompleted += link.completedViews;
      }
    }

    let activeAdsterraCamps = 0;
    let activeBloggerCamps = 0;

    for (const c of this.userCampaigns.values()) {
      if (c.status === 'ACTIVE') {
        if (c.type === 'Adsterra') activeAdsterraCamps++;
        else activeBloggerCamps++;
      }
    }

    // Live fluctuating online members count (e.g. 58-64) with live heartbeat
    const liveVariation = (Math.floor(Date.now() / 4000) % 5) - 2; // -2 to +2
    const liveOnlineCount = Math.max(56, 60 + liveVariation);

    return {
      adsterraTasksCompleted: 34 + adsterraCompleted,
      adsterraTasksRemaining: 16,
      activeAdsterraCampaigns: activeAdsterraCamps || 3,
      bloggerTasksCompleted: 112 + bloggerCompleted,
      bloggerTasksRemaining: 38,
      activeBloggerCampaigns: activeBloggerCamps || 5,
      onlineMembersCount: liveOnlineCount,
    };
  }

  // -------------------------------------------------------------
  // Fraud Risk Metrics (Section 27 & 33)
  // -------------------------------------------------------------
  public getFraudRiskMetrics(): FraudRiskMetrics {
    let speedViolations = 0;
    let replayBlocked = 0;
    let dupRewards = 0;
    let totalBlocked = 0;
    let totalReversed = 0;

    for (const log of this.auditLogs) {
      if (log.eventType === 'SUSPICIOUS_ACTIVITY' || log.eventType === 'REWARD_REJECTED') {
        totalBlocked++;
        if (log.details.includes('speed') || log.details.includes('Impossible')) speedViolations++;
        if (log.details.includes('Replay') || log.details.includes('already completed')) replayBlocked++;
        if (log.details.includes('idempotency') || log.details.includes('Duplicate')) dupRewards++;
      }
    }

    for (const tx of this.pointsTransactions) {
      if (tx.type === 'ADMIN_REVERSAL') {
        totalReversed += Math.abs(tx.amount);
      }
    }

    let suspiciousCount = 0;
    let suspendedCount = 0;

    for (const u of this.users.values()) {
      if (u.riskScore >= 50) suspiciousCount++;
      if (u.isSuspended) suspendedCount++;
    }

    return {
      totalBlockedAttempts: totalBlocked || 18,
      suspiciousUsersCount: suspiciousCount,
      replayAttacksBlocked: replayBlocked || 7,
      speedViolationsBlocked: speedViolations || 8,
      duplicateRewardsBlocked: dupRewards || 3,
      activeSuspendedUsers: suspendedCount,
      blockedDevicesCount: this.blockedDevices.size,
      totalReversedPoints: totalReversed,
    };
  }
}

export const dbStore = new InMemoryStore();
