'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface StudentRow {
  id: string;
  nisn: string;
  fullname: string;
}

interface GradeEntry {
  uts: string;
  uas: string;
  utsId: string | null;
  uasId: string | null;
  status: 'saved' | 'pending' | 'editing';
}

const SUBJECTS = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia',
  'Biologi', 'Sejarah Indonesia', 'Pendidikan Pancasila',
  'Pendidikan Agama Islam', 'Pendidikan Jasmani',
];

const YEAR = new Date().getFullYear();
const ACADEMIC_YEARS = [`${YEAR - 1}/${YEAR}`, `${YEAR}/${YEAR + 1}`];
const PAGE_SIZE = 10;

export default function GradesPage() {
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0]);
  const [semester, setSemester] = useState(1);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('students').select('class').then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map((d: { class: string }) => d.class))].sort();
        setClasses(unique);
        if (unique.length > 0) setSelectedClass(unique[0]);
      }
    });
  }, []);

  const loadStudentsAndGrades = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    const year = parseInt(academicYear.split('/')[0]);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: stuData, count } = await supabase
      .from('users')
      .select('id, nisn, fullname, students!inner(class)', { count: 'exact' })
      .eq('role', 'siswa')
      .eq('students.class', selectedClass)
      .order('fullname')
      .range(from, to);

    setTotal(count ?? 0);

    if (!stuData) { setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: StudentRow[] = stuData.map((u: any) => ({ id: u.id, nisn: u.nisn, fullname: u.fullname }));
    setStudents(rows);

    const ids = rows.map((r) => r.id);
    const { data: gradeData } = await supabase
      .from('grades')
      .select('id, student_id, type, score')
      .in('student_id', ids)
      .eq('subject', selectedSubject)
      .eq('semester', semester)
      .eq('year', year);

    const map: Record<string, GradeEntry> = {};
    rows.forEach((s) => {
      map[s.id] = { uts: '', uas: '', utsId: null, uasId: null, status: 'pending' };
    });
    if (gradeData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gradeData.forEach((g: any) => {
        if (!map[g.student_id]) return;
        if (g.type === 'UTS') { map[g.student_id].uts = String(g.score); map[g.student_id].utsId = g.id; }
        if (g.type === 'UAS') { map[g.student_id].uas = String(g.score); map[g.student_id].uasId = g.id; }
      });
      rows.forEach((s) => {
        const e = map[s.id];
        if (e.uts && e.uas) e.status = 'saved';
      });
    }
    setGrades(map);
    setLoading(false);
  }, [selectedClass, selectedSubject, semester, academicYear, page]);

  useEffect(() => { loadStudentsAndGrades(); }, [loadStudentsAndGrades]);

  function handleChange(studentId: string, field: 'uts' | 'uas', value: string) {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value, status: 'editing' },
    }));
  }

  async function saveAll() {
    setSaving(true);
    const year = parseInt(academicYear.split('/')[0]);
    const upserts: object[] = [];

    Object.entries(grades).forEach(([studentId, entry]) => {
      if (entry.status !== 'editing') return;
      if (entry.uts !== '') {
        upserts.push({
          id: entry.utsId ?? uuidv4(),
          student_id: studentId,
          subject: selectedSubject,
          type: 'UTS',
          score: parseFloat(entry.uts),
          semester,
          year,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
      if (entry.uas !== '') {
        upserts.push({
          id: entry.uasId ?? uuidv4(),
          student_id: studentId,
          subject: selectedSubject,
          type: 'UAS',
          score: parseFloat(entry.uas),
          semester,
          year,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    });

    if (upserts.length > 0) {
      await supabase.from('grades').upsert(upserts, { onConflict: 'id' });
    }
    await loadStudentsAndGrades();
    setSaving(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function StatusBadge({ status }: { status: GradeEntry['status'] }) {
    if (status === 'saved') return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#d8f5f3', color: '#007169' }}>✓ Saved</span>
    );
    if (status === 'editing') return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#d6e3ff', color: '#264778' }}>Editing...</span>
    );
    return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#e6e8ea', color: '#43474f' }}>Pending</span>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#191c1e' }}>Grade Input</h1>
          <p className="text-sm mt-1" style={{ color: '#43474f' }}>Select class and subject to enter Midterm (UTS) and Final (UAS) scores.</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#001736' }}
        >
          <Save size={15} /> {saving ? 'Menyimpan...' : 'Save All Grades'}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474f' }}>Academic Year / Semester</label>
          <div className="flex gap-2">
            <select
              value={academicYear}
              onChange={(e) => { setAcademicYear(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 text-sm rounded-lg border outline-none"
              style={{ borderColor: '#e0e3e5', color: '#43474f' }}
            >
              {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={semester}
              onChange={(e) => { setSemester(Number(e.target.value)); setPage(1); }}
              className="w-28 px-3 py-2 text-sm rounded-lg border outline-none"
              style={{ borderColor: '#e0e3e5', color: '#43474f' }}
            >
              <option value={1}>Ganjil</option>
              <option value={2}>Genap</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474f' }}>Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
            style={{ borderColor: '#e0e3e5', color: '#43474f' }}
          >
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#43474f' }}>Select Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => { setSelectedSubject(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
            style={{ borderColor: '#e0e3e5', color: '#43474f' }}
          >
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#001736' }}>
              {['No', 'NIS', 'Student Name', 'Nilai UTS', 'Nilai UAS', 'Status'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: '#747780' }}>Memuat data...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: '#747780' }}>Pilih kelas untuk menampilkan siswa</td></tr>
            ) : students.map((s, i) => {
              const entry = grades[s.id] ?? { uts: '', uas: '', utsId: null, uasId: null, status: 'pending' as const };
              return (
                <tr key={s.id} className="border-t border-[#f2f4f6] hover:bg-[#f7f9fb]">
                  <td className="px-5 py-3 text-xs" style={{ color: '#747780' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-5 py-3" style={{ color: '#43474f' }}>{s.nisn}</td>
                  <td className="px-5 py-3 font-medium" style={{ color: '#191c1e' }}>{s.fullname}</td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      min={0} max={100}
                      value={entry.uts}
                      onChange={(e) => handleChange(s.id, 'uts', e.target.value)}
                      placeholder="—"
                      className="w-20 px-2.5 py-1.5 text-sm rounded-lg border text-center outline-none focus:ring-2 focus:ring-[#264778]"
                      style={{
                        borderColor: entry.status === 'editing' ? '#405f91' : '#e0e3e5',
                        backgroundColor: entry.status === 'editing' ? '#f0f4ff' : '#ffffff',
                      }}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      min={0} max={100}
                      value={entry.uas}
                      onChange={(e) => handleChange(s.id, 'uas', e.target.value)}
                      placeholder="—"
                      className="w-20 px-2.5 py-1.5 text-sm rounded-lg border text-center outline-none focus:ring-2 focus:ring-[#264778]"
                      style={{
                        borderColor: entry.status === 'editing' ? '#405f91' : '#e0e3e5',
                        backgroundColor: entry.status === 'editing' ? '#f0f4ff' : '#ffffff',
                      }}
                    />
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={entry.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs" style={{ color: '#747780' }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total} students
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-[#f2f4f6]" style={{ color: '#43474f' }}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: p === page ? '#001736' : 'transparent', color: p === page ? '#fff' : '#43474f' }}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && page < totalPages - 2 && <span className="px-1 text-xs" style={{ color: '#747780' }}>...</span>}
            {totalPages > 5 && page < totalPages - 2 && (
              <button onClick={() => setPage(totalPages)} className="w-8 h-8 rounded-lg text-sm font-medium" style={{ color: '#43474f' }}>{totalPages}</button>
            )}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-[#f2f4f6]" style={{ color: '#43474f' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
