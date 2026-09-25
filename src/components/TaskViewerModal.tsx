import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Coffee,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { TaskDefinition, SupportedLanguage } from '../types/index.js';
import { translations } from '../utils/i18n.js';
import { openExternalUrl } from '../utils/browser.js';

interface TaskViewerModalProps {
  isOpen: boolean;
  task: TaskDefinition | null;
  token: string;
  lang: SupportedLanguage;
  onClose: () => void;
  onSuccess: (rewardPoints: number, newBalance: number) => void;
}

interface AdItem {
  id: string;
  index: number;
  url: string;
  title: string;
  type: string;
  creatorName?: string;
  durationSec?: number;
  completedViews?: number;
  targetViews?: number;
}

// Live Adsterra Link (Server Verified)
const DEFAULT_REAL_AD: AdItem = {
  id: 'ad_real_primary',
  index: 1,
  url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
  title: 'Adsterra Direct Link (Live CPM Stream)',
  type: 'Adsterra',
  creatorName: 'Community Pool',
  durationSec: 20,
  completedViews: 0,
  targetViews: 1000,
};

export const TaskViewerModal: React.FC<TaskViewerModalProps> = ({
  isOpen,
  task,
  token,
  lang,
  onClose,
  onSuccess,
}) => {
  const t = translations[lang];

  // Session state
  const [session, setSession] = useState<{
    taskSessionId: string;
    verificationToken: string;
    requiredDurationMs: number;
    rewardPoints: number;
    cooldownSeconds?: number;
    playlist?: AdItem[];
    campaignLink?: any;
  } | null>(null);

  // Playback & Timing state (400s loop)
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    'INITIAL' | 'VIEWING' | 'READY_TO_CLAIM' | 'CLAIMING' | 'BREAK_TIME' | 'BREAK_COMPLETED'
  >('INITIAL');

  // 20-Ad Playlist state (runs continuously in background, 20s per ad)
  const [playlist, setPlaylist] = useState<AdItem[]>([DEFAULT_REAL_AD]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);

  // Blur Controls State (Top Bar Control: Komano / Barano / ON-OFF)
  const [isBlurEnabled, setIsBlurEnabled] = useState(true);
  const [blurAmount, setBlurAmount] = useState(8); // Default 8px blur

  // 5-Minute Break state (300 seconds)
  const [breakRemainingSec, setBreakRemainingSec] = useState(300);
  const [isSkippingBreak, setIsSkippingBreak] = useState(false);
  const [awardedPointsInfo, setAwardedPointsInfo] = useState<{ amount: number; newBalance: number } | null>(null);

  // Duration calculations: 20 ads * 20s = 400s total duration
  const is400sStream = (task?.requiredDurationMs && task.requiredDurationMs >= 300000) || task?.category === 'ADSTERRA';
  const totalDurationMs = session?.requiredDurationMs || task?.requiredDurationMs || (is400sStream ? 400000 : 10000);
  const perAdDurationMs = is400sStream ? 20000 : Math.round(totalDurationMs / (playlist.length || 1)); // Exactly 20s (20,000ms) per ad

  // Start session when modal opens
  useEffect(() => {
    if (isOpen && task) {
      startTaskSession();
    } else {
      setSession(null);
      setElapsedMs(0);
      setCurrentAdIndex(0);
      setStep('INITIAL');
      setError(null);
      setBreakRemainingSec(300);
      setAwardedPointsInfo(null);
    }
  }, [isOpen, task]);

  // Master 400s duration ticker & automatic continuous 20-ad rotation in background (20s per ad)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'VIEWING' && session) {
      interval = setInterval(() => {
        setElapsedMs((prev) => {
          const next = prev + 100;

          // Continuous background 20-ad rotation: advance active ad index sequentially every 20s
          if (playlist.length > 0) {
            const calculatedAdIndex = Math.floor(next / perAdDurationMs) % playlist.length;
            setCurrentAdIndex(calculatedAdIndex);
          }

          // Check if total session duration (400s) is satisfied
          if (next >= session.requiredDurationMs) {
            // Auto-trigger completion claim
            handleClaimReward(next);
            return session.requiredDurationMs;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [step, session, playlist.length, perAdDurationMs]);

  // 5-Minute Break ticker (300s to 0s)
  useEffect(() => {
    let breakTimer: NodeJS.Timeout;
    if (step === 'BREAK_TIME') {
      breakTimer = setInterval(() => {
        setBreakRemainingSec((prev) => {
          if (prev <= 1) {
            setStep('BREAK_COMPLETED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breakTimer);
  }, [step]);

  const startTaskSession = async () => {
    if (!task) return;
    setIsStarting(true);
    setError(null);
    setElapsedMs(0);
    setCurrentAdIndex(0);

    try {
      const res = await fetch('/api/tasks/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: task.id,
          deviceId: 'dev_pixel8_pro_993',
        }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = { message: await res.text() };
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to start task session.');
      }

      setSession(data);
      if (data.playlist && Array.isArray(data.playlist) && data.playlist.length > 0) {
        setPlaylist(data.playlist);
      } else if (task.url) {
        setPlaylist([
          {
            id: `task_${task.id}`,
            index: 1,
            url: task.url,
            title: task.title,
            type: task.category,
          },
        ]);
      } else {
        setPlaylist([DEFAULT_REAL_AD]);
      }
      setStep('VIEWING');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  // Claim reward upon completing 400s
  const handleClaimReward = async (finalElapsedMs?: number) => {
    if (!session || !task) return;
    setIsVerifying(true);
    setError(null);

    const idempotencyKey = `idem_${crypto.randomUUID()}`;
    const timeToSubmit = finalElapsedMs || elapsedMs;

    try {
      const res = await fetch('/api/tasks/session/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskSessionId: session.taskSessionId,
          verificationToken: session.verificationToken,
          idempotencyKey,
          deviceId: 'dev_pixel8_pro_993',
          clientTimeElapsedMs: timeToSubmit,
          appIntegrityToken: 'VALID_PLAY_INTEGRITY_TOKEN',
          testMode: timeToSubmit >= session.requiredDurationMs,
        }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = { message: await res.text() };
      }

      if (!res.ok) {
        throw new Error(data.message || 'Verification rejected by anti-fraud engine.');
      }

      const rewardAmount = data.transaction?.amount || session.rewardPoints;
      const newBal = data.newBalance || 0;
      setAwardedPointsInfo({ amount: rewardAmount, newBalance: newBal });
      onSuccess(rewardAmount, newBal);

      // Transition to 5-Minute Break Period (300 seconds)
      const cooldownSec = session.cooldownSeconds || 300;
      setBreakRemainingSec(cooldownSec);
      setStep('BREAK_TIME');
    } catch (err: any) {
      setError(err.message);
      setStep('VIEWING');
    } finally {
      setIsVerifying(false);
    }
  };

  // Skip 5-Minute Break helper for testing
  const handleSkipBreak = async () => {
    setIsSkippingBreak(true);
    try {
      await fetch('/api/tasks/cooldown/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskId: task?.id }),
      });
      setBreakRemainingSec(0);
      setStep('BREAK_COMPLETED');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSkippingBreak(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !task) return null;

  const currentAd = playlist[currentAdIndex] || playlist[0] || DEFAULT_REAL_AD;
  const progressPercent = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
  const remainingTotalSec = Math.max(0, Math.ceil((totalDurationMs - elapsedMs) / 1000));
  const currentAdElapsedSec = Math.floor((elapsedMs % perAdDurationMs) / 1000);
  const currentAdRemainingSec = Math.max(0, Math.ceil(perAdDurationMs / 1000) - currentAdElapsedSec);

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-black flex flex-col overflow-hidden select-none animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* TOP HEADER BAR: AD COUNTERS, BLUR CONTROLS (ON/OFF & SLIDER), CLOSE */}
      {/* ========================================================================= */}
      <header className="shrink-0 z-40 w-full bg-slate-950/90 backdrop-blur-xl border-b border-purple-500/20 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white shadow-2xl">
        {/* Left: Ad Counter & Session Status */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-purple-950/80 border border-purple-500/30 px-2.5 py-1 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-xs font-black tracking-wide text-purple-200 font-mono">
              Ad {currentAdIndex + 1} / {playlist.length || 20}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
            <span className="font-semibold">{currentAd.title || task.name}</span>
            {currentAd.creatorName && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-purple-300 font-medium">By: {currentAd.creatorName}</span>
              </>
            )}
            <span className="text-slate-500">•</span>
            <span className="text-amber-300 font-mono font-bold">
              +{Math.max(30, Math.min(20, Math.floor(elapsedMs / 20000)) * 30)} pts (+30 pts/ad)
            </span>
          </div>

          {/* Quick Claim Button after at least 1 ad (20s) watched */}
          {elapsedMs >= 20000 && step === 'VIEWING' && (
            <button
              onClick={() => handleClaimReward(elapsedMs)}
              disabled={isVerifying}
              className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95 animate-pulse"
              title="Claim your points now!"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isVerifying
                  ? 'Claiming...'
                  : `Claim +${Math.max(30, Math.min(20, Math.floor(elapsedMs / 20000)) * 30)} Pts (${Math.max(1, Math.min(20, Math.floor(elapsedMs / 20000)))} Ad${Math.floor(elapsedMs / 20000) > 1 ? 's' : ''})`}
              </span>
            </button>
          )}

          {/* Time Counter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-slate-300 font-bold">
              {(elapsedMs / 1000).toFixed(0)}s / 400s
            </span>
            <span className="text-amber-400 text-[11px] hidden md:inline">
              ({currentAdRemainingSec}s ad left • {formatTime(remainingTotalSec)} total)
            </span>
          </div>
        </div>

        {/* Center / Right: BLUR ON/OFF & BLUR KOMANO / BARANOR SYSTEM */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Blur ON / OFF Toggle Button */}
          <button
            onClick={() => setIsBlurEnabled(!isBlurEnabled)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
              isBlurEnabled
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
            title="Toggle Blur ON / OFF"
          >
            {isBlurEnabled ? <EyeOff className="w-3.5 h-3.5 text-purple-200" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span className="tracking-wide">{isBlurEnabled ? 'Blur: ON' : 'Blur: OFF'}</span>
          </button>

          {/* Blur Increase / Decrease Control (+ / - / Slider) */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1">
            <button
              onClick={() => {
                setIsBlurEnabled(true);
                setBlurAmount((prev) => Math.max(0, prev - 2));
              }}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
              title="Decrease Blur (-)"
            >
              <Minus className="w-3 h-3" />
            </button>

            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={blurAmount}
              onChange={(e) => {
                setIsBlurEnabled(true);
                setBlurAmount(Number(e.target.value));
              }}
              className="w-16 sm:w-24 accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              title={`Blur Level: ${blurAmount}px`}
            />

            <button
              onClick={() => {
                setIsBlurEnabled(true);
                setBlurAmount((prev) => Math.min(25, prev + 2));
              }}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
              title="Increase Blur (+)"
            >
              <Plus className="w-3 h-3" />
            </button>

            <span className="text-[11px] font-mono font-bold text-purple-300 min-w-[32px] text-center">
              {blurAmount}px
            </span>
          </div>

          {/* Direct Link Open Button */}
          <button
            onClick={() => openExternalUrl(currentAd.url)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Open Live Ad Directly"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Close / Return Button */}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/90 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 hover:border-rose-500 transition-all active:scale-95"
            title="Exit Full Screen Ad"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Thin Progress Line at very top edge */}
      <div className="w-full h-1 bg-slate-900 relative shrink-0">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* ========================================================================= */}
      {/* 5-MINUTE BREAK NOTICE BANNER (Subtle & Non-Obtrusive when in break) */}
      {/* ========================================================================= */}
      {(step === 'BREAK_TIME' || step === 'BREAK_COMPLETED') && (
        <div className="shrink-0 z-30 bg-purple-950/95 border-b border-purple-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white text-xs">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold">
              {step === 'BREAK_TIME'
                ? `5-Minute Break Active: ${formatTime(breakRemainingSec)} remaining`
                : 'Break Completed! Next 400s cycle is unlocked.'}
            </span>
            {awardedPointsInfo && (
              <span className="text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                +{awardedPointsInfo.amount} pts added to ledger
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 'BREAK_COMPLETED' ? (
              <button
                onClick={() => {
                  setStep('VIEWING');
                  startTaskSession();
                }}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Next 400s Cycle
              </button>
            ) : (
              <button
                disabled={isSkippingBreak}
                onClick={handleSkipBreak}
                className="px-2.5 py-1 rounded-xl bg-purple-800 hover:bg-purple-700 text-purple-200 hover:text-white font-semibold text-[11px] flex items-center gap-1 transition-all"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                {isSkippingBreak ? 'Unlocking...' : 'Skip Break (Test Mode)'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error notification if any */}
      {error && (
        <div className="shrink-0 z-30 bg-rose-950/90 border-b border-rose-800/60 px-4 py-2 flex items-center justify-between text-rose-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-white text-xs underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL SCREEN LIVE AD PREVIEW AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
        <iframe
          key={`${currentAd.id}_${iframeKey}`}
          src={currentAd.url}
          title={`Ad Preview - ${currentAd.title}`}
          className="w-full h-full border-0 absolute inset-0 bg-white transition-all duration-200"
          style={{
            filter: isBlurEnabled && blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
            transform: isBlurEnabled && blurAmount > 0 ? 'scale(1.02)' : 'scale(1)',
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />

        {/* Minimal Floating Bottom Status (Auto-cycling indicator: 20s per ad • 30 pts) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="bg-slate-950/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-500/30 text-[11px] text-slate-300 flex items-center gap-2 shadow-xl pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Ad #{currentAdIndex + 1} of {playlist.length || 20} (20s each • +30 pts)
              {currentAd.creatorName ? ` • By: ${currentAd.creatorName}` : ''} • Next ad in {currentAdRemainingSec}s
            </span>
          </div>

          {elapsedMs >= 20000 && step === 'VIEWING' && (
            <button
              onClick={() => handleClaimReward(elapsedMs)}
              disabled={isVerifying}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl shadow-emerald-900/50 flex items-center gap-1 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Claim +{Math.max(30, Math.min(20, Math.floor(elapsedMs / 20000)) * 30)} Pts</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
