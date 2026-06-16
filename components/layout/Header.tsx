'use client';

import { Bell, Menu } from 'lucide-react';
import SettingsMenu from './SettingsMenu';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header
      style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e0e3e5', height: 56 }}
      className="fixed top-0 right-0 left-0 md:left-60 z-10 flex items-center justify-between px-4 md:px-6"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg hover:bg-[#f2f4f6] transition-colors"
          style={{ color: '#43474f' }}
        >
          <Menu size={20} />
        </button>
        <p style={{ color: '#191c1e' }} className="font-semibold text-sm tracking-wide">
          STAKAD SMAN 07
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button style={{ color: '#43474f' }} className="p-1.5 rounded-lg hover:bg-[#f2f4f6] transition-colors">
          <Bell size={18} />
        </button>
        <SettingsMenu />
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
