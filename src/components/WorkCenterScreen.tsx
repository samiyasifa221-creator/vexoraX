import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  Globe,
  Rocket,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { TaskDefinition, SupportedLanguage, UserProfile } from '../types/index.js';
import { translations } from '../utils/i18n.js';
import { TaskViewerModal } from './TaskViewerModal.js';

interface WorkCenterScreenProps {
  user: UserProfile;
  token: string;
  lang: SupportedLanguage;
  onRefreshUser: () => void;
}

export const WorkCenterScreen: React.FC<WorkCenterScreenProps> = ({
  user,
  token,
  lang,
  onRefreshUser,
}) => {
  const t = translations[lang];

  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleStartTask = (task: TaskDefinition) => {
    if (!task.isActive) {
      setFeedback({ type: 'error', message: 'This task is currently inactive.' });
      return;
    }
    if ((task as any).cooldownRemainingSeconds > 0) {
      setFeedback({
        type: 'error',
        message: `Task is on a 5-minute break/cooldown. Available in ${formatCountdown((task as any).cooldownRemainingSeconds)}.`,
      });
      return;
    }
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSkipCooldown = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/tasks/cooldown/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: '5-minute break reset for testing. You can start the 400s ad cycle now!',
        });
        fetchTasks();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleTaskSuccess = (rewardPoints: number, newBalance: number) => {
    setFeedback({
      type: 'success',
      message: `Verified completion! +${rewardPoints} Points credited to your ledger (New Balance: ${newBalance} pts). 5-minute break started.`,
    });
    onRefreshUser();
    fetchTasks();
  };

  // Helper to render icon
  const renderTaskIcon = (iconName: string, category: string) => {
    if (category === 'ADSTERRA' || iconName === 'Sparkles') {
      return <Sparkles className="w-6 h-6 text-purple-400" />;
    }
    if (category === 'BLOGGER' || iconName === 'Globe') {
      return <Globe className="w-6 h-6 text-fuchsia-400" />;
    }
    return <Rocket className="w-6 h-6 text-indigo-400" />;
  };

  // Format seconds to MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 8. Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">{t.workCenterTitle}</h2>
        </div>
        <p className="text-xs text-purple-300/80">{t.workCenterSubtitle}</p>
      </div>

      {/* User daily requirements badge */}
      <div className="p-3.5 bg-slate-900/80 border border-purple-900/40 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Daily Tasks Completed:</span>
          <strong className="text-white font-mono">{user.dailyTasksCompleted}</strong>
        </div>
        <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
          Zero-Trust Verified
        </span>
      </div>

      {/* 400s Continuous 20-Ad Loop Spotlight Banner */}
      <div className="p-3.5 bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 rounded-2xl border border-purple-600/40 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {lang === 'bn' ? 'স্বয়ংক্রিয় ২০টি অ্যাড রোটেশন (২০ সেকেন্ড করে • প্রতি অ্যাড ৩০ পয়েন্ট)' : 'Continuous 20-Ad Auto-Stream (20s per ad • 30 Pts each)'}
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
            {lang === 'bn' ? '+৩০ পয়েন্ট / অ্যাড' : '+30 Pts / Ad'}
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {lang === 'bn'
            ? 'প্রতিটি অ্যাড ২০ সেকেন্ড চলবে এবং একবার অ্যাড দেখলেই ৩০ পয়েন্ট পাবেন! মোট ২০টি অ্যাড প্রিভিউ হবে এবং প্রতিটিতে ৩০ পয়েন্ট করে আয় হবে।'
            : 'Each ad plays for 20 seconds and gives 30 points per ad view! 20 ads rotate sequentially with instant point claiming enabled.'}
        </p>
        <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5 pt-0.5 truncate">
          <span className="text-slate-400">Live Stream:</span>
          <span className="truncate">https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 8. EXACTLY 3 Task Options */}
      <div className="space-y-3.5">
        {tasks.map((task) => {
          const cooldownSec = (task as any).cooldownRemainingSeconds || 0;
          const isAvailable = task.isActive && cooldownSec === 0 && !user.isSuspended;

          return (
            <div
              key={task.id}
              onClick={() => isAvailable && handleStartTask(task)}
              className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden group ${
                isAvailable
                  ? 'bg-slate-900/90 hover:bg-slate-800/90 border-purple-900/50 hover:border-purple-500/60 shadow-xl shadow-purple-950/30 cursor-pointer active:scale-[0.99]'
                  : 'bg-slate-950/70 border-slate-800/80 opacity-80 cursor-not-allowed'
              }`}
            >
              {/* Subtle top indicator for task number */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-900/60 to-slate-900 border border-purple-500/30 flex items-center justify-center shadow-md">
                    {renderTaskIcon(task.icon, task.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                        Task #{task.taskIndex}
                      </span>
                      {task.taskIndex === 3 && (
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                          Dynamic (Admin Configured)
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight">{task.name || task.title}</h3>
                  </div>
                </div>

                {/* Reward Badge */}
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 shadow-sm">
                    +{task.rewardPoints} {t.points}
                  </span>
                </div>
              </div>

              {/* Description & Availability Status */}
              <div className="flex items-end justify-between pt-2 border-t border-purple-950/80 text-xs">
                <div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {cooldownSec > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <Clock className="w-3 h-3 text-amber-400" />
                          5-Min Break: {formatCountdown(cooldownSec)}
                        </span>
                        <button
                          onClick={(e) => handleSkipCooldown(task.id, e)}
                          className="text-[10px] text-purple-300 hover:text-white bg-purple-900/60 hover:bg-purple-800 border border-purple-500/30 px-2 py-0.5 rounded font-bold transition-all"
                          title="Skip cooldown for rapid testing"
                        >
                          Skip Break
                        </button>
                      </div>
                    ) : isAvailable ? (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Available Now
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Unavailable</span>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Min: {task.requiredDurationMs / 1000}s
                    </span>
                  </div>
                </div>

                {/* Arrow Button */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                    isAvailable
                      ? 'bg-purple-600 text-white group-hover:bg-purple-500 group-hover:translate-x-0.5 shadow-md shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Viewer Modal */}
      <TaskViewerModal
        isOpen={isModalOpen}
        task={selectedTask}
        token={token}
        lang={lang}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
};
