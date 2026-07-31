"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { catOf } from "@/lib/utils";
import { getCoords } from "@/lib/geocode";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function FlyToUser({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 13, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

export default function MapContent() {
  const [gemachs, setGemachs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetch("/api/gemachs")
      .then((r) => r.json())
      .then((d) => { setGemachs(d.gemachs || []); setLoading(false); });
  }, []);

  function handleNearMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const markers = useMemo(() => {
    return gemachs
      .map((g) => {
        const coords = getCoords(g);
        if (!coords) return null;
        const cat = catOf(g.category);
        return { ...g, coords, cat };
      })
      .filter(Boolean) as any[];
  }, [gemachs]);

  // Center: first gemach or NYC
  const center: [number, number] = markers[0]?.coords || [40.7128, -74.006];

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Map View</h1>
          <p className="text-xs text-gray-500">{markers.length} gemachs mapped</p>
        </div>
        <button
          onClick={handleNearMe}
          disabled={locating}
          className="btn btn-primary"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {locating ? "Locating..." : "Near Me"}
        </button>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={userCoords ? 13 : 5}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToUser coords={userCoords} />

          {userCoords && (
            <Marker position={userCoords}>
              <Popup>
                <strong>Your location</strong>
              </Popup>
            </Marker>
          )}

          {markers.map((g: any) => (
            <Marker key={g.id} position={g.coords}>
              <Popup>
                <div className="min-w-[180px]">
                  <Link href={`/gemachs/${g.id}`} className="font-semibold text-sm hover:underline">
                    {g.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">{g.cat.icon} {g.cat.label}</p>
                  <p className="text-xs text-gray-500">{g.city}, {g.state}</p>
                  <p className="text-xs text-gray-500">{g.phone}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
