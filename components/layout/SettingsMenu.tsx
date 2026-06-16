'use client';

import { useEffect, useRef, useState } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function resetForm() {
    setNewPassword('');
    setConfirm('');
    setError('');
    setSuccess(false);
    setShow(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (open) resetForm();
        }}
        aria-label="Pengaturan"
        title="Ganti Password"
        style={{ color: '#43474f' }}
        className="p-1.5 rounded-lg hover:bg-[#f2f4f6] transition-colors"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg p-4 z-30"
          style={{ border: '1px solid #e0e3e5' }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: '#191c1e' }}>
            Ganti Password
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password baru (min. 6 karakter)"
                className="w-full px-3 py-2 pr-9 text-sm rounded-lg border outline-none focus:ring-2"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5"
                style={{ color: '#43474f' }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <input
              type={show ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Konfirmasi password baru"
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2"
              style={inputStyle}
            />

            {error && (
              <p
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: '#ffdad6', color: '#ba1a1a' }}
              >
                {error}
              </p>
            )}
            {success && (
              <p
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: '#d7f5e0', color: '#0a7c3f' }}
              >
                Password berhasil diubah.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#001736' }}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
