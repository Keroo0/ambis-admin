'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteStudentDialogProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteStudentDialog({
  studentId,
  studentName,
  onClose,
  onSuccess,
}: DeleteStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: studentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Terjadi kesalahan, coba lagi');
        setLoading(false);
        return;
      }
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#ffdad6' }}
          >
            <AlertTriangle size={20} style={{ color: '#ba1a1a' }} />
          </div>
          <div>
            <h3 className="font-semibold text-base" style={{ color: '#001736' }}>
              Hapus Siswa?
            </h3>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#43474f' }}>
              Data siswa{' '}
              <span className="font-medium" style={{ color: '#001736' }}>
                {studentName}
              </span>{' '}
              beserta seluruh data absensi dan wajah akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 mb-4" style={{ backgroundColor: '#ffdad6' }}>
            <p className="text-sm" style={{ color: '#93000a' }}>{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl py-2.5 text-sm transition-colors hover:bg-[#f7f9fb]"
            style={{ border: '1px solid #e0e3e5', color: '#43474f' }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: '#ba1a1a' }}
          >
            {loading ? 'Menghapus...' : 'Hapus Permanen'}
          </button>
        </div>
      </div>
    </div>
  );
}
