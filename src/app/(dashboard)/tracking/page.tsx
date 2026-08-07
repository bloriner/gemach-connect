"use client";

import { useEffect, useState, useCallback } from "react";
import nextDynamic from "next/dynamic";
import { Clock, Truck, Navigation, MapPin, CheckCircle2, Send, Phone, AlertCircle, Gauge } from "lucide-react";

const FleetMap = nextDynamic(() => import("@/components/tracking/fleet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
    </div>
  ),
});

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
  _count?: { routeStops: number };
}

interface LocationLog {
  id: string;
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  timestamp: string;
}

interface RouteStop {
  id: string;
  order: number;
  completed: boolean;
  estimatedArrival?: string | null;
  actualArrival?: string | null;
  notes?: string | null;
  workOrder: {
    id: string;
    orderNumber: string;
    status: string;
    priority: string;
    customer: { id: string; companyName: string; phone?: string | null };
    property: { id: string; address: string; lat?: number | null; lng?: number | null };
    serviceType: { name: string };
  };
}

interface VehicleDetail {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  licensePlate?: string | null;
  color?: string | null;
  status: string;
  currentLat?: number | null;
  currentLng?: number | null;
  lastLocationAt?: string | null;
  crew?: {
    name: string;
    lead?: { name: string; phone?: string | null } | null;
  } | null;
  routeStops: RouteStop[];
  locationLogs: LocationLog[];
}

export default function TrackingPage() {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vehicleDetail, setVehicleDetail] = useState<VehicleDetail | null>(null);
  const [notifyingStop, setNotifyingStop] = useState<string | null>(null);
  const [completingStop, setCompletingStop] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/fleet/locations");
      if (res.ok) {
        setVehicles(await res.json());
        setError(null);
      }
    } catch (e) {
      console.error("Failed to fetch locations", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVehicleDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/fleet/vehicles/${id}`);
      if (res.ok) {
        setVehicleDetail(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch vehicle detail", e);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 15000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  useEffect(() => {
    if (selectedVehicle) {
      fetchVehicleDetail(selectedVehicle);
      const detailInterval = setInterval(() => fetchVehicleDetail(selectedVehicle), 15000);
      return () => clearInterval(detailInterval);
    } else {
      setVehicleDetail(null);
    }
  }, [selectedVehicle, fetchVehicleDetail]);

  // Send On-My-Way notification
  const notifyOnMyWay = async (stopId: string) => {
    setNotifyingStop(stopId);
    try {
      await fetch(`/api/fleet/routes/${stopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimatedArrival: new Date(Date.now() + 20 * 60000).toISOString(), // 20 min ETA
          notifyCustomer: true,
        }),
      });
      if (selectedVehicle) fetchVehicleDetail(selectedVehicle);
    } catch (e) {
      console.error(e);
    } finally {
      setNotifyingStop(null);
    }
  };

  // Mark stop complete
  const markStopComplete = async (stopId: string) => {
    setCompletingStop(stopId);
    try {
      await fetch(`/api/fleet/routes/${stopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          actualArrival: new Date().toISOString(),
        }),
      });
      if (selectedVehicle) fetchVehicleDetail(selectedVehicle);
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingStop(null);
    }
  };

  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE");
  const selectedVehicleLoc = vehicles.find((v) => v.id === selectedVehicle);

  // Latest location log for speed stats
  const latestLog = vehicleDetail?.locationLogs?.[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Fleet Tracking</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeVehicles.length} van{activeVehicles.length !== 1 ? "s" : ""} active
            {" — "}Updates every 15s
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="h-[500px] w-full overflow-hidden rounded-xl border border-slate-200 lg:h-[calc(100vh-200px)]">
            {loading ? (
              <div className="flex h-full items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
              </div>
            ) : (
              <FleetMap
                vehicles={activeVehicles}
                selectedVehicle={selectedVehicle}
                onSelect={setSelectedVehicle}
                routeStops={vehicleDetail?.routeStops || []}
                locationHistory={vehicleDetail?.locationLogs?.map((l) => ({
                  lat: l.lat,
                  lng: l.lng,
                  timestamp: l.timestamp,
                })) || []}
              />
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Active vans list */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Truck className="h-4 w-4" />
              Active Vans
            </h2>
            {!loading && vehicles.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
                No vehicles being tracked.
                <br />
                Vehicles appear when technicians go mobile.
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {vehicles.map((vehicle) => {
                  const isActive = vehicle.lastLocationAt
                    ? Date.now() - new Date(vehicle.lastLocationAt).getTime() < 2 * 60 * 60 * 1000
                    : false;
                  const isSelected = selectedVehicle === vehicle.id;

                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(isSelected ? null : vehicle.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                          : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-900">{vehicle.name}</span>
                          <span className={`inline-flex h-2 w-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
                        </div>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          vehicle.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {vehicle.status}
                        </span>
                      </div>
                      {vehicle.crew && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          👤 {vehicle.crew.lead?.name || vehicle.crew.name}
                        </p>
                      )}
                      {vehicle.licensePlate && (
                        <p className="text-xs text-slate-400 mt-0.5">📋 {vehicle.licensePlate}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        {vehicle.lastLocationAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {isActive ? "Live" : new Date(vehicle.lastLocationAt).toLocaleTimeString()}
                          </span>
                        )}
                        {vehicle._count && (
                          <span>{vehicle._count.routeStops} stops</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected vehicle detail & route */}
          {vehicleDetail && (
            <div className="space-y-3">
              {/* Speed & stats card */}
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Vehicle Info</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Make/Model</span>
                    <p className="font-medium text-slate-800">
                      {[vehicleDetail.make, vehicleDetail.model, vehicleDetail.year].filter(Boolean).join(" ") || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Plate</span>
                    <p className="font-medium text-slate-800">{vehicleDetail.licensePlate || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Crew</span>
                    <p className="font-medium text-slate-800">{vehicleDetail.crew?.name || "Unassigned"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Speed</span>
                    <p className="font-medium text-slate-800 flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5" />
                      {latestLog?.speed != null ? `${Math.round(latestLog.speed)} mph` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Route timeline */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Navigation className="h-4 w-4" />
                  Today's Route
                  {vehicleDetail.routeStops.length > 0 && (
                    <span className="text-xs font-normal text-slate-400 ml-auto">
                      {vehicleDetail.routeStops.filter((s) => s.completed).length}/
                      {vehicleDetail.routeStops.length} done
                    </span>
                  )}
                </h3>

                {vehicleDetail.routeStops.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                    <MapPin className="h-5 w-5 mx-auto mb-1 text-slate-300" />
                    No route stops planned for today.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {vehicleDetail.routeStops
                      .sort((a, b) => a.order - b.order)
                      .map((stop, idx) => (
                        <div
                          key={stop.id}
                          className={`rounded-lg border p-3 ${
                            stop.completed
                              ? "border-green-200 bg-green-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className={`flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                                stop.completed
                                  ? "bg-green-500 text-white"
                                  : "bg-brand-100 text-brand-700"
                              }`}>
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {stop.workOrder.customer.companyName}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{stop.workOrder.property.address}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{stop.workOrder.serviceType.name}</p>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          {!stop.completed && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => notifyOnMyWay(stop.id)}
                                disabled={notifyingStop === stop.id}
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                              >
                                <Send className="h-3 w-3" />
                                {notifyingStop === stop.id ? "Sending..." : "On My Way"}
                              </button>
                              <button
                                onClick={() => markStopComplete(stop.id)}
                                disabled={completingStop === stop.id}
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-green-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                {completingStop === stop.id ? "..." : "Done"}
                              </button>
                            </div>
                          )}

                          {stop.completed && (
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                              {stop.actualArrival && ` at ${new Date(stop.actualArrival).toLocaleTimeString()}`}
                            </div>
                          )}

                          {stop.estimatedArrival && !stop.completed && (
                            <div className="mt-1 text-xs text-blue-600">
                              ETA: {new Date(stop.estimatedArrival).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
