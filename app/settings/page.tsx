'use client';

import React, { useState, useContext } from 'react';
import Header from '@/components/Header';
import { SidebarContext } from '@/components/DashboardShell';
import { Icons } from '@/components/Icons';

export default function SettingsPage() {
  const { openSidebar } = useContext(SidebarContext);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const endpointUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/license/sync`
    : 'https://brain-license.vercel.app/api/license/sync';

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  return (
    <>
      <Header
        title="Cloud Settings & API"
        subtitle="Serverless endpoints, cryptographic specifications & offline sync protocol"
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
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center space-x-2 shrink-0"
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
                <span><strong>HMAC-SHA256:</strong> Cryptographic signatures signed with the master vendor secret.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Hardware Binding:</strong> Tied strictly to CPU, BIOS serials, and motherboard UUID.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Zero Cross-Node Sharing:</strong> A license created for Node A will fail verification on Node B.</span>
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
                <span><strong>3.5s Silent Timeout:</strong> If cloud is unreachable, clients continue without any lag.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-sky-400 font-bold">&bull;</span>
                <span><strong>Self-Healing:</strong> Upon remote extension in this portal, the client auto-updates on next sync.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Database & Deployment Status */}
        <div className="rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <Icons.Activity className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Infrastructure & Runtime
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-slate-400 block text-[10px] font-mono">HOSTING PROVIDER</span>
              <span className="text-white font-semibold">Vercel Serverless Edge</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-slate-400 block text-[10px] font-mono">DATABASE TIER</span>
              <span className="text-white font-semibold">Supabase PostgreSQL (Active)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-slate-400 block text-[10px] font-mono">CLIENT VERSION</span>
              <span className="text-white font-semibold">Brain Workstation v2.4+</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
