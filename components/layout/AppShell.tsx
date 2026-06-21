'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const isLoginPage = pathname === '/login';

  // Hanya admin yang sudah login boleh mengakses halaman internal.
  useEffect(() => {
    if (isLoginPage) {
      queueMicrotask(() => setAuthChecked(true));
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        router.replace('/login');
      } else {
        setAuthChecked(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) router.replace('/login');
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  // Halaman login tampil penuh tanpa sidebar/header.
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Tahan render sampai sesi terverifikasi (mencegah konten bocor sekejap).
  if (!authChecked) {
    return null;
  }

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
