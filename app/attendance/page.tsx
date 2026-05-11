'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LeaveRequest {
  id: string;
  student_id: string;
  type: string;
  reason: string | null;
  attachment_url: string | null;
  status: string;
  date_from: string | null;
  date_to: string | null;
  created_at: number;
  student?: { fullname: string; class: string } | null;
}

export default function AttendancePage() {
  const [pending, setPending] = useState<LeaveRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedToday, setApprovedToday] = useState(0);
  const [attentionNeeded, setAttentionNeeded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
    load();
  }, []);

  async function load() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase
        .from('leave_requests')
        .select(
          'id, student_id, type, reason, attachment_url, status, date_from, date_to, created_at, students!leave_requests_student_id_fkey(class, users!students_id_fkey(fullname))'
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('date_from', today),
      supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rejected'),
    ]);

    if (pendingRes.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = pendingRes.data.map((r: any) => ({
        id: r.id,
        student_id: r.student_id,
        type: r.type,
        reason: r.reason,
        attachment_url: r.attachment_url,
        status: r.status,
        date_from: r.date_from,
        date_to: r.date_to,
        created_at: r.created_at,
        student: r.students
          ? { fullname: r.students.users?.fullname ?? '-', class: r.students.class ?? '-' }
          : null,
      }));
      setPending(rows);
      setPendingCount(rows.length);
    }
    setApprovedToday(approvedRes.count ?? 0);
    setAttentionNeeded(rejectedRes.count ?? 0);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    const req = pending.find((r) => r.id === id);
    const { error: updateErr } = await supabase
      .from('leave_requests')
      .update({ status: 'approved', reviewed_at: Date.now() })
      .eq('id', id);
    if (updateErr) {
      setActionLoading(null);
      return;
    }
    setPending((prev) => prev.filter((r) => r.id !== id));
    setPendingCount((c) => c - 1);
    setApprovedToday((c) => c + 1);
    setActionLoading(null);
    try {
      await supabase.from('audit_log').insert({
        admin_id: adminId,
        action: 'approve_leave',
        entity_type: 'leave',
        entity_id: id,
        old_value: { status: 'pending' },
        new_value: { status: 'approved', student_id: req?.student_id },
        created_at: Date.now(),
      });
    } catch (_) { /* non-blocking */ }
  }

  async function handleReject(id: string, reason: string) {
    setActionLoading(id);
    const req = pending.find((r) => r.id === id);
    await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejected_reason: reason.trim() || null,
        reviewed_at: Date.now(),
      })
      .eq('id', id);
    setPending((prev) => prev.filter((r) => r.id !== id));
    setPendingCount((c) => c - 1);
    setAttentionNeeded((c) => c + 1);
    setRejectModal(null);
    setRejectReason('');
    setActionLoading(null);
    try {
      await supabase.from('audit_log').insert({
        admin_id: adminId,
        action: 'reject_leave',
        entity_type: 'leave',
        entity_id: id,
        old_value: { status: 'pending' },
        new_value: { status: 'rejected', rejected_reason: reason.trim() || null, student_id: req?.student_id },
        created_at: Date.now(),
      });
    } catch (_) { /* non-blocking */ }
  }

  const typeLabel = (type: string) =>
    type === 'sakit'
      ? { label: 'Sakit', bg: '#ffdf9e', color: '#5b4300' }
      : { label: 'Izin', bg: '#d8f5f3', color: '#00504a' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#191c1e' }}>
          Persetujuan Izin &amp; Sakit
        </h1>
        <p className="text-sm mt-1" style={{ color: '#43474f' }}>
          Tinjau dan setujui pengajuan izin dan sakit yang masuk.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="MENUNGGU PERSETUJUAN"
          value={pendingCount}
          icon={<Clock size={18} />}
          iconBg="#ffdf9e"
          iconColor="#5b4300"
        />
        <StatCard
          label="DISETUJUI HARI INI"
          value={approvedToday}
          icon={<CheckCircle size={18} />}
          iconBg="#d8f5f3"
          iconColor="#007169"
        />
        <StatCard
          label="PERLU PERHATIAN"
          value={attentionNeeded}
          icon={<AlertTriangle size={18} />}
          iconBg="#ffdad6"
          iconColor="#ba1a1a"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <p className="text-sm" style={{ color: '#747780' }}>Memuat data...</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-12 text-center">
          <CheckCircle size={40} className="mx-auto mb-3" style={{ color: '#007169' }} />
          <p className="font-medium" style={{ color: '#191c1e' }}>
            Tidak ada pengajuan yang menunggu persetujuan
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {pending.map((req) => {
            const t = typeLabel(req.type);
            const busy = actionLoading === req.id;
            return (
              <div key={req.id} className="bg-white rounded-xl border border-[#e0e3e5] p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#191c1e' }}>
                      {req.student?.fullname ?? req.student_id}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#747780' }}>
                      {req.student?.class}
                      {req.date_from
                        ? ` • ${req.date_from}${req.date_to && req.date_to !== req.date_from ? ` – ${req.date_to}` : ''}`
                        : ''}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: t.bg, color: t.color }}
                  >
                    {t.label}
                  </span>
                </div>

                {req.reason && (
                  <p
                    className="text-xs italic my-3 p-3 rounded-lg"
                    style={{ backgroundColor: '#f7f9fb', color: '#43474f' }}
                  >
                    &ldquo;{req.reason}&rdquo;
                  </p>
                )}

                {req.attachment_url && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1.5" style={{ color: '#43474f' }}>
                      Lampiran
                    </p>
                    <a
                      href={req.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs p-2.5 rounded-lg border border-[#e0e3e5] hover:bg-[#f7f9fb]"
                      style={{ color: '#405f91' }}
                    >
                      <span>📎</span>
                      <span>Lihat lampiran</span>
                    </a>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#001736' }}
                  >
                    <Check size={15} />
                    {busy ? 'Memproses...' : 'Setujui'}
                  </button>
                  <button
                    onClick={() => { setRejectModal(req.id); setRejectReason(''); }}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[#fff5f5] disabled:opacity-50"
                    style={{ borderColor: '#ffdad6', color: '#ba1a1a' }}
                  >
                    <X size={15} /> Tolak
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-base mb-1" style={{ color: '#191c1e' }}>
              Alasan Penolakan
            </h3>
            <p className="text-xs mb-3" style={{ color: '#747780' }}>
              Opsional — alasan akan tersimpan di data pengajuan.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tulis alasan penolakan..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-[#ba1a1a]"
              style={{ borderColor: '#e0e3e5', resize: 'none', color: '#191c1e' }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium border hover:bg-[#f7f9fb]"
                style={{ borderColor: '#e0e3e5', color: '#43474f' }}
              >
                Batal
              </button>
              <button
                onClick={() => handleReject(rejectModal, rejectReason)}
                disabled={actionLoading === rejectModal}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#ba1a1a' }}
              >
                {actionLoading === rejectModal ? 'Memproses...' : 'Tolak Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#43474f' }}>
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold" style={{ color: '#191c1e' }}>
        {value}
      </p>
    </div>
  );
}
