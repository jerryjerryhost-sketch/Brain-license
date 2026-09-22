'use client';

import React, { useState, useEffect, useContext } from 'react';
import Header from '@/components/Header';
import { SidebarContext } from '@/components/DashboardShell';
import { Icons } from '@/components/Icons';

export default function SettingsPage() {
  const { openSidebar } = useContext(SidebarContext);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    is_supabase?: boolean;
    supabase_url?: string;
    connected?: boolean;
    count?: number;
    error?: string;
  } | null>(null);

  const endpointUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/license/sync`
    : 'https://brain-license.vercel.app/api/license/sync';

  const fetchDbStatus = async () => {
    setTestingDb(true);
    try {
      const res = await fetch('/api/admin/db-status');
      if (res.ok) {
        const d = await res.json();
        setDbStatus(d);
      }
    } catch (err) {
      console.error('Failed to test db connection:', err);
    } finally {
      setTestingDb(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const sqlSchema = `-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY DEFAULT ('lic-' || substr(md5(random()::text), 1, 12)),
    client_name TEXT NOT NULL,
    machine_id TEXT UNIQUE NOT NULL,
    license_type TEXT DEFAULT 'SUBSCRIPTION',
    issued_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    license_key TEXT NOT NULL,
    max_users INTEGER DEFAULT 0,
    app_version TEXT DEFAULT '',
    last_ip TEXT DEFAULT '',
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON licenses(machine_id);
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public sync access" ON licenses FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 0;`;

  const envTemplate = `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VENDOR_SECRET=DH_MEDISURG_SECURE_KERNEL_NODE_LOCK_2026_X91A_OFFLINE`;

  return (
    <>
      <Header
        title="Cloud Settings & API"
        subtitle="Serverless endpoints, Supabase database connection & offline sync protocol"
        onOpenSidebar={openSidebar}
      />

      <main className="p-4 md:p-8 space-y-6 max-w-5xl w-full mx-auto">
        {/* Endpoint Configuration */}
        <div className="rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 p-5 md:p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Icons.Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Workstation Sync Endpoint</h3>
              <p className="text-[11px] text-slate-400">Public heartbeat & remote license renewal URL</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-[#090D16] border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-xs text-indigo-300 select-all overflow-x-auto">
              {endpointUrl}
            </div>
            <button
              onClick={handleCopyEndpoint}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            >
              {copiedEndpoint ? (
                <>
                  <Icons.Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Icons.Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Client workstations send periodic background heartbeats to this endpoint. The endpoint verifies node authenticity and delivers updated cryptographic licenses whenever extended by an administrator.
          </p>
        </div>

        {/* Supabase Connection Dashboard */}
        <div className="rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 p-5 md:p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs">
                ⚡
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Supabase PostgreSQL Connection</h3>
                <p className="text-[11px] text-slate-400">Cloud database persistence &amp; multi-workstation central registry</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                dbStatus?.is_supabase && dbStatus?.connected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : dbStatus?.is_supabase && !dbStatus?.connected
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800'
              }`}>
                {dbStatus?.is_supabase && dbStatus?.connected
                  ? `Supabase Live (${dbStatus.count} Licenses)`
                  : dbStatus?.is_supabase && !dbStatus?.connected
                  ? 'Supabase Error'
                  : 'Local Storage Fallback'}
              </span>

              <button
                onClick={fetchDbStatus}
                disabled={testingDb}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                {testingDb ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-slate-400 block text-[10px]">STORAGE ENGINE</span>
              <span className="text-white font-semibold">{dbStatus?.is_supabase ? 'Supabase PostgreSQL' : 'Local /tmp JSON Store'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SUPABASE PROJECT</span>
              <span className="text-emerald-400 font-semibold truncate block">{dbStatus?.supabase_url || 'Not configured in Vercel'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-slate-400 block text-[10px]">RECORDS LOADED</span>
              <span className="text-indigo-300 font-semibold">{dbStatus?.count || 0} Workstations</span>
            </div>
          </div>

          {dbStatus?.error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
              <strong>Connection Notice:</strong> {dbStatus.error}
            </div>
          )}

          {/* Setup Instructions for Supabase */}
          <div className="space-y-3 pt-2 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80">
            <h4 className="font-semibold text-slate-200 text-xs">How to Connect Your Supabase Database:</h4>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>In your Supabase dashboard, open the <strong>SQL Editor</strong> and run the schema (copy below).</li>
              <li>Go to <strong>Project Settings &rarr; API</strong> and copy your <strong>Project URL</strong> and <strong>service_role</strong> secret key.</li>
              <li>In your <strong>Vercel Project Settings &rarr; Environment Variables</strong>, add the variables below.</li>
            </ol>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSchema);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{copiedSql ? '✓ Schema Copied!' : 'Copy Supabase SQL Schema'}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(envTemplate);
                  setCopiedEnv(true);
                  setTimeout(() => setCopiedEnv(false), 2000);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{copiedEnv ? '✓ Env Template Copied!' : 'Copy Vercel Env Template'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cryptographic Security Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Icons.Shield className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Cryptographic Architecture
              </h4>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>HMAC-SHA256:</strong> Dual-canonical signatures with user capacity controls.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Hardware Binding:</strong> Tied strictly to CPU, BIOS serials, and motherboard UUID.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Zero Cross-Node Sharing:</strong> A license created for Node A fails on Node B.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Icons.Pulse className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Offline Resilience Protocol
              </h4>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-sky-400 font-bold">&bull;</span>
                <span><strong>100% Offline Capable:</strong> Clients validate local licenses without internet access.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-sky-400 font-bold">&bull;</span>
                <span><strong>3.5s Silent Timeout:</strong> If cloud is unreachable, clients continue without lag.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-sky-400 font-bold">&bull;</span>
                <span><strong>Self-Healing:</strong> Workstation auto-updates license on next cloud heartbeat.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
