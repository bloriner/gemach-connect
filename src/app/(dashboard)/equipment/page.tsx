"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  QrCode, Plus, X, Download, MapPin, Wrench, CheckCircle2,
  AlertTriangle, Package, RefreshCw, History, ClipboardList,
  Loader2, ArrowRightLeft,
} from "lucide-react";
import { EquipmentTimeline } from "@/components/equipment/equipment-timeline";

interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  status: string;
  location: string | null;
  qrCode: string;
  notes: string | null;
  deployedAt: string | null;
  workOrder: { orderNumber: string } | null;
  property: { name: string; address: string } | null;
}

const EQUIPMENT_TYPES = [
  "EXTRACTOR", "FAN", "DEHUMIDIFIER", "AIR_SCRUBBER", "SPRAYER", "OTHER",
];

const typeLabels: Record<string, string> = {
  EXTRACTOR: "Extractor",
  FAN: "Fan",
  DEHUMIDIFIER: "Dehumidifier",
  AIR_SCRUBBER: "Air Scrubber",
  SPRAYER: "Sprayer",
  OTHER: "Other",
};

const statusVariant = (s: string): "success" | "info" | "warning" | "danger" | "default" => {
  const m: Record<string, "success" | "info" | "warning" | "danger" | "default"> = {
    AVAILABLE: "success",
    DEPLOYED: "info",
    MAINTENANCE: "warning",
    RETIRED: "danger",
  };
  return m[s] ?? "default";
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [qrModal, setQrModal] = useState<Equipment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState<string | null>(null); // equipmentId
  const [checkinModal, setCheckinModal] = useState<string | null>(null); // equipmentId
  const [historyOpen, setHistoryOpen] = useState<Set<string>>(new Set());
  const [workOrders, setWorkOrders] = useState<{ id: string; orderNumber: string; address: string }[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("EXTRACTOR");
  const [formSerial, setFormSerial] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    fetchEquipment();
  }, []);

  async function fetchEquipment() {
    try {
      const res = await fetch("/api/equipment");
      if (res.ok) setEquipment(await res.json());
    } catch (e) {
      console.error("Failed to fetch equipment", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          type: formType,
          serialNumber: formSerial || null,
          location: formLocation || null,
          notes: formNotes || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormName("");
        setFormSerial("");
        setFormLocation("");
        setFormNotes("");
        await fetchEquipment();
      }
    } catch (e) {
      console.error("Create failed", e);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchEquipment();
    } catch (e) {
      console.error("Status update failed", e);
    }
  }

  async function fetchWorkOrdersForCheckout() {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const orders = await res.json();
        setWorkOrders(
          orders
            .filter((o: any) => ["PENDING", "DISPATCHED", "EN_ROUTE", "ON_SITE"].includes(o.status))
            .map((o: any) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              address: o.property?.address ?? "—",
            }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCheckOut(equipmentId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: selectedWorkOrder }),
      });
      if (res.ok) {
        setCheckoutModal(null);
        setSelectedWorkOrder("");
        await fetchEquipment();
      } else {
        const err = await res.json();
        alert(err.error ?? "Check-out failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckIn(equipmentId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setCheckinModal(null);
        await fetchEquipment();
      } else {
        const err = await res.json();
        alert(err.error ?? "Check-in failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  function toggleHistory(id: string) {
    setHistoryOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const stats = {
    total: equipment.length,
    available: equipment.filter((e) => e.status === "AVAILABLE").length,
    deployed: equipment.filter((e) => e.status === "DEPLOYED").length,
    maintenance: equipment.filter((e) => e.status === "MAINTENANCE").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment QR</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track equipment with QR codes at worksites
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Equipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Package, color: "bg-slate-100 text-slate-600" },
          { label: "Available", value: stats.available, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
          { label: "Deployed", value: stats.deployed, icon: MapPin, color: "bg-blue-100 text-blue-600" },
          { label: "Maintenance", value: stats.maintenance, icon: AlertTriangle, color: "bg-amber-100 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className={`rounded-lg p-2 ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setShowForm(false)} />
          <Card className="relative z-10 w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Add Equipment</h2>
                <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Truck-Mount Extractor #3"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {EQUIPMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{typeLabels[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                  <input
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g., Warehouse A"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Optional"
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !formName.trim()}
                  className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Equipment"}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Check-Out Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => { setCheckoutModal(null); setSelectedWorkOrder(""); }} />
          <Card className="relative z-10 w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Check Out Equipment</h2>
                <button
                  onClick={() => { setCheckoutModal(null); setSelectedWorkOrder(""); }}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assign to Work Order *
                </label>
                {workOrders.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">No active work orders available.</p>
                ) : (
                  <select
                    value={selectedWorkOrder}
                    onChange={(e) => setSelectedWorkOrder(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select work order...</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.orderNumber} — {wo.address}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button
                onClick={() => handleCheckOut(checkoutModal)}
                disabled={actionLoading || !selectedWorkOrder}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking out...
                  </span>
                ) : (
                  "Check Out"
                )}
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Check-In Confirmation Modal */}
      {checkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setCheckinModal(null)} />
          <Card className="relative z-10 w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Check In Equipment</h2>
                <button onClick={() => setCheckinModal(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-5 w-5 mb-1" />
                <p className="font-medium">Return this equipment to inventory?</p>
                <p className="text-xs text-green-600 mt-1">
                  This will mark it as available and close the active checkout record.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCheckinModal(null)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCheckIn(checkinModal)}
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking in...
                    </span>
                  ) : (
                    "Check In"
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setQrModal(null)} />
          <Card className="relative z-10 w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">QR Code</h2>
                <button onClick={() => setQrModal(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="mx-auto w-64 rounded-xl border border-slate-200 bg-white p-4">
                <img
                  src={`/api/equipment/${qrModal.id}/qr`}
                  alt={`QR Code for ${qrModal.name}`}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{qrModal.name}</p>
                <p className="text-sm text-slate-500">{typeLabels[qrModal.type]}</p>
                <p className="text-xs font-mono text-slate-400">{qrModal.qrCode}</p>
              </div>
              <a
                href={`/api/equipment/${qrModal.id}/qr`}
                download={`qr-${qrModal.qrCode}.svg`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </a>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Equipment Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : equipment.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <QrCode className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">No equipment registered yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Add your first piece of equipment
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((eq) => (
            <Card key={eq.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{eq.name}</h3>
                    <p className="text-xs text-slate-500">{typeLabels[eq.type]}</p>
                    {eq.serialNumber && (
                      <p className="text-xs font-mono text-slate-400 mt-0.5">S/N: {eq.serialNumber}</p>
                    )}
                  </div>
                  <Badge variant={statusVariant(eq.status)}>
                    {eq.status}
                  </Badge>
                </div>

                {eq.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {eq.location}
                  </div>
                )}
                {eq.property && (
                  <div className="rounded-lg bg-blue-50 p-2 text-xs">
                    <p className="font-medium text-blue-700">{eq.property.name}</p>
                    <p className="text-blue-500">{eq.property.address}</p>
                  </div>
                )}
                {eq.workOrder && (
                  <div className="text-xs text-slate-500">
                    Order: <span className="font-medium">{eq.workOrder.orderNumber}</span>
                  </div>
                )}

                {/* QR code badge */}
                <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                  <QrCode className="h-3 w-3" />
                  {eq.qrCode}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => setQrModal(eq)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <QrCode className="h-3 w-3" />
                    QR
                  </button>
                  {eq.status === "AVAILABLE" && (
                    <button
                      onClick={() => { setCheckoutModal(eq.id); fetchWorkOrdersForCheckout(); }}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                    >
                      <ClipboardList className="h-3 w-3" />
                      Check Out
                    </button>
                  )}
                  {eq.status === "DEPLOYED" && (
                    <button
                      onClick={() => setCheckinModal(eq.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Check In
                    </button>
                  )}
                  {(eq.status === "AVAILABLE" || eq.status === "DEPLOYED") && (
                    <button
                      onClick={() => updateStatus(eq.id, "MAINTENANCE")}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
                    >
                      <Wrench className="h-3 w-3" />
                      Service
                    </button>
                  )}
                  {eq.status === "MAINTENANCE" && (
                    <button
                      onClick={() => updateStatus(eq.id, "AVAILABLE")}
                      className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Ready
                    </button>
                  )}
                  <button
                    onClick={() => toggleHistory(eq.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                  >
                    <History className="h-3 w-3" />
                    History
                  </button>
                </div>

                {/* Timeline */}
                <EquipmentTimeline equipmentId={eq.id} open={historyOpen.has(eq.id)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
