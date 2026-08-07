"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { OrderCard } from "@/components/field/order-card";
import { Clock, List, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";

type Tab = "active" | "completed";

interface FieldOrder {
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
}

export default function FieldPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [orders, setOrders] = useState<FieldOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const statusParam = activeTab === "completed" ? "COMPLETED" : "";
      const url = `/api/field/orders${statusParam ? `?status=${statusParam}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to view field orders");
          return;
        }
        throw new Error("Failed to load orders");
      }

      const data = await res.json();
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Field Work</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-red-400" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="mt-3 text-sm text-brand-600 font-medium hover:underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      )}

      {/* Tab bar */}
      {!error && (
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => handleTabChange("active")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "active"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List className="h-4 w-4" />
            Active
            {orders.length > 0 && (
              <span className="rounded-full bg-brand-100 text-brand-700 px-1.5 py-0.5 text-xs font-bold">
                {orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("completed")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "completed"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </button>
        </div>
      )}

      {/* Order list */}
      {!error && (
        <div className="space-y-3">
          {orders.length === 0 && activeTab === "active" && (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Clock className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-slate-500">No active orders assigned.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Orders assigned to your crew will appear here.
                </p>
              </CardContent>
            </Card>
          )}

          {orders.length === 0 && activeTab === "completed" && (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-slate-500">No completed orders today.</p>
              </CardContent>
            </Card>
          )}

          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => router.push(`/field/${order.id}`)}
            />
          ))}
        </div>
      )}

      {/* Bottom nav for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:hidden">
        <div className="flex items-center justify-around h-14">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "active" ? "text-brand-600" : "text-slate-400"
            }`}
          >
            <List className="h-5 w-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "completed" ? "text-brand-600" : "text-slate-400"
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            Completed
          </button>
        </div>
      </nav>
    </div>
  );
}
