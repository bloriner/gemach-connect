"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_COLORS, type OrderStatus, formatCurrency } from "@/lib/utils";
import {
  Loader2, RefreshCw, Clock, MapPin, User, Wrench, AlertCircle,
  ChevronDown, ArrowRight, GripVertical
} from "lucide-react";

// ── Types ──────────────────────────────────────────────
interface Crew {
  id: string;
  name: string;
  lead: { id: string; name: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  completedAt: string | null;
  createdAt: string;
  price: number | null;
  ageHours: number | null;
  customer: { id: string; companyName: string; contactName: string | null; phone: string | null };
  property: { id: string; name: string; address: string; city: string | null; state: string | null };
  serviceType: { id: string; name: string };
  crew: { id: string; name: string; lead: { id: string; name: string } | null } | null;
}

type Column = "unassigned" | "scheduled" | "inProgress" | "completed";

interface ColumnDef {
  key: Column;
  label: string;
  color: string;
  bgColor: string;
}

const COLUMNS: ColumnDef[] = [
  { key: "unassigned", label: "Unassigned", color: "text-yellow-700", bgColor: "bg-yellow-50" },
  { key: "scheduled", label: "Scheduled", color: "text-blue-700", bgColor: "bg-blue-50" },
  { key: "inProgress", label: "In Progress", color: "text-purple-700", bgColor: "bg-purple-50" },
  { key: "completed", label: "Completed Today", color: "text-green-700", bgColor: "bg-green-50" },
];

const priorityBadgeVariant = (p: string): "danger" | "warning" | "info" | "default" => {
  const map: Record<string, "danger" | "warning" | "info" | "default"> = {
    URGENT: "danger", HIGH: "warning", NORMAL: "info", LOW: "default",
  };
  return map[p] ?? "default";
};

// ── Page ───────────────────────────────────────────────
export default function DispatchPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [todayCompleted, setTodayCompleted] = useState<Order[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch("/api/dispatch/board");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOrders(data.orders);
      setTodayCompleted(data.todayCompleted);
      setCrews(data.crews);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchBoard, 30000);
    return () => clearInterval(interval);
  }, [fetchBoard]);

  // ── Group orders into columns ──
  const grouped = useCallback(() => {
    const unassigned: Order[] = [];
    const scheduled: Order[] = [];
    const inProgress: Order[] = [];
    const completed: Order[] = [];

    for (const o of orders) {
      if (!o.crew) {
        unassigned.push(o);
      } else if (o.status === "EN_ROUTE" || o.status === "ON_SITE" || o.status === "ARRIVED") {
        inProgress.push(o);
      } else if (o.status === "COMPLETED") {
        completed.push(o);
      } else {
        scheduled.push(o); // PENDING, DISPATCHED with crew
      }
    }

    // Merge today's already-completed orders
    for (const o of todayCompleted) {
      completed.push(o);
    }

    return { unassigned, scheduled, inProgress, completed };
  }, [orders, todayCompleted]);

  // ── Status change ──
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchBoard();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Crew assignment ──
  const handleAssignCrew = async (orderId: string, crewId: string) => {
    setActionLoading(orderId);
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crewId, status: "DISPATCHED" }),
      });
      if (res.ok) fetchBoard();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const groups = grouped();

  // ── Stats ──
  const allActive = groups.unassigned.length + groups.scheduled.length + groups.inProgress.length;
  const urgent = orders.filter((o) => o.priority === "URGENT").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispatch Board</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and track all active jobs</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBoard}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{allActive}</p>
            <p className="text-xs text-slate-500">Active Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{groups.scheduled.length}</p>
            <p className="text-xs text-slate-500">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{groups.inProgress.length}</p>
            <p className="text-xs text-slate-500">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{groups.completed.length}</p>
            <p className="text-xs text-slate-500">Completed Today</p>
          </CardContent>
        </Card>
      </div>

      {urgent > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span><strong>{urgent}</strong> urgent job{urgent > 1 ? "s" : ""} need{urgent === 1 ? "s" : ""} attention</span>
        </div>
      )}

      {/* ── Board Columns ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colOrders = groups[col.key];
          return (
            <div key={col.key} className="flex flex-col">
              {/* Column Header */}
              <div className={`flex items-center justify-between rounded-t-lg ${col.bgColor} px-4 py-3`}>
                <h3 className={`text-sm font-semibold ${col.color}`}>
                  {col.label}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${col.bgColor} ${col.color}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className={`flex-1 rounded-b-lg border border-t-0 border-slate-200 ${col.bgColor} bg-opacity-30 p-2 space-y-2 min-h-[200px]`}>
                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <GripVertical className="h-5 w-5 text-slate-300" />
                    <p className="mt-2 text-xs text-slate-400">No orders</p>
                  </div>
                )}

                {colOrders.map((order) => {
                  const isLoading = actionLoading === order.id;
                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      {/* Top row: order number + priority */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono font-medium text-brand-700">
                          {order.orderNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {order.priority === "URGENT" && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-red-500" title="Urgent" />
                          )}
                          <Badge variant={priorityBadgeVariant(order.priority)} className="text-[10px]">
                            {order.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Customer + Service */}
                      <p className="mt-1 text-sm font-medium text-slate-900 truncate">
                        {order.customer.companyName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Wrench className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{order.serviceType.name}</span>
                      </div>

                      {/* Address */}
                      <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-400">
                        <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{order.property.address}</span>
                      </div>

                      {/* Crew + Time */}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        {order.crew ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{order.crew.name}</span>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Unassigned</span>
                        )}
                        {order.scheduledDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(order.scheduledDate).toLocaleTimeString("en-US", {
                              hour: "numeric", minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>

                      {/* Age indicator for unassigned */}
                      {!order.crew && order.ageHours != null && order.ageHours > 2 && (
                        <div className="mt-1.5 text-[10px] text-amber-600">
                          Waiting {order.ageHours}h
                        </div>
                      )}

                      {/* Quick Actions Dropdown */}
                      <div className="mt-2 -mb-1 -mx-1">
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                        ) : (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(openMenu === order.id ? null : order.id);
                              }}
                              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                              Actions <ChevronDown className="h-2.5 w-2.5" />
                            </button>

                            {openMenu === order.id && (
                              <div
                                className="absolute left-0 top-full z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Status options */}
                                {order.status !== "DISPATCHED" && order.crew && (
                                  <button
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                    onClick={() => handleStatusChange(order.id, "DISPATCHED")}
                                  >
                                    Mark Dispatched
                                  </button>
                                )}
                                {order.status !== "EN_ROUTE" && order.crew && (
                                  <button
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                    onClick={() => handleStatusChange(order.id, "EN_ROUTE")}
                                  >
                                    Mark En Route
                                  </button>
                                )}
                                {order.status !== "ON_SITE" && order.crew && (
                                  <button
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                    onClick={() => handleStatusChange(order.id, "ON_SITE")}
                                  >
                                    Mark On Site
                                  </button>
                                )}
                                {order.status !== "COMPLETED" && (
                                  <button
                                    className="w-full text-left px-3 py-1.5 text-xs text-green-700 hover:bg-green-50"
                                    onClick={() => handleStatusChange(order.id, "COMPLETED")}
                                  >
                                    Mark Completed
                                  </button>
                                )}

                                {/* Assign crew (only for unassigned) */}
                                {!order.crew && (
                                  <>
                                    <div className="border-t border-slate-100 my-1" />
                                    <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                                      Assign Crew
                                    </p>
                                    {crews.map((crew) => (
                                      <button
                                        key={crew.id}
                                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                        onClick={() => handleAssignCrew(order.id, crew.id)}
                                      >
                                        {crew.name}
                                        {crew.lead && (
                                          <span className="text-slate-400"> — {crew.lead.name}</span>
                                        )}
                                      </button>
                                    ))}
                                    {crews.length === 0 && (
                                      <p className="px-3 py-1.5 text-xs text-slate-400">No crews available</p>
                                    )}
                                  </>
                                )}

                                {/* Reassign (for assigned orders) */}
                                {order.crew && crews.length > 1 && (
                                  <>
                                    <div className="border-t border-slate-100 my-1" />
                                    <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                                      Reassign
                                    </p>
                                    {crews
                                      .filter((c) => c.id !== order.crew?.id)
                                      .map((crew) => (
                                        <button
                                          key={crew.id}
                                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                          onClick={() => handleAssignCrew(order.id, crew.id)}
                                        >
                                          {crew.name}
                                        </button>
                                      ))}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
