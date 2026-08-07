"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, MapPin } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  lat: number | null;
  lng: number | null;
  takenAt: string;
  user: { name: string };
}

const TYPE_LABELS: Record<string, string> = {
  ARRIVAL: "Arrival",
  BEFORE: "Before",
  DURING: "In Progress",
  AFTER: "After",
  DAMAGE: "Damage",
  COMPLETION: "Completion",
  GENERAL: "General",
};

const TYPE_COLORS: Record<string, string> = {
  ARRIVAL: "bg-blue-100 text-blue-700",
  BEFORE: "bg-amber-100 text-amber-700",
  DURING: "bg-purple-100 text-purple-700",
  AFTER: "bg-green-100 text-green-700",
  DAMAGE: "bg-red-100 text-red-700",
  COMPLETION: "bg-emerald-100 text-emerald-700",
  GENERAL: "bg-slate-100 text-slate-700",
};

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">No photos yet</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setLightbox(photo)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
          >
            <img
              src={photo.url}
              alt={photo.caption || photo.type}
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[photo.type] || "bg-slate-100 text-slate-700"}`}
              >
                {TYPE_LABELS[photo.type] || photo.type}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.url}
              alt={lightbox.caption || ""}
              className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
            />
            <div className="mt-3 flex items-center justify-between text-white">
              <div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[lightbox.type] || ""}`}
                >
                  {TYPE_LABELS[lightbox.type] || lightbox.type}
                </span>
                {lightbox.caption && (
                  <p className="mt-1 text-sm">{lightbox.caption}</p>
                )}
                <p className="mt-1 text-xs text-white/60">
                  {lightbox.user.name} —{" "}
                  {format(new Date(lightbox.takenAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              {(lightbox.lat != null && lightbox.lng != null) && (
                <a
                  href={`https://maps.google.com/?q=${lightbox.lat},${lightbox.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-white/60 hover:text-white"
                >
                  <MapPin className="h-3 w-3" />
                  View on map
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
