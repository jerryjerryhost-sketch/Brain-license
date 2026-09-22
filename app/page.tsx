'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import RegisterModal from '@/components/RegisterModal';
import EditLicenseModal from '@/components/EditLicenseModal';
import { SidebarContext } from '@/components/DashboardShell';
import { Icons } from '@/components/Icons';

interface LicenseRecord {
  id: string;
  client_name: string;
  machine_id: string;
  license_type: 'SUBSCRIPTION' | 'PERPETUAL' | 'TRIAL';
  issued_date: string;
  expiry_date: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  license_key: string;
  max_users?: number;
  app_version?: string;
  last_ip?: string;
  last_sync_at?: string;
  notes?: string;
  is_online?: boolean;
  days_remaining?: number | 'PERPETUAL';
  is_expired?: boolean;
  is_expiring_soon?: boolean;
}

interface Stats {
  total: number;
  active: number;
  online: number;
  expiring_soon: number;
  expired: number;
}

export default function DashboardHome() {
  const { openSidebar } = useContext(SidebarContext);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, online: 0, expiring_soon: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<LicenseRecord | null>(null);

  const fetchFleet = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/licenses');
      const data = await res.json();
      if (data.success) {
        setLicenses(data.licenses || []);
        setStats(data.stats || { total: 0, active: 0, online: 0, expiring_soon: 0, expired: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleQuickExtend = async (machineId: string, days: number) => {
    try {
      setActionInProgress(machineId);
      const res = await fetch('/api/admin/licenses/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: machineId, action: 'extend_days', days }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchFleet();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch {
      alert('Network failure');
    } finally {
      setActionInProgress(null);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const expiringList = licenses.filter((lic) => lic.is_expiring_soon && lic.status !== 'SUSPENDED');
  const recentSyncs = [...licenses]
    .filter((l) => l.last_sync_at)
    .sort((a, b) => new Date(b.last_sync_at!).getTime() - new Date(a.last_sync_at!).getTime())
    .slice(0, 6);

  // Distribution calculations
  const totalSafe = stats.total || 1;
  const activePct = Math.round((stats.active / totalSafe) * 100);
  const expiringPct = Math.round((stats.expiring_soon / totalSafe) * 100);
  const expiredPct = Math.round((stats.expired / totalSafe) * 100);

  return (
    <>
      <Header
        title="Fleet Overview"
        subtitle="Workstation health, remote renewals & offline synchronization"
        onOpenSidebar={openSidebar}
        onRefresh={fetchFleet}
        isRefreshing={loading}
        onRegisterClick={() => setIsRegisterOpen(true)}
      />

      <main className="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Summary Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 md:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SYSTEM READY
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  HMAC-SHA256 Cryptographic Core Active
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Workstation Node Telemetry & Licensing
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Client workstations operate 100% offline using hardware-bound certificates. When internet access is available, stations quietly perform a background handshake to sync validity and renew automatically.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <Link
                href="/licenses"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center space-x-2"
              >
                <span>View Full Registry</span>
                <Icons.ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Workstations */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Workstations</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Icons.Server className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono tracking-tight">{stats.total}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Registered hardware endpoints</div>
            </div>
          </div>

          {/* Active Nodes */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Licenses</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Icons.CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">{stats.active}</div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5 font-medium">
                {stats.total > 0 ? `${activePct}% of total fleet` : 'No stations registered'}
              </div>
            </div>
          </div>

          {/* Live Syncs */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Live Online Heartbeats</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                <Icons.Pulse className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-sky-400 font-mono tracking-tight">{stats.online}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Connected in last 24 hours</div>
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Expiring Soon (&lt; 30d)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Icons.AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">{stats.expiring_soon}</div>
              <div className="text-[11px] text-amber-400/80 mt-0.5 font-medium">
                {stats.expiring_soon > 0 ? 'Requires renewal attention' : 'Zero stations expiring soon'}
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Distribution Progress Bar */}
        <div className="p-4 rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Fleet Status Breakdown</span>
            <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Active ({stats.active})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Expiring ({stats.expiring_soon})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Inactive/Expired ({stats.expired})</span>
              </div>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden flex">
            <div style={{ width: `${activePct}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
            <div style={{ width: `${expiringPct}%` }} className="h-full bg-amber-500 transition-all duration-500" />
            <div style={{ width: `${expiredPct}%` }} className="h-full bg-rose-500 transition-all duration-500" />
          </div>
        </div>

        {/* Two-Column Layout: Urgent Renewals & Live Sync Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Attention Required (Expiring Soon) */}
          <div className="rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icons.Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                  Renewals Due Soon (&lt; 30 Days)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {expiringList.length} Station{expiringList.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="p-4 flex-1">
              {expiringList.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Icons.Check className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-medium text-slate-300">All Nodes in Good Standing</div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    No client workstations are currently due for expiration within the next 30 days.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringList.map((lic) => (
                    <div
                      key={lic.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-white flex items-center space-x-2">
                          <span>{lic.client_name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            {lic.days_remaining}d left
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {lic.machine_id} &bull; Exp: {lic.expiry_date}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingLicense(lic);
                            setIsEditOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-colors flex items-center space-x-1.5"
                        >
                          <Icons.Edit className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Live Workstation Sync Stream */}
          <div className="rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icons.Activity className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                  Recent Telemetry Pulses
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Latest Handshakes
              </span>
            </div>

            <div className="p-4 flex-1">
              {recentSyncs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  No workstation sync pulses recorded yet. Once clients connect, they will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSyncs.map((lic) => (
                    <div
                      key={lic.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            lic.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-white">{lic.client_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {lic.machine_id} {lic.last_ip ? `• IP: ${lic.last_ip}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-indigo-300 block">
                          {lic.app_version ? `v${lic.app_version.replace(/^v/i, '')}` : 'Sync Pending'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(lic.last_sync_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Workstation Deployment Guide Snippet */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <Icons.Terminal className="w-4 h-4 text-indigo-400" />
              <span>Client Sync Integration Ready</span>
            </h4>
            <p className="text-xs text-slate-400">
              Workstations automatically sync with this server at <code className="text-indigo-300 font-mono">/api/license/sync</code>. No client configuration changes are required.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/licenses"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-950/40 whitespace-nowrap"
            >
              Go to Licenses Directory &rarr;
            </Link>
          </div>
        </div>
      </main>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={fetchFleet}
      />

      <EditLicenseModal
        isOpen={isEditOpen}
        license={editingLicense}
        onClose={() => {
          setIsEditOpen(false);
          setEditingLicense(null);
        }}
        onSuccess={fetchFleet}
      />
    </>
  );
}
