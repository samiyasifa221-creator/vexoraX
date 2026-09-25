import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  ShieldAlert,
  Package,
  Lock,
  Award,
  Sparkles,
  User,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  LogIn,
} from 'lucide-react';
import { UserProfile } from './types/index.js';
import { AndroidSimulator } from './components/AndroidSimulator.js';
import { AdminFraudDashboard } from './components/AdminFraudDashboard.js';
import { AndroidBuildCenter } from './components/AndroidBuildCenter.js';
import { FirebaseRulesViewer } from './components/FirebaseRulesViewer.js';
import { ReleaseChecklist } from './components/ReleaseChecklist.js';
import { AuthModal } from './components/AuthModal.js';
import { Capacitor } from '@capacitor/core';

export default function App() {
  const [activeTab, setActiveTab] = useState<'client' | 'admin' | 'build' | 'rules' | 'checklist'>('client');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize with seed user Alex Vance
  const loginPreset = async (preset: 'alex' | 'hacker' | 'admin') => {
    let email = 'alex.vance@example.com';
    let pass = 'AlexPassword123!';

    if (preset === 'hacker') {
      email = 'bot_farm4@disposable-mail.org';
      pass = 'Hacker123!';
    } else if (preset === 'admin') {
      email = 'samiyasifa221@gmail.com';
      pass = 'AdminPass@2026';
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, deviceId: 'dev_pixel8_pro_993' }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loginPreset('alex');
      setLoading(false);
    };
    init();
  }, []);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-bounce shadow-xl shadow-indigo-600/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="text-sm font-semibold text-slate-300">Initializing VexoraX Security Engine...</div>
        </div>
      </div>
    );
  }

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500/30">
      {/* Top Header Bar (Adaptive for Web Studio / Hidden on Native Android unless toggled) */}
      {!isNative ? (
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo & Platform Tag */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30 border border-purple-400/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-tight text-white">VexoraX</h1>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Android &amp; Anti-Fraud Suite
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">8-Link Fair Rotation • Work Center • Idempotent Points Ledger</p>
              </div>
            </div>

            {/* Persona Switcher & Server Status */}
            <div className="flex items-center gap-3 text-xs">
              {/* Server Status Pill */}
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-slate-300 font-medium">Server Anti-Fraud Gateway:</span>
                <span className="text-[11px] text-emerald-400 font-bold">ACTIVE</span>
              </div>

              {/* Current Active Persona */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt=""
                  className="w-6 h-6 rounded-lg object-cover border border-slate-700"
                />
                <div className="hidden sm:block text-left leading-tight pr-1">
                  <div className="text-[11px] font-bold text-slate-200">{currentUser.displayName}</div>
                  <div className="text-[10px] text-slate-500 font-mono capitalize">{currentUser.role}</div>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  title="Sign In with Custom Account"
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Global Navigation Tabs */}
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('client')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'client'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Android Client &amp; Attack Lab
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Fraud &amp; Risk Dashboard
            </button>

            <button
              onClick={() => setActiveTab('build')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'build'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              Android Build &amp; Architecture
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Lock className="w-4 h-4" />
              Firebase Security Rules
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'checklist'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              Release Checklist (18/18)
            </button>
          </div>
        </header>
      ) : null}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {activeTab === 'client' && (
          <AndroidSimulator
            user={currentUser}
            token={token}
            onRefreshUser={refreshUser}
            onSwitchUser={loginPreset}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminFraudDashboard token={token} onRefreshData={refreshUser} />
        )}

        {activeTab === 'build' && <AndroidBuildCenter token={token} />}

        {activeTab === 'rules' && <FirebaseRulesViewer />}

        {activeTab === 'checklist' && <ReleaseChecklist token={token} />}
      </main>

      {/* Footer (hidden on native Android) */}
      {!isNative && (
        <footer className="bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-400">
          <p>
            VexoraX • Android (API 35/36) • Server-Authoritative Anti-Fraud • 8-Link Rotator • Idempotent Points Ledger
          </p>
        </footer>
      )}

      {/* Custom Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newToken, newUser) => {
          setToken(newToken);
          setCurrentUser(newUser);
        }}
      />
    </div>
  );
}
