'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setNewPassword('');
      setConfirm('');
      setLoading(false);
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      setLoading(false);
    }
  }

  const inputStyle = {
    borderColor: '#c4c6d0',
    color: '#191c1e',
    backgroundColor: '#f7f9fb',
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1" style={{ color: '#191c1e' }}>
        Pengaturan
      </h1>
      <p className="text-sm mb-6" style={{ color: '#43474f' }}>
        Kelola akun admin Anda.
      </p>

      <div
        className="bg-white rounded-2xl shadow-sm p-6"
        style={{ border: '1px solid #e0e3e5' }}
      >
        <h2 className="text-base font-semibold mb-1" style={{ color: '#191c1e' }}>
          Ganti Password
        </h2>
        <p className="text-xs mb-5" style={{ color: '#43474f' }}>
          Masuk sebagai <strong>{email || '...'}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: '#43474f' }}
            >
              Password Baru
            </label>
            <input
              id="newPassword"
              type={show ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: '#43474f' }}
            >
              Konfirmasi Password Baru
            </label>
            <input
              id="confirm"
              type={show ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>

          <label className="flex items-center gap-2 text-xs" style={{ color: '#43474f' }}>
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            Tampilkan password
          </label>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#ffdad6', color: '#ba1a1a' }}
            >
              {error}
            </p>
          )}

          {success && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#d7f5e0', color: '#0a7c3f' }}
            >
              Password berhasil diubah.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#001736' }}
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}
