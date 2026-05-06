'use client';

import { useEffect, useState } from 'react';
import { Users, CalendarCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import GeofenceSection from '@/components/dashboard/GeofenceSection';

interface AbsenceRow {
  id: string;
  student_id: string;
  date: string;
  status: string;
  notes: string | null;
  student?: { fullname: string; class: string } | null;
}

export default function DashboardPage() {
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [absences, setAbsences] = useState<AbsenceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];

      const [studentsRes, pendingRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('attendance')
          .select('id, student_id, date, status, notes, students(fullname, class)')
          .eq('date', today)
          .neq('status', 'present')
          .limit(10),
      ]);

      setTotalStudents(studentsRes.count ?? 0);
      setPendingApprovals(pendingRes.count ?? 0);

      if (attendanceRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAbsences(attendanceRes.data.map((r: any) => ({
          id: r.id,
          student_id: r.student_id,
          date: r.date,
          status: r.status,
          notes: r.notes,
          student: r.students,
        })));
      }

      const { count: presentCount } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', 'present');
      const total = studentsRes.count ?? 1;
      setAttendanceRate(total > 0 ? Math.round(((presentCount ?? 0) / total) * 100) : 0);
      setLoading(false);
    }
    load();
  }, []);

  const statusLabel = (status: string) => {
    if (status === 'sick') return { label: 'Sakit', bg: '#ffdf9e', color: '#5b4300' };
    if (status === 'leave') return { label: 'Izin', bg: '#d8f5f3', color: '#00504a' };
    if (status === 'late') return { label: 'Terlambat', bg: '#d6e3ff', color: '#264778' };
    return { label: 'Alfa', bg: '#ffdad6', color: '#93000a' };
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#191c1e' }}>Dashboard Overview</h1>
        <p className="text-sm mt-1" style={{ color: '#43474f' }}>Welcome back, Admin. Here is today&apos;s school summary.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="TOTAL STUDENTS" value={loading ? '—' : (totalStudents ?? 0).toLocaleString()} sub="+12 from last semester" icon={<Users size={18} />} iconBg="#d6e3ff" iconColor="#264778" />
        <StatCard title="ATTENDANCE RATE" value={loading ? '—' : `${attendanceRate ?? 0}%`} sub="Above target (95%)" icon={<CalendarCheck size={18} />} iconBg="#d8f5f3" iconColor="#007169" />
        <StatCard title="PENDING APPROVALS" value={loading ? '—' : String(pendingApprovals ?? 0)} sub="Requires attention today" icon={<AlertCircle size={18} />} iconBg="#ffdad6" iconColor="#ba1a1a" valueColor="#ba1a1a" />
      </div>

      {/* Absence Table */}
      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e3e5]">
          <h2 className="font-semibold text-sm" style={{ color: '#191c1e' }}>Absence Monitoring (Today)</h2>
          <button className="text-xs font-medium" style={{ color: '#405f91' }}>View All</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#f7f9fb' }}>
              {['Student', 'Class', 'Status', 'Notes', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: '#43474f' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: '#747780' }}>Memuat data...</td></tr>
            ) : absences.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: '#747780' }}>Semua siswa hadir hari ini</td></tr>
            ) : (
              absences.map((row) => {
                const s = statusLabel(row.status);
                return (
                  <tr key={row.id} className="border-t border-[#f2f4f6] hover:bg-[#f7f9fb]">
                    <td className="px-5 py-3 font-medium" style={{ color: '#191c1e' }}>{row.student?.fullname ?? row.student_id}</td>
                    <td className="px-5 py-3" style={{ color: '#43474f' }}>{row.student?.class ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td className="px-5 py-3" style={{ color: '#43474f' }}>{row.notes ?? '—'}</td>
                    <td className="px-5 py-3">
                      <button style={{ color: '#405f91' }}><ExternalLink size={15} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <GeofenceSection />
    </div>
  );
}

function StatCard({ title, value, sub, icon, iconBg, iconColor, valueColor }: {
  title: string; value: string; sub: string; icon: React.ReactNode;
  iconBg: string; iconColor: string; valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#43474f' }}>{title}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg, color: iconColor }}>{icon}</div>
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: valueColor ?? '#191c1e' }}>{value}</p>
      <p className="text-xs" style={{ color: '#747780' }}>{sub}</p>
    </div>
  );
}
