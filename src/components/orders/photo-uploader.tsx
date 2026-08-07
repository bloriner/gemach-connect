"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, CheckCircle2 } from "lucide-react";

const PHOTO_TYPES = [
  { value: "ARRIVAL", label: "Arrival", color: "bg-blue-100 text-blue-700" },
  { value: "BEFORE", label: "Before Work", color: "bg-amber-100 text-amber-700" },
  { value: "DURING", label: "In Progress", color: "bg-purple-100 text-purple-700" },
  { value: "AFTER", label: "After Work", color: "bg-green-100 text-green-700" },
  { value: "DAMAGE", label: "Damage/Issue", color: "bg-red-100 text-red-700" },
  { value: "COMPLETION", label: "Completion", color: "bg-emerald-100 text-emerald-700" },
  { value: "GENERAL", label: "General", color: "bg-slate-100 text-slate-700" },
];

interface PhotoUploaderProps {
  workOrderId: string;
  onUploaded: () => void;
}

export default function PhotoUploader({ workOrderId, onUploaded }: PhotoUploaderProps) {
  const [selectedType, setSelectedType] = useState("GENERAL");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setSuccess(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // Get location if available
      let lat: number | null = null;
      let lng: number | null = null;
      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // location not available — fine
        }
      }

      const formData = new FormData();
      formData.append("workOrderId", workOrderId);
      formData.append("file", file);
      formData.append("type", selectedType);
      if (caption.trim()) formData.append("caption", caption.trim());
      if (lat != null) formData.append("lat", lat.toString());
      if (lng != null) formData.append("lng", lng.toString());

      const res = await fetch("/api/field/photos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      setSuccess(true);
      setFile(null);
      setPreview(null);
      setCaption("");
      onUploaded();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setFile(null);
    setSuccess(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {!preview ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 p-6">
          <Camera className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">Take a photo or upload from gallery</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Choose File
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const input = fileRef.current;
                if (input) {
                  input.setAttribute("capture", "environment");
                  input.click();
                  input.removeAttribute("capture");
                }
              }}
            >
              <Camera className="mr-1.5 h-4 w-4" />
              Camera
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          {/* Preview */}
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900/80"
            >
              <X className="h-4 w-4" />
            </button>
            {success && (
              <div className="absolute top-2 left-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Uploaded
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="p-3 space-y-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Photo Type</label>
              <div className="flex flex-wrap gap-1">
                {PHOTO_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => setSelectedType(pt.value)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                      selectedType === pt.value
                        ? pt.color
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)..."
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {!success && (
              <Button
                size="sm"
                className="w-full"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-4 w-4" /> Upload Photo
                  </>
                )}
              </Button>
            )}
            {success && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={clearPreview}
              >
                Take Another
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
