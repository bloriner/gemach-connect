"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  MapPin,
  Wrench,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  StickyNote,
  FileText,
  Receipt,
  Package,
  AlertCircle,
} from "lucide-react";

// ── Types ──
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
  notes: string | null;
  price: number | null;
  billingType: string;
  completedAt: string | null;
  createdAt: string;
  customer: { id: string; companyName: string; contactName: string | null; email: string | null; phone: string | null };
  property: { id: string; address: string; city: string | null; state: string | null; accessNotes: string | null };
  serviceType: { id: string; name: string; basePrice: number | null };
  crew: (Crew & { members: { id: string; name: string }[] }) | null;
  invoice: { id: string; invoiceNumber: string; status: string; total: number } | null;
  items: { id: string; serviceType: { name: string }; description: string | null; quantity: number; unitPrice: number; total: number }[];
  timeEntries: { id: string; type: string; timestamp: string; user: { name: string } }[];
  photos: { id: string; url: string; type: string; caption: string | null }[];
}

const STATUS_FLOW = ["PENDING", "SCHEDULED", "DISPATCHED", "EN_ROUTE", "ON_SITE", "COMPLETED"] as const;

// ── Helpers ──
const statusVariant = (s: string) => {
  const map: Record<string, "warning" | "info" | "success" | "danger"> = {
    PENDING: "warning", SCHEDULED: "info", DISPATCHED: "info",
    EN_ROUTE: "info", ON_SITE: "info", COMPLETED: "success", CANCELLED: "danger",
  };
  return map[s] ?? "default";
};

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const formatDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

const fmtCurrency = (n: number | null) =>
  n != null ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";

// ── Page ──
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Editable fields
  const [crewId, setCrewId] = useState("");
  const [status, setStatus] = useState("");
  const [price, setPrice] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data.order);
        setCrews(data.allCrews || []);
        setCrewId(data.order.crew?.id || "");
        setStatus(data.order.status);
        setPrice(data.order.price?.toString() || "");
        setScheduledDate(data.order.scheduledDate ? data.order.scheduledDate.slice(0, 16) : "");
        setNotes(data.order.notes || "");
        setLoading(false);
      });
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewId: crewId || null,
          status,
          price: price ? parseFloat(price) : null,
          scheduledDate: scheduledDate || null,
          notes: notes || null,
          notifyCustomer,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setOrder(updated);
      showToast("Order updated");
    } catch {
      showToast("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const advanceStatus = async (next: string) => {
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, notifyCustomer }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setOrder(updated);
      showToast(`Status → ${next.replace("_", " ")}`);
    } catch {
      setStatus(order?.status || "PENDING");
      showToast("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const currentIdx = STATUS_FLOW.indexOf(order?.status as typeof STATUS_FLOW[number]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="text-slate-500">Order not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/orders")}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
            <Badge variant={statusVariant(order.status)}>{order.status.replace("_", " ")}</Badge>
            {order.priority !== "NORMAL" && (
              <Badge variant="danger">{order.priority}</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Created {formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-1">
            {STATUS_FLOW.map((s, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              const isCancelled = order.status === "CANCELLED";
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-3 w-3 rounded-full transition ${
                        isCancelled ? "bg-red-300" : done ? "bg-brand-600" : active ? "bg-brand-400 ring-2 ring-brand-200" : "bg-slate-200"
                      }`}
                    />
                    <span className={`text-[10px] font-medium whitespace-nowrap ${
                      isCancelled ? "text-red-400" : done || active ? "text-brand-700" : "text-slate-400"
                    }`}>
                      {s.replace("_", " ")}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mt-[-12px] ${
                      isCancelled ? "bg-red-200" : i < currentIdx ? "bg-brand-500" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — Info cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Card>
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <User className="h-4 w-4 text-slate-400" /> Customer
              </h3>
              <p className="font-medium text-slate-900">{order.customer.companyName}</p>
              {order.customer.contactName && (
                <p className="text-sm text-slate-600 mt-0.5">{order.customer.contactName}</p>
              )}
              <div className="flex gap-4 mt-2 text-sm text-slate-500">
                {order.customer.email && <span>{order.customer.email}</span>}
                {order.customer.phone && <span>{order.customer.phone}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Property */}
          <Card>
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <MapPin className="h-4 w-4 text-slate-400" /> Property
              </h3>
              <p className="font-medium text-slate-900">{order.property.address}</p>
              {(order.property.city || order.property.state) && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {[order.property.city, order.property.state].filter(Boolean).join(", ")}
                </p>
              )}
              {order.property.accessNotes && (
                <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  <strong>Access:</strong> {order.property.accessNotes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service & Pricing */}
          <Card>
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Wrench className="h-4 w-4 text-slate-400" /> Service &amp; Pricing
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="info">{order.serviceType.name}</Badge>
                {order.serviceType.basePrice && (
                  <span className="text-xs text-slate-500">
                    Base: {fmtCurrency(order.serviceType.basePrice)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Price</label>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Billing</label>
                  <Badge variant={order.billingType === "SPLIT" ? "info" : "default"}>
                    {order.billingType === "SPLIT" ? "Split" : "Single"}
                  </Badge>
                </div>
              </div>

              {/* Upsell items */}
              {order.items.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                    <Package className="h-3 w-3" /> Added Items
                  </h4>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          {item.serviceType.name}
                          {item.description ? ` — ${item.description}` : ""}
                          {" × "}{item.quantity}
                        </span>
                        <span className="font-medium">{fmtCurrency(item.total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                      <span>Total</span>
                      <span>
                        {fmtCurrency(
                          order.items.reduce((sum, i) => sum + i.total, 0) + (order.price || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crew Assignment */}
          <Card>
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Users className="h-4 w-4 text-slate-400" /> Crew &amp; Schedule
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Assign Crew</label>
                  <select
                    value={crewId}
                    onChange={(e) => setCrewId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Unassigned</option>
                    {crews.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.lead ? `(${c.lead.name})` : ""}
                      </option>
                    ))}
                  </select>
                  {order.crew && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {order.crew.members.map((m) => (
                        <span key={m.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Scheduled</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <StickyNote className="h-4 w-4 text-slate-400" /> Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          {order.timeEntries.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Clock className="h-4 w-4 text-slate-400" /> Activity Timeline
                </h3>
                <div className="space-y-3">
                  {[...order.timeEntries]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((te) => (
                      <div key={te.id} className="flex gap-3 text-sm">
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-brand-400 flex-shrink-0" />
                        <div>
                          <p className="text-slate-700">
                            <strong>{te.user.name}</strong> — {te.type.replace("_", " ")}
                          </p>
                          <p className="text-xs text-slate-400">{formatDateTime(te.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — Actions sidebar */}
        <div className="space-y-4">
          {/* Status Actions */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Actions</h3>
              <div className="space-y-2">
                {STATUS_FLOW.map((s) => {
                  const idx = STATUS_FLOW.indexOf(s);
                  const canAdvance = idx === currentIdx + 1 || (idx > currentIdx && order.status !== "CANCELLED");
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={s}
                      disabled={!canAdvance || saving}
                      onClick={() => advanceStatus(s)}
                      className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isCurrent
                          ? "bg-brand-50 text-brand-700 border border-brand-200"
                          : canAdvance
                          ? "bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-600"
                          : "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed"
                      }`}
                    >
                      {idx < currentIdx ? (
                        <CheckCircle2 className="h-4 w-4 text-brand-500" />
                      ) : isCurrent ? (
                        <Clock className="h-4 w-4 text-brand-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                      )}
                      {s.replace("_", " ")}
                    </button>
                  );
                })}
                {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                  <button
                    onClick={() => advanceStatus("CANCELLED")}
                    disabled={saving}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <Card>
            <CardContent className="p-5">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={notifyCustomer}
                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Notify customer of changes
                </label>
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardContent className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Completed</span>
                <span className="font-medium">{formatDateTime(order.completedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price</span>
                <span className="font-medium">{fmtCurrency(order.price)}</span>
              </div>
              {order.invoice && (
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-slate-500">Invoice</span>
                  <a
                    href={`/invoicing/${order.invoice.id}`}
                    className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {order.invoice.invoiceNumber}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
