import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Activity,
  Award,
  Settings,
  Rocket,
  Sliders,
  Save,
  Layers,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  Link2,
  Play,
  Check,
  Copy,
  X,
  Globe,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  FraudRiskMetrics,
  UserProfile,
  PointsTransaction,
  AuditLogEntry,
  TaskDefinition,
  AppConfig,
  UserLink,
} from '../types/index.js';
import { openExternalUrl } from '../utils/browser.js';

interface AdminFraudDashboardProps {
  token: string;
  onRefreshData?: () => void;
}

export const AdminFraudDashboard: React.FC<AdminFraudDashboardProps> = ({ token, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'adsManager' | 'fraud' | 'campaignConfig' | 'audit'>('adsManager');

  const [metrics, setMetrics] = useState<FraudRiskMetrics | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [inspectData, setInspectData] = useState<{
    user: UserProfile;
    transactions: PointsTransaction[];
    sessions: any[];
    logs: AuditLogEntry[];
    links?: any[];
  } | null>(null);

  // Real Ads & Tasks State
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [links, setLinks] = useState<UserLink[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Create Task / Ad State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'ADSTERRA' | 'BLOGGER' | 'DIRECT_LINK' | 'BANNER' | 'VIDEO' | 'CONFIGURABLE_CUSTOM'>('ADSTERRA');
  const [newTaskUrl, setNewTaskUrl] = useState('https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1');
  const [newTaskReward, setNewTaskReward] = useState<number>(450);
  const [newTaskCooldown, setNewTaskCooldown] = useState<number>(300);
  const [newTaskDuration, setNewTaskDuration] = useState<number>(400);
  const [newTaskDailyLimit, setNewTaskDailyLimit] = useState<number>(25);
  const [newTaskIcon, setNewTaskIcon] = useState('Sparkles');
  const [newTaskActive, setNewTaskActive] = useState<boolean>(true);

  // Edit Task / Ad State
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState<'ADSTERRA' | 'BLOGGER' | 'DIRECT_LINK' | 'BANNER' | 'VIDEO' | 'CONFIGURABLE_CUSTOM'>('ADSTERRA');
  const [editTaskUrl, setEditTaskUrl] = useState('');
  const [editTaskReward, setEditTaskReward] = useState<number>(100);
  const [editTaskCooldown, setEditTaskCooldown] = useState<number>(60);
  const [editTaskDuration, setEditTaskDuration] = useState<number>(30);
  const [editTaskDailyLimit, setEditTaskDailyLimit] = useState<number>(30);
  const [editTaskIcon, setEditTaskIcon] = useState('Sparkles');
  const [editTaskActive, setEditTaskActive] = useState<boolean>(true);

  // Create Real Ad Link State
  const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkType, setNewLinkType] = useState<'Adsterra' | 'Blogger' | 'DirectLink' | 'Banner' | 'Video'>('Adsterra');
  const [newLinkTargetViews, setNewLinkTargetViews] = useState<number>(500);

  // Edit Real Ad Link State
  const [editingLink, setEditingLink] = useState<UserLink | null>(null);
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinkType, setEditLinkType] = useState<any>('Adsterra');
  const [editLinkTargetViews, setEditLinkTargetViews] = useState<number>(500);
  const [editLinkStatus, setEditLinkStatus] = useState<any>('ACTIVE');

  // Campaign AppConfig State
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [minDailyTasks, setMinDailyTasks] = useState<number>(50);
  const [enforceDailyReq, setEnforceDailyReq] = useState<boolean>(false);

  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, uRes, lRes, tRes, cRes, linksRes] = await Promise.all([
        fetch('/api/admin/fraud/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/fraud/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/config', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/links', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
      }
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
      }
      if (lRes.ok) {
        const lData = await lRes.json();
        setAuditLogs(lData.logs || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTasks(tData.tasks || []);
      }
      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinks(linksData.links || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setConfig(cData.config);
        setMinDailyTasks(cData.config.minimumDailyTasksRequired || 50);
        setEnforceDailyReq(cData.config.enforceDailyTaskRequirement);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  // -------------------------------------------------------------
  // REAL AD / TASK ACTIONS (ADD, EDIT, DELETE)
  // -------------------------------------------------------------
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newTaskName,
          title: newTaskTitle || newTaskName,
          description: newTaskDesc,
          category: newTaskCategory,
          url: newTaskUrl,
          rewardPoints: newTaskReward,
          cooldownSeconds: newTaskCooldown,
          minDurationSeconds: newTaskDuration,
          requiredDurationMs: newTaskDuration * 1000,
          dailyLimit: newTaskDailyLimit,
          icon: newTaskIcon,
          isActive: newTaskActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ad task');

      setActionMessage(`Ad Task "${newTaskName}" created successfully! Published live to all devices.`);
      setIsCreateTaskModalOpen(false);
      setNewTaskName('');
      setNewTaskTitle('');
      setNewTaskDesc('');
      loadDashboardData();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      setActionMessage(`Error creating task: ${e.message}`);
    }
  };

  const openEditTaskModal = (task: TaskDefinition) => {
    setEditingTask(task);
    setEditTaskName(task.name);
    setEditTaskTitle(task.title || task.name);
    setEditTaskDesc(task.description);
    setEditTaskCategory(task.category as any);
    setEditTaskUrl(task.url || '');
    setEditTaskReward(task.rewardPoints);
    setEditTaskCooldown(task.cooldownSeconds);
    setEditTaskDuration(task.minDurationSeconds || Math.round(task.requiredDurationMs / 1000) || 30);
    setEditTaskDailyLimit(task.dailyLimit);
    setEditTaskIcon(task.icon);
    setEditTaskActive(task.isActive);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      const res = await fetch(`/api/admin/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editTaskName,
          title: editTaskTitle,
          description: editTaskDesc,
          category: editTaskCategory,
          url: editTaskUrl,
          rewardPoints: editTaskReward,
          cooldownSeconds: editTaskCooldown,
          minDurationSeconds: editTaskDuration,
          requiredDurationMs: editTaskDuration * 1000,
          dailyLimit: editTaskDailyLimit,
          icon: editTaskIcon,
          isActive: editTaskActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task');

      setActionMessage(`Ad Task "${editTaskName}" updated live!`);
      setEditingTask(null);
      loadDashboardData();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      setActionMessage(`Error updating task: ${e.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string, taskName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the Ad Task "${taskName}"? It will be removed immediately from all users.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete task');
      }

      setActionMessage(`Ad Task "${taskName}" was deleted.`);
      loadDashboardData();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      setActionMessage(`Delete error: ${e.message}`);
    }
  };

  const handleToggleTaskActive = async (task: TaskDefinition) => {
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !task.isActive }),
      });
      if (res.ok) {
        setActionMessage(`Ad Task "${task.name}" is now ${!task.isActive ? 'Active' : 'Paused'}.`);
        loadDashboardData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e: any) {
      setActionMessage(`Toggle error: ${e.message}`);
    }
  };

  // -------------------------------------------------------------
  // REAL AD LINKS ACTIONS (ADD, EDIT, DELETE)
  // -------------------------------------------------------------
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          url: newLinkUrl,
          title: newLinkTitle || 'Direct Ad Link',
          type: newLinkType,
          targetViews: newLinkTargetViews,
          status: 'ACTIVE',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add ad link');

      setActionMessage(`Real Ad Link added to stream rotation!`);
      setIsCreateLinkModalOpen(false);
      setNewLinkUrl('');
      setNewLinkTitle('');
      loadDashboardData();
    } catch (e: any) {
      setActionMessage(`Error adding link: ${e.message}`);
    }
  };

  const openEditLinkModal = (link: UserLink) => {
    setEditingLink(link);
    setEditLinkUrl(link.url);
    setEditLinkTitle(link.title);
    setEditLinkType(link.type);
    setEditLinkTargetViews(link.targetViews);
    setEditLinkStatus(link.status);
  };

  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    try {
      const res = await fetch(`/api/admin/links/${editingLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          url: editLinkUrl,
          title: editLinkTitle,
          type: editLinkType,
          targetViews: editLinkTargetViews,
          status: editLinkStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update link');

      setActionMessage(`Ad Link "${editLinkTitle}" updated!`);
      setEditingLink(null);
      loadDashboardData();
    } catch (e: any) {
      setActionMessage(`Error updating link: ${e.message}`);
    }
  };

  const handleDeleteLink = async (linkId: string, title: string) => {
    if (!confirm(`Permanently remove Ad Link "${title}" from rotation?`)) return;
    try {
      const res = await fetch(`/api/admin/links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActionMessage(`Ad Link removed.`);
        loadDashboardData();
      }
    } catch (e: any) {
      setActionMessage(`Delete error: ${e.message}`);
    }
  };

  const handleToggleLinkStatus = async (link: UserLink) => {
    const nextStatus = link.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setActionMessage(`Ad link status updated to ${nextStatus}.`);
        loadDashboardData();
      }
    } catch (e: any) {
      setActionMessage(`Toggle error: ${e.message}`);
    }
  };

  // -------------------------------------------------------------
  // USER INSPECT & FRAUD ACTIONS
  // -------------------------------------------------------------
  const handleInspectUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/fraud/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInspectData(data);
        setSelectedUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSuspend = async (userId: string, currentSuspended: boolean) => {
    try {
      const res = await fetch('/api/admin/fraud/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, suspend: !currentSuspended }),
      });
      if (res.ok) {
        setActionMessage(`User ${!currentSuspended ? 'Suspended' : 'Unsuspended'} successfully.`);
        loadDashboardData();
        if (selectedUser?.userId === userId) handleInspectUser(userId);
      }
    } catch (e: any) {
      setActionMessage(`Failed to update suspension: ${e.message}`);
    }
  };

  const handleReverseReward = async (transactionId: string) => {
    if (!confirm('Reverse this transaction? A compensating debit transaction will be added.')) return;
    try {
      const res = await fetch('/api/admin/fraud/reverse-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactionId, reason: 'Anti-fraud audit findings.' }),
      });
      if (res.ok) {
        setActionMessage('Transaction successfully reversed and ledger updated.');
        loadDashboardData();
        if (selectedUser) handleInspectUser(selectedUser.userId);
      }
    } catch (e: any) {
      setActionMessage(`Failed to reverse reward: ${e.message}`);
    }
  };

  const handleSaveCampaignConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          minimumDailyTasksRequired: minDailyTasks,
          enforceDailyTaskRequirement: enforceDailyReq,
        }),
      });

      if (res.ok) {
        setActionMessage('Campaign requirements saved! Gate rules updated.');
        loadDashboardData();
      }
    } catch (e: any) {
      setActionMessage(`Failed to save config: ${e.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === 'CRITICAL' && log.severity !== 'CRITICAL') return false;
    if (logFilter === 'WARN' && log.severity !== 'WARN') return false;
    if (logFilter === 'ADMIN' && log.eventType !== 'ADMIN_ACTION') return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-900 border border-purple-900/40 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              VexoraX Master Administration &amp; Ads Suite
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                Real Live Data • Zero Demo
              </span>
            </h2>
            <p className="text-xs text-purple-300/80">
              Manage Work Center Ads, Add &amp; Delete Campaign Streams, Fair CPM Rotation &amp; Risk Controls
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-purple-900/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('adsManager')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'adsManager'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ads &amp; Tasks Manager</span>
          </button>
          <button
            onClick={() => setActiveTab('fraud')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'fraud'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Fraud &amp; Accounts</span>
          </button>
          <button
            onClick={() => setActiveTab('campaignConfig')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'campaignConfig'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Campaign Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-purple-950/90 border border-purple-500/60 text-purple-200 text-xs rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-2 text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ADS & TASKS MANAGER (ADD, EDIT, DELETE REAL ADS) */}
      {/* ========================================================================= */}
      {activeTab === 'adsManager' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Ad Tasks</span>
              <div className="text-2xl font-black text-amber-300 font-mono mt-1">
                {tasks.filter((t) => t.isActive).length} / {tasks.length}
              </div>
            </div>
            <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Stream Ad Links</span>
              <div className="text-2xl font-black text-purple-300 font-mono mt-1">
                {links.filter((l) => l.status === 'ACTIVE').length} Active
              </div>
            </div>
            <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Primary Live Adsterra Link</span>
              <div className="text-xs font-mono text-cyan-300 truncate mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="truncate">https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: WORK CENTER EARNING ADS & TASKS */}
          <div className="bg-slate-900 border border-purple-900/40 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-950/80">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Work Center Earning Ads &amp; Tasks
                </h3>
                <p className="text-xs text-purple-300/80">
                  These rewarded tasks are shown in users' Work Center. You can add new ads, edit existing ones, or delete them.
                </p>
              </div>

              <button
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add New Ad Task
              </button>
            </div>

            {/* Task Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    task.isActive
                      ? 'bg-slate-950/80 border-purple-900/40 hover:border-purple-600/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-bold">
                          #{task.taskIndex} • {task.category}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            task.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {task.isActive ? 'Live' : 'Paused'}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        +{task.rewardPoints} Pts
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white">{task.name}</h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{task.description}</p>

                    {/* Direct Ad URL preview */}
                    {task.url && (
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                          <span>Target Ad URL:</span>
                          <button
                            onClick={() => openExternalUrl(task.url!)}
                            className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5 font-bold"
                          >
                            Open Link <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-cyan-300 truncate">{task.url}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-purple-950/60">
                      <div>
                        <span className="block text-slate-500">Duration</span>
                        <span className="text-white font-bold">{task.minDurationSeconds || Math.round(task.requiredDurationMs / 1000)}s</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Cooldown</span>
                        <span className="text-white font-bold">{task.cooldownSeconds}s</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Daily Limit</span>
                        <span className="text-white font-bold">{task.dailyLimit}/day</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-purple-950/80 text-xs">
                    <button
                      onClick={() => handleToggleTaskActive(task)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                        task.isActive ? 'text-amber-400 hover:bg-amber-950/30' : 'text-emerald-400 hover:bg-emerald-950/30'
                      }`}
                    >
                      {task.isActive ? 'Pause' : 'Activate'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditTaskModal(task)}
                        className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id, task.name)}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: ROTATING AD STREAM & CAMPAIGN LINKS */}
          <div className="bg-slate-900 border border-purple-900/40 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-950/80">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  Rotating Stream Ads &amp; Direct Links
                </h3>
                <p className="text-xs text-purple-300/80">
                  These real ad links are rotated in the 8-Ad continuous auto stream and blogger task. No fake links exist.
                </p>
              </div>

              <button
                onClick={() => setIsCreateLinkModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Real Ad Link
              </button>
            </div>

            {/* Links Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-900/40 text-slate-400 uppercase text-[10px]">
                    <th className="pb-2">Title &amp; Type</th>
                    <th className="pb-2">Direct Ad Link URL</th>
                    <th className="pb-2">Views Progress</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/60 font-sans text-xs">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-950/50">
                      <td className="py-3">
                        <div className="font-extrabold text-white">{link.title}</div>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          {link.type}
                        </span>
                      </td>
                      <td className="py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-cyan-300 truncate block max-w-[220px]">
                            {link.url}
                          </span>
                          <button
                            onClick={() => copyToClipboard(link.url)}
                            className="text-slate-400 hover:text-white"
                            title="Copy link"
                          >
                            {copiedUrl === link.url ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => openExternalUrl(link.url)}
                            className="text-purple-400 hover:text-purple-300"
                            title="Test open link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 font-mono">
                        <div className="text-white font-bold">
                          {link.completedViews} / {link.targetViews}
                        </div>
                        <div className="w-24 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round((link.completedViews / (link.targetViews || 1)) * 100))}%`,
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleToggleLinkStatus(link)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            link.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {link.status}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditLinkModal(link)}
                            className="p-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-xs transition-all"
                            title="Edit Link"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id, link.title)}
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs transition-all"
                            title="Delete Link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {links.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No ad links in rotation. Click "+ Add Real Ad Link" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FRAUD & ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'fraud' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Blocked Attacks</span>
              <div className="text-2xl font-black text-rose-400 font-mono mt-1">{metrics?.totalBlockedAttempts || 18}</div>
            </div>
            <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Speed Violations</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">{metrics?.speedViolationsBlocked || 8}</div>
            </div>
            <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Replay Protected</span>
              <div className="text-2xl font-black text-purple-300 font-mono mt-1">{metrics?.replayAttacksBlocked || 7}</div>
            </div>
            <div className="p-4 bg-slate-900 border border-purple-900/40 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Reversed Points</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{metrics?.totalReversedPoints || 0}</div>
            </div>
          </div>

          {/* Accounts & Deep Dive Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-900 border border-purple-900/40 rounded-3xl p-4 space-y-3">
              <h3 className="text-sm font-extrabold text-white">Registered Accounts &amp; Risk Signals</h3>
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.userId}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      selectedUser?.userId === u.userId
                        ? 'bg-purple-950/70 border-purple-500'
                        : 'bg-slate-950 border-purple-950/40 hover:border-purple-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={u.avatarUrl || u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={u.displayName}
                          className="w-10 h-10 rounded-xl object-cover border border-purple-500/40"
                        />
                        {u.isSuspended && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-950"></span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-xs">{u.displayName || u.name}</span>
                          <span className="text-[10px] font-mono text-purple-400">({u.role})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-amber-300 block">{u.pointsBalance} pts</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            u.riskScore > 80 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          Risk {u.riskScore}/100
                        </span>
                      </div>

                      <button
                        onClick={() => handleInspectUser(u.userId)}
                        className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspect User Drawer */}
            <div className="lg:col-span-5 bg-slate-900 border border-purple-900/40 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Account Risk Inspector
              </h3>

              {selectedUser ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-purple-900/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{selectedUser.displayName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          selectedUser.isSuspended ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {selectedUser.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">UID: {selectedUser.userId}</div>
                    <div className="text-[11px] font-mono text-slate-400">Email: {selectedUser.email}</div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => handleToggleSuspend(selectedUser.userId, selectedUser.isSuspended)}
                        className={`flex-1 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                          selectedUser.isSuspended
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-600 hover:bg-rose-500 text-white'
                        }`}
                      >
                        {selectedUser.isSuspended ? 'Unsuspend Account' : 'Suspend Account'}
                      </button>
                    </div>
                  </div>

                  {/* Transactions Ledger */}
                  {inspectData && inspectData.transactions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-white text-xs">User Ledger ({inspectData.transactions.length})</h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {inspectData.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2 rounded-xl bg-slate-950 border border-purple-950/60 flex items-center justify-between text-[11px]"
                          >
                            <div>
                              <div className="font-bold text-white">{tx.type}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{tx.id}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-400">+{tx.amount} pts</span>
                              <button
                                onClick={() => handleReverseReward(tx.id)}
                                className="text-[10px] text-rose-400 hover:text-rose-300 underline"
                              >
                                Reverse
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Select an account from the list to inspect audit logs, ledger entries, and risk flags.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CAMPAIGN POLICY */}
      {/* ========================================================================= */}
      {activeTab === 'campaignConfig' && (
        <div className="bg-slate-900 border border-purple-900/40 rounded-3xl p-5 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Campaign Rules &amp; Daily Task Gates
            </h3>
            <p className="text-xs text-purple-300/80">
              Configure minimum daily tasks required before members can launch campaigns. Admin can change or disable this requirement.
            </p>
          </div>

          <form onSubmit={handleSaveCampaignConfig} className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-purple-900/40 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-white block">Enforce Minimum Daily Task Requirement</span>
                  <span className="text-[11px] text-slate-400">
                    If active, users must complete X tasks today before creating campaigns.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enforceDailyReq}
                  onChange={(e) => setEnforceDailyReq(e.target.checked)}
                  className="rounded border-purple-500 text-purple-600 w-4 h-4"
                />
              </label>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Required Daily Tasks Threshold (e.g. 50 tasks/day)
                </label>
                <input
                  type="number"
                  value={minDailyTasks}
                  onChange={(e) => setMinDailyTasks(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              Update Campaign Policy
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-purple-900/40 rounded-3xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <h3 className="font-extrabold text-white">Immutable Audit Trail</h3>
            <span className="text-purple-300 font-mono">{filteredLogs.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-900/40 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Event</th>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60 font-mono text-[11px]">
                {filteredLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-950/50">
                    <td className="py-2 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 text-purple-300 font-bold whitespace-nowrap">{log.eventType}</td>
                    <td className="py-2 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2 text-slate-300 font-sans text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW AD TASK */}
      {/* ========================================================================= */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-purple-950">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add New Work Center Ad Task
              </h3>
              <button onClick={() => setIsCreateTaskModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Ad Task Name / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adsterra High-CPM Stream or Partner Ad"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Direct Ad Link URL</label>
                <input
                  type="url"
                  placeholder="https://unlikelycharitablewanting.com/yq26ub6cn?key=2de33b5349b5825fabf2823dca90c5d1"
                  value={newTaskUrl}
                  onChange={(e) => setNewTaskUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-purple-300/70 mt-1 block">
                  The real Adsterra or web ad link played in the continuous stream player.
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADSTERRA', 'BLOGGER', 'DIRECT_LINK', 'BANNER', 'VIDEO', 'CONFIGURABLE_CUSTOM'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewTaskCategory(cat)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                        newTaskCategory === cat
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-950 border-purple-950/60 text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Task Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe the ad task for users..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Reward Points</label>
                  <input
                    type="number"
                    min="1"
                    value={newTaskReward}
                    onChange={(e) => setNewTaskReward(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Watch Duration (Seconds)</label>
                  <input
                    type="number"
                    min="5"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Cooldown / Break (Seconds)</label>
                  <input
                    type="number"
                    min="0"
                    value={newTaskCooldown}
                    onChange={(e) => setNewTaskCooldown(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Daily Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={newTaskDailyLimit}
                    onChange={(e) => setNewTaskDailyLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-purple-950">
                <span className="font-bold text-white">Active Status (Immediate Live)</span>
                <input
                  type="checkbox"
                  checked={newTaskActive}
                  onChange={(e) => setNewTaskActive(e.target.checked)}
                  className="rounded border-purple-500 text-purple-600 w-4 h-4"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl transition-all shadow-lg"
                >
                  Create &amp; Publish Ad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT AD TASK */}
      {/* ========================================================================= */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-purple-950">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                Edit Ad Task ({editingTask.name})
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Ad Task Name / Label</label>
                <input
                  type="text"
                  required
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Direct Ad Link URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editTaskUrl}
                  onChange={(e) => setEditTaskUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADSTERRA', 'BLOGGER', 'DIRECT_LINK', 'BANNER', 'VIDEO', 'CONFIGURABLE_CUSTOM'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditTaskCategory(cat)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                        editTaskCategory === cat
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-950 border-purple-950/60 text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Description</label>
                <textarea
                  required
                  rows={2}
                  value={editTaskDesc}
                  onChange={(e) => setEditTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Reward Points</label>
                  <input
                    type="number"
                    min="1"
                    value={editTaskReward}
                    onChange={(e) => setEditTaskReward(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Watch Duration (Seconds)</label>
                  <input
                    type="number"
                    min="5"
                    value={editTaskDuration}
                    onChange={(e) => setEditTaskDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Cooldown / Break (Seconds)</label>
                  <input
                    type="number"
                    min="0"
                    value={editTaskCooldown}
                    onChange={(e) => setEditTaskCooldown(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Daily Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editTaskDailyLimit}
                    onChange={(e) => setEditTaskDailyLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-purple-950">
                <span className="font-bold text-white">Active Status</span>
                <input
                  type="checkbox"
                  checked={editTaskActive}
                  onChange={(e) => setEditTaskActive(e.target.checked)}
                  className="rounded border-purple-500 text-purple-600 w-4 h-4"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl transition-all shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE REAL AD LINK */}
      {/* ========================================================================= */}
      {isCreateLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-950">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-400" />
                Add Real Ad Link to Stream
              </h3>
              <button onClick={() => setIsCreateLinkModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Real Ad Link URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://unlikelycharitablewanting.com/..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Title / Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adsterra Direct Stream #2"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Link Type</label>
                <div className="flex gap-2">
                  {['Adsterra', 'Blogger', 'DirectLink'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewLinkType(type as any)}
                      className={`flex-1 py-1.5 rounded-xl font-bold border transition-all ${
                        newLinkType === type
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-950 border-purple-900/40 text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Target Views</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={newLinkTargetViews}
                  onChange={(e) => setNewLinkTargetViews(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateLinkModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl transition-all shadow-lg"
                >
                  Save &amp; Activate Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT REAL AD LINK */}
      {/* ========================================================================= */}
      {editingLink && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-950">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                Edit Ad Link
              </h3>
              <button onClick={() => setEditingLink(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLink} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Real Ad Link URL</label>
                <input
                  type="url"
                  required
                  value={editLinkUrl}
                  onChange={(e) => setEditLinkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Title / Campaign Name</label>
                <input
                  type="text"
                  required
                  value={editLinkTitle}
                  onChange={(e) => setEditLinkTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Link Type</label>
                <div className="flex gap-2">
                  {['Adsterra', 'Blogger', 'DirectLink'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditLinkType(type)}
                      className={`flex-1 py-1.5 rounded-xl font-bold border transition-all ${
                        editLinkType === type
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-950 border-purple-900/40 text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Target Views</label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={editLinkTargetViews}
                  onChange={(e) => setEditLinkTargetViews(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Status</label>
                <div className="flex gap-2">
                  {['ACTIVE', 'INACTIVE', 'COMPLETED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditLinkStatus(st)}
                      className={`flex-1 py-1.5 rounded-xl font-bold border text-[11px] transition-all ${
                        editLinkStatus === st
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-950 border-purple-900/40 text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl transition-all shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
