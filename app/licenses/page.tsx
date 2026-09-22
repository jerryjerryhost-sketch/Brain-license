'use client';

import React, { useState, useEffect, useContext } from 'react';
import Header from '@/components/Header';
import RegisterModal from '@/components/RegisterModal';
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

export default function LicensesPage() {
  const { openSidebar } = useContext(SidebarContext);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, online: 0, expiring_soon: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/licenses');
      const data = await res.json();
      if (data.success) {
        setLicenses(data.licenses || []);
        setStats(data.stats || { total: 0, active: 0, online: 0, expiring_soon: 0, expired: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadLicFile = (license: LicenseRecord) => {
    const blob = new Blob([license.license_key], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license_${license.client_name.replace(/[^a-zA-Z0-9]/g, '_')}.lic`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleQuickAction = async (machineId: string, action: string, days: number = 0) => {
    try {
      setActionLoadingId(machineId);
      const res = await fetch('/api/admin/licenses/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: machineId, action, days }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLicenses();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch {
      alert('Network failure executing action.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete workstation "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/licenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchLicenses();
    } catch {
      alert('Delete failed');
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

  // Filter list
  const filteredLicenses = licenses.filter((lic) => {
    const query = search.toLowerCase();
    const matchesSearch =
      lic.client_name.toLowerCase().includes(query) ||
      lic.machine_id.toLowerCase().includes(query) ||
      (lic.notes && lic.notes.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return lic.status === 'ACTIVE' && !lic.is_expired;
    if (statusFilter === 'ONLINE') return lic.is_online;
    if (statusFilter === 'EXPIRING_SOON') return lic.is_expiring_soon;
    if (statusFilter === 'EXPIRED') return lic.is_expired || lic.status === 'SUSPENDED';
    return true;
  });

  return (
    <>
      <Header
        title="Workstation Licenses"
        subtitle="Cryptographic node registry, remote renewals & offline `.lic` key issuance"
        onOpenSidebar={openSidebar}
        onRefresh={fetchLicenses}
        isRefreshing={loading}
        onRegisterClick={() => setIsRegisterOpen(true)}
      />

      <main className="p-4 md:p-8 space-y-5 max-w-7xl w-full mx-auto">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0F172A]/70 border border-slate-800/80 p-3 rounded-2xl">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Client Name, Machine HWID, or Notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#090D16] border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
            {[
              { id: 'ALL', label: 'All Stations', count: stats.total },
              { id: 'ACTIVE', label: 'Active', count: stats.active },
              { id: 'ONLINE', label: 'Live Online', count: stats.online },
              { id: 'EXPIRING_SOON', label: 'Expiring Soon', count: stats.expiring_soon },
              { id: 'EXPIRED', label: 'Suspended / Expired', count: stats.expired },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Workstations Table Card */}
        <div className="rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#090D16] text-slate-400 font-mono text-[10px] tracking-wider uppercase border-b border-slate-800">
                  <th className="px-5 py-3.5 font-semibold">Client & Workstation</th>
                  <th className="px-5 py-3.5 font-semibold">Hardware Node (HWID)</th>
                  <th className="px-5 py-3.5 font-semibold">License Status</th>
                  <th className="px-5 py-3.5 font-semibold">Validity Period</th>
                  <th className="px-5 py-3.5 font-semibold">Sync Telemetry</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                        <Icons.Key className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                        <span className="text-sm font-medium text-slate-400">No workstation records found</span>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {search
                            ? 'No clients match your search query. Try clearing the search.'
                            : 'Click "Register Node" at the top right to issue your first license key.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((lic) => {
                    const isBusy = actionLoadingId === lic.machine_id;

                    return (
                      <tr
                        key={lic.id}
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* Client details */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white text-sm tracking-tight">
                            {lic.client_name}
                          </div>
                          {lic.notes && (
                            <div className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate">
                              {lic.notes}
                            </div>
                          )}
                          <div className="flex items-center space-x-1.5 mt-1">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              {lic.app_version ? `v${lic.app_version}` : 'v2.4.0'}
                            </span>
                            {lic.license_type === 'PERPETUAL' && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                LIFETIME
                              </span>
                            )}
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                              {lic.max_users && lic.max_users > 0 ? `${lic.max_users} Users` : 'Unlimited Users'}
                            </span>
                          </div>
                        </td>

                        {/* Hardware ID with copy */}
                        <td className="px-5 py-4 font-mono">
                          <button
                            onClick={() => handleCopy(lic.machine_id, lic.id)}
                            title="Click to copy Hardware Node ID"
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#090D16] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                          >
                            <span>{lic.machine_id}</span>
                            <span className="text-slate-500">
                              {copiedId === lic.id ? (
                                <Icons.Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Icons.Copy className="w-3 h-3 text-slate-500" />
                              )}
                            </span>
                          </button>
                        </td>

                        {/* License Status */}
                        <td className="px-5 py-4">
                          {lic.status === 'SUSPENDED' ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              <span>Suspended</span>
                            </span>
                          ) : lic.is_expired ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              <span>Expired</span>
                            </span>
                          ) : lic.is_expiring_soon ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>Expiring Soon</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* Validity Period */}
                        <td className="px-5 py-4 font-mono">
                          <div className="font-semibold text-slate-200">
                            {lic.expiry_date === 'PERPETUAL' ? 'Permanent Lifetime' : lic.expiry_date}
                          </div>
                          {lic.expiry_date !== 'PERPETUAL' && (
                            <div
                              className={`text-[11px] mt-0.5 ${
                                lic.is_expired
                                  ? 'text-rose-400 font-semibold'
                                  : lic.is_expiring_soon
                                  ? 'text-amber-400 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {lic.is_expired
                                ? `Expired ${Math.abs(Number(lic.days_remaining))}d ago`
                                : `${lic.days_remaining} days remaining`}
                            </div>
                          )}
                        </td>

                        {/* Sync Telemetry */}
                        <td className="px-5 py-4 font-mono text-[11px]">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                lic.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                              }`}
                            />
                            <span className={lic.is_online ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                              {lic.is_online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatRelativeTime(lic.last_sync_at)} {lic.last_ip ? `(${lic.last_ip})` : ''}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Quick Extensions */}
                            <button
                              disabled={isBusy}
                              onClick={() => handleQuickAction(lic.machine_id, 'extend_days', 30)}
                              title="Extend validity +30 Days"
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-mono transition-colors"
                            >
                              +30d
                            </button>
                            <button
                              disabled={isBusy}
                              onClick={() => handleQuickAction(lic.machine_id, 'extend_days', 365)}
                              title="Extend validity +1 Year"
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-mono font-semibold transition-colors"
                            >
                              +1yr
                            </button>
                            <button
                              disabled={isBusy}
                              onClick={() => handleQuickAction(lic.machine_id, 'set_perpetual')}
                              title="Set Perpetual (Lifetime license)"
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-mono transition-colors"
                            >
                              &infin;
                            </button>

                            {/* Download .lic */}
                            <button
                              onClick={() => downloadLicFile(lic)}
                              title="Download signed offline .lic file"
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors"
                            >
                              <Icons.Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Suspend */}
                            <button
                              disabled={isBusy}
                              onClick={() => handleQuickAction(lic.machine_id, 'toggle_suspend')}
                              title={lic.status === 'SUSPENDED' ? 'Re-activate workstation' : 'Suspend workstation'}
                              className={`p-1.5 border rounded-lg transition-colors ${
                                lic.status === 'SUSPENDED'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                              }`}
                            >
                              {lic.status === 'SUSPENDED' ? (
                                <Icons.Unlock className="w-3.5 h-3.5" />
                              ) : (
                                <Icons.Lock className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              disabled={isBusy}
                              onClick={() => handleDelete(lic.id, lic.client_name)}
                              title="Permanently remove workstation"
                              className="p-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 rounded-lg transition-colors"
                            >
                              <Icons.Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={fetchLicenses}
      />
    </>
  );
}
