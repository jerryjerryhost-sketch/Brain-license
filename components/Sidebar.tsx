'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCount?: number;
}

export default function Sidebar({ isOpen, onClose, activeCount }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Fleet Dashboard',
      href: '/',
      icon: Icons.Dashboard,
      badge: null,
    },
    {
      label: 'Workstations & Keys',
      href: '/licenses',
      icon: Icons.Key,
      badge: activeCount !== undefined && activeCount > 0 ? `${activeCount} Active` : null,
    },
    {
      label: 'Cloud Settings & API',
      href: '/settings',
      icon: Icons.Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/70">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-indigo-950/50 group-hover:scale-105 transition-transform">
                <Icons.Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold tracking-tight text-white font-sans">BRAIN</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    HUB
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                  License Cloud
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
              Fleet Management
            </div>

            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Health & User Info */}
        <div className="p-3 border-t border-slate-800/70 space-y-2.5 bg-slate-950/40">
          {/* Cloud Health Card */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Serverless Edge</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400 font-bold font-mono text-[10px]">HEALTHY</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>HMAC-SHA256</span>
              <span className="text-indigo-400">Node-Locked</span>
            </div>
          </div>

          {/* User / Org Footer */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-300">
                A
              </div>
              <div className="text-[11px] font-medium text-slate-300">Administrator</div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">v2.4.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
