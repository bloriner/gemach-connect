"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Package, Loader2, Check, X, Truck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-700",
  completed: "bg-blue-50 text-blue-700",
};

export default function RequestsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"incoming" | "my">("incoming");
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const url = tab === "incoming" ? "/api/offers?incoming=true" : "/api/offers";
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setOffers(d.offers || []); setLoading(false); });
  }, [tab]);

  async function updateStatus(id: string, status: string) {
    const prev = [...offers];
    setOffers((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(`Offer ${status}`);

    const res = await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setOffers(prev);
      toast.error("Failed to update");
    }
  }

  const filtered = statusFilter ? offers.filter((o) => o.status === statusFilter) : offers;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        <p className="text-gray-500 mt-1">Manage donation offers and requests.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(["incoming", "my"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setStatusFilter(""); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              tab === t ? "text-primary-700 border-b-2 border-primary-600 -mb-[2px]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "incoming" ? "Incoming Requests" : "My Offers"}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {["", "pending", "accepted", "completed", "declined"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`badge cursor-pointer ${statusFilter === s ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={tab === "incoming" ? "No incoming requests" : "No offers yet"}
          description={tab === "incoming" ? "When someone offers to donate to your gemach, it will appear here." : "You haven't made any donation offers yet."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{o.items}</span>
                    <span className={`badge ${STATUS_COLORS[o.status] || ""}`}>{o.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    For <span className="font-medium text-gray-700">{o.gemach?.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {tab === "incoming" ? `From ${o.donor?.name}` : "Your offer"} · {o.method} · Qty: {o.qty}
                  </p>
                  {o.note && <p className="text-sm text-gray-500 italic">{o.note}</p>}
                  {o.preferredDate && <p className="text-sm text-gray-400">Preferred: {o.preferredDate}</p>}
                  <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}</p>
                </div>

                {/* Actions: gemach owner can accept/decline/completed */}
                {tab === "incoming" && o.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => updateStatus(o.id, "accepted")} className="btn btn-primary text-sm">
                      <Check className="h-4 w-4" /> Accept
                    </button>
                    <button onClick={() => updateStatus(o.id, "declined")} className="btn btn-ghost text-sm text-red-600">
                      <X className="h-4 w-4" /> Decline
                    </button>
                  </div>
                )}
                {tab === "incoming" && o.status === "accepted" && (
                  <button onClick={() => updateStatus(o.id, "completed")} className="btn btn-secondary text-sm flex-shrink-0">
                    <Truck className="h-4 w-4" /> Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
