'use client';

import React, { useState } from 'react';
import { Icons } from './Icons';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSuccess }: RegisterModalProps) {
  const [clientName, setClientName] = useState('');
  const [machineId, setMachineId] = useState('');
  const [duration, setDuration] = useState('365');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanClient = clientName.trim();
    const cleanHwid = machineId.trim().toUpperCase();

    if (!cleanClient || !cleanHwid) {
      setError('Both Client Name and Machine ID are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: cleanClient,
          machine_id: cleanHwid,
          days: duration === 'PERPETUAL' ? 0 : Number(duration),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setClientName('');
        setMachineId('');
        setDuration('365');
        setNotes('');
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to issue license.');
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
              <Icons.Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Register Client Workstation</h3>
              <p className="text-[11px] text-slate-400">Generate cryptographic node-locked license</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Client or Facility Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Salem Surgicals & Diagnostics"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-[#090D16] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Hardware Machine ID (HWID) *
            </label>
            <input
              type="text"
              required
              placeholder="DH-XXXX-XXXX-XXXX-XXXX"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value.toUpperCase())}
              className="w-full bg-[#090D16] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase placeholder-slate-600 focus:outline-none transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              Displayed directly on the customer's Brain Workstation activation dialog.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Validity Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[#090D16] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none transition-colors"
            >
              <option value="30">30 Days (Evaluation / Trial)</option>
              <option value="90">90 Days (Quarterly Plan)</option>
              <option value="180">180 Days (Half-Yearly Plan)</option>
              <option value="365">365 Days (1-Year Annual Subscription)</option>
              <option value="730">730 Days (2-Year Enterprise Term)</option>
              <option value="PERPETUAL">PERPETUAL (Permanent Lifetime License)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Administrative Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Purchase Order #8920, Onsite installation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#090D16] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all shadow-md shadow-indigo-950/40 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing & Registering...</span>
                </>
              ) : (
                <>
                  <Icons.Key className="w-3.5 h-3.5" />
                  <span>Generate & Issue License</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
