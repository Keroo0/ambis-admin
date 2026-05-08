'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Login gagal.');
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (userData?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Akses ditolak. Hanya akun admin yang dapat masuk.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#f7f9fb' }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8"
        style={{ border: '1px solid #e0e3e5' }}
      >
        {/* Logo area */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3"
            style={{ backgroundColor: '#001736' }}
          >
            A
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#001736' }}>
            AMBIS Admin
          </h1>
          <p className="text-sm mt-1" style={{ color: '#43474f' }}>
            SMAN 07 Kab. Tangerang
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: '#43474f' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sman07.local"
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none focus:ring-2"
              style={{
                borderColor: '#c4c6d0',
                color: '#191c1e',
                backgroundColor: '#f7f9fb',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: '#43474f' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none focus:ring-2"
              style={{
                borderColor: '#c4c6d0',
                color: '#191c1e',
                backgroundColor: '#f7f9fb',
              }}
            />
          </div>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#ffdad6', color: '#ba1a1a' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#001736' }}
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
