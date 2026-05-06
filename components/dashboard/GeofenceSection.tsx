'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: 320, borderRadius: 12, backgroundColor: '#eceef0' }}
      className="flex items-center justify-center"
    >
      <p className="text-sm" style={{ color: '#747780' }}>Memuat peta...</p>
    </div>
  ),
});

export default function GeofenceSection() {
  const [enabled, setEnabled] = useState(true);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('50');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['geofence_enabled', 'school_lat', 'school_lng', 'geofence_radius']);

      if (data) {
        const map: Record<string, string> = Object.fromEntries(
          data.map((s: { key: string; value: string }) => [s.key, s.value])
        );
        setEnabled(map['geofence_enabled'] !== 'false');
        setLat(map['school_lat'] ?? '');
        setLng(map['school_lng'] ?? '');
        setRadius(map['geofence_radius'] ?? '50');
      }
      setLoadingSettings(false);
    }
    loadSettings();
  }, []);

  function handleMapClick(clickLat: number, clickLng: number) {
    setLat(clickLat.toFixed(6));
    setLng(clickLng.toFixed(6));
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg('');

    const now = Math.floor(Date.now() / 1000);
    const rows = [
      { key: 'geofence_enabled', value: String(enabled), type: 'bool',   updated_at: now },
      { key: 'school_lat',       value: lat,             type: 'double', updated_at: now },
      { key: 'school_lng',       value: lng,             type: 'double', updated_at: now },
      { key: 'geofence_radius',  value: radius,          type: 'int',    updated_at: now },
    ];

    const { error } = await supabase
      .from('settings')
      .upsert(rows, { onConflict: 'key' });

    setSaving(false);
    if (error) {
      setSavedMsg(`Error: ${error.message}`);
    } else {
      setSavedMsg('Pengaturan disimpan!');
      setTimeout(() => setSavedMsg(''), 3000);
    }
  }

  const latNum = lat ? parseFloat(lat) : null;
  const lngNum = lng ? parseFloat(lng) : null;
  const radiusNum = parseInt(radius) || 50;

  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] mt-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e0e3e5]">
        <div className="flex items-center gap-2">
          <MapPin size={16} style={{ color: '#006A63' }} />
          <h2 className="font-semibold text-sm" style={{ color: '#191c1e' }}>Pengaturan Lokasi Absensi</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#747780' }}>
            {enabled ? 'Aktif' : 'Nonaktif'}
          </span>
          <button
            type="button"
            onClick={() => setEnabled(v => !v)}
            className="relative w-11 h-6 rounded-full transition-colors duration-200"
            style={{ backgroundColor: enabled ? '#006A63' : '#e0e3e5' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`p-5 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {loadingSettings ? (
          <div style={{ height: 320, backgroundColor: '#f7f9fb', borderRadius: 12 }}
            className="flex items-center justify-center">
            <p className="text-sm" style={{ color: '#747780' }}>Memuat pengaturan...</p>
          </div>
        ) : (
          <MapPicker
            lat={latNum}
            lng={lngNum}
            radius={radiusNum}
            disabled={!enabled}
            onMapClick={handleMapClick}
          />
        )}

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
              style={{ borderColor: '#e0e3e5' }}
              placeholder="-6.178300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={e => setLng(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
              style={{ borderColor: '#e0e3e5' }}
              placeholder="106.631900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#43474f' }}>
              Radius (meter)
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={radius}
              onChange={e => setRadius(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#006A63]"
              style={{ borderColor: '#e0e3e5' }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#f2f4f6]">
        <span
          className="text-sm"
          style={{ color: savedMsg.startsWith('Error') ? '#ba1a1a' : '#006A63', minHeight: 20 }}
        >
          {savedMsg}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#001736' }}
        >
          <Save size={14} />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}
