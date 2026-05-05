'use client';

import { Bell, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header
      style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e0e3e5', height: 56, left: 240 }}
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6"
    >
      <p style={{ color: '#191c1e' }} className="font-semibold text-sm tracking-wide">
        STAKAD SMAN 07
      </p>
      <div className="flex items-center gap-3">
        <button style={{ color: '#43474f' }} className="p-1.5 rounded-lg hover:bg-[#f2f4f6] transition-colors">
          <Bell size={18} />
        </button>
        <button style={{ color: '#43474f' }} className="p-1.5 rounded-lg hover:bg-[#f2f4f6] transition-colors">
          <Settings size={18} />
        </button>
        <div
          style={{ backgroundColor: '#264778' }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs cursor-pointer"
        >
          A
        </div>
      </div>
    </header>
  );
}
