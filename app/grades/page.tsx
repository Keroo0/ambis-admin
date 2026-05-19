'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface StudentItem {
  id: string;
  nisn: string;
  fullname: string;
}

type SubjectEntry = {
  uts: string;
  uas: string;
  status: 'empty' | 'editing' | 'saved';
  utsId?: string;
  uasId?: string;
};

const SUBJECTS = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah Indonesia',
  'Pendidikan Pancasila',
  'Pendidikan Agama Islam',
  'Pendidikan Jasmani',
];

const YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [`${YEAR - 1}/${YEAR}`, `${YEAR}/${YEAR + 1}`];

export default function GradesPage() {
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0]);
  const [semester, setSemester] = useState(1);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [studentList, setStudentList] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentIdx, setStudentIdx] = useState(0);
  const [entries, setEntries] = useState<Record<string, SubjectEntry>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
  }, []);

  // Load available classes
  useEffect(() => {
    supabase
      .from('students')
      .select('class')
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((d: { class: string }) => d.class))].sort();
          setClasses(unique);
          if (unique.length > 0) setSelectedClass(unique[0]);
        }
      });
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClass) return;
    supabase
      .from('students')
      .select('id, nisn, users!students_id_fkey(fullname)')
      .eq('class', selectedClass)
      .order('nisn')
      .then(({ data }) => {
        const list = (data ?? []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          nisn: s.nisn as string,
          fullname: ((s.users as Record<string, string> | null)?.fullname) ?? '-',
        }));
        setStudentList(list);
        setStudentIdx(0);
        if (list.length > 0) setSelectedStudent(list[0].id);
        else setSelectedStudent('');
      });
  }, [selectedClass]);

  // Load grades when student/semester/year changes
  const year = parseInt(academicYear.split('/')[0]);

  const loadGrades = useCallback(async () => {
    if (!selectedStudent) {
      setEntries({});
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('grades')
      .select('id, subject, type, score')
      .eq('student_id', selectedStudent)
      .eq('semester', semester)
      .eq('year', year);

    const newEntries: Record<string, SubjectEntry> = {};
    SUBJECTS.forEach((subj) => {
      const uts = data?.find((g: Record<string, unknown>) => g.subject === subj && g.type === 'UTS');
      const uas = data?.find((g: Record<string, unknown>) => g.subject === subj && g.type === 'UAS');
      newEntries[subj] = {
        uts: uts ? String(uts.score) : '',
        uas: uas ? String(uas.score) : '',
        status: (uts || uas) ? 'saved' : 'empty',
        utsId: (uts?.id as string) ?? undefined,
        uasId: (uas?.id as string) ?? undefined,
      };
    });
    setEntries(newEntries);
    setLoading(false);
  }, [selectedStudent, semester, year]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  function handleChange(subj: string, field: 'uts' | 'uas', value: string) {
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) return;
    setEntries((prev) => ({
      ...prev,
      [subj]: { ...prev[subj], [field]: value, status: 'editing' },
    }));
  }

  async function saveAll() {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    const now = Date.now();
    const rows: object[] = [];

    for (const subj of SUBJECTS) {
      const e = entries[subj];
      if (!e || e.status !== 'editing') continue;
      if (e.uts !== '') {
        rows.push({
          id: e.utsId ?? uuidv4(),
          student_id: selectedStudent,
          subject: subj,
          type: 'UTS',
          score: parseFloat(e.uts),
          semester,
          year,
          created_at: now,
          updated_at: now,
        });
      }
      if (e.uas !== '') {
        rows.push({
          id: e.uasId ?? uuidv4(),
          student_id: selectedStudent,
          subject: subj,
          type: 'UAS',
          score: parseFloat(e.uas),
          semester,
          year,
          created_at: now,
          updated_at: now,
        });
      }
    }

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase.from('grades').upsert(rows, { onConflict: 'id' });
      if (upsertErr) {
        setSaveError(`Gagal menyimpan: ${upsertErr.message}`);
        setSaving(false);
        return;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const auditRows = rows.map((u: any) => ({
          admin_id: adminId,
          action: 'update_grade',
          entity_type: 'grade',
          entity_id: u.id,
          old_value: null,
          new_value: { student_id: u.student_id, subject: u.subject, type: u.type, score: u.score },
          created_at: Date.now(),
        }));
        await supabase.from('audit_log').insert(auditRows);
      } catch (_) { /* non-blocking */ }
    }

    await loadGrades();
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function prevStudent() {
    if (studentIdx <= 0) return;
    const newIdx = studentIdx - 1;
    setStudentIdx(newIdx);
    setSelectedStudent(studentList[newIdx].id);
  }

  function nextStudent() {
    if (studentIdx >= studentList.length - 1) return;
    const newIdx = studentIdx + 1;
    setStudentIdx(newIdx);
    setSelectedStudent(studentList[newIdx].id);
  }

  const selectedStudentData = studentList[studentIdx] ?? null;
  const hasEdits = Object.values(entries).some((e) => e.status === 'editing');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#191c1e' }}>Input Nilai</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: '#43474f' }}>
            Pilih kelas dan siswa untuk mengisi nilai UTS dan UAS semua mata pelajaran.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#d8f5f3', color: '#007169' }}>
              ✓ Nilai tersimpan
            </span>
          )}
          {saveError && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#ffdad6', color: '#ba1a1a' }}>
              {saveError}
            </span>
          )}
          <button
            onClick={loadGrades}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[#f7f9fb] disabled:opacity-50"
            style={{ borderColor: '#e0e3e5', color: '#43474f' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={saveAll}
            disabled={saving || !hasEdits}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#001736' }}
          >
            <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474f' }}>
            Tahun Ajaran / Semester
          </label>
          <div className="flex gap-2">
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-[#264778]"
              style={{ borderColor: '#e0e3e5', color: '#43474f' }}
            >
              {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-28 px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-[#264778]"
              style={{ borderColor: '#e0e3e5', color: '#43474f' }}
            >
              <option value={1}>Ganjil</option>
              <option value={2}>Genap</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474f' }}>
            Kelas
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-[#264778]"
            style={{ borderColor: '#e0e3e5', color: '#43474f' }}
          >
            {classes.length === 0 && <option value="">Memuat kelas...</option>}
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474f' }}>
            Siswa
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => {
              const idx = studentList.findIndex(s => s.id === e.target.value);
              setStudentIdx(idx >= 0 ? idx : 0);
              setSelectedStudent(e.target.value);
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-[#264778]"
            style={{ borderColor: '#e0e3e5', color: '#43474f' }}
          >
            {studentList.length === 0 && <option value="">Pilih kelas terlebih dahulu</option>}
            {studentList.map((s) => (
              <option key={s.id} value={s.id}>{s.fullname} ({s.nisn})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student navigation */}
      {studentList.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={prevStudent}
            disabled={studentIdx === 0}
            className="px-3 py-1 text-sm rounded border disabled:opacity-40 hover:bg-[#f7f9fb] transition-colors"
            style={{ borderColor: '#e0e3e5', color: '#43474f' }}
          >
            ← Sebelumnya
          </button>
          <span className="text-sm font-medium text-[#191c1e]">
            {selectedStudentData?.fullname ?? '-'} ({selectedStudentData?.nisn ?? '-'})
          </span>
          <button
            onClick={nextStudent}
            disabled={studentIdx >= studentList.length - 1}
            className="px-3 py-1 text-sm rounded border disabled:opacity-40 hover:bg-[#f7f9fb] transition-colors"
            style={{ borderColor: '#e0e3e5', color: '#43474f' }}
          >
            Berikutnya →
          </button>
          <span className="text-xs ml-1" style={{ color: '#747780' }}>
            {studentIdx + 1} / {studentList.length}
          </span>
        </div>
      )}

      {/* Table with fade animation per student */}
      <motion.div
        key={selectedStudent}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#001736' }}>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-white">No</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-white">Mata Pelajaran</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-white">Nilai UTS</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-white">Nilai UAS</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: '#747780' }}>
                      Memuat data...
                    </td>
                  </tr>
                ) : !selectedStudent ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: '#747780' }}>
                      Pilih kelas dan siswa untuk menampilkan nilai.
                    </td>
                  </tr>
                ) : (
                  SUBJECTS.map((subj, i) => {
                    const e = entries[subj] ?? { uts: '', uas: '', status: 'empty' as const };
                    return (
                      <tr key={subj} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f9fb]'}>
                        <td className="py-3 px-4 text-[#43474f]">{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-[#191c1e]">{subj}</td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={e.uts}
                            onChange={(ev) => handleChange(subj, 'uts', ev.target.value)}
                            placeholder="—"
                            className="w-20 rounded border px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-[#264778]"
                            style={{ borderColor: e.status === 'editing' ? '#405f91' : '#e0e3e5' }}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={e.uas}
                            onChange={(ev) => handleChange(subj, 'uas', ev.target.value)}
                            placeholder="—"
                            className="w-20 rounded border px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-[#264778]"
                            style={{ borderColor: e.status === 'editing' ? '#405f91' : '#e0e3e5' }}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={e.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: SubjectEntry['status'] }) {
  if (status === 'saved') return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#d8f5f3', color: '#007169' }}>
      ✓ Tersimpan
    </span>
  );
  if (status === 'editing') return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#d6e3ff', color: '#264778' }}>
      Belum disimpan
    </span>
  );
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#e6e8ea', color: '#43474f' }}>
      Kosong
    </span>
  );
}
