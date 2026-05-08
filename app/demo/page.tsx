'use client';

import { useState } from 'react';
import { FlaskConical, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const DEMO_PREFIX = 'demo0000-0000-0000-0000-';

const DEMO_STUDENTS = [
  { suffix: '000000000001', name: 'Demo Siswa Satu',   nisn: 'DEMO000001', klass: '10A', gender: 'M' },
  { suffix: '000000000002', name: 'Demo Siswa Dua',    nisn: 'DEMO000002', klass: '10A', gender: 'F' },
  { suffix: '000000000003', name: 'Demo Siswa Tiga',   nisn: 'DEMO000003', klass: '11B', gender: 'M' },
  { suffix: '000000000004', name: 'Demo Siswa Empat',  nisn: 'DEMO000004', klass: '11B', gender: 'F' },
  { suffix: '000000000005', name: 'Demo Siswa Lima',   nisn: 'DEMO000005', klass: '10A', gender: 'M' },
];

const SUBJECTS = ['Matematika', 'Bahasa Indonesia', 'IPA'];
const SCORE_TABLE = [
  [85, 88, 80, 90, 75],
  [78, 92, 85, 70, 88],
  [90, 76, 93, 82, 79],
];
const UAS_OFFSET = [3, -2, 4, -3, 2];

function getWeekdays(n: number): string[] {
  const days: string[] = [];
  let d = new Date();
  while (days.length < n) {
    d = new Date(d.getTime() - 86400000);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(d.toISOString().split('T')[0]);
    }
  }
  return days;
}

type Status = 'idle' | 'seeding' | 'deleting' | 'done' | 'error';

export default function DemoPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function seed() {
    setStatus('seeding');
    setMessage('');
    try {
      const now = Date.now();

      // 1. Users
      const users = DEMO_STUDENTS.map((s) => ({
        id: DEMO_PREFIX + s.suffix,
        nisn: s.nisn,
        password_hash: 'demo',
        role: 'siswa',
        fullname: s.name,
        email: `${s.nisn.toLowerCase()}@sman07.local`,
        is_active: true,
        created_at: now,
        updated_at: now,
      }));
      const { error: uErr } = await supabase.from('users').upsert(users, { onConflict: 'id' });
      if (uErr) throw uErr;

      // 2. Students
      const students = DEMO_STUDENTS.map((s) => ({
        id: DEMO_PREFIX + s.suffix,
        nisn: s.nisn,
        class: s.klass,
        gender: s.gender,
        created_at: now,
        updated_at: now,
      }));
      const { error: sErr } = await supabase.from('students').upsert(students, { onConflict: 'id' });
      if (sErr) throw sErr;

      // 3. Grades
      const grades: object[] = [];
      DEMO_STUDENTS.forEach((stu, si) => {
        SUBJECTS.forEach((subj, subji) => {
          const utsScore = SCORE_TABLE[subji][si];
          const uasScore = Math.min(100, Math.max(0, utsScore + UAS_OFFSET[si]));
          grades.push({ id: uuidv4(), student_id: DEMO_PREFIX + stu.suffix, subject: subj, type: 'UTS', score: utsScore, semester: 1, year: new Date().getFullYear(), created_at: now, updated_at: now });
          grades.push({ id: uuidv4(), student_id: DEMO_PREFIX + stu.suffix, subject: subj, type: 'UAS', score: uasScore, semester: 1, year: new Date().getFullYear(), created_at: now, updated_at: now });
        });
      });
      const { error: gErr } = await supabase.from('grades').insert(grades);
      if (gErr) throw gErr;

      // 4. Attendance (last 5 weekdays)
      const weekdays = getWeekdays(5);
      const attendance: object[] = [];
      DEMO_STUDENTS.forEach((stu) => {
        weekdays.forEach((date) => {
          attendance.push({
            id: uuidv4(),
            student_id: DEMO_PREFIX + stu.suffix,
            date,
            time_in: '07:15:00',
            time_out: '14:30:00',
            status: 'present',
            is_within_geofence: true,
            liveness_verified: true,
            notes: '[demo]',
            created_at: now,
            updated_at: now,
          });
        });
      });
      const { error: aErr } = await supabase.from('attendance').insert(attendance);
      if (aErr) throw aErr;

      // 5. Leave requests (2 pending)
      const leaves = [
        {
          id: uuidv4(),
          student_id: DEMO_PREFIX + DEMO_STUDENTS[0].suffix,
          type: 'sakit',
          reason: 'Demam sejak kemarin',
          status: 'pending',
          date_from: weekdays[0],
          date_to: weekdays[0],
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          student_id: DEMO_PREFIX + DEMO_STUDENTS[2].suffix,
          type: 'izin',
          reason: 'Keperluan keluarga',
          status: 'pending',
          date_from: weekdays[1],
          date_to: weekdays[1],
          created_at: now,
          updated_at: now,
        },
      ];
      const { error: lErr } = await supabase.from('leave_requests').insert(leaves);
      if (lErr) throw lErr;

      setStatus('done');
      setMessage('Demo data berhasil di-seed. 5 siswa, nilai, absensi, dan 2 izin pending sudah tersedia.');
    } catch (e: unknown) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function deleteDemoData() {
    setStatus('deleting');
    setMessage('');
    try {
      const ids = DEMO_STUDENTS.map((s) => DEMO_PREFIX + s.suffix);

      // Delete in FK order
      await supabase.from('leave_requests').delete().in('student_id', ids);
      await supabase.from('attendance').delete().in('student_id', ids);
      await supabase.from('grades').delete().in('student_id', ids);
      await supabase.from('students').delete().in('id', ids);
      await supabase.from('users').delete().in('id', ids);

      setStatus('done');
      setMessage('Semua demo data berhasil dihapus.');
    } catch (e: unknown) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#191c1e' }}>
          Demo Data
        </h1>
        <p className="text-sm mt-1" style={{ color: '#43474f' }}>
          Seed atau hapus data demo untuk keperluan presentasi thesis.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Seed card */}
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#d8f5f3', color: '#007169' }}>
              <FlaskConical size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#191c1e' }}>Seed Demo Data</p>
              <p className="text-xs" style={{ color: '#747780' }}>5 siswa, nilai, absensi, izin</p>
            </div>
          </div>
          <ul className="text-xs mb-4 space-y-1" style={{ color: '#43474f' }}>
            <li>• 5 siswa demo (kelas 10A &amp; 11B)</li>
            <li>• Nilai UTS &amp; UAS 3 mata pelajaran</li>
            <li>• Absensi 5 hari kerja terakhir</li>
            <li>• 2 pengajuan izin berstatus Pending</li>
          </ul>
          <button
            onClick={seed}
            disabled={status === 'seeding' || status === 'deleting'}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#001736' }}
          >
            {status === 'seeding' && <Loader2 size={15} className="animate-spin" />}
            {status === 'seeding' ? 'Menyemai...' : 'Seed Data'}
          </button>
        </div>

        {/* Delete card */}
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ffdad6', color: '#ba1a1a' }}>
              <Trash2 size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#191c1e' }}>Hapus Demo Data</p>
              <p className="text-xs" style={{ color: '#747780' }}>Bersihkan semua data demo</p>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: '#43474f' }}>
            Menghapus semua baris yang terkait dengan 5 akun demo (berdasarkan ID tetap). Data siswa real tidak terpengaruh.
          </p>
          <button
            onClick={deleteDemoData}
            disabled={status === 'seeding' || status === 'deleting'}
            className="w-full py-2.5 rounded-lg text-sm font-semibold border flex items-center justify-center gap-2 transition-colors hover:bg-[#fff5f5] disabled:opacity-50"
            style={{ borderColor: '#ffdad6', color: '#ba1a1a' }}
          >
            {status === 'deleting' && <Loader2 size={15} className="animate-spin" />}
            {status === 'deleting' ? 'Menghapus...' : 'Hapus Data Demo'}
          </button>
        </div>
      </div>

      {/* Result banner */}
      {(status === 'done' || status === 'error') && message && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: status === 'done' ? '#d8f5f3' : '#ffdad6',
            color: status === 'done' ? '#007169' : '#ba1a1a',
          }}
        >
          {status === 'done'
            ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
