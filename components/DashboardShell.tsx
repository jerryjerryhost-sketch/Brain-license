'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';

export const SidebarContext = React.createContext<{
  openSidebar: () => void;
}>({
  openSidebar: () => {},
});

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ openSidebar: () => setSidebarOpen(true) }}>
      <div className="min-h-screen bg-[#080C15] text-slate-100 flex flex-col font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
