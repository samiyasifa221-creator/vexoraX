import React, { useState, useEffect } from 'react';
import {
  User,
  Copy,
  Check,
  Globe,
  Plus,
  Trash2,
  Edit2,
  Play,
  RotateCcw,
  Sparkles,
  Coins,
  History,
  ShieldCheck,
  Gift,
  Share2,
  HelpCircle,
  Code,
  LogOut,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import {
  UserProfile,
  UserLink,
  UserCampaign,
  PointsTransaction,
  PremiumPackage,
  SupportedLanguage,
  AppConfig,
} from '../types/index.js';
import { translations } from '../utils/i18n.js';

interface ProfileScreenProps {
  user: UserProfile;
  token: string;
  config: AppConfig;
  lang: SupportedLanguage;
  initialSection?: string;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRefreshUser: () => void;
  onLogout: () => void;
  onOpenAdminPanel?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  token,
  config,
  lang,
  initialSection,
  onLanguageChange,
  onRefreshUser,
  onLogout,
  onOpenAdminPanel,
}) => {
  const t = translations[lang];

  const [activeSection, setActiveSection] = useState<string>(initialSection || 'menu');
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Links state
  const [links, setLinks] = useState<UserLink[]>([]);
  const [linkTab, setLinkTab] = useState<'All' | 'Adsterra' | 'Blogger'>('All');
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<'Adsterra' | 'Blogger'>('Blogger');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  // Campaign state
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [campaignFilter, setCampaignFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);
  const [selectedTargetViews, setSelectedTargetViews] = useState<number>(50);
  const [isStartingCampaign, setIsStartingCampaign] = useState(false);

  // Rewards Ledger
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);

  // Referrals
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    totalReferrals: number;
    successfulReferrals: number;
    referralRewards: number;
    history: any[];
  } | null>(null);

  // Premium
  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[]>([]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load data
  const loadLinks = async () => {
    try {
      const res = await fetch('/api/links', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLedger = async () => {
    try {
      const res = await fetch('/api/rewards', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadReferrals = async () => {
    try {
      const res = await fetch('/api/referrals', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setReferralData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadPremium = async () => {
    try {
      const res = await fetch('/api/premium', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setPremiumPackages(data.packages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadLinks();
    loadCampaigns();
    loadLedger();
    loadReferrals();
    loadPremium();
  }, [token]);

  useEffect(() => {
    if (initialSection) setActiveSection(initialSection);
  }, [initialSection]);

  const copyUid = () => {
    navigator.clipboard.writeText(user.userId || user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const copyRefCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Add Link Handler (Section 11)
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          url: newLinkUrl,
          type: newLinkType,
          title: newLinkTitle || `${newLinkType} Link`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add link');

      setFeedback({ type: 'success', message: 'Link successfully added!' });
      setNewLinkUrl('');
      setNewLinkTitle('');
      setIsAddLinkModalOpen(false);
      loadLinks();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Delete Link
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to remove this campaign link?')) return;
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Link deleted successfully' });
        loadLinks();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Toggle Link Active
  const handleToggleLinkActive = async (link: UserLink) => {
    const newStatus = link.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      loadLinks();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Start Campaign Handler (Section 14 & 17)
  const handleStartCampaign = async () => {
    setFeedback(null);
    setIsStartingCampaign(true);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          selectedLinks: selectedLinkIds,
          targetViews: selectedTargetViews,
          type: 'Blogger',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start campaign');

      setFeedback({
        type: 'success',
        message: `Campaign started! ${data.campaign.targetViews} Views allocated across ${selectedLinkIds.length} links.`,
      });
      setSelectedLinkIds([]);
      onRefreshUser();
      loadCampaigns();
      loadLinks();
      loadLedger();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsStartingCampaign(false);
    }
  };

  // Premium Purchase
  const handleBuyPremium = async (pkg: PremiumPackage) => {
    if (!confirm(`Purchase ${pkg.name} for ${pkg.priceCoins} Coins?`)) return;
    try {
      const res = await fetch('/api/premium/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: pkg.packageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFeedback({ type: 'success', message: data.message });
      onRefreshUser();
      loadPremium();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const filteredLinks = links.filter((l) => {
    if (linkTab === 'All') return true;
    return l.type === linkTab;
  });

  const activeLinksCount = links.filter((l) => l.status === 'ACTIVE').length;

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* 19. Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.avatarUrl || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/60 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{user.displayName || user.name}</h2>
                {user.isPremium && (
                  <span className="text-[10px] bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 px-2 py-0.5 rounded-full font-black uppercase">
                    VIP PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-300 font-mono">{user.email}</p>

              {/* UID with Copy button */}
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-mono">
                <span>UID: {user.userId || user.uid}</span>
                <button
                  onClick={copyUid}
                  className="p-1 hover:bg-purple-900/40 text-purple-300 hover:text-white rounded transition-colors"
                  title={t.copyUid}
                >
                  {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Points Pill */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-purple-300">{t.points}</span>
            <div className="text-xl font-black text-white font-mono flex items-center gap-1 justify-end">
              <Sparkles className="w-4 h-4 text-purple-400" />
              {(user.pointsBalance ?? user.points).toLocaleString()}
            </div>
          </div>
        </div>

        {/* User Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-purple-900/60 text-center">
          <div className="p-2 bg-slate-950/60 rounded-xl border border-purple-900/30">
            <span className="text-[10px] text-slate-400 block">Total Links</span>
            <span className="text-sm font-extrabold text-white font-mono">{links.length} / 8</span>
          </div>
          <div className="p-2 bg-slate-950/60 rounded-xl border border-purple-900/30">
            <span className="text-[10px] text-slate-400 block">Coins</span>
            <span className="text-sm font-extrabold text-amber-400 font-mono">{(user.coinsBalance ?? user.coins).toLocaleString()}</span>
          </div>
          <div className="p-2 bg-slate-950/60 rounded-xl border border-purple-900/30">
            <span className="text-[10px] text-slate-400 block">Status</span>
            <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Sub-Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'menu', label: 'All Sections' },
          { id: 'links', label: t.addYourLinks },
          { id: 'campaign', label: t.yourCampaign },
          { id: 'history', label: t.campaignHistory },
          { id: 'rewards', label: t.rewards },
          { id: 'premium', label: 'Premium' },
          { id: 'refer', label: 'Refer' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeSection === sec.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white bg-slate-900/70 hover:bg-slate-900'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* 11. ADD YOUR LINKS SECTION */}
      {activeSection === 'links' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">{t.addYourLinks}</h3>
              <p className="text-[11px] text-purple-300/80">{t.maxActiveLinksNotice}</p>
            </div>

            <button
              onClick={() => setIsAddLinkModalOpen(true)}
              disabled={activeLinksCount >= 8}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.addNewLink}
            </button>
          </div>

          {/* Tabs: All / Adsterra / Blogger */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-purple-900/40 w-fit text-xs font-semibold">
            {['All', 'Blogger', 'Adsterra'].map((tab) => (
              <button
                key={tab}
                onClick={() => setLinkTab(tab as any)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  linkTab === tab ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Links List */}
          <div className="space-y-2.5">
            {filteredLinks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 border border-dashed border-purple-900/40 rounded-2xl">
                No campaign links added yet. Click &quot;+ Add New Link&quot; to begin.
              </div>
            ) : (
              filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-purple-900/40 hover:border-purple-500/40 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {link.type}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-xs">{link.title}</h4>
                      </div>
                      <div className="text-[11px] text-cyan-400 font-mono truncate max-w-sm flex items-center gap-1 mt-0.5">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {link.url}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        link.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : link.status === 'ACTIVE'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {link.status}
                    </span>
                  </div>

                  {/* Views Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Views:</span>
                      <span className="text-white font-bold">
                        {link.completedViews} / {link.targetViews} {t.viewsProgress}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          link.completedViews >= link.targetViews ? 'bg-emerald-400' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((link.completedViews / link.targetViews) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-purple-950/60 text-xs">
                    <button
                      onClick={() => handleToggleLinkActive(link)}
                      className={`text-[11px] font-semibold ${
                        link.status === 'ACTIVE' ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {link.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 14 & 17. YOUR CAMPAIGN SECTION */}
      {activeSection === 'campaign' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-white">{t.yourCampaign}</h3>
            <p className="text-[11px] text-purple-300/80">{t.fairRotationNotice}</p>
          </div>

          {/* Daily requirement alert if active */}
          {config.enforceDailyTaskRequirement && (
            <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl text-xs text-purple-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong>Daily Task Requirement:</strong> You must complete {config.minimumDailyTasksRequired} tasks/day before launching campaigns.
                (Completed today: {user.dailyTasksCompleted})
              </div>
            </div>
          )}

          {/* STEP 1: Select Links (Max 8) */}
          <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                Step 1: Select Campaign Links ({t.selectedLinksCount}: {selectedLinkIds.length}/8)
              </span>
              <button
                onClick={() => {
                  if (selectedLinkIds.length === links.length) setSelectedLinkIds([]);
                  else setSelectedLinkIds(links.slice(0, 8).map((l) => l.id));
                }}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
              >
                {selectedLinkIds.length === links.length ? 'Deselect All' : 'Select All (Max 8)'}
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {links.map((link) => {
                const isSelected = selectedLinkIds.includes(link.id);
                return (
                  <label
                    key={link.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-white'
                        : 'bg-slate-950 border-purple-900/30 text-slate-300 hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedLinkIds((prev) => prev.filter((id) => id !== link.id));
                          } else {
                            if (selectedLinkIds.length >= 8) {
                              setFeedback({ type: 'error', message: 'You can select at most 8 links per campaign.' });
                              return;
                            }
                            setSelectedLinkIds((prev) => [...prev, link.id]);
                          }
                        }}
                        className="rounded border-purple-500 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="font-bold text-xs">{link.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{link.url}</div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      {link.completedViews} / {link.targetViews} views
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Choose Target Package */}
          <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-white block">{t.selectTargetViews}</span>

            <div className="grid grid-cols-2 gap-2.5">
              {config.campaignPackages.map((pkg) => {
                const isSelected = selectedTargetViews === pkg.targetViews;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedTargetViews(pkg.targetViews)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-400 text-white shadow-lg'
                        : 'bg-slate-950 border-purple-900/30 text-slate-300 hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">{pkg.label}</span>
                      {pkg.isPopular && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold uppercase">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-purple-300">
                      {pkg.pointsCost} {t.points}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Campaign Button */}
          <button
            onClick={handleStartCampaign}
            disabled={selectedLinkIds.length === 0 || isStartingCampaign}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-purple-950/40 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            {isStartingCampaign ? 'Launching Campaign...' : t.startCampaignBtn}
          </button>
        </div>
      )}

      {/* 18. CAMPAIGN HISTORY & STATUS */}
      {activeSection === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">{t.campaignHistory}</h3>
            <span className="text-xs text-purple-300 font-mono">{campaigns.length} Total</span>
          </div>

          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 border border-dashed border-purple-900/40 rounded-2xl">
                No campaigns launched yet.
              </div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-900 border border-purple-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">{c.id}</span>
                      <h4 className="text-xs font-bold text-white">{c.targetViews} Views Campaign ({c.selectedLinks.length} Links)</h4>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Progress:</span>
                      <span className="text-white font-bold">{c.completedViews} / {c.targetViews}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        style={{ width: `${Math.min(100, Math.round((c.completedViews / c.targetViews) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-purple-950/60 font-mono">
                    <span>Cost: {c.pointsCost} pts</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 20. REWARDS (POINTS LEDGER) */}
      {activeSection === 'rewards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Immutable Points Ledger</h3>
            <span className="text-xs text-purple-300 font-mono">Verified Append-Only</span>
          </div>

          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id || tx.transactionId} className="p-3 bg-slate-900 border border-purple-900/30 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{tx.description || tx.source || tx.type}</span>
                  <span
                    className={`font-mono font-extrabold ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Bal: {tx.balanceBefore ?? tx.balance_before} ➔ {tx.balanceAfter ?? tx.balance_after}</span>
                  <span>{new Date(tx.createdAt || tx.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 21. PREMIUM SUBSCRIPTION */}
      {activeSection === 'premium' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-white">{t.premiumTitle}</h3>
            <p className="text-[11px] text-purple-300/80">
              Unlock 2.0x task multipliers, zero cooldowns, and top fair link rotation.
            </p>
          </div>

          <div className="space-y-3">
            {premiumPackages.map((pkg) => (
              <div
                key={pkg.packageId}
                className="p-4 rounded-3xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{pkg.badge}</span>
                    <h4 className="text-sm font-extrabold text-white">{pkg.name}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-amber-300 font-mono flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-400" />
                      {pkg.priceCoins} Coins
                    </div>
                    <span className="text-[10px] text-slate-400">{pkg.durationDays} Days Duration</span>
                  </div>
                </div>

                <ul className="text-[11px] text-slate-300 space-y-1">
                  {pkg.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleBuyPremium(pkg)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-amber-950 font-black text-xs rounded-xl shadow-lg transition-all"
                >
                  Activate for {pkg.priceCoins} Coins
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 22. REFERRAL PROGRAM */}
      {activeSection === 'refer' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-white">{t.referralTitle}</h3>
            <p className="text-[11px] text-purple-300/80">Earn 200 points for every member who signs up and completes tasks.</p>
          </div>

          <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-white block">Your Referral Code</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-950 p-2.5 rounded-xl border border-purple-900/40 font-mono text-sm font-bold text-purple-300 text-center tracking-wider">
                {user.referralCode}
              </div>
              <button
                onClick={copyRefCode}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedRef ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-900 border border-purple-900/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 block">Total Referrals</span>
              <span className="text-lg font-black text-white font-mono">{referralData?.totalReferrals || 0}</span>
            </div>
            <div className="p-3 bg-slate-900 border border-purple-900/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 block">Rewards Earned</span>
              <span className="text-lg font-black text-amber-400 font-mono">{referralData?.referralRewards || 0} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Menu Directory Overview */}
      {activeSection === 'menu' && (
        <div className="space-y-2">
          {[
            { id: 'links', label: t.addYourLinks, icon: Globe, count: `${links.length}/8` },
            { id: 'campaign', label: t.yourCampaign, icon: Play },
            { id: 'history', label: t.campaignHistory, icon: History },
            { id: 'rewards', label: t.rewards, icon: Sparkles },
            { id: 'premium', label: 'Premium VIP', icon: Award },
            { id: 'refer', label: 'Referral Program', icon: Share2 },
            { id: 'api', label: 'Developer API Keys', icon: Code },
            { id: 'support', label: 'Help & Support', icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="w-full p-3.5 bg-slate-900/90 hover:bg-slate-800 border border-purple-900/30 hover:border-purple-500/40 rounded-2xl flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-900/40 flex items-center justify-center text-purple-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.count && (
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}

          {/* Admin panel launcher if admin */}
          {user.role === 'admin' && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="w-full p-3.5 bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-300 hover:text-white transition-all mt-2"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Admin Governance &amp; Fraud Console</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full p-3 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-rose-300 transition-all mt-3"
          >
            <LogOut className="w-4 h-4" />
            {t.logout}
          </button>
        </div>
      )}

      {/* Add New Link Modal */}
      {isAddLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-md w-full p-5 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">{t.addNewLink}</h3>
              <button onClick={() => setIsAddLinkModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLink} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Link Type</label>
                <div className="flex gap-2">
                  {['Blogger', 'Adsterra'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewLinkType(type as any)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                        newLinkType === type
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-950 border-purple-900/30 text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Campaign URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://yourblog.com/article"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Campaign Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pixel 9 Pro Review"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl transition-all shadow-lg"
              >
                Save &amp; Activate Link
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
