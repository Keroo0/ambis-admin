'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={`fixed left-0 top-0 bottom-0 z-30 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <Header onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-60 pt-14 min-h-screen">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </>
  );
}
