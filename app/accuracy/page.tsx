'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertCircle, CheckCircle2, Gauge, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { computeAccuracyMetrics, type AccuracyLogRow } from '@/lib/accuracyMetrics';

interface FaceRecognitionLogRow extends AccuracyLogRow {
  id: string;
  student_id: string;
  attendance_id: string | null;
  attempt_type: string | null;
  source: string | null;
  threshold: number | null;
  failure_reason: string | null;
  duration_ms: number | null;
  created_at: number;
  student?: { fullname: string; class: string } | null;
}

function formatPercent(value: number | null) {
  if (value === null) return '-';
  return `${value.toFixed(1)}%`;
}

function formatDate(epochMs: number) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epochMs));
}

function statusBadge(passed: boolean | null) {
  if (passed === true) return { label: 'Lolos', bg: '#d8f5f3', color: '#007169' };
  if (passed === false) return { label: 'Gagal', bg: '#ffdad6', color: '#ba1a1a' };
  return { label: 'Tidak diketahui', bg: '#e0e3e5', color: '#43474f' };
}

export default function AccuracyPage() {
  const [rows, setRows] = useState<FaceRecognitionLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('face_recognition_logs')
      .select(
        'id, student_id, attendance_id, attempt_type, source, face_match_score, threshold, passed, liveness_verified, failure_reason, duration_ms, created_at, students!face_recognition_logs_student_id_fkey(class, users!students_id_fkey(fullname))',
      )
      .order('created_at', { ascending: false })
      .limit(250);

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const mapped = (data ?? []).map((raw: Record<string, unknown>) => {
      const student = raw.students as Record<string, unknown> | null;
      return {
        id: raw.id as string,
        student_id: raw.student_id as string,
        attendance_id: raw.attendance_id as string | null,
        attempt_type: raw.attempt_type as string | null,
        source: raw.source as string | null,
        face_match_score: raw.face_match_score as number | null,
        threshold: raw.threshold as number | null,
        passed: raw.passed as boolean | null,
        liveness_verified: raw.liveness_verified as boolean | null,
        failure_reason: raw.failure_reason as string | null,
        duration_ms: raw.duration_ms as number | null,
        created_at: raw.created_at as number,
        student: student
          ? {
              fullname: (student.users as Record<string, string> | null)?.fullname ?? '-',
              class: (student.class as string | null) ?? '-',
            }
          : null,
      };
    });

    setRows(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());

    const channel = supabase
      .channel('admin-face-recognition-logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'face_recognition_logs' },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const metrics = computeAccuracyMetrics(rows);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#191c1e' }}>
          Face Recognition Accuracy
        </h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: '#43474f' }}>
          Ringkasan metrik biometrik untuk bahan evaluasi skripsi AMBIS.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#ffdad6', color: '#ba1a1a' }}>
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
        <MetricCard
          label="RATA-RATA SIMILARITY"
          value={metrics.averageScorePercent === null ? '-' : `${metrics.averageScorePercent}%`}
          hint={`${metrics.totalAttempts} percobaan`}
          icon={<Gauge size={18} />}
          iconBg="#d6e3ff"
          iconColor="#264778"
        />
        <MetricCard
          label="SUCCESS RATE"
          value={formatPercent(metrics.successRatePercent)}
          hint={`${metrics.passedAttempts} lolos, ${metrics.failedAttempts} gagal`}
          icon={<CheckCircle2 size={18} />}
          iconBg="#d8f5f3"
          iconColor="#007169"
        />
        <MetricCard
          label="FRR"
          value={formatPercent(metrics.falseRejectRatePercent)}
          hint="Genuine gagal / total genuine"
          icon={<ShieldAlert size={18} />}
          iconBg="#ffdf9e"
          iconColor="#5b4300"
        />
        <MetricCard
          label="FAR"
          value={formatPercent(metrics.falseAcceptRatePercent)}
          hint="Impostor lolos / total impostor"
          icon={<ShieldCheck size={18} />}
          iconBg="#ffdad6"
          iconColor="#ba1a1a"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#d8f5f3', color: '#007169' }}>
              <Activity size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#191c1e' }}>Ringkasan Evaluasi</p>
              <p className="text-xs" style={{ color: '#747780' }}>Data dari 250 log terbaru</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <SummaryRow label="Total percobaan" value={metrics.totalAttempts.toString()} />
            <SummaryRow label="Percobaan lolos" value={metrics.passedAttempts.toString()} />
            <SummaryRow label="Percobaan gagal" value={metrics.failedAttempts.toString()} />
            <SummaryRow label="Liveness success" value={formatPercent(metrics.livenessRatePercent)} />
          </div>

          <p className="text-xs mt-4 leading-relaxed" style={{ color: '#747780' }}>
            Catatan: FAR membutuhkan data percobaan bertipe <b>impostor</b>. Absensi normal siswa otomatis dicatat sebagai <b>genuine</b>.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e0e3e5]">
            <p className="font-semibold text-sm" style={{ color: '#191c1e' }}>Log Terbaru</p>
            <p className="text-xs mt-0.5" style={{ color: '#747780' }}>
              Riwayat percobaan pengenalan wajah yang tercatat dari aplikasi siswa.
            </p>
          </div>

          {loading ? (
            <p className="text-sm p-5" style={{ color: '#747780' }}>Memuat data...</p>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center">
              <Gauge size={36} className="mx-auto mb-3" style={{ color: '#747780' }} />
              <p className="font-medium text-sm" style={{ color: '#191c1e' }}>Belum ada log akurasi</p>
              <p className="text-xs mt-1" style={{ color: '#747780' }}>
                Data akan muncul setelah siswa melakukan percobaan absensi wajah.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#f7f9fb', color: '#43474f' }}>
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Siswa</th>
                    <th className="text-left font-semibold px-4 py-3">Score</th>
                    <th className="text-left font-semibold px-4 py-3">Status</th>
                    <th className="text-left font-semibold px-4 py-3">Tipe</th>
                    <th className="text-left font-semibold px-4 py-3">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 30).map((row) => {
                    const badge = statusBadge(row.passed);
                    return (
                      <tr key={row.id} className="border-t border-[#eef0f2]">
                        <td className="px-4 py-3">
                          <p className="font-medium whitespace-nowrap" style={{ color: '#191c1e' }}>
                            {row.student?.fullname ?? row.student_id}
                          </p>
                          <p className="text-xs" style={{ color: '#747780' }}>{row.student?.class ?? '-'}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#191c1e' }}>
                          {row.face_match_score === null
                            ? '-'
                            : `${(row.face_match_score * 100).toFixed(1)}%`}
                          <p className="text-xs" style={{ color: '#747780' }}>
                            threshold {row.threshold === null ? '-' : (row.threshold * 100).toFixed(0)}%
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                          {row.failure_reason && (
                            <p className="text-xs mt-1" style={{ color: '#747780' }}>{row.failure_reason}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize" style={{ color: '#43474f' }}>
                          {row.attempt_type ?? '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#43474f' }}>
                          {formatDate(row.created_at)}
                          <p className="text-xs" style={{ color: '#747780' }}>
                            {row.duration_ms === null ? '-' : `${row.duration_ms} ms`}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wide" style={{ color: '#747780' }}>{label}</p>
          <p className="text-2xl font-bold mt-2" style={{ color: '#191c1e' }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: '#747780' }}>{hint}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#eef0f2] pb-2">
      <span style={{ color: '#43474f' }}>{label}</span>
      <span className="font-semibold" style={{ color: '#191c1e' }}>{value}</span>
    </div>
  );
}
