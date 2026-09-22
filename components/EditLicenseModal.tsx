'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

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
  notes?: string;
  days_remaining?: number | 'PERPETUAL';
}

interface EditLicenseModalProps {
  isOpen: boolean;
  license: LicenseRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditLicenseModal({ isOpen, license, onClose, onSuccess }: EditLicenseModalProps) {
  const [maxUsers, setMaxUsers] = useState<number>(0);
  const [validityOption, setValidityOption] = useState<string>('30d');
  const [customDays, setCustomDays] = useState<string>('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (license) {
      setMaxUsers(license.max_users !== undefined ? Number(license.max_users) : 0);
      if (license.expiry_date === 'PERPETUAL') {
        setValidityOption('perpetual');
      } else {
        setValidityOption('30d');
      }
      setError(null);
    }
  }, [license]);

  if (!isOpen || !license) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/licenses/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: license.machine_id,
          action: 'update_license',
          validity_option: validityOption,
          custom_days: validityOption === 'custom' ? Number(customDays || 30) : undefined,
          max_users: Number(maxUsers || 0),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to update license.');
      }
    } catch {
      setError('Network communication failure. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Icons.Edit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Manage Workstation License</h3>
              <p className="text-[11px] text-slate-400">Update validity period & user account limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Node Information Card */}
        <div className="bg-[#090D16] border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Workstation / Client</span>
            <span className="font-semibold text-white">{license.client_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Hardware ID (HWID)</span>
            <span className="font-mono text-indigo-300 text-[11px]">{license.machine_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Expiration</span>
            <span className="font-mono text-emerald-400 font-medium">
              {license.expiry_date === 'PERPETUAL' ? 'Permanent Lifetime' : license.expiry_date}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* User Limits Input */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              User Limit (Max Active Accounts)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                required
                value={maxUsers}
                onChange={(e) => setMaxUsers(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full bg-[#090D16] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500">
                {maxUsers === 0 ? 'Unlimited' : 'Accounts'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              Set 0 for Unlimited Users, or specific count (e.g. 5 users allowed).
            </p>
          </div>

          {/* Streamlined Validity Duration Dropdown */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Validity Duration (Extend / Renew)
            </label>
            <select
              value={validityOption}
              onChange={(e) => setValidityOption(e.target.value)}
              className="w-full bg-[#090D16] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none transition-colors"
            >
              <option value="15d">15 Days</option>
              <option value="30d">30 Days (1 Month)</option>
              <option value="180d">6 Months (180 Days)</option>
              <option value="365d">1 Year (365 Days)</option>
              <option value="perpetual">Lifetime (Perpetual)</option>
              <option value="custom">Custom Days</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Extends license validity and cryptographically re-signs the key.
            </p>
          </div>

          {/* Custom Days Input if Custom selected */}
          {validityOption === 'custom' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-slate-300 font-semibold mb-1.5">
                Number of Custom Days *
              </label>
              <input
                type="number"
                min="1"
                required
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="e.g. 45"
                className="w-full bg-[#090D16] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Sync Guarantee Notice */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-start space-x-2">
            <Icons.Pulse className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <span>
              <strong>Real-Time Sync:</strong> The workstation will automatically synchronize this updated duration and user limit within 60 seconds (or immediately on manual sync).
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-950/40 flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving & Pushing...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-3.5 h-3.5" />
                  <span>Update & Push to Client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
