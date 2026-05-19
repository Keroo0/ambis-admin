'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Download, Pencil, Search, Camera, CameraOff, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StudentModal from '@/components/students/StudentModal';
import ResetFaceDialog from '@/components/students/ResetFaceDialog';
import DeleteStudentDialog from '@/components/students/DeleteStudentDialog';

interface StudentRow {
  id: string;
  nisn: string;
  fullname: string;
  class: string;
  is_active: boolean;
  has_face: boolean;
  parent_id: string | null;
  parent: { fullname: string; phone?: string } | null;
}

const AVATAR_COLORS = [
  '#264778', '#007169', '#5b4300', '#93000a', '#405f91',
  '#00504a', '#3a2900', '#002b5b', '#00201d', '#201600',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function StatusBadge({ isActive, hasFace }: { isActive: boolean; hasFace: boolean }) {
  if (!hasFace) return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#d6e3ff', color: '#264778' }}>Pending Setup</span>
  );
  if (isActive) return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#d8f5f3', color: '#007169' }}>Active</span>
  );
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: '#ffdad6', color: '#ba1a1a' }}>Inactive</span>
  );
}

const PAGE_SIZE = 10;

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | undefined>();

  const [showReset, setShowReset] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    supabase.from('students').select('class').then(({ data }) => {
      if (data) {
        const unique = [...new Set(data.map((d: { class: string }) => d.class))].sort();
        setClasses(unique);
      }
    });
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('users')
      .select('id, nisn, fullname, is_active, students!students_id_fkey!inner(class, parent_id, face_embeddings!face_embeddings_student_id_fkey(id), parent:parent_id(fullname, phone))', { count: 'exact' })
      .eq('role', 'siswa')
      .order('fullname')
      .range(from, to);

    if (search) query = query.ilike('fullname', `%${search}%`);
    if (classFilter) query = query.eq('students.class', classFilter);
    if (statusFilter === 'active') query = query.eq('is_active', true);
    if (statusFilter === 'inactive') query = query.eq('is_active', false);

    const { data, count, error: queryErr } = await query;
    if (queryErr) {
      setStudents([]);
      setTotal(0);
      setLoadError('Gagal memuat data siswa.');
      setLoading(false);
      return;
    }
    setTotal(count ?? 0);

    if (data) {
      setStudents(data.map((u: Record<string, unknown>) => {
        const stu = u.students as Record<string, unknown> | null;
        const faces = stu?.face_embeddings as unknown[];
        const parentRaw = stu?.parent as Record<string, string> | null;
        return {
          id: u.id as string,
          nisn: u.nisn as string,
          fullname: u.fullname as string,
          is_active: u.is_active as boolean,
          class: (stu?.class as string) ?? '—',
          has_face: Array.isArray(faces) ? faces.length > 0 : !!stu?.face_embeddings,
          parent_id: (stu?.parent_id as string) ?? null,
          parent: parentRaw ? { fullname: parentRaw.fullname, phone: parentRaw.phone } : null,
        };
      }));
    }
    setLoading(false);
  }, [page, search, classFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function openAdd() {
    setModalMode('add');
    setSelectedStudent(undefined);
    setShowModal(true);
  }

  function openEdit(s: StudentRow) {
    setModalMode('edit');
    setSelectedStudent(s);
    setShowModal(true);
  }

  function openReset(s: StudentRow) {
    setResetTarget({ id: s.id, name: s.fullname });
    setShowReset(true);
  }

  function openDelete(s: StudentRow) {
    setDeleteTarget({ id: s.id, name: s.fullname });
    setShowDelete(true);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#191c1e' }}>Student Data Management</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: '#43474f' }}>Manage enrollments, NISN records, and account statuses.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[#f7f9fb]" style={{ borderColor: '#e0e3e5', color: '#43474f' }}>
            <Download size={15} /> Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#001736' }}
          >
            <UserPlus size={15} /> Add Student
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:w-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#747780' }} />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-[#264778] w-full sm:w-56"
            style={{ borderColor: '#e0e3e5' }}
          />
        </div>
        <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border outline-none w-full sm:w-auto" style={{ borderColor: '#e0e3e5', color: '#43474f' }}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border outline-none w-full sm:w-auto" style={{ borderColor: '#e0e3e5', color: '#43474f' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <p className="text-xs sm:ml-auto" style={{ color: '#747780' }}>
          Showing {total === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()} students
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr style={{ backgroundColor: '#f7f9fb' }}>
                {['Name', 'NISN', 'Class', 'Orang Tua', 'Account Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 md:px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#43474f' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 md:px-5 py-10 text-center text-sm" style={{ color: '#747780' }}>Memuat data...</td></tr>
              ) : loadError ? (
                <tr><td colSpan={6} className="px-4 md:px-5 py-10 text-center text-sm" style={{ color: '#ba1a1a' }}>{loadError}</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-4 md:px-5 py-10 text-center text-sm" style={{ color: '#747780' }}>Tidak ada siswa ditemukan</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className="border-t border-[#f2f4f6] hover:bg-[#f7f9fb]">
                  <td className="px-4 md:px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: avatarColor(s.fullname) }}>
                        {initials(s.fullname)}
                      </div>
                      <span className="font-medium whitespace-nowrap" style={{ color: '#191c1e' }}>{s.fullname}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-3 whitespace-nowrap" style={{ color: '#43474f' }}>{s.nisn}</td>
                  <td className="px-4 md:px-5 py-3 whitespace-nowrap" style={{ color: '#43474f' }}>{s.class}</td>
                  <td className="px-4 md:px-5 py-3 whitespace-nowrap">
                    {s.parent ? (
                      <span className="text-xs font-medium" style={{ color: '#007169' }}>{s.parent.fullname}</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ borderColor: '#e0e3e5', color: '#747780' }}>Belum ditautkan</span>
                    )}
                  </td>
                  <td className="px-4 md:px-5 py-3"><StatusBadge isActive={s.is_active} hasFace={s.has_face} /></td>
                  <td className="px-4 md:px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} title="Edit siswa"
                        className="p-1.5 rounded-lg hover:bg-[#f2f4f6] transition-colors" style={{ color: '#43474f' }}>
                        <Pencil size={15} />
                      </button>
                      {s.has_face ? (
                        <button onClick={() => openReset(s)} title="Hapus data wajah"
                          className="p-1.5 rounded-lg hover:bg-[#ffdad6] transition-colors" style={{ color: '#ba1a1a' }}>
                          <Camera size={15} />
                        </button>
                      ) : (
                        <button disabled title="Belum ada data wajah"
                          className="p-1.5 rounded-lg opacity-40 cursor-not-allowed" style={{ color: '#747780' }}>
                          <CameraOff size={15} />
                        </button>
                      )}
                      <button onClick={() => openDelete(s)} title="Hapus siswa"
                        className="p-1.5 rounded-lg hover:bg-[#ffdad6] transition-colors" style={{ color: '#ba1a1a' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <PaginBtn label="‹" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p < 1 || p > totalPages) return null;
            return <PaginBtn key={p} label={String(p)} onClick={() => setPage(p)} active={p === page} />;
          })}
          {totalPages > 5 && page < totalPages - 2 && <span className="px-2 text-sm" style={{ color: '#747780' }}>...</span>}
          {totalPages > 5 && page < totalPages - 2 && <PaginBtn label={String(totalPages)} onClick={() => setPage(totalPages)} />}
          <PaginBtn label="›" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
        </div>
      )}

      {showModal && (
        <StudentModal
          mode={modalMode}
          student={selectedStudent}
          onClose={() => setShowModal(false)}
          onSuccess={load}
        />
      )}
      {showReset && resetTarget && (
        <ResetFaceDialog
          studentId={resetTarget.id}
          studentName={resetTarget.name}
          onClose={() => { setShowReset(false); setResetTarget(null); }}
          onSuccess={load}
        />
      )}
      {showDelete && deleteTarget && (
        <DeleteStudentDialog
          studentId={deleteTarget.id}
          studentName={deleteTarget.name}
          onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
          onSuccess={load}
        />
      )}
    </div>
  );
}

function PaginBtn({ label, onClick, active, disabled }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
      style={{ backgroundColor: active ? '#001736' : 'transparent', color: active ? '#ffffff' : '#43474f' }}>
      {label}
    </button>
  );
}
