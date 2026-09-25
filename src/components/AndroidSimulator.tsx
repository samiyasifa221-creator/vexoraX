import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  AlertTriangle,
  Play,
  Lock,
  Flame,
  Check,
  Award,
  Terminal,
  ChevronRight,
  User,
  LogOut,
  MailCheck,
  Maximize2,
  Minimize2,
  Layers,
  Activity,
  History,
  Info,
} from 'lucide-react';
import {
  UserProfile,
  TaskDefinition,
  PointsTransaction,
  SupportedLanguage,
  RealtimeAnalytics,
  AppConfig,
} from '../types/index.js';
import { HomeScreen } from './HomeScreen.js';
import { WorkCenterScreen } from './WorkCenterScreen.js';
import { ProfileScreen } from './ProfileScreen.js';
import { Navigation, TabType } from './Navigation.js';
import { SplashScreen } from './SplashScreen.js';
import { Capacitor } from '@capacitor/core';

interface AndroidSimulatorProps {
  user: UserProfile;
  token: string;
  onRefreshUser: () => void;
  onSwitchUser: (preset: 'alex' | 'hacker' | 'admin') => void;
  onOpenAuthModal: () => void;
}

export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({
  user,
  token,
  onRefreshUser,
  onSwitchUser,
  onOpenAuthModal,
}) => {
  // Mobile app state
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [profileInitialSection, setProfileInitialSection] = useState<string>('overview');
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [isFullscreen, setIsFullscreen] = useState(Capacitor.isNativePlatform());

  // Realtime Analytics & App Config
  const [analytics, setAnalytics] = useState<RealtimeAnalytics>({
    adsterraTasksCompleted: 1420,
    adsterraTasksRemaining: 3580,
    activeAdsterraCampaigns: 48,
    bloggerTasksCompleted: 2190,
    bloggerTasksRemaining: 5810,
    activeBloggerCampaigns: 32,
    onlineMembersCount: 68,
  });

  const [config, setConfig] = useState<AppConfig>({
    minimumDailyTasksRequired: 5,
    enforceDailyTaskRequirement: true,
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
    campaignPackages: [],
  });

  // Attack simulator state
  const [attackTesting, setAttackTesting] = useState(false);
  const [lastAttackResult, setLastAttackResult] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  // Ledger state
  const [recentTransactions, setRecentTransactions] = useState<PointsTransaction[]>([]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/realtime/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.analytics) setAnalytics(data.analytics);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/app/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/ledger/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setRecentTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchConfig();
    fetchLedger();

    // Live continuous polling so Home Screen metrics and balance update in real time
    const liveTimer = setInterval(() => {
      fetchAnalytics();
      fetchLedger();
      if (typeof onRefreshUser === 'function') {
        onRefreshUser();
      }
    }, 3500);

    return () => clearInterval(liveTimer);
  }, [user.userId, token]);

  // -------------------------------------------------------------
  // ATTACK SIMULATOR (Anti-Fraud Server-Authoritative Gate Tests)
  // -------------------------------------------------------------
  const triggerAttack = async (type: string) => {
    setAttackTesting(true);
    setLastAttackResult(null);

    let payload: any = {
      taskSessionId: 'sess_init_alex_01',
      verificationToken: 'forged_token_attack',
      idempotencyKey: `idem_attack_${crypto.randomUUID()}`,
      deviceId: 'dev_pixel8_pro_993',
      clientTimeElapsedMs: 150,
      attackType: type,
    };

    if (type === 'IMPOSSIBLE_SPEED') {
      try {
        const startRes = await fetch('/api/tasks/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ taskId: 'task_adsterra_impression', deviceId: 'dev_pixel8_pro_993' }),
        });
        const startData = await startRes.json();
        if (!startRes.ok) {
          setAttackTesting(false);
          setLastAttackResult({
            type: 'error',
            title: 'Task Start Blocked',
            message: startData.message || 'Cannot start session',
          });
          return;
        }
        payload.taskSessionId = startData.taskSessionId;
        payload.verificationToken = startData.verificationToken;
        payload.clientTimeElapsedMs = 150; // 150ms instead of 10,000ms!
      } catch (err: any) {
        setAttackTesting(false);
        setLastAttackResult({ type: 'error', title: 'Network Error', message: err.message });
        return;
      }
    } else if (type === 'REPLAY_ATTACK') {
      payload.taskSessionId = 'sess_init_alex_01';
      payload.verificationToken = 'forged_reuse_token';
    } else if (type === 'IDEMPOTENCY_REPLAY') {
      payload.idempotencyKey = 'idem_seed_alex_001';
      payload.taskSessionId = 'sess_init_alex_01';
    } else if (type === 'TOKEN_TAMPER') {
      payload.taskSessionId = 'sess_active_alex_02';
      payload.verificationToken = 'tampered_signature_9999999999999999';
    } else if (type === 'ROOTED_DEVICE') {
      payload.taskSessionId = 'sess_active_alex_02';
      payload.appIntegrityToken = 'ROOTED_TAMPERED';
    }

    try {
      const res = await fetch('/api/tasks/session/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = { message: await res.text() };
      }
      setAttackTesting(false);

      if (data.idempotentReplay) {
        setLastAttackResult({
          type: 'warning',
          title: 'Idempotency Protection Active!',
          message:
            'The backend detected duplicate submission with existing idempotencyKey. It returned the existing transaction safely without crediting duplicate points!',
          details: `Transaction ID: ${data.transaction.id}`,
        });
      } else if (!res.ok) {
        setLastAttackResult({
          type: 'error',
          title: `Server Blocked: ${data.error || 'Fraud Detected'}`,
          message: data.message,
          details: `HTTP ${res.status} • Security Audit Event Logged • Risk Score Escalated`,
        });
        onRefreshUser();
      } else {
        setLastAttackResult({
          type: 'success',
          title: 'Action Succeeded',
          message: data.message,
        });
      }
    } catch (e: any) {
      setAttackTesting(false);
      setLastAttackResult({ type: 'error', title: 'Error', message: e.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Notice */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-800/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">VexoraX — Android App &amp; Security Lab</h2>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                v1.0.0 (API 35/36)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Production-ready reward, task, 8-link management, campaign rotator &amp; server anti-fraud engine.
            </p>
          </div>
        </div>

        {/* Persona quick switch & View Mode */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl text-xs">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            title="Toggle Fullscreen Native Layout"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-purple-400" /> : <Maximize2 className="w-3.5 h-3.5 text-purple-400" />}
            <span className="text-xs font-semibold">{isFullscreen ? 'Chassis Mode' : 'Full Screen'}</span>
          </button>
          <span className="text-slate-400 pl-1 font-medium hidden sm:inline">Active Persona:</span>
          <button
            onClick={() => onSwitchUser('alex')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user.email.includes('alex')
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Alex (Legitimate)
          </button>
          <button
            onClick={() => onSwitchUser('hacker')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user.email.includes('bot')
                ? 'bg-rose-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bot Farmer (Suspicious)
          </button>
          <button
            onClick={() => onSwitchUser('admin')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user.email.includes('admin') || user.email === 'samiyasifa221@gmail.com'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Main Dual-Column: Left = Interactive Phone Frame, Right = Anti-Fraud Attack Lab & Live Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* ANDROID DEVICE CHASSIS (LEFT COLUMN - 7 COLS) */}
        {/* ========================================================================= */}
        <div className={`mx-auto w-full flex justify-center ${isFullscreen ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
          <div className={isFullscreen || Capacitor.isNativePlatform() 
            ? "relative w-full max-w-md bg-slate-950 rounded-3xl p-1.5 shadow-2xl border border-slate-800"
            : "relative w-full max-w-[420px] bg-slate-950 rounded-[44px] p-3 shadow-2xl shadow-purple-950/30 border-4 border-slate-800"}>
            
            {/* Outer Bezel & Speaker / Camera Notch only on chassis mode */}
            {!isFullscreen && !Capacitor.isNativePlatform() && (
              <>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-2 z-30 pointer-events-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800"></div>
                  <div className="w-10 h-1.5 rounded-full bg-slate-800"></div>
                </div>

                {/* Android Device Status Bar */}
                <div className="h-6 bg-slate-950 rounded-t-[36px] flex items-center justify-between px-6 pt-1 text-[11px] text-slate-400 font-medium select-none z-20">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-purple-400">5G</span>
                    <span className="text-[10px]">100%</span>
                  </div>
                </div>
              </>
            )}

            {/* Screen Viewport Container */}
            <div className={`relative w-full bg-slate-950 overflow-hidden flex flex-col border border-slate-800/80 ${
              isFullscreen || Capacitor.isNativePlatform() ? 'rounded-2xl min-h-[720px]' : 'h-[760px] rounded-[34px]'
            }`}>
              {showSplash ? (
                <SplashScreen onComplete={() => setShowSplash(false)} lang={lang} />
              ) : (
                <>
                  {/* Screen Content depending on Bottom Nav Tab */}
                  <div className="flex-1 overflow-y-auto pb-24 scrollbar-thin scrollbar-thumb-purple-900/50">
                    {currentTab === 'home' && (
                      <HomeScreen
                        user={user}
                        analytics={analytics}
                        config={config}
                        lang={lang}
                        onLanguageChange={(newLang) => setLang(newLang)}
                        onNavigateWorkCenter={() => setCurrentTab('workcenter')}
                        onNavigateProfileSection={(sec) => {
                          setProfileInitialSection(sec);
                          setCurrentTab('profile');
                        }}
                        onBuyCoinClick={() => {
                          setProfileInitialSection('coins');
                          setCurrentTab('profile');
                        }}
                        onRefreshData={() => {
                          onRefreshUser();
                          fetchAnalytics();
                        }}
                      />
                    )}

                    {currentTab === 'workcenter' && (
                      <WorkCenterScreen
                        user={user}
                        token={token}
                        lang={lang}
                        onRefreshUser={() => {
                          onRefreshUser();
                          fetchLedger();
                        }}
                      />
                    )}

                    {currentTab === 'profile' && (
                      <ProfileScreen
                        user={user}
                        token={token}
                        config={config}
                        lang={lang}
                        initialSection={profileInitialSection}
                        onLanguageChange={(newLang) => setLang(newLang)}
                        onRefreshUser={() => {
                          onRefreshUser();
                          fetchLedger();
                        }}
                        onLogout={() => setShowSplash(true)}
                        onOpenAdminPanel={onOpenAuthModal}
                      />
                    )}
                  </div>

                  {/* Android 3-Section Bottom Navigation with Big Purple Center Button */}
                  <Navigation
                    currentTab={currentTab}
                    onTabChange={(tab: TabType) => setCurrentTab(tab)}
                    lang={lang}
                  />
                </>
              )}
            </div>

            {/* Phone Home Bar Pill */}
            {!isFullscreen && !Capacitor.isNativePlatform() && (
              <div className="h-5 flex items-center justify-center pt-1">
                <div className="w-32 h-1 bg-slate-700/80 rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ATTACK LAB & REAL-TIME LEDGER (RIGHT COLUMN - hidden on native) */}
        {/* ========================================================================= */}
        {!Capacitor.isNativePlatform() && (
          <div className={`space-y-5 ${isFullscreen ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
          {/* Attack Simulator Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Anti-Fraud &amp; Attack Lab</h3>
                  <p className="text-[11px] text-slate-400">Section 30: Server-Authoritative Verification</p>
                </div>
              </div>
              <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                Live Intercept
              </span>
            </div>

            <p className="text-xs text-slate-300">
              The client app is <strong className="text-rose-400">never trusted</strong>. Click each attack below to
              dispatch spoofed requests directly against the live backend API:
            </p>

            {/* Attack Trigger Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                disabled={attackTesting}
                onClick={() => triggerAttack('IMPOSSIBLE_SPEED')}
                className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group hover:border-rose-500/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400">
                    Impossible Speed
                  </span>
                  <Clock className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400" />
                </div>
                <p className="text-[10px] text-slate-400">Submit a 12s task in 150ms</p>
              </button>

              <button
                disabled={attackTesting}
                onClick={() => triggerAttack('REPLAY_ATTACK')}
                className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group hover:border-amber-500/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
                    Replay Attack
                  </span>
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                </div>
                <p className="text-[10px] text-slate-400">Re-submit used session token</p>
              </button>

              <button
                disabled={attackTesting}
                onClick={() => triggerAttack('IDEMPOTENCY_REPLAY')}
                className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group hover:border-indigo-500/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
                    Duplicate Ledger Key
                  </span>
                  <Layers className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                </div>
                <p className="text-[10px] text-slate-400">Test double-credit prevention</p>
              </button>

              <button
                disabled={attackTesting}
                onClick={() => triggerAttack('TOKEN_TAMPER')}
                className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group hover:border-purple-500/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-purple-400">
                    Token Tampering
                  </span>
                  <Lock className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
                </div>
                <p className="text-[10px] text-slate-400">HMAC cryptographic corruption</p>
              </button>

              <button
                disabled={attackTesting}
                onClick={() => triggerAttack('ROOTED_DEVICE')}
                className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-left transition-all group hover:border-rose-500/50 sm:col-span-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400">
                    Rooted Device / Play Integrity Bypass
                  </span>
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400" />
                </div>
                <p className="text-[10px] text-slate-400">Hardware attestation failure &amp; binary patch detection</p>
              </button>
            </div>

            {/* Attack Feedback Box */}
            {lastAttackResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                  lastAttackResult.type === 'error'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                    : lastAttackResult.type === 'warning'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {lastAttackResult.type === 'error' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : lastAttackResult.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>{lastAttackResult.title}</span>
                </div>
                <p className="text-[11px] opacity-90">{lastAttackResult.message}</p>
                {lastAttackResult.details && (
                  <p className="text-[10px] font-mono opacity-75">{lastAttackResult.details}</p>
                )}
              </div>
            )}
          </div>

          {/* Real-time Ledger Stream */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Immutable Points Ledger</h3>
              </div>
              <button
                onClick={fetchLedger}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-850/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{tx.description}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      ID: {tx.id.slice(0, 14)}... • {new Date(tx.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div
                    className={`font-black ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Android Client Architecture Spec */}
          <div className="bg-purple-950/20 border border-purple-900/30 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <Info className="w-4 h-4" />
              <span>Android MVVM Architecture Ready</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kotlin Coroutines, StateFlow, Room DB, and Firebase Authentication central state machine are fully
              exported in the <strong>Android Build &amp; Architecture</strong> tab for direct APK / AAB compilation!
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
