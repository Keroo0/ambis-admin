'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, CalendarCheck, AlertCircle, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import GeofenceSection from '@/components/dashboard/GeofenceSection';
import AttendanceTimeSection from '@/components/dashboard/AttendanceTimeSection';

interface AttendanceRow {
  id: string;
  student_id: string;
  date: string;
  status: string;
  notes: string | null;
  time_in: string | null;
  time_out: string | null;
  student?: { fullname: string; class: string } | null;
}

interface ClassAverage {
  class: string;
  avg: number;
}

interface RecentGradeRow {
  subject: string;
  type: string;
  score: number;
  created_at: number;
  studentName: string;
}

export default function DashboardPage() {
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveTick, setLiveTick] = useState(false);
  const [classAverages, setClassAverages] = useState<ClassAverage[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGradeRow[]>([]);

  const loadAttendance = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const [studentsRes, pendingRes, attendanceRes, presentRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('attendance')
        .select('id, student_id, date, status, notes, time_in, time_out, students!attendance_student_id_fkey(class, users!students_id_fkey(fullname))')
        .eq('date', today)
        .order('time_in', { ascending: false, nullsFirst: false })
        .limit(20),
      supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', 'present'),
    ]);

    setTotalStudents(studentsRes.count ?? 0);
    setPendingApprovals(pendingRes.count ?? 0);

    if (attendanceRes.data) {
      setTodayAttendance(attendanceRes.data.map((r: unknown) => {
        const row = r as Record<string, unknown>;
        const stu = row.students as Record<string, unknown> | null;
        return {
          id: row.id as string,
          student_id: row.student_id as string,
          date: row.date as string,
          status: row.status as string,
          notes: row.notes as string | null,
          time_in: row.time_in as string | null,
          time_out: row.time_out as string | null,
          student: stu
            ? { fullname: (stu.users as Record<string, string> | null)?.fullname ?? '', class: stu.class as string ?? '' }
            : null,
        };
      }));
    }

    const total = studentsRes.count ?? 1;
    setAttendanceRate(total > 0 ? Math.round(((presentRes.count ?? 0) / total) * 100) : 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAttendance();

    const channel = supabase
      .channel('admin-dashboard-attendance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => {
          setLiveTick(true);
          loadAttendance();
          window.setTimeout(() => setLiveTick(false), 1500);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        () => loadAttendance(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAttendance]);

  // Fetch grades summary separately
  useEffect(() => {
    async function loadGrades() {
      const [gradesPerClassRes, recentGradesRes] = await Promise.all([
        supabase
          .from('grades')
          .select('score, students!student_id(class)'),
        supabase
          .from('grades')
          .select('subject, type, score, created_at, students!student_id(users!id(fullname))')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Compute class averages
      if (gradesPerClassRes.data) {
        const acc: Record<string, { sum: number; count: number }> = {};
        (gradesPerClassRes.data as unknown as { score: number; students: { class: string } | null }[])
          .forEach((row) => {
            const cls = row.students?.class ?? 'Unknown';
            if (!acc[cls]) acc[cls] = { sum: 0, count: 0 };
            acc[cls].sum += row.score;
            acc[cls].count += 1;
          });
        const averages = Object.entries(acc)
          .map(([cls, { sum, count }]) => ({ class: cls, avg: sum / count }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5);
        setClassAverages(averages);
      }

      // Map recent grades
      if (recentGradesRes.data) {
        const rows = (recentGradesRes.data as unknown as {
          subject: string;
          type: string;
          score: number;
          created_at: number;
          students: { users: { fullname: string } | null } | null;
        }[]).map((g) => ({
          subject: g.subject,
          type: g.type,
          score: g.score,
          created_at: g.created_at,
          studentName: g.students?.users?.fullname ?? '—',
        }));
        setRecentGrades(rows);
      }
    }
    loadGrades();
  }, []);

  const statusLabel = (status: string) => {
    if (status === 'present') return { label: 'Hadir', bg: '#d8f5f3', color: '#007169' };
    if (status === 'sick') return { label: 'Sakit', bg: '#ffdf9e', color: '#5b4300' };
    if (status === 'leave') return { label: 'Izin', bg: '#d8f5f3', color: '#00504a' };
    if (status === 'late') return { label: 'Terlambat', bg: '#d6e3ff', color: '#264778' };
    return { label: 'Alfa', bg: '#ffdad6', color: '#93000a' };
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#191c1e' }}>Dashboard Overview</h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: '#43474f' }}>Welcome back, Admin. Here is today&apos;s school summary.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        <StatCard
          title="TOTAL STUDENTS"
          value={loading ? '—' : (totalStudents ?? 0).toLocaleString()}
          sub="+12 from last semester"
          icon={<Users size={18} />}
          iconBg="#d6e3ff"
          iconColor="#264778"
          delay={0}
        />
        <StatCard
          title="ATTENDANCE RATE"
          value={loading ? '—' : `${attendanceRate ?? 0}%`}
          sub="Above target (95%)"
          icon={<CalendarCheck size={18} />}
          iconBg="#d8f5f3"
          iconColor="#007169"
          delay={0.05}
        />
        <StatCard
          title="PENDING APPROVALS"
          value={loading ? '—' : String(pendingApprovals ?? 0)}
          sub="Requires attention today"
          icon={<AlertCircle size={18} />}
          iconBg="#ffdad6"
          iconColor="#ba1a1a"
          valueColor="#ba1a1a"
          delay={0.1}
        />
      </div>

      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-[#e0e3e5]">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm" style={{ color: '#191c1e' }}>Kehadiran Hari Ini</h2>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
              style={{
                backgroundColor: liveTick ? '#d8f5f3' : '#f0f3f6',
                color: liveTick ? '#007169' : '#43474f',
              }}
              title="Realtime aktif"
            >
              <Radio size={10} className={liveTick ? 'animate-pulse' : ''} />
              {liveTick ? 'Update baru' : 'Live'}
            </span>
          </div>
          <Link href="/attendance" className="text-xs font-medium" style={{ color: '#405f91' }}>View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ backgroundColor: '#f7f9fb' }}>
                {['Siswa', 'Kelas', 'Status', 'Masuk', 'Pulang'].map((h) => (
                  <th key={h} className="px-4 md:px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#43474f' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 md:px-5 py-8 text-center text-sm" style={{ color: '#747780' }}>Memuat data...</td></tr>
              ) : todayAttendance.length === 0 ? (
                <tr><td colSpan={5} className="px-4 md:px-5 py-8 text-center text-sm" style={{ color: '#747780' }}>Belum ada siswa absen hari ini</td></tr>
              ) : (
                todayAttendance.map((row) => {
                  const s = statusLabel(row.status);
                  const fmt = (t: string | null) => (t && t.length >= 5 ? t.substring(0, 5) : '—');
                  return (
                    <tr key={row.id} className="border-t border-[#f2f4f6] hover:bg-[#f7f9fb]">
                      <td className="px-4 md:px-5 py-3 font-medium whitespace-nowrap" style={{ color: '#191c1e' }}>{row.student?.fullname ?? row.student_id}</td>
                      <td className="px-4 md:px-5 py-3 whitespace-nowrap" style={{ color: '#43474f' }}>{row.student?.class ?? '—'}</td>
                      <td className="px-4 md:px-5 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td className="px-4 md:px-5 py-3 whitespace-nowrap tabular-nums" style={{ color: '#43474f' }}>{fmt(row.time_in)}</td>
                      <td className="px-4 md:px-5 py-3 whitespace-nowrap tabular-nums" style={{ color: '#43474f' }}>{fmt(row.time_out)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ringkasan Nilai */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-6">
        {/* Card kiri: Rata-rata Nilai per Kelas */}
        <div className="rounded-xl border border-[#e0e3e5] bg-white p-5">
          <h3 className="text-xs font-semibold tracking-widest text-[#43474f] uppercase mb-4">
            Rata-rata Nilai per Kelas
          </h3>
          {classAverages.length === 0 ? (
            <p className="text-sm text-[#747780]">Belum ada data nilai.</p>
          ) : (
            <ul className="space-y-2">
              {classAverages.map(({ class: cls, avg }) => (
                <li key={cls} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#191c1e]">{cls}</span>
                  <span className={`font-semibold ${avg >= 75 ? 'text-[#006A63]' : 'text-[#BA1A1A]'}`}>
                    {avg.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card kanan: Input Nilai Terbaru */}
        <div className="rounded-xl border border-[#e0e3e5] bg-white p-5">
          <h3 className="text-xs font-semibold tracking-widest text-[#43474f] uppercase mb-4">
            Input Nilai Terbaru
          </h3>
          {recentGrades.length === 0 ? (
            <p className="text-sm text-[#747780]">Belum ada data nilai terbaru.</p>
          ) : (
            <ul className="space-y-2.5">
              {recentGrades.map((g, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-[#191c1e] truncate">{g.studentName}</p>
                    <p className="text-xs text-[#747780]">{g.subject} · {g.type}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className={`font-semibold text-sm ${g.score >= 75 ? 'text-[#006A63]' : 'text-[#BA1A1A]'}`}>
                      {g.score}
                    </span>
                    <span className="text-xs text-[#747780]">
                      {new Date(g.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AttendanceTimeSection />
      <GeofenceSection />
    </div>
  );
}

function StatCard({ title, value, sub, icon, iconBg, iconColor, valueColor, delay = 0 }: {
  title: string; value: string; sub: string; icon: React.ReactNode;
  iconBg: string; iconColor: string; valueColor?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-xl border border-[#e0e3e5] p-4 md:p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#43474f' }}>{title}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg, color: iconColor }}>{icon}</div>
      </div>
      <p className="text-2xl md:text-3xl font-bold mb-1" style={{ color: valueColor ?? '#191c1e' }}>{value}</p>
      <p className="text-xs" style={{ color: '#747780' }}>{sub}</p>
    </motion.div>
  );
}
