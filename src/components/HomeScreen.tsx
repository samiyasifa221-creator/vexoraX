import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Coins,
  Users,
  Flame,
  Globe,
  Share2,
  Code,
  HelpCircle,
  Gift,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Play,
  Layers,
  Radio,
  Target,
  Zap,
} from 'lucide-react';
import { UserProfile, RealtimeAnalytics, SupportedLanguage, AppConfig } from '../types/index.js';
import { translations } from '../utils/i18n.js';

interface HomeScreenProps {
  user: UserProfile;
  analytics: RealtimeAnalytics;
  config: AppConfig;
  lang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onNavigateWorkCenter: () => void;
  onNavigateProfileSection: (section: string) => void;
  onBuyCoinClick: () => void;
  onRefreshData: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  analytics,
  config,
  lang,
  onLanguageChange,
  onNavigateWorkCenter,
  onNavigateProfileSection,
  onBuyCoinClick,
}) => {
  const t = translations[lang];

  // Live community activity events (simulating live active members)
  const [liveEvents, setLiveEvents] = useState([
    { id: 1, text: 'Alex V. earned +30 Points watching community ad', time: '3s ago', type: 'earn' },
    { id: 2, text: 'Sarah J. launched 50 Impressions campaign for Adsterra', time: '14s ago', type: 'camp' },
    { id: 3, text: 'Karim R. completed 20s ad view (+30 pts credited)', time: '28s ago', type: 'earn' },
    { id: 4, text: 'Tanvir H. started 100 Impressions campaign (100 Pts)', time: '45s ago', type: 'camp' },
  ]);

  useEffect(() => {
    const eventTemplates = [
      { text: 'Priya S. earned +30 Points watching verified ad', type: 'earn' },
      { text: 'David K. launched 50 Impressions campaign (50 Pts)', type: 'camp' },
      { text: 'Elena R. watched 20s ad view (+30 pts to ledger)', type: 'earn' },
      { text: 'Rahul M. launched 150 Impressions campaign (150 Pts)', type: 'camp' },
      { text: 'Samir B. earned +30 Points (Adsterra 20s stream)', type: 'earn' },
      { text: 'Fatima Z. started 200 Impressions campaign (200 Pts)', type: 'camp' },
    ];

    const timer = setInterval(() => {
      const randomEvent = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      setLiveEvents((prev) => [
        { id: Date.now(), text: randomEvent.text, time: 'Just now', type: randomEvent.type },
        ...prev.slice(0, 3).map((e, idx) => ({ ...e, time: `${(idx + 1) * 15}s ago` })),
      ]);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Adsterra progress
  const adsterraTotal = analytics.adsterraTasksCompleted + analytics.adsterraTasksRemaining;
  const adsterraProgress = Math.round((analytics.adsterraTasksCompleted / (adsterraTotal || 1)) * 100);

  // Blogger progress
  const bloggerTotal = analytics.bloggerTasksCompleted + analytics.bloggerTasksRemaining;
  const bloggerProgress = Math.round((analytics.bloggerTasksCompleted / (bloggerTotal || 1)) * 100);

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* 5. Header: Welcome Back & User Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user.avatarUrl || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user.displayName}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-500/50 shadow-md shadow-purple-900/30"
            />
            {user.online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
            )}
          </div>
          <div>
            <div className="text-xs text-purple-300/80 font-medium">{t.welcomeBack}</div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">{user.displayName || user.name}</h2>
              {user.isPremium && (
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 px-2 py-0.5 rounded-full font-black tracking-wider uppercase shadow-sm">
                  {t.premiumUser}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-purple-900/40 p-1 rounded-xl">
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'en' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => onLanguageChange('bn')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === 'bn' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            বাংলা
          </button>
        </div>
      </div>

      {/* 5. Large Balance Card (Live Real-Time) */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 border border-purple-500/40 shadow-2xl relative overflow-hidden group">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/30 transition-colors"></div>

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              {lang === 'bn' ? 'লাইভ সার্ভার সক্রিয়' : 'Live Realtime System'}
            </span>
          </div>

          <div className="text-[10px] text-purple-300 font-mono">
            {lang === 'bn' ? 'প্রতি অ্যাড: +৩০ পয়েন্ট' : '30 Pts / Ad View'}
          </div>
        </div>

        <div className="flex items-start justify-between relative z-10 mb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300/90">{t.yourBalance}</span>
            <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2 mt-0.5">
              <span>{(user.pointsBalance ?? user.points).toLocaleString()}</span>
              <span className="text-sm font-sans font-bold text-purple-300">{t.points}</span>
            </div>
          </div>

          {/* Buy Coin Button */}
          {config.quickActions?.buyCoin && (
            <button
              onClick={onBuyCoinClick}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Coins className="w-3.5 h-3.5 fill-current" />
              {t.buyCoin}
            </button>
          )}
        </div>

        {/* Bottom strip: Coins & Online Members (Dynamic Live) */}
        <div className="pt-3 border-t border-purple-800/50 flex items-center justify-between text-xs relative z-10">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{(user.coinsBalance ?? user.coins).toLocaleString()} {t.coins}</span>
          </div>

          <div className="flex items-center gap-2 text-purple-200/90 bg-purple-950/60 border border-purple-700/40 px-2.5 py-1 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-xs">
              {t.onlineMembers}: <strong className="text-white font-bold font-mono">{analytics.onlineMembersCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 5.5 NEW: Campaign Quick Launcher (৫০ পয়েন্ট দিয়ে ৫০, ১০০, ১৫০, ২০০ ইমপ্রেশন) */}
      <div className="p-4 rounded-3xl bg-slate-900/95 border border-purple-800/50 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                {lang === 'bn' ? '৫০ পয়েন্ট দিয়ে ক্যাম্পেইন ইমপ্রেশন' : 'Launch Campaign with Points'}
              </h3>
              <p className="text-[11px] text-purple-300">
                {lang === 'bn'
                  ? '৫০ পয়েন্টে ৫০ ইমপ্রেশন নিন (এছাড়াও ১০০, ১৫০, ২০০ ইমপ্রেশন)'
                  : '50 Pts gives 50 Impressions (also 100, 150, 200 packages)'}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
            1 Pt = 1 Imp
          </span>
        </div>

        {/* 4 Packages: 50, 100, 150, 200 Impressions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { views: 50, pts: 50, label: '50 Views', popular: false },
            { views: 100, pts: 100, label: '100 Views', popular: true },
            { views: 150, pts: 150, label: '150 Views', popular: false },
            { views: 200, pts: 200, label: '200 Views', popular: false },
          ].map((pkg) => (
            <button
              key={pkg.views}
              onClick={() => onNavigateProfileSection('campaign')}
              className={`p-2.5 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between ${
                pkg.popular
                  ? 'bg-gradient-to-br from-purple-950 to-indigo-950 border-purple-500/60 shadow-md shadow-purple-900/30'
                  : 'bg-slate-950/80 border-purple-900/40 hover:border-purple-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-white">{pkg.views} Imp</span>
                {pkg.popular && (
                  <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold uppercase">
                    HOT
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono font-bold text-amber-400">
                {pkg.pts} {t.points}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigateProfileSection('campaign')}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{lang === 'bn' ? '৫০ পয়েন্ট দিয়ে ক্যাম্পেইন তৈরি করুন' : 'Launch Campaign (From 50 Points)'}</span>
        </button>
      </div>

      {/* 6. Four Real-time Analytics Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* CARD 1: Adsterra Task */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">{t.card1Title}</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-base font-extrabold text-white">
              {analytics.adsterraTasksCompleted} <span className="text-xs text-slate-400 font-normal">/ {adsterraTotal}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {t.remainingTasks}: {analytics.adsterraTasksRemaining}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${adsterraProgress}%` }}
            ></div>
          </div>
        </div>

        {/* CARD 2: Active Adsterra Campaigns */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{t.card2Title}</span>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300 font-mono">
              {analytics.activeAdsterraCampaigns}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t.activeCampaigns}</div>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Realtime Verified Traffic
          </div>
        </div>

        {/* CARD 3: Blogger Task */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">{t.card3Title}</span>
              <Globe className="w-3.5 h-3.5 text-fuchsia-400" />
            </div>
            <div className="text-base font-extrabold text-white">
              {analytics.bloggerTasksCompleted} <span className="text-xs text-slate-400 font-normal">/ {bloggerTotal}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {t.remainingTasks}: {analytics.bloggerTasksRemaining}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${bloggerProgress}%` }}
            ></div>
          </div>
        </div>

        {/* CARD 4: Active Blogger Campaigns */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">{t.card4Title}</span>
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {analytics.activeBloggerCampaigns}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t.activeCampaigns}</div>
          </div>
          <div className="text-[10px] text-purple-300 font-medium flex items-center gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Fair Rotation Active
          </div>
        </div>
      </div>

      {/* 7. Home Primary Call-to-Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onNavigateWorkCenter}
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white font-extrabold text-sm flex items-center justify-between shadow-xl shadow-purple-900/30 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
            <div className="text-left">
              <div>{t.startEarning}</div>
              <div className="text-[10px] text-amber-300 font-mono font-bold">
                {lang === 'bn' ? 'প্রতি অ্যাড: +৩০ পয়েন্ট' : '+30 Pts per Ad View'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => onNavigateProfileSection('links')}
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-purple-800/50 text-purple-200 font-extrabold text-sm flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-900/50 flex items-center justify-center text-purple-300">
              <Globe className="w-4 h-4" />
            </div>
            <span>{t.joinAdNetwork}</span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-purple-400" />
        </button>
      </div>

      {/* 7.5 LIVE Community Activity Stream */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{lang === 'bn' ? 'লাইভ মেম্বার এক্টিভিটি ফিড' : 'Live Community Activity Stream'}</span>
          </div>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
            Realtime Verified
          </span>
        </div>

        <div className="space-y-1.5">
          {liveEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-2 rounded-xl bg-slate-950/70 border border-purple-950 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-300"
            >
              <div className="flex items-center gap-2 truncate">
                {evt.type === 'earn' ? (
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
                <span className="text-slate-300 text-[11px] truncate">{evt.text}</span>
              </div>
              <span className="text-[10px] text-purple-300/80 font-mono shrink-0 ml-2">{evt.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Sub Quick Actions: Rewards, API, Refer, Support */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-purple-900/30 space-y-3">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Services</div>
        <div className="grid grid-cols-4 gap-2">
          {config.quickActions?.rewards && (
            <button
              onClick={() => onNavigateProfileSection('rewards')}
              className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-purple-900/30 flex flex-col items-center gap-1.5 transition-all"
            >
              <Gift className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-semibold text-slate-300">{t.rewards}</span>
            </button>
          )}

          {config.quickActions?.api && (
            <button
              onClick={() => onNavigateProfileSection('api')}
              className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-purple-900/30 flex flex-col items-center gap-1.5 transition-all"
            >
              <Code className="w-5 h-5 text-cyan-400" />
              <span className="text-[11px] font-semibold text-slate-300">{t.api}</span>
            </button>
          )}

          {config.quickActions?.refer && (
            <button
              onClick={() => onNavigateProfileSection('refer')}
              className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-purple-900/30 flex flex-col items-center gap-1.5 transition-all"
            >
              <Share2 className="w-5 h-5 text-fuchsia-400" />
              <span className="text-[11px] font-semibold text-slate-300">{t.refer}</span>
            </button>
          )}

          {config.quickActions?.support && (
            <button
              onClick={() => onNavigateProfileSection('support')}
              className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-purple-900/30 flex flex-col items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-300">{t.support}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
