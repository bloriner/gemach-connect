"use client";

import { useState, useEffect } from "react";
import { Clock, User, MapPin, FileText, Package, ArrowRightLeft, Loader2 } from "lucide-react";

export interface TimelineEntry {
  type: "CHECKOUT";
  id: string;
  timestamp: string;
  workOrderNumber: string;
  propertyAddress: string;
  checkedOutBy: string;
  checkedInAt: string | null;
  checkedInBy: string | null;
  notes: string | null;
  duration: string | null;
}

interface Props {
  equipmentId: string;
  open: boolean;
}

export function EquipmentTimeline({ equipmentId, open }: Props) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/equipment/${equipmentId}/history`)
      .then((r) => r.json())
      .then((data) => setTimeline(data.timeline ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [equipmentId, open]);

  if (!open) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-xs">Loading history...</span>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-slate-400">
        <Package className="h-5 w-5 mx-auto mb-1 text-slate-300" />
        No checkout history yet.
      </div>
    );
  }

  return (
    <div className="space-y-0 pl-4 border-l-2 border-slate-200 ml-2 mt-2">
      {timeline.map((entry, i) => (
        <div key={entry.id} className="relative pb-4 last:pb-0">
          {/* Dot */}
          <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ${entry.checkedInAt ? "bg-green-500" : "bg-blue-500"}`} />

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {new Date(entry.timestamp).toLocaleDateString()} at{" "}
              {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="flex items-center gap-1 text-slate-600">
                <FileText className="h-3 w-3 text-slate-400" />
                <span className="font-medium">{entry.workOrderNumber}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <User className="h-3 w-3 text-slate-400" />
                {entry.checkedOutBy}
              </div>
              <div className="flex items-center gap-1 text-slate-500 col-span-2">
                <MapPin className="h-3 w-3 text-slate-400" />
                {entry.propertyAddress}
              </div>
            </div>

            {entry.checkedInAt && (
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-green-600">
                  <ArrowRightLeft className="h-3 w-3" />
                  Returned {new Date(entry.checkedInAt).toLocaleDateString()}
                </span>
                <span className="text-slate-400">by {entry.checkedInBy}</span>
                {entry.duration && (
                  <span className="text-slate-400">· {entry.duration}</span>
                )}
              </div>
            )}

            {!entry.checkedInAt && (
              <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                Currently deployed
              </div>
            )}

            {entry.notes && (
              <p className="text-xs text-slate-400 italic">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
