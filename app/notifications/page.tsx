'use client';

import { useState, useEffect } from 'react';
import { Send, Users, School, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Target = 'all' | 'class' | 'student';

interface StudentOption {
  id: string;
  fullname: string;
  nisn: string;
  class: string;
}

const TARGET_OPTIONS: { value: Target; label: string; icon: React.ElementType }[] = [
  { value: 'all',     label: 'Semua Siswa',    icon: Users  },
  { value: 'class',   label: 'Per Kelas',      icon: School },
  { value: 'student', label: 'Siswa Tertentu', icon: User   },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    supabase.from('students').select('class').then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map((d: { class: string }) => d.class))].sort();
        setClasses(unique);
      }
    });

    supabase
      .from('users')
      .select('id, nisn, fullname, students!students_id_fkey!inner(class)')
      .eq('role', 'siswa')
      .eq('is_active', true)
      .order('fullname')
      .then(({ data }) => {
        if (data) {
          setStudents(data.map((u: Record<string, unknown>) => {
            const stu = u.students as Record<string, string> | null;
            return {
              id: u.id as string,
              fullname: u.fullname as string,
              nisn: u.nisn as string,
              class: stu?.class ?? '',
            };
          }));
        }
      });
  }, []);

  async function handleSend() {
    setResult(null);
    setSending(true);

    const payload: Record<string, string> = { title, body, target };
    if (target === 'class')   payload.class      = selectedClass;
    if (target === 'student') payload.student_id = selectedStudent;

    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSending(false);

    if (!res.ok) {
      setResult({ ok: false, msg: json.error ?? 'Gagal mengirim notifikasi' });
    } else {
      setResult({ ok: true, msg: `Notifikasi berhasil dikirim ke ${json.sent} siswa` });
      setTitle('');
      setBody('');
    }
  }

  const canSend =
    title.trim() &&
    body.trim() &&
    (target === 'all' ||
      (target === 'class' && selectedClass) ||
      (target === 'student' && selectedStudent));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#191c1e' }}>
          Kirim Notifikasi
        </h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: '#43474f' }}>
          Tulis dan kirim pengumuman langsung ke aplikasi siswa.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e3e5] p-5 md:p-6 max-w-2xl">

        {/* Target */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#43474f' }}>
            Kirim ke
          </label>
          <div className="flex flex-wrap gap-2">
            {TARGET_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setTarget(value); setSelectedClass(''); setSelectedStudent(''); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  backgroundColor: target === value ? '#001736' : '#f7f9fb',
                  color: target === value ? '#fff' : '#43474f',
                  borderColor: target === value ? '#001736' : '#e0e3e5',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {target === 'class' && (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="mt-3 w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-[#264778]"
              style={{ borderColor: '#e0e3e5', color: '#43474f' }}
            >
              <option value="">Pilih kelas...</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {target === 'student' && (
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="mt-3 w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-[#264778]"
              style={{ borderColor: '#e0e3e5', color: '#43474f' }}
            >
              <option value="">Pilih siswa...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullname} — {s.class} ({s.nisn})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Judul */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#43474f' }}>
            Judul
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Contoh: Libur Hari Raya, Jadwal Ujian Berubah..."
            maxLength={100}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#264778]"
            style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
          />
        </div>

        {/* Isi */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#43474f' }}>
            Isi Notifikasi
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Tulis isi pengumuman di sini..."
            rows={5}
            maxLength={500}
            className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#264778] resize-none"
            style={{ borderColor: '#e0e3e5', color: '#191c1e' }}
          />
          <p className="text-xs mt-1 text-right" style={{ color: '#747780' }}>
            {body.length}/500 karakter
          </p>
        </div>

        {result && (
          <div
            className="px-4 py-3 rounded-lg mb-4 text-sm"
            style={{
              backgroundColor: result.ok ? '#d8f5f3' : '#ffdad6',
              color: result.ok ? '#007169' : '#ba1a1a',
            }}
          >
            {result.msg}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !canSend}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#001736' }}
        >
          <Send size={15} />
          {sending ? 'Mengirim...' : 'Kirim Notifikasi'}
        </button>
      </div>
    </div>
  );
}
