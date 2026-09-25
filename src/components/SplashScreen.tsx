import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupportedLanguage } from '../types/index.js';
import { translations } from '../utils/i18n.js';

interface SplashScreenProps {
  onComplete: () => void;
  lang: SupportedLanguage;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, lang }) => {
  const t = translations[lang];
  const [step, setStep] = useState<number>(0);
  const steps = [
    'Checking Firebase Session...',
    'Validating App Version v1.2.0...',
    'Checking Maintenance & Integrity...',
    'Establishing Secure Channel...',
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 500);
    const timer2 = setTimeout(() => setStep(2), 1000);
    const timer3 = setTimeout(() => setStep(3), 1500);
    const timer4 = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm space-y-6">
        {/* Animated App Logo */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/40 border border-purple-400/40 animate-in zoom-in-75 duration-700">
            <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>LoopPulse</span>
            <span className="text-xs bg-purple-500/30 text-purple-300 border border-purple-400/40 px-2 py-0.5 rounded-full font-bold uppercase">
              PRO
            </span>
          </h1>
          <p className="text-xs text-purple-200/80 mt-1">Reward Tasks • Campaigns • Fair Link Rotation</p>
        </div>

        {/* Loading Progress Animation */}
        <div className="w-full space-y-2">
          <div className="w-full h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-purple-500/20">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-400 transition-all duration-500 rounded-full"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-[11px] font-mono text-purple-300 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            {steps[step]}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 text-[10px] text-purple-300/60 font-mono">
        LoopPulse Pro v1.2.0 • Android 15 • Zero-Trust Engine
      </div>
    </div>
  );
};
