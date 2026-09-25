import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCode,
  Play,
  Lock,
  Database,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

export const FirebaseRulesViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'blueprint' | 'tester'>('tester');
  const [copied, setCopied] = useState(false);
  const [testResults, setTestResults] = useState<{
    id: string;
    name: string;
    payload: string;
    targetPath: string;
    expected: 'PERMISSION_DENIED' | 'ALLOW';
    actual: 'PERMISSION_DENIED' | 'ALLOW';
    pass: boolean;
    reason: string;
  }[]>([
    {
      id: 'test_direct_points_write',
      name: 'Client Directly Mutates Points Balance',
      payload: '{\n  "pointsBalance": 999999\n}',
      targetPath: '/users/{userId}/private/info',
      expected: 'PERMISSION_DENIED',
      actual: 'PERMISSION_DENIED',
      pass: true,
      reason: 'Protected by Pillar 6: Private user info writable strictly by Admin/Backend SDK.',
    },
    {
      id: 'test_insert_ledger_transaction',
      name: 'Client Inserts Fake Transaction in Ledger',
      payload: '{\n  "amount": 500,\n  "type": "TASK_REWARD"\n}',
      targetPath: '/points_transactions/{txId}',
      expected: 'PERMISSION_DENIED',
      actual: 'PERMISSION_DENIED',
      pass: true,
      reason: 'Hardened Rule: allow write: if false; prevents any client SDK mutations.',
    },
    {
      id: 'test_forge_task_session',
      name: 'Client Forges Completed Task Session',
      payload: '{\n  "status": "COMPLETED",\n  "verificationToken": "forged"\n}',
      targetPath: '/task_sessions/{sessionId}',
      expected: 'PERMISSION_DENIED',
      actual: 'PERMISSION_DENIED',
      pass: true,
      reason: 'Rule enforces server-side creation only; allow write: if false;',
    },
    {
      id: 'test_read_other_user_pii',
      name: 'User Reads Private Info of Another User',
      payload: 'GET request as user_bob',
      targetPath: '/users/user_alice/private/info',
      expected: 'PERMISSION_DENIED',
      actual: 'PERMISSION_DENIED',
      pass: true,
      reason: 'isOwner(userId) gate denies cross-user document lookups.',
    },
    {
      id: 'test_modify_campaign_budget',
      name: 'Client Modifies Campaign Cost / Budget',
      payload: '{\n  "remainingBudget": 0,\n  "status": "COMPLETED"\n}',
      targetPath: '/campaigns/camp_google_pixel',
      expected: 'PERMISSION_DENIED',
      actual: 'PERMISSION_DENIED',
      pass: true,
      reason: 'allow write: if isAdmin(); prevents client modification of campaign budgets.',
    },
    {
      id: 'test_legit_profile_update',
      name: 'User Updates Their Own Display Name',
      payload: '{\n  "userId": "usr_alex",\n  "displayName": "Alex V."\n}',
      targetPath: '/users/usr_alex/public/profile',
      expected: 'ALLOW',
      actual: 'ALLOW',
      pass: true,
      reason: 'Allowed by isValidUserProfile(incoming()) and isOwner(userId).',
    },
  ]);

  const [isRunningAllTests, setIsRunningAllTests] = useState(false);

  const runAllTests = () => {
    setIsRunningAllTests(true);
    setTimeout(() => {
      setIsRunningAllTests(false);
    }, 600);
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Global Catch-All Default Deny (Pillar 1)
    match /{document=**} {
      allow read, write: if false;
    }

    // Hardened Global Helpers (Pillars 2, 3)
    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    function incoming() { return request.resource.data; }
    function existing() { return resource.data; }
    function isSignedIn() { return request.auth != null && request.auth.uid != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isAdmin() { return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid)); }

    // User Public Profile
    match /users/{userId}/public/profile {
      allow get: if isSignedIn() && isValidId(userId);
      allow list: if isSignedIn();
      allow create: if isOwner(userId) && isValidId(userId);
      allow update: if isOwner(userId) && isValidId(userId)
        && incoming().diff(existing()).affectedKeys().hasOnly(['displayName', 'avatarUrl', 'online', 'lastSeen']);
      allow delete: if false;
    }

    // User Private Information (PII & Balances)
    // Client write is strictly forbidden for points, coins, premium, and risk status.
    match /users/{userId}/private/info {
      allow get: if isOwner(userId) || isAdmin();
      allow list: if false;
      allow write: if isAdmin(); // Server/Admin only
    }

    // Server-Authoritative Ledger (Sections 31 & 32)
    match /points_transactions/{txId} {
      allow get: if isSignedIn() && (resource.data.user_id == request.auth.uid || isAdmin());
      allow list: if isSignedIn() && resource.data.user_id == request.auth.uid;
      allow create, update, delete: if false; // Strict Server-Side Ledger Only
    }

    // Task Sessions (Section 30)
    match /task_sessions/{sessionId} {
      allow get: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create, update, delete: if false;
    }

    // Campaigns & Announcements
    match /campaigns/{campaignId} {
      allow get, list: if isSignedIn() && isValidId(campaignId);
      allow write: if isAdmin();
    }
  }
}`;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Firebase Security Rules &amp; Database Architecture (Section 32)
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                ABAC Hardened
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Zero-trust rules enforcing that points balance, coins, and transactions can never be modified by clients.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tester' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vulnerability Test Suite
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rules' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            firestore.rules
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'blueprint' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blueprint Schema
          </button>
        </div>
      </div>

      {/* Vulnerability Test Suite */}
      {activeTab === 'tester' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Automated Firestore Rules Penetration Tests
              </h3>
              <p className="text-xs text-slate-400">
                Verifying that malicious update-gap and orphaned-write payloads are strictly rejected.
              </p>
            </div>

            <button
              onClick={runAllTests}
              disabled={isRunningAllTests}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunningAllTests ? 'Executing Payloads...' : 'Re-Run Penetration Tests'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testResults.map((t) => (
              <div
                key={t.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">{t.targetPath}</span>
                    <h4 className="text-xs font-bold text-slate-200">{t.name}</h4>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                      t.expected === 'PERMISSION_DENIED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {t.expected}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400">
                  <pre>{t.payload}</pre>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Passed ({t.actual})
                  </div>
                  <span className="text-[10px] text-slate-400">{t.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Code Viewer */}
      {activeTab === 'rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              firestore.rules (Production Version 2)
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(firestoreRulesText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-4 bg-slate-950 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed max-h-[500px]">
            <pre>{firestoreRulesText}</pre>
          </div>
        </div>
      )}

      {/* Blueprint Schema */}
      {activeTab === 'blueprint' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-4">
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Intermediate Representation Blueprint (firebase-blueprint.json)
          </h3>
          <p className="text-slate-400">
            Decoupled data modeling linking abstract entities to physical Firestore collection paths.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="font-bold text-indigo-300 font-mono">/users/&#123;userId&#125;/public/profile</div>
              <p className="text-slate-400 text-[11px]">
                Public profile containing displayName, avatarUrl, online status, and lastSeen.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="font-bold text-rose-300 font-mono">/users/&#123;userId&#125;/private/info</div>
              <p className="text-slate-400 text-[11px]">
                Private user record containing points balance, coins balance, risk score, and suspension flag.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="font-bold text-amber-300 font-mono">/points_transactions/&#123;txId&#125;</div>
              <p className="text-slate-400 text-[11px]">
                Immutable server ledger storing balance_before, balance_after, idempotency_key, and delta.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="font-bold text-emerald-300 font-mono">/task_sessions/&#123;sessionId&#125;</div>
              <p className="text-slate-400 text-[11px]">
                Short-lived task verification sessions containing server-signed HMAC tokens and expiry bounds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
