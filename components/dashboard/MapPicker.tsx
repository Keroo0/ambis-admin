'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  radius: number;
  disabled: boolean;
  onMapClick: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [-6.1783, 106.6319];

export default function MapPicker({ lat, lng, radius, disabled, onMapClick }: MapPickerProps) {
  const hasCoords = lat !== null && lng !== null;
  const center: [number, number] = hasCoords ? [lat!, lng!] : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={17}
      style={{
        height: 320,
        width: '100%',
        borderRadius: 12,
        cursor: disabled ? 'default' : 'crosshair',
        zIndex: 0,
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} />
      {!disabled && <ClickHandler onMapClick={onMapClick} />}
      {hasCoords && (
        <>
          <Marker position={[lat!, lng!]} icon={markerIcon} />
          <Circle
            center={[lat!, lng!]}
            radius={radius}
            pathOptions={{ color: '#006A63', fillColor: '#006A63', fillOpacity: 0.15 }}
          />
        </>
      )}
    </MapContainer>
  );
}
