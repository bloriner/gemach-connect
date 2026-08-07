"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Truck, Clock, Navigation } from "lucide-react";

interface VehicleLocation {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  licensePlate?: string | null;
  status: string;
  currentLat: number;
  currentLng: number;
  lastLocationAt?: string | null;
  crew?: {
    id: string;
    name: string;
    lead?: { id: string; name: string; phone?: string | null } | null;
  } | null;
}

interface LocationLog {
  lat: number;
  lng: number;
  timestamp: string;
}

interface RouteStop {
  id: string;
  order: number;
  completed: boolean;
  estimatedArrival?: string | null;
  actualArrival?: string | null;
  workOrder: {
    id: string;
    orderNumber: string;
    status: string;
    customer: { companyName: string; phone?: string | null };
    property: { address: string; lat?: number | null; lng?: number | null };
  };
}

function FitBounds({ vehicles }: { vehicles: VehicleLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (vehicles.length > 0) {
      const bounds = L.latLngBounds(
        vehicles.map((v) => [v.currentLat, v.currentLng] as [number, number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 13 });
      }
    }
  }, [vehicles, map]);
  return null;
}

// Vehicle marker icons by status
function createVanIcon(status: string) {
  const colors: Record<string, string> = {
    ACTIVE: "#16a34a",
    MAINTENANCE: "#f59e0b",
    OUT_OF_SERVICE: "#ef4444",
  };
  const bg = colors[status] || "#6b7280";
  return L.divIcon({
    html: `<div style="background:${bg};color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.35)">🚐</div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// Stop marker (small circle)
const stopIcon = L.divIcon({
  html: `<div style="background:#8b5cf6;color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)">📍</div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface FleetMapProps {
  vehicles: VehicleLocation[];
  selectedVehicle: string | null;
  onSelect: (id: string | null) => void;
  routeStops?: RouteStop[];
  locationHistory?: LocationLog[];
}

export default function FleetMap({
  vehicles,
  selectedVehicle,
  onSelect,
  routeStops = [],
  locationHistory = [],
}: FleetMapProps) {
  const [mounted, setMounted] = useState(false);
  const defaultCenter: [number, number] = [44.3148, -85.6024]; // Michigan

  useEffect(() => { setMounted(true); }, []);

  // Build polyline from location history
  const historyPath = useMemo(() => {
    return locationHistory
      .filter((l) => l.lat && l.lng)
      .map((l) => [l.lat, l.lng] as [number, number]);
  }, [locationHistory]);

  // Build route lines between stops
  const routePath = useMemo(() => {
    return routeStops
      .filter((s) => s.workOrder.property.lat && s.workOrder.property.lng)
      .sort((a, b) => a.order - b.order)
      .map((s) => [s.workOrder.property.lat!, s.workOrder.property.lng!] as [number, number]);
  }, [routeStops]);

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

      {/* Vehicle markers */}
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.currentLat, vehicle.currentLng]}
          icon={createVanIcon(vehicle.status)}
          eventHandlers={{ click: () => onSelect(vehicle.id) }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <p className="font-semibold text-sm">{vehicle.name}</p>
              {vehicle.make && (
                <p className="text-xs text-slate-500">
                  {vehicle.make} {vehicle.model || ""}
                  {vehicle.licensePlate ? ` • ${vehicle.licensePlate}` : ""}
                </p>
              )}
              {vehicle.crew && (
                <p className="text-xs text-brand-600 mt-1">
                  👤 {vehicle.crew.name}
                  {vehicle.crew.lead && ` — ${vehicle.crew.lead.name}`}
                </p>
              )}
              {vehicle.lastLocationAt && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(vehicle.lastLocationAt).toLocaleTimeString()}
                </p>
              )}
              <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                vehicle.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                vehicle.status === "MAINTENANCE" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {vehicle.status.replace("_", " ")}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Route stops as markers */}
      {routeStops
        .filter((s) => s.workOrder.property.lat && s.workOrder.property.lng)
        .map((stop) => (
          <Marker
            key={`stop-${stop.id}`}
            position={[stop.workOrder.property.lat!, stop.workOrder.property.lng!]}
            icon={stopIcon}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-xs">Stop #{stop.order + 1}</p>
                <p className="text-xs text-slate-600">{stop.workOrder.customer.companyName}</p>
                <p className="text-xs text-slate-500">{stop.workOrder.property.address}</p>
                <span className={`inline-block mt-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  stop.completed ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {stop.completed ? "Done" : "Pending"}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Route line between stops */}
      {routePath.length > 1 && (
        <Polyline
          positions={routePath}
          pathOptions={{ color: "#8b5cf6", weight: 3, dashArray: "10 6", opacity: 0.7 }}
        />
      )}

      {/* Location history trail */}
      {historyPath.length > 1 && (
        <Polyline
          positions={historyPath}
          pathOptions={{ color: "#3b82f6", weight: 2, opacity: 0.4 }}
        />
      )}

      <FitBounds vehicles={vehicles} />
    </MapContainer>
  );
}
