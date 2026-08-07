"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Undo } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface SignaturePadProps {
  onSignatureChange: (svg: string, isEmpty: boolean) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  onSignatureChange,
  width = 500,
  height = 180,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const pointsRef = useRef<Point[]>([]);
  const strokesRef = useRef<Point[][]>([]);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  // Initialize canvas
  useEffect(() => {
    const result = getCanvasContext();
    if (!result) return;
    const { canvas, ctx } = result;

    // Handle DPR for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    clearCanvas();
  }, [width, height, getCanvasContext]);

  const clearCanvas = () => {
    const result = getCanvasContext();
    if (!result) return;
    result.ctx.clearRect(0, 0, result.canvas.width, result.canvas.height);
    strokesRef.current = [];
    setHasSignature(false);
    onSignatureChange("", true);
  };

  const getPosition = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPosition(e);
    if (!pos) return;

    const result = getCanvasContext();
    if (!result) return;

    setIsDrawing(true);
    pointsRef.current = [pos];
    result.ctx.beginPath();
    result.ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const pos = getPosition(e);
    if (!pos) return;

    const result = getCanvasContext();
    if (!result) return;

    pointsRef.current.push(pos);

    const lastPoint = pointsRef.current[pointsRef.current.length - 2] || pos;
    const midPoint = {
      x: (lastPoint.x + pos.x) / 2,
      y: (lastPoint.y + pos.y) / 2,
    };

    result.ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
    result.ctx.stroke();
    result.ctx.beginPath();
    result.ctx.moveTo(midPoint.x, midPoint.y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (pointsRef.current.length > 1) {
      strokesRef.current.push([...pointsRef.current]);
      setHasSignature(true);
      const svg = generateSvg();
      onSignatureChange(svg, false);
    }
    pointsRef.current = [];
  };

  const generateSvg = (): string => {
    const strokes = strokesRef.current;
    if (strokes.length === 0) return "";

    let paths = "";
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      let d = `M ${stroke[0].x} ${stroke[0].y}`;
      for (let i = 1; i < stroke.length; i++) {
        const prev = stroke[i - 1];
        const curr = stroke[i];
        const mx = (prev.x + curr.x) / 2;
        const my = (prev.y + curr.y) / 2;
        d += ` Q ${prev.x} ${prev.y}, ${mx} ${my}`;
      }
      paths += `<path d="${d}" fill="none" stroke="#1e40af" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${paths}</svg>`;
  };

  const undoLast = () => {
    strokesRef.current.pop();
    const result = getCanvasContext();
    if (!result) return;

    result.ctx.clearRect(0, 0, result.canvas.width, result.canvas.height);

    // Redraw remaining strokes
    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) continue;
      result.ctx.beginPath();
      result.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        const prev = stroke[i - 1];
        const curr = stroke[i];
        const mx = (prev.x + curr.x) / 2;
        const my = (prev.y + curr.y) / 2;
        result.ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
      }
      result.ctx.stroke();
    }

    const empty = strokesRef.current.length === 0;
    setHasSignature(!empty);
    onSignatureChange(empty ? "" : generateSvg(), empty);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none w-full cursor-crosshair rounded-lg"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </button>
        <button
          type="button"
          onClick={undoLast}
          disabled={!hasSignature}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <Undo className="h-3.5 w-3.5" />
          Undo
        </button>
        <span className="ml-auto text-xs text-slate-400">
          {hasSignature ? "Signature captured" : "Draw your signature above"}
        </span>
      </div>
    </div>
  );
}
