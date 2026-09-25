import React from 'react';
import { Home, Briefcase, User, Sparkles } from 'lucide-react';
import { SupportedLanguage } from '../types/index.js';
import { translations } from '../utils/i18n.js';

export type TabType = 'home' | 'workcenter' | 'profile';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  lang: SupportedLanguage;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, lang }) => {
  const t = translations[lang];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-purple-900/40 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* 1. HOME */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 transition-all duration-200 ${
            currentTab === 'home'
              ? 'text-purple-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'text-purple-400' : 'text-slate-400'}`} />
          <span className="text-[11px] tracking-tight">{t.navHome}</span>
        </button>

        {/* 2. WORK CENTER - Centered Large Circular Purple Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => onTabChange('workcenter')}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl relative group ${
              currentTab === 'workcenter'
                ? 'bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-indigo-500 scale-110 shadow-purple-500/50 ring-4 ring-purple-500/30'
                : 'bg-gradient-to-tr from-purple-800 to-indigo-700 hover:scale-105 shadow-purple-900/40 ring-2 ring-purple-600/30'
            }`}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
              <Briefcase className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
            </div>
            {/* Pulsing ring indicator */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse"></span>
          </button>
        </div>

        {/* 3. PROFILE */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 transition-all duration-200 ${
            currentTab === 'profile'
              ? 'text-purple-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'text-purple-400' : 'text-slate-400'}`} />
          <span className="text-[11px] tracking-tight">{t.navProfile}</span>
        </button>
      </div>
    </nav>
  );
};
