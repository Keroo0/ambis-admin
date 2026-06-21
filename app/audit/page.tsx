'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: number;
}

const ACTION_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  approve_leave:  { label: 'Approve',  bg: '#d8f5f3', color: '#007169' },
  reject_leave:   { label: 'Reject',   bg: '#ffdad6', color: '#ba1a1a' },
  update_grade:   { label: 'Update',   bg: '#d6e3ff', color: '#264778' },
  add_student:    { label: 'Add',      bg: '#001736', color: '#ffffff' },
  edit_student:   { label: 'Edit',     bg: '#264778', color: '#ffffff' },
  delete_student: { label: 'Delete',   bg: '#ffdad6', color: '#ba1a1a' },
};

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_BADGE[action] ?? { label: action, bg: '#e6e8ea', color: '#43474f' };
  return (
    <span
      className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function formatTs(ts: number) {
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function previewValue(raw: Record<string, unknown> | null) {
  if (!raw) return '—';
  return Object.entries(raw)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error: queryErr } = await supabase
      .from('audit_log')
      .select('id, action, entity_type, entity_id, old_value, new_value, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (queryErr) {
      setRows([]);
      setLoading(false);
      return;
    }
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { queueMicrotask(() => load()); }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#191c1e' }}>
            Audit Log
          </h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: '#43474f' }}>
            Riwayat 100 aksi admin terakhir — hanya baca.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[#f7f9fb] disabled:opacity-50 self-start"
          style={{ borderColor: '#e0e3e5', color: '#43474f' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        {loading ? (
          <p className="px-4 md:px-5 py-12 text-center text-sm" style={{ color: '#747780' }}>
            Memuat data...
          </p>
        ) : rows.length === 0 ? (
          <div className="px-4 md:px-5 py-16 text-center">
            <ShieldCheck size={40} className="mx-auto mb-3" style={{ color: '#007169' }} />
            <p className="font-medium text-sm" style={{ color: '#191c1e' }}>
              Belum ada log audit.
            </p>
            <p className="text-xs mt-1" style={{ color: '#747780' }}>
              Log akan muncul setelah admin melakukan aksi pertama.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr style={{ backgroundColor: '#001736' }}>
                  {['Waktu', 'Aksi', 'Tipe', 'Entity ID', 'Detail'].map((h) => (
                    <th
                      key={h}
                      className="px-4 md:px-5 py-3 text-left text-xs font-semibold text-white whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-t border-[#f2f4f6] hover:bg-[#f7f9fb]"
                    style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}
                  >
                    <td className="px-4 md:px-5 py-3 text-xs whitespace-nowrap" style={{ color: '#43474f' }}>
                      {formatTs(row.created_at)}
                    </td>
                    <td className="px-4 md:px-5 py-3">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="px-4 md:px-5 py-3 text-xs capitalize whitespace-nowrap" style={{ color: '#43474f' }}>
                      {row.entity_type}
                    </td>
                    <td className="px-4 md:px-5 py-3 font-mono text-xs" style={{ color: '#747780' }}>
                      <span title={row.entity_id} className="truncate max-w-[80px] inline-block align-bottom">{row.entity_id.slice(0, 8)}…</span>
                    </td>
                    <td
                      className="px-4 md:px-5 py-3 text-xs max-w-[200px] truncate"
                      style={{ color: '#43474f' }}
                    >
                      {previewValue(row.new_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs mt-3" style={{ color: '#747780' }}>
        Menampilkan {rows.length} entri terbaru.
      </p>
    </div>
  );
}
