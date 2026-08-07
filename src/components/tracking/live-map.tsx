"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Truck, Clock } from "lucide-react";

interface CrewLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lastLocationAt: string;
  vehicleInfo: string | null;
  lead: { id: string; name: string; phone: string | null } | null;
  _count: { workOrders: number };
}

function FitBounds({ crews }: { crews: CrewLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (crews.length > 0) {
      const bounds = L.latLngBounds(
        crews.map((c) => [c.lat, c.lng] as [number, number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      }
    }
  }, [crews, map]);
  return null;
}

const vanIcon = L.divIcon({
  html: `<div style="background:#2563eb;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🚐</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Fix default Leaflet marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LiveMapProps {
  crews: CrewLocation[];
  selectedCrew: string | null;
  onSelect: (id: string) => void;
}

export default function LiveMap({ crews, selectedCrew, onSelect }: LiveMapProps) {
  const [mounted, setMounted] = useState(false);
  const defaultCenter: [number, number] = [44.3148, -85.6024];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {crews.map((crew) => (
        <Marker
          key={crew.id}
          position={[crew.lat, crew.lng]}
          icon={vanIcon}
          eventHandlers={{ click: () => onSelect(crew.id) }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-semibold text-sm">{crew.name}</p>
              {crew.lead && <p className="text-xs text-slate-500">{crew.lead.name}</p>}
              {crew.vehicleInfo && (
                <p className="text-xs text-slate-500 mt-1">
                  <Truck className="inline h-3 w-3 mr-1" />
                  {crew.vehicleInfo}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(crew.lastLocationAt).toLocaleTimeString()}
              </p>
              <p className="text-xs text-brand-600 mt-1">
                {crew._count.workOrders} order{crew._count.workOrders !== 1 ? "s" : ""}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
      <FitBounds crews={crews} />
    </MapContainer>
  );
}
