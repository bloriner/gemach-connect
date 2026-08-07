"use client";

import { useState } from "react";
import { X, Download } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  caption?: string | null;
  takenAt: string;
  user?: { name: string } | null;
  lat?: number | null;
  lng?: number | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onCaptureClick?: () => void;
}

const typeLabels: Record<string, string> = {
  ARRIVAL: "Arrival",
  IN_PROGRESS: "In Progress",
  COMPLETION: "Completion",
  DAMAGE: "Damage",
  EQUIPMENT: "Equipment",
  GENERAL: "General",
};

const typeColors: Record<string, string> = {
  ARRIVAL: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETION: "bg-green-100 text-green-700",
  DAMAGE: "bg-red-100 text-red-700",
  EQUIPMENT: "bg-purple-100 text-purple-700",
  GENERAL: "bg-slate-100 text-slate-600",
};

export function PhotoGallery({ photos, onCaptureClick }: PhotoGalleryProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const types = Array.from(new Set(photos.map((p) => p.type)));
  const filtered = selectedType
    ? photos.filter((p) => p.type === selectedType)
    : photos;

  return (
    <div className="space-y-4">
      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            selectedType === null
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({photos.length})
        </button>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type === selectedType ? null : type)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedType === type
                ? "bg-brand-600 text-white"
                : typeColors[type] || "bg-slate-100 text-slate-600"
            }`}
          >
            {typeLabels[type] || type} ({photos.filter((p) => p.type === type).length})
          </button>
        ))}
        {onCaptureClick && (
          <button
            onClick={onCaptureClick}
            className="rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition ml-auto"
          >
            + Add Photo
          </button>
        )}
      </div>

      {/* Photo grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-slate-400">
          <Download className="h-10 w-10 mb-2" />
          <p className="text-sm">No photos yet</p>
          {onCaptureClick && (
            <button
              onClick={onCaptureClick}
              className="mt-3 text-sm text-brand-600 font-medium hover:underline"
            >
              Take the first photo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filtered.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group"
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || "Job photo"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${typeColors[photo.type] || "bg-slate-100 text-slate-600"}`}>
                  {typeLabels[photo.type] || photo.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxPhoto.url}
            alt={lightboxPhoto.caption || "Job photo"}
            className="max-h-[85vh] max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxPhoto.caption && (
            <div className="absolute bottom-4 left-4 right-4 text-center text-white text-sm">
              {lightboxPhoto.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
