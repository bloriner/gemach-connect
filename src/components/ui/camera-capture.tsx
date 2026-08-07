"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Check, RefreshCw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  onClose?: () => void;
  label?: string;
}

export function CameraCapture({ onCapture, onClose, label = "Take Photo" }: CameraCaptureProps) {
  const [mode, setMode] = useState<"idle" | "camera" | "preview">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode("camera");
    } catch {
      setError("Could not access camera. Please check permissions or use the upload option.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setCapturedFile(file);
        setPreviewUrl(url);
        setMode("preview");
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const confirmPhoto = () => {
    if (capturedFile && previewUrl) {
      onCapture(capturedFile, previewUrl);
    }
    resetState();
  };

  const retakePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedFile(null);
    setPreviewUrl(null);
    startCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedFile(file);
    setPreviewUrl(url);
    setMode("preview");
  };

  const resetState = () => {
    stopCamera();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedFile(null);
    setMode("idle");
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  return (
    <div className="space-y-3">
      {/* Idle state: action buttons */}
      {mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startCamera}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition active:scale-95"
          >
            <Camera className="h-4 w-4" />
            {label}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition active:scale-95"
          >
            <Upload className="h-4 w-4" />
            Upload Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Camera view */}
      {mode === "camera" && (
        <div className="relative overflow-hidden rounded-xl border-2 border-brand-500 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-[60vh] object-cover"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg hover:scale-105 transition active:scale-95"
              aria-label="Capture photo"
            >
              <div className="h-12 w-12 rounded-full border-4 border-slate-800" />
            </button>
          </div>
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Close camera"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Preview */}
      {mode === "preview" && previewUrl && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border-2 border-slate-200">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto max-h-[60vh] object-cover"
            />
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={retakePhoto}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Retake
            </button>
            <button
              onClick={confirmPhoto}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              <Check className="h-4 w-4" />
              Use Photo
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
