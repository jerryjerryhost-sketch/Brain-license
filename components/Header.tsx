'use client';

import React from 'react';
import { Icons } from './Icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onRegisterClick?: () => void;
}

export default function Header({
  title,
  subtitle,
  onOpenSidebar,
  onRefresh,
  isRefreshing,
  onRegisterClick,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left Title & Mobile Menu Button */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          aria-label="Open Navigation"
        >
          <Icons.Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{title}</span>
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-400 hidden sm:block font-sans">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Real-time Edge Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">Edge Registry Live</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh records from cloud database"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Icons.Refresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        )}

        {onRegisterClick && (
          <button
            onClick={onRegisterClick}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-950/40 flex items-center space-x-2"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Register Node</span>
          </button>
        )}
      </div>
    </header>
  );
}
