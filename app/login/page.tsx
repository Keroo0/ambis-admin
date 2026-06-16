'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function mapAuthError(message: string): string {
    const m = message.toLowerCase();

    if (m.includes('invalid login credentials')) {
      return 'Email atau password salah. Periksa kembali keduanya.';
    }
    if (m.includes('email not confirmed')) {
      return 'Email belum diverifikasi. Cek kotak masuk email Anda.';
    }
    if (m.includes('invalid email')) {
      return 'Format email tidak valid.';
    }
    if (m.includes('rate limit') || m.includes('too many requests')) {
      return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
    }
    if (m.includes('user not found')) {
      return 'Akun dengan email ini tidak ditemukan.';
    }
    return message || 'Login gagal. Silakan coba lagi.';
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.user) {
        setError(
          signInError ? mapAuthError(signInError.message) : 'Login gagal. Silakan coba lagi.',
        );
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
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      setLoading(false);
    }
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border outline-none focus:ring-2"
                style={{
                  borderColor: '#c4c6d0',
                  color: '#191c1e',
                  backgroundColor: '#f7f9fb',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                style={{ color: '#43474f' }}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
