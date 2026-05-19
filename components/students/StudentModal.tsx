'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface StudentRow {
  id: string;
  nisn: string;
  fullname: string;
  class: string;
  is_active: boolean;
  homeroom_teacher?: string;
}

interface StudentModalProps {
  mode: 'add' | 'edit';
  student?: StudentRow;
  onClose: () => void;
  onSuccess: () => void;
}

const CLASSES = [
  'X IPA 1', 'X IPA 2', 'X IPA 3',
  'X IPS 1', 'X IPS 2', 'X IPS 3',
  'XI IPA 1', 'XI IPA 2', 'XI IPA 3',
  'XI IPS 1', 'XI IPS 2', 'XI IPS 3',
  'XII IPA 1', 'XII IPA 2', 'XII IPA 3',
  'XII IPS 1', 'XII IPS 2', 'XII IPS 3',
];

const HOMEROOM_MAP: Record<string, string> = {
  'X':   'Muhammad yusuf',
  'XI':  'Zainal Arifin',
  'XII': 'Ilham Fauzan',
};

function getAutoWaliKelas(className: string): string {
  if (className.startsWith('XII')) return HOMEROOM_MAP['XII'];
  if (className.startsWith('XI'))  return HOMEROOM_MAP['XI'];
  if (className.startsWith('X'))   return HOMEROOM_MAP['X'];
  return '';
}

export default function StudentModal({ mode, student, onClose, onSuccess }: StudentModalProps) {
  const [nisn, setNisn] = useState(student?.nisn ?? '');
  const [fullname, setFullname] = useState(student?.fullname ?? '');
  const [studentClass, setStudentClass] = useState(student?.class ?? CLASSES[0]);
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(student?.is_active ?? true);
  const [waliKelas, setWaliKelas] = useState(
    mode === 'edit'
      ? (student?.homeroom_teacher ?? '')
      : getAutoWaliKelas(student?.class ?? CLASSES[0])
  );
  const [waliKelasManual, setWaliKelasManual] = useState(mode === 'edit');
  const [loading, setLoading] = useState(false);
  const [nisnError, setNisnError] = useState('');
  const [error, setError] = useState('');

  // Parent account state (ADD mode only)
  const [addParent, setAddParent] = useState(false);
  const [parentForm, setParentForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
  });

  async function handleSubmit() {
    setNisnError('');
    setError('');

    if (!nisn.trim() || !fullname.trim()) {
      setError('NISN dan Nama Lengkap wajib diisi');
      return;
    }
    if (mode === 'add' && password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    // Validate parent fields if addParent is checked
    if (mode === 'add' && addParent) {
      if (!parentForm.fullname.trim()) {
        setError('Nama lengkap orang tua wajib diisi');
        return;
      }
      if (!parentForm.email.trim()) {
        setError('Email orang tua wajib diisi');
        return;
      }
      if (parentForm.password.length < 6) {
        setError('Password sementara orang tua minimal 6 karakter');
        return;
      }
    }

    setLoading(true);

    if (mode === 'add') {
      try {
        const bodyPayload: Record<string, unknown> = {
          nisn: nisn.trim(),
          fullname: fullname.trim(),
          class: studentClass,
          password,
          homeroom_teacher: waliKelas.trim() || null,
        };

        if (addParent) {
          bodyPayload.parent = {
            fullname: parentForm.fullname.trim(),
            email: parentForm.email.trim(),
            phone: parentForm.phone.trim() || undefined,
            password: parentForm.password,
          };
        }

        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });
        const data = await res.json();
        if (res.status === 409) {
          if (data.error?.includes('orang tua')) {
            setError(data.error);
          } else {
            setNisnError('NISN sudah terdaftar');
          }
        } else if (!res.ok) {
          setError(data.error ?? 'Terjadi kesalahan, coba lagi');
        } else {
          onSuccess();
          onClose();
        }
      } catch {
        setError('Gagal terhubung ke server. Periksa koneksi internet.');
      }
    } else if (student) {
      const { error: userErr } = await supabase
        .from('users')
        .update({ fullname: fullname.trim(), is_active: isActive })
        .eq('id', student.id);

      if (userErr) { setError(userErr.message); setLoading(false); return; }

      const { error: stuErr } = await supabase
        .from('students')
        .update({ class: studentClass, homeroom_teacher: waliKelas.trim() || null })
        .eq('id', student.id);

      if (stuErr) { setError(stuErr.message); setLoading(false); return; }

      onSuccess();
      onClose();
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-white rounded-2xl p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: '#001736' }}>
            {mode === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>NISN</label>
            <input
              type="text"
              value={nisn}
              onChange={e => setNisn(e.target.value)}
              readOnly={mode === 'edit'}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              style={{
                borderColor: nisnError ? '#ba1a1a' : '#e0e3e5',
                backgroundColor: mode === 'edit' ? '#f7f9fb' : '#fff',
                color: mode === 'edit' ? '#747780' : '#191c1e',
              }}
              placeholder="10 digit NISN"
            />
            {nisnError && <p className="text-xs mt-1" style={{ color: '#ba1a1a' }}>{nisnError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>Nama Lengkap</label>
            <input
              type="text"
              value={fullname}
              onChange={e => setFullname(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:border-[#006A63]"
              style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
              placeholder="Nama lengkap siswa"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>Kelas</label>
            <input
              type="text"
              list="class-options"
              value={studentClass}
              onChange={e => {
                setStudentClass(e.target.value);
                if (!waliKelasManual) setWaliKelas(getAutoWaliKelas(e.target.value));
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
              style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
              placeholder="Pilih atau ketik kelas..."
            />
            <datalist id="class-options">
              {CLASSES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>Wali Kelas</label>
            <input
              type="text"
              value={waliKelas}
              onChange={e => { setWaliKelasManual(true); setWaliKelas(e.target.value); }}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
              style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
              placeholder="Nama wali kelas"
            />
            {!waliKelasManual && (
              <p className="text-xs mt-1" style={{ color: '#747780' }}>Otomatis dari kelas — bisa diubah manual</p>
            )}
          </div>

          {mode === 'add' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>Password Sementara</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
                style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
                placeholder="Minimal 6 karakter"
              />
            </div>
          )}

          {mode === 'edit' && (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium" style={{ color: '#191c1e' }}>Status Akun</p>
                <p className="text-xs" style={{ color: '#747780' }}>Nonaktif = siswa tidak bisa login</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(v => !v)}
                className="relative w-12 h-6 rounded-full transition-colors duration-200"
                style={{ backgroundColor: isActive ? '#006A63' : '#e0e3e5' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  style={{ transform: isActive ? 'translateX(24px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          )}

          {/* Parent account section — ADD mode only */}
          {mode === 'add' && (
            <div className="rounded-xl border border-[#e0e3e5] p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addParent}
                  onChange={e => setAddParent(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#006A63]"
                />
                <span className="text-sm font-semibold" style={{ color: '#191c1e' }}>
                  Tambahkan Akun Orang Tua
                </span>
              </label>

              <AnimatePresence>
                {addParent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 mt-4 pt-4 border-t border-[#e0e3e5]">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>
                          Nama Lengkap Orang Tua <span style={{ color: '#ba1a1a' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={parentForm.fullname}
                          onChange={e => setParentForm(p => ({ ...p, fullname: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
                          style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
                          placeholder="Nama lengkap orang tua"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>
                          Email Orang Tua <span style={{ color: '#ba1a1a' }}>*</span>
                        </label>
                        <input
                          type="email"
                          value={parentForm.email}
                          onChange={e => setParentForm(p => ({ ...p, email: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
                          style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
                          placeholder="email@contoh.com"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>
                          No. Telepon Orang Tua
                        </label>
                        <input
                          type="tel"
                          value={parentForm.phone}
                          onChange={e => setParentForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
                          style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
                          placeholder="08xxxxxxxxxx (opsional)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>
                          Password Sementara Ortu <span style={{ color: '#ba1a1a' }}>*</span>
                        </label>
                        <input
                          type="password"
                          value={parentForm.password}
                          onChange={e => setParentForm(p => ({ ...p, password: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
                          style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
                          placeholder="Minimal 6 karakter"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {error && (
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: '#ffdad6', border: '1px solid #f5c2be' }}>
              <p className="text-sm" style={{ color: '#93000a' }}>{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm transition-colors hover:bg-[#f7f9fb]"
            style={{ border: '1px solid #e0e3e5', color: '#43474f' }}>
            Batal
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#001736' }}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
