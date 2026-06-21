'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  Gauge,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Student Data', icon: Users },
  { href: '/grades', label: 'Grade Input', icon: BookOpen },
  { href: '/attendance',    label: 'Attendance',    icon: CalendarCheck },
  { href: '/notifications', label: 'Notifications', icon: Megaphone     },
  { href: '/audit',         label: 'Audit Log',     icon: ClipboardList },
  { href: '/accuracy',      label: 'Accuracy',      icon: Gauge },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      style={{ backgroundColor: '#001736', width: 240, minHeight: '100vh' }}
      className="flex flex-col"
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: '#264778' }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          >
            A
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SMAN 07</p>
            <p style={{ color: '#7594ca' }} className="text-xs leading-tight">Kab. Tangerang</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white md:hidden p-1">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              style={{
                backgroundColor: active ? '#264778' : 'transparent',
                color: active ? '#a9c7ff' : '#c4c6d0',
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-[background-color,transform] duration-150 hover:bg-[#002b5b] active:scale-[0.97]"
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 border-t border-[#264778] pt-4 mt-2">
        <button
          style={{ color: '#c4c6d0' }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm hover:bg-[#002b5b] transition-[background-color,transform] duration-150 active:scale-[0.97]"
        >
          <HelpCircle size={18} />
          Help Center
        </button>
        <button
          onClick={handleLogout}
          style={{ color: '#ff8a80' }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm hover:bg-[#002b5b] transition-[background-color,transform] duration-150 active:scale-[0.97]"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
