"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Navigation, NavigationOff, Radio } from "lucide-react";

interface LocationTrackerProps {
  className?: string;
  variant?: "button" | "chip";
}

export function LocationTracker({ className, variant = "button" }: LocationTrackerProps) {
  const [tracking, setTracking] = useState(false);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicleName, setVehicleName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // Fetch the user's vehicle on mount
  useEffect(() => {
    fetch("/api/fleet/my-vehicle")
      .then((res) => {
        if (!res.ok) throw new Error("No vehicle");
        return res.json();
      })
      .then((vehicle) => {
        setVehicleId(vehicle.id);
        setVehicleName(vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`.trim());
      })
      .catch(() => {
        setVehicleId(null);
      });
  }, []);

  const sendLocation = useCallback(
    async (lat: number, lng: number, speed?: number | null, heading?: number | null) => {
      if (!vehicleId) return;

      // Don't spam — only send if position changed significantly or 15s passed
      const last = lastPosRef.current;
      if (last) {
        const dist = Math.sqrt((lat - last.lat) ** 2 + (lng - last.lng) ** 2) * 111000;
        if (dist < 10 && lastSent && Date.now() - lastSent.getTime() < 15000) return;
      }

      lastPosRef.current = { lat, lng };
      setLastSent(new Date());

      try {
        await fetch(`/api/fleet/vehicles/${vehicleId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, speed, heading }),
        });
        setError(null);
      } catch {
        // Silently fail — will retry on next position
      }
    },
    [vehicleId, lastSent]
  );

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed, pos.coords.heading);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLoading(false);
        setTracking(true);
        sendLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.speed != null ? pos.coords.speed * 2.237 : null, // m/s → mph
          pos.coords.heading
        );
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000,
      }
    );
  }, [sendLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    lastPosRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (!vehicleId) {
    return null; // No vehicle assigned to this crew
  }

  if (variant === "chip") {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        tracking
          ? "border-green-300 bg-green-50 text-green-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      } ${className || ""}`}>
        <span className={`h-2 w-2 rounded-full ${tracking ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
        {tracking ? "Live" : vehicleName || "Van"}
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <p className="mb-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5">{error}</p>
      )}

      {tracking ? (
        <button
          onClick={stopTracking}
          className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <NavigationOff className="h-4 w-4" />
          Stop Tracking
        </button>
      ) : (
        <button
          onClick={startTracking}
          disabled={loading}
          className="w-full rounded-xl bg-navy-900 px-4 py-3 text-sm font-semibold text-white hover:bg-navy-800 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          {loading ? "Locating..." : `Start Tracking${vehicleName ? ` — ${vehicleName}` : ""}`}
        </button>
      )}

      {tracking && lastSent && (
        <p className="mt-1.5 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <Radio className="h-3 w-3 text-green-500 animate-pulse" />
          Last update: {lastSent.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
