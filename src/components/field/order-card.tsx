"use client";

import { Clock, MapPin, Camera, CheckCircle2, AlertCircle, ChevronRight, Wrench } from "lucide-react";

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    priority: string;
    scheduledDate: string | null;
    customer: { companyName: string; phone?: string | null };
    property: { address: string; city?: string | null; state?: string | null };
    serviceType: { name: string };
    crew?: { name: string } | null;
    photos: Array<{ url: string; type: string }>;
    items?: Array<{ id: string; serviceType: { name: string }; total: number }>;
    _count?: { photos: number; checklistItems: number; forms: number };
  };
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  DISPATCHED: "bg-blue-100 text-blue-700",
  EN_ROUTE: "bg-amber-100 text-amber-700",
  ON_SITE: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  NORMAL: "bg-slate-100 text-slate-600",
  LOW: "bg-slate-50 text-slate-500",
};

export function OrderCard({ order, onClick }: OrderCardProps) {
  const latestPhoto = order.photos?.[0];
  const photosCount = order._count?.photos ?? order.photos?.length ?? 0;
  const checklistCount = order._count?.checklistItems ?? 0;
  const formsCount = order._count?.forms ?? 0;
  const upsellCount = (order.items?.length ?? 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-brand-300 transition-all active:scale-[0.98]"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {order.customer.companyName}
          </h3>
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{order.property.address}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || "bg-slate-100 text-slate-700"}`}>
            {order.status.replace("_", " ")}
          </span>
          {order.priority !== "NORMAL" && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[order.priority] || ""}`}>
              {order.priority}
            </span>
          )}
        </div>
      </div>

      {/* Service and upsells */}
      <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
        <Wrench className="h-3.5 w-3.5" />
        <span>{order.serviceType.name}</span>
        {upsellCount > 0 && (
          <span className="text-xs text-brand-600 font-medium">
            +{upsellCount} more
          </span>
        )}
      </div>

      {/* Photo thumbnail strip */}
      {latestPhoto && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto">
          {order.photos.slice(0, 3).map((photo, i) => (
            <div key={i} className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {i === 2 && photosCount > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                  +{photosCount - 2}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meta bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {photosCount > 0 && (
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3" /> {photosCount}
            </span>
          )}
          {checklistCount > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {checklistCount}
            </span>
          )}
          {order.scheduledDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(order.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
}
