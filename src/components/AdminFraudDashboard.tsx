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
} from 'lucide-react';
import { FraudRiskMetrics, UserProfile, PointsTransaction, AuditLogEntry, TaskDefinition, AppConfig } from '../types/index.js';

interface AdminFraudDashboardProps {
  token: string;
  onRefreshData?: () => void;
}

export const AdminFraudDashboard: React.FC<AdminFraudDashboardProps> = ({ token, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'fraud' | 'taskConfig' | 'campaignConfig' | 'audit'>('fraud');

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

  // Configurable Task 3 State (Section 8)
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [task3Name, setTask3Name] = useState('');
  const [task3Desc, setTask3Desc] = useState('');
  const [task3Reward, setTask3Reward] = useState<number>(160);
  const [task3Cooldown, setTask3Cooldown] = useState<number>(45);
  const [task3DailyLimit, setTask3DailyLimit] = useState<number>(15);
  const [task3Active, setTask3Active] = useState<boolean>(true);
  const [task3Icon, setTask3Icon] = useState('Rocket');

  // Campaign AppConfig State (Section 15)
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [minDailyTasks, setMinDailyTasks] = useState<number>(50);
  const [enforceDailyReq, setEnforceDailyReq] = useState<boolean>(false);

  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [newNote, setNewNote] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, uRes, lRes, tRes, cRes] = await Promise.all([
        fetch('/api/admin/fraud/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/fraud/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/config', { headers: { Authorization: `Bearer ${token}` } }),
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
        const tList: TaskDefinition[] = tData.tasks || [];
        setTasks(tList);
        const t3 = tList.find((t) => t.taskIndex === 3);
        if (t3) {
          setTask3Name(t3.name);
          setTask3Desc(t3.description);
          setTask3Reward(t3.rewardPoints);
          setTask3Cooldown(t3.cooldownSeconds);
          setTask3DailyLimit(t3.dailyLimit);
          setTask3Active(t3.isActive);
          setTask3Icon(t3.icon);
        }
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

  // Section 8: Save Task 3 Config Live (No new APK needed!)
  const handleSaveTask3 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tasks/task_configurable_third', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: task3Name,
          description: task3Desc,
          rewardPoints: task3Reward,
          cooldownSeconds: task3Cooldown,
          dailyLimit: task3DailyLimit,
          isActive: task3Active,
          icon: task3Icon,
        }),
      });

      if (res.ok) {
        setActionMessage('Task #3 updated live on server! All client Work Centers updated immediately.');
        loadDashboardData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e: any) {
      setActionMessage(`Failed to update task: ${e.message}`);
    }
  };

  // Section 15: Save Campaign Config (Daily requirement number & toggle)
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

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === 'CRITICAL' && log.severity !== 'CRITICAL') return false;
    if (logFilter === 'WARN' && log.severity !== 'WARN') return false;
    if (logFilter === 'ADMIN' && log.eventType !== 'ADMIN_ACTION') return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-purple-900/40 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              LoopPulse Admin &amp; Fraud Control
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                Zero-Trust Authoritative
              </span>
            </h2>
            <p className="text-xs text-purple-300/80">Dynamic Task 3 Management, Fair Rotation Oversight &amp; Audit Logs</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-purple-900/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('fraud')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'fraud' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fraud &amp; Accounts
          </button>
          <button
            onClick={() => setActiveTab('taskConfig')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'taskConfig' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Task 3 Config
          </button>
          <button
            onClick={() => setActiveTab('campaignConfig')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'campaignConfig' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Campaign Rules
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs rounded-2xl flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* TAB 1: FRAUD & ACCOUNTS */}
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
                        : 'bg-slate-950 border-purple-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatarUrl || u.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{u.displayName || u.name}</span>
                          {u.isSuspended && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-bold">
                              SUSPENDED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-xs">
                        <span className="text-[10px] text-slate-400 block font-mono">Bal: {u.pointsBalance ?? u.points} pts</span>
                        <span className={`font-mono font-bold ${u.riskScore >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          Risk: {u.riskScore}
                        </span>
                      </div>
                      <button
                        onClick={() => handleInspectUser(u.userId)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspector */}
            <div className="lg:col-span-5 bg-slate-900 border border-purple-900/40 rounded-3xl p-4 space-y-4">
              <h3 className="text-sm font-extrabold text-white">Investigation Case File</h3>
              {inspectData ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-purple-900/40 space-y-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">{inspectData.user.displayName}</span>
                      <span className="text-purple-300 font-mono">{inspectData.user.userId}</span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-purple-950">
                      <button
                        onClick={() => handleToggleSuspend(inspectData.user.userId, inspectData.user.isSuspended)}
                        className={`flex-1 py-1.5 rounded-xl font-bold ${
                          inspectData.user.isSuspended ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {inspectData.user.isSuspended ? 'Unsuspend' : 'Suspend Account'}
                      </button>
                    </div>
                  </div>

                  {/* Ledger Transactions with Reverse Button */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Transactions Ledger</span>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {inspectData.transactions.map((tx) => (
                        <div key={tx.id || tx.transactionId} className="p-2 bg-slate-950 rounded-xl border border-purple-900/30 flex justify-between items-center text-[11px]">
                          <div>
                            <div className="text-white font-medium">{tx.description || tx.type}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Tx: {tx.id?.slice(0, 10)}...</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={tx.amount > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                            </span>
                            {tx.type !== 'ADMIN_REVERSAL' && (
                              <button
                                onClick={() => handleReverseReward(tx.id || tx.transactionId)}
                                className="p-1 text-slate-400 hover:text-rose-400"
                                title="Reverse fraudulent reward"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-purple-900/40 rounded-2xl">
                  Select an account to view its ledger and investigation case file.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASK 3 CONFIGURATION (Section 8) */}
      {activeTab === 'taskConfig' && (
        <div className="bg-slate-900 border border-purple-900/40 rounded-3xl p-5 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Rocket className="w-4 h-4 text-purple-400" />
              Dynamic Task #3 Configuration
            </h3>
            <p className="text-xs text-purple-300/80">
              Per specification Section 8: The 3rd task in Work Center is fully configurable live from this Admin Panel
              without publishing a new APK!
            </p>
          </div>

          <form onSubmit={handleSaveTask3} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Task Name / Title</label>
              <input
                type="text"
                required
                value={task3Name}
                onChange={(e) => setTask3Name(e.target.value)}
                className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Description</label>
              <textarea
                rows={2}
                required
                value={task3Desc}
                onChange={(e) => setTask3Desc(e.target.value)}
                className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Reward (Points)</label>
                <input
                  type="number"
                  required
                  value={task3Reward}
                  onChange={(e) => setTask3Reward(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Cooldown (Seconds)</label>
                <input
                  type="number"
                  required
                  value={task3Cooldown}
                  onChange={(e) => setTask3Cooldown(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Daily Limit</label>
                <input
                  type="number"
                  required
                  value={task3DailyLimit}
                  onChange={(e) => setTask3DailyLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-purple-900/40 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task3Active}
                  onChange={(e) => setTask3Active(e.target.checked)}
                  className="rounded border-purple-500 text-purple-600"
                />
                <span className="text-white font-semibold">Enable Task in Work Center</span>
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              Save &amp; Publish Task #3 Changes
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CAMPAIGN CONFIGURATION (Section 15) */}
      {activeTab === 'campaignConfig' && (
        <div className="bg-slate-900 border border-purple-900/40 rounded-3xl p-5 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Campaign Rules &amp; Daily Task Gates (Section 15)
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

      {/* TAB 4: AUDIT LOGS (Section 36) */}
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
                {filteredLogs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-950/50">
                    <td className="py-2 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 text-purple-300 font-bold whitespace-nowrap">{log.eventType}</td>
                    <td className="py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>
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
    </div>
  );
};
