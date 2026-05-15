'use client';

import { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const KEYS = ['time_in_start', 'time_in_end', 'time_out_start', 'time_out_end'] as const;

export default function AttendanceTimeSection() {
  const [timeInStart, setTimeInStart] = useState('06:00');
  const [timeInEnd, setTimeInEnd] = useState('07:30');
  const [timeOutStart, setTimeOutStart] = useState('14:00');
  const [timeOutEnd, setTimeOutEnd] = useState('16:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .in('key', [...KEYS])
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = Object.fromEntries(
            data.map((s: { key: string; value: string }) => [s.key, s.value])
          );
          if (map['time_in_start'])  setTimeInStart(map['time_in_start']);
          if (map['time_in_end'])    setTimeInEnd(map['time_in_end']);
          if (map['time_out_start']) setTimeOutStart(map['time_out_start']);
          if (map['time_out_end'])   setTimeOutEnd(map['time_out_end']);
        }
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (timeInStart >= timeInEnd) {
      setSavedMsg('Error: Jam mulai masuk harus sebelum batas akhir');
      return;
    }
    if (timeOutStart >= timeOutEnd) {
      setSavedMsg('Error: Jam mulai pulang harus sebelum batas akhir');
      return;
    }

    setSaving(true);
    setSavedMsg('');

    const now = Math.floor(Date.now() / 1000);
    const rows = [
      { key: 'time_in_start',  value: timeInStart,  type: 'string', updated_at: now },
      { key: 'time_in_end',    value: timeInEnd,    type: 'string', updated_at: now },
      { key: 'time_out_start', value: timeOutStart, type: 'string', updated_at: now },
      { key: 'time_out_end',   value: timeOutEnd,   type: 'string', updated_at: now },
    ];

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
    const json = await res.json();

    setSaving(false);
    if (!res.ok) {
      setSavedMsg(`Error: ${json.error ?? res.statusText}`);
    } else {
      setSavedMsg('Pengaturan disimpan!');
      setTimeout(() => setSavedMsg(''), 3000);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] mt-6 overflow-hidden">
      <div className="flex items-center gap-2 px-4 md:px-5 py-4 border-b border-[#e0e3e5]">
        <Clock size={16} style={{ color: '#405f91' }} />
        <h2 className="font-semibold text-sm" style={{ color: '#191c1e' }}>Pengaturan Jam Absen</h2>
      </div>

      {loading ? (
        <div className="px-4 md:px-5 py-8 text-center text-sm" style={{ color: '#747780' }}>
          Memuat pengaturan...
        </div>
      ) : (
        <div className="p-4 md:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Absen Masuk */}
            <div className="rounded-xl p-4" style={{ backgroundColor: '#f0f4ff', border: '1px solid #d6e3ff' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#264778' }}>
                Absen Masuk
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#43474f' }}>
                    Mulai
                  </label>
                  <input
                    type="time"
                    value={timeInStart}
                    onChange={e => setTimeInStart(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#264778]"
                    style={{ borderColor: '#c4ccdd', color: '#191c1e', backgroundColor: '#fff' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#43474f' }}>
                    Batas Akhir
                  </label>
                  <input
                    type="time"
                    value={timeInEnd}
                    onChange={e => setTimeInEnd(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#264778]"
                    style={{ borderColor: '#c4ccdd', color: '#191c1e', backgroundColor: '#fff' }}
                  />
                </div>
              </div>
              <p className="text-xs mt-2.5" style={{ color: '#405f91' }}>
                Lewat pukul {timeInEnd} → dianggap terlambat
              </p>
            </div>

            {/* Absen Pulang */}
            <div className="rounded-xl p-4" style={{ backgroundColor: '#f0faf9', border: '1px solid #c8ede9' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#007169' }}>
                Absen Pulang
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#43474f' }}>
                    Mulai
                  </label>
                  <input
                    type="time"
                    value={timeOutStart}
                    onChange={e => setTimeOutStart(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007169]"
                    style={{ borderColor: '#a8d8d4', color: '#191c1e', backgroundColor: '#fff' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#43474f' }}>
                    Batas Akhir
                  </label>
                  <input
                    type="time"
                    value={timeOutEnd}
                    onChange={e => setTimeOutEnd(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007169]"
                    style={{ borderColor: '#a8d8d4', color: '#191c1e', backgroundColor: '#fff' }}
                  />
                </div>
              </div>
              <p className="text-xs mt-2.5" style={{ color: '#007169' }}>
                Siswa bisa absen pulang mulai pukul {timeOutStart}
              </p>
            </div>

          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 md:px-5 py-3 border-t border-[#f2f4f6]">
        <span
          className="text-sm"
          style={{ color: savedMsg.startsWith('Error') ? '#ba1a1a' : '#006A63', minHeight: 20 }}
        >
          {savedMsg}
        </span>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
          style={{ backgroundColor: '#001736' }}
        >
          <Save size={14} />
          {saving ? 'Menyimpan...' : 'Simpan Jam'}
        </button>
      </div>
    </div>
  );
}
