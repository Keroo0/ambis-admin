'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: string | null;
  new_value: string | null;
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

function previewValue(raw: string | null) {
  if (!raw) return '—';
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(obj)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  } catch {
    return raw.slice(0, 80);
  }
}

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('audit_log')
      .select('id, action, entity_type, entity_id, old_value, new_value, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#191c1e' }}>
            Audit Log
          </h1>
          <p className="text-sm mt-1" style={{ color: '#43474f' }}>
            Riwayat 100 aksi admin terakhir — hanya baca.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[#f7f9fb] disabled:opacity-50"
          style={{ borderColor: '#e0e3e5', color: '#43474f' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
        {loading ? (
          <p className="px-5 py-12 text-center text-sm" style={{ color: '#747780' }}>
            Memuat data...
          </p>
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <ShieldCheck size={40} className="mx-auto mb-3" style={{ color: '#007169' }} />
            <p className="font-medium text-sm" style={{ color: '#191c1e' }}>
              Belum ada log audit.
            </p>
            <p className="text-xs mt-1" style={{ color: '#747780' }}>
              Log akan muncul setelah admin melakukan aksi pertama.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#001736' }}>
                {['Waktu', 'Aksi', 'Tipe', 'Entity ID', 'Detail'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-white"
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
                  <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: '#43474f' }}>
                    {formatTs(row.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <ActionBadge action={row.action} />
                  </td>
                  <td className="px-5 py-3 text-xs capitalize" style={{ color: '#43474f' }}>
                    {row.entity_type}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#747780' }}>
                    <span title={row.entity_id}>{row.entity_id.slice(0, 8)}…</span>
                  </td>
                  <td
                    className="px-5 py-3 text-xs max-w-xs truncate"
                    style={{ color: '#43474f' }}
                  >
                    {previewValue(row.new_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs mt-3" style={{ color: '#747780' }}>
        Menampilkan {rows.length} entri terbaru.
      </p>
    </div>
  );
}
