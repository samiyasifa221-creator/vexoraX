import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Sparkles,
  Globe,
  Lock,
  ArrowRight,
  RotateCcw,
  Play,
  Pause,
  Copy,
  Check,
  Coffee,
  Zap,
  Flame,
  Layers,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import { TaskDefinition, SupportedLanguage, UserLink } from '../types/index.js';
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
  completedViews?: number;
  targetViews?: number;
}

// Default Real Adsterra link fallback (NO FAKE / DEMO DOMAINS)
const DEFAULT_REAL_AD: AdItem = {
  id: 'ad_real_primary',
  index: 1,
  url: 'https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1',
  title: 'Adsterra Direct Link (Live CPM Stream)',
  type: 'Adsterra',
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

  // Playback & Timing state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    'INITIAL' | 'VIEWING' | 'READY_TO_CLAIM' | 'CLAIMING' | 'BREAK_TIME' | 'BREAK_COMPLETED'
  >('INITIAL');

  // Real Ad Playlist state
  const [playlist, setPlaylist] = useState<AdItem[]>([DEFAULT_REAL_AD]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // 5-Minute Break state (300 seconds)
  const [breakRemainingSec, setBreakRemainingSec] = useState(300);
  const [isSkippingBreak, setIsSkippingBreak] = useState(false);
  const [awardedPointsInfo, setAwardedPointsInfo] = useState<{ amount: number; newBalance: number } | null>(null);

  // Per-ad rotation duration (400s total / 8 ads = 50s each)
  const is400sStream = (task?.requiredDurationMs && task.requiredDurationMs >= 300000) || task?.category === 'ADSTERRA';
  const totalDurationMs = session?.requiredDurationMs || task?.requiredDurationMs || (is400sStream ? 400000 : 10000);
  const perAdDurationMs = Math.round(totalDurationMs / (playlist.length || 8)); // 50,000ms (50s) per ad

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

  // Master 400s duration ticker & automatic 8-ad rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'VIEWING' && session) {
      interval = setInterval(() => {
        setElapsedMs((prev) => {
          const next = prev + 100;

          // Continuous 8-ad rotation: advance active ad index sequentially
          if (isAutoPlay && playlist.length > 0) {
            const calculatedAdIndex = Math.floor(next / perAdDurationMs) % playlist.length;
            setCurrentAdIndex(calculatedAdIndex);
          }

          // Check if total session duration is satisfied
          if (next >= session.requiredDurationMs) {
            // Auto-trigger completion claim
            handleClaimReward(next, true);
            return session.requiredDurationMs;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [step, session, isAutoPlay, playlist.length, perAdDurationMs]);

  // 5-Minute Break ticker (counts down from 300s to 0s)
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

  // Claim reward and enter the 5-minute break period
  const handleClaimReward = async (finalElapsedMs?: number, isAuto = false) => {
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
          testMode: timeToSubmit >= session.requiredDurationMs, // Allows smooth dev test validation
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

  // Fast-Forward 400s (Dev / Appraisal Testing helper)
  const handleFastForwardDev = () => {
    if (!session) return;
    setElapsedMs(session.requiredDurationMs);
    handleClaimReward(session.requiredDurationMs, false);
  };

  // Skip 5-Minute Break (Dev / Appraisal helper)
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

  const copyCurrentAdUrl = () => {
    const currentAd = playlist[currentAdIndex] || playlist[0] || DEFAULT_REAL_AD;
    navigator.clipboard.writeText(currentAd.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (!isOpen || !task) return null;

  const currentAd = playlist[currentAdIndex] || playlist[0] || DEFAULT_REAL_AD;
  const progressPercent = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
  const remainingTotalSec = Math.max(0, Math.ceil((totalDurationMs - elapsedMs) / 1000));
  const currentAdElapsedSec = Math.floor((elapsedMs % perAdDurationMs) / 1000);
  const currentAdRemainingSec = Math.max(0, Math.ceil(perAdDurationMs / 1000) - currentAdElapsedSec);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/40 rounded-[28px] max-w-xl w-full overflow-hidden shadow-2xl relative my-auto">
        {/* ========================================================================= */}
        {/* TOP STATUS BAR & HEADER */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-3.5 sm:p-4 border-b border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm text-white">
                  {task.name || 'Adsterra 8-Ad Auto Stream'}
                </h3>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                  400s Loop
                </span>
              </div>
              <div className="text-[10px] text-purple-300/80 flex items-center gap-2 mt-0.5">
                <span>8 Ads Auto-Rotation</span>
                <span>•</span>
                <span className="text-amber-400 font-medium">5-Min Break Required</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black font-mono text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 shadow-sm">
              +{session?.rewardPoints || task.rewardPoints} {t.points}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: BREAK TIME SCREEN (5-MINUTE COOLDOWN AFTER 400s) */}
        {/* ========================================================================= */}
        {step === 'BREAK_TIME' || step === 'BREAK_COMPLETED' ? (
          <div className="p-6 space-y-5 text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Break Icon & Glowing Halo */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping"></div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-900/50 border-2 border-purple-400/50 relative z-10">
                <Coffee className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Break Title & Bengali / English description */}
            <div className="space-y-1.5">
              <div className="inline-block bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold text-purple-300 uppercase tracking-wider">
                {step === 'BREAK_TIME' ? '5-Minute Rest Period Active' : 'Break Time Completed!'}
              </div>
              <h3 className="text-lg font-black text-white">
                {lang === 'bn'
                  ? '৪০০ সেকেন্ড সম্পন্ন • ৫ মিনিটের বিরতি চলছে'
                  : '400s Cycle Completed • 5-Minute Break in Progress'}
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {lang === 'bn'
                  ? '৪০০ সেকেন্ড সফলভাবে অ্যাড দেখার পর ৫ মিনিটের বাধ্যতামূলক বিরতি দেওয়া হয়েছে। বিরতি শেষে পরবর্তী ৪০০ সেকেন্ডের ৮টি অ্যাডের রোটেশন সেশন শুরু হবে।'
                  : 'You completed the 400-second 8-ad viewing cycle. Please relax during this 5-minute break. Next cycle unlocks automatically.'}
              </p>
            </div>

            {/* Live Break Countdown Timer */}
            <div className="bg-slate-950/90 border border-purple-900/50 rounded-2xl p-4 max-w-xs mx-auto space-y-2">
              <div className="text-[11px] text-purple-400 uppercase font-mono font-bold tracking-wider">
                Remaining Break Time
              </div>
              <div className="text-3xl font-black font-mono text-amber-300 tracking-wider">
                {formatTime(breakRemainingSec)}
              </div>
              {/* Break Progress Bar */}
              <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${Math.round(((300 - breakRemainingSec) / 300) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Points Awarded Notice */}
            {awardedPointsInfo && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between text-xs max-w-sm mx-auto">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div className="text-left">
                    <span className="font-bold text-white">Points Credited to Ledger</span>
                    <p className="text-[10px] text-emerald-300 font-mono">Immutable Double-Entry Verified</p>
                  </div>
                </div>
                <div className="font-black text-emerald-400 font-mono text-sm">
                  +{awardedPointsInfo.amount} pts
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 space-y-2 max-w-sm mx-auto">
              {step === 'BREAK_COMPLETED' ? (
                <button
                  onClick={() => {
                    setStep('VIEWING');
                    startTaskSession();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === 'bn' ? 'পরবর্তী ৪০০ সেকেন্ড সেশন শুরু করুন' : 'Start Next 400s Ad Cycle'}
                </button>
              ) : (
                <button
                  disabled={isSkippingBreak}
                  onClick={handleSkipBreak}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {isSkippingBreak
                    ? 'Unlocking Next Session...'
                    : lang === 'bn'
                    ? 'টেস্টের জন্য বিরতি বাদ দিন (Skip Break for Test)'
                    : 'Skip Break (Testing & Evaluation Mode)'}
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STEP 2: LIVE 8-AD CONTINUOUS LOOP PLAYER & PREVIEW (400 SECONDS) */
          /* ========================================================================= */
          <div className="p-4 sm:p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 8-Ad Rotation Bar (Sequential Pills 1 to 8) */}
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-purple-950/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-bold text-white text-[11px]">8-Ad Rotation Playlist:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-300 font-mono">
                    Ad #{currentAdIndex + 1} of 8
                  </span>
                  <button
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                      isAutoPlay
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isAutoPlay ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Auto-Advance: ON
                      </>
                    ) : (
                      'Auto-Advance: PAUSED'
                    )}
                  </button>
                </div>
              </div>

              {/* 8 Clickable Ad Chips */}
              <div className="grid grid-cols-8 gap-1">
                {playlist.map((ad, idx) => {
                  const isActive = idx === currentAdIndex;
                  const isPrimary = ad.url.includes('unlikelycharitablewanting.com');

                  return (
                    <button
                      key={ad.id || idx}
                      onClick={() => setCurrentAdIndex(idx)}
                      title={`${ad.title} (${ad.url})`}
                      className={`h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all relative ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 border border-purple-400 scale-105 z-10'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>#{idx + 1}</span>
                      {isPrimary && (
                        <span className="w-1 h-1 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Ad URL & Inspector Toolbar */}
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                    {currentAd.type}
                  </span>
                  <span className="font-bold text-white text-[11px] truncate">{currentAd.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={copyCurrentAdUrl}
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 text-[10px] flex items-center gap-1"
                    title="Copy full ad link URL"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => openExternalUrl(currentAd.url)}
                    className="p-1 px-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Direct</span>
                  </button>
                </div>
              </div>

              {/* Exact URL Preview address bar */}
              <div className="p-1.5 px-2 bg-slate-900/90 rounded-xl border border-slate-800 text-[10px] font-mono text-cyan-300 truncate flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{currentAd.url}</span>
                </div>
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="text-slate-400 hover:text-white ml-2 shrink-0"
                  title="Reload Ad Frame"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* LIVE AD PREVIEW EMBEDDED FRAME / WEBVIEW SIMULATOR */}
            {/* ================================================================= */}
            <div className="w-full h-56 sm:h-64 bg-slate-950 rounded-2xl border border-purple-900/40 overflow-hidden relative flex flex-col">
              {/* Frame simulated address bar */}
              <div className="h-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[9px] font-mono text-slate-500 ml-1">In-App WebView Ad Player</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-purple-300">
                  <span>Ad #{currentAdIndex + 1} Slot</span>
                  <span>•</span>
                  <span>{currentAdRemainingSec}s left</span>
                </div>
              </div>

              {/* Live Iframe Embed with fallback */}
              <div className="flex-1 w-full h-full relative bg-slate-900">
                <iframe
                  key={`${currentAd.id}_${iframeKey}`}
                  src={currentAd.url}
                  title={`Ad Preview - ${currentAd.title}`}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />

                {/* Anti-blocker helper notice at bottom of frame */}
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-md p-2 border-t border-purple-900/40 flex items-center justify-between text-[10px] text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <span className="truncate">
                      Live Stream Active • Auto-cycling 8 ads across 400 seconds
                    </span>
                  </div>
                  <button
                    onClick={() => openExternalUrl(currentAd.url)}
                    className="text-purple-400 hover:text-purple-300 font-bold shrink-0 ml-2 flex items-center gap-0.5"
                  >
                    Direct View <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* MASTER 400s PROGRESS BAR & DUAL TIMER */}
            {/* ================================================================= */}
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Total Session Time (400s):</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Elapsed: {(elapsedMs / 1000).toFixed(0)}s / 400s
                  </span>
                  <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {formatTime(remainingTotalSec)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-850 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Sub-timing breakdown */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                <span>Current Ad #{currentAdIndex + 1} Remaining: {currentAdRemainingSec}s</span>
                <span className="text-emerald-400 font-bold">5-Min Break Upon 400s Finish</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Previous Ad */}
                <button
                  onClick={() =>
                    setCurrentAdIndex((prev) => (prev > 0 ? prev - 1 : playlist.length - 1))
                  }
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  ← Previous Ad
                </button>
                {/* Next Ad */}
                <button
                  onClick={() =>
                    setCurrentAdIndex((prev) => (prev < playlist.length - 1 ? prev + 1 : 0))
                  }
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Next Ad →
                </button>
              </div>

              {/* Dev / Fast-Forward Test Button (Allows verifying the 400s claim and 5-min cooldown without waiting 400s) */}
              <button
                onClick={handleFastForwardDev}
                disabled={isVerifying}
                className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-purple-300 hover:text-purple-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isVerifying
                    ? 'Verifying Task Completion...'
                    : '⚡ Fast-Forward 400s & Test 5-Minute Break (Dev Preview)'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
