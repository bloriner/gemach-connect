"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/ui/camera-capture";
import { PhotoGallery } from "@/components/field/photo-gallery";
import { ChecklistView } from "@/components/field/checklist-view";
import { FormRenderer, FORM_TEMPLATES } from "@/components/field/form-renderer";
import { SignatureSection } from "@/components/field/signature-section";
import {
  ArrowLeft, MapPin, Clock, Phone, User, Wrench, FileText,
  Camera, CheckCircle2, ClipboardList, PenLine, Plus, Trash2,
  DollarSign, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";

type Tab = "overview" | "photos" | "checklist" | "forms" | "signature";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  dueDate: string | null;
  notes: string | null;
  price: number | null;
  completedAt: string | null;
  customer: {
    companyName: string;
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  property: {
    name: string;
    address: string;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    accessNotes?: string | null;
    gateCode?: string | null;
  };
  serviceType: { name: string; description?: string | null; checklistTemplate?: string | null; basePrice?: number | null };
  crew?: { name: string } | null;
  items: Array<{ id: string; serviceType: { id: string; name: string }; description?: string | null; quantity: number; unitPrice: number; total: number; addedBy?: { name: string } | null }>;
  photos: Array<{ id: string; url: string; thumbnailUrl?: string | null; type: string; caption?: string | null; takenAt: string; user?: { name: string } | null }>;
  checklistItems: Array<{ id: string; label: string; order: number; completed: boolean; completedAt?: string | null; completedBy?: { name: string } | null; notes?: string | null }>;
  forms: Array<{ id: string; formType: string; title: string; data: string; submittedAt?: string | null; submittedBy?: { name: string } | null }>;
  timeEntries: Array<{ id: string; type: string; timestamp: string; lat?: number | null; lng?: number | null }>;
  fieldNotes: Array<{ id: string; type: string; content?: string | null; createdAt: string }>;
}

export default function FieldOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<string>("GENERAL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [formType, setFormType] = useState<string | null>(null);
  const [showFullForms, setShowFullForms] = useState(false);
  const [arrivalMarked, setArrivalMarked] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/field/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to load order");
      const data = await res.json();
      setOrder(data);
      setArrivalMarked(data.timeEntries?.some((e: any) => e.type === "ARRIVAL"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Mark arrival
  const markArrival = async () => {
    setActionLoading("arrival");
    try {
      await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: orderId, type: "ARRIVAL", notes: "Technician arrived on site" }),
      });
      setArrivalMarked(true);
      fetchOrder();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Complete job
  const completeJob = async () => {
    setActionLoading("complete");
    try {
      await fetch(`/api/field/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: orderId, type: "DEPARTURE", notes: "Job completed" }),
      });
      fetchOrder();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Photo upload
  const handlePhotoCapture = async (file: File, previewUrl: string) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      await fetch("/api/field/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: orderId, url, type: photoType }),
      });

      setShowCamera(false);
      fetchOrder();
    } catch (e) {
      console.error(e);
    }
  };

  // Checklist toggle
  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    await fetch("/api/field/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, completed }),
    });
    fetchOrder();
  };

  // Checklist note
  const handleChecklistNote = async (itemId: string, notes: string) => {
    await fetch("/api/field/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, notes }),
    });
    fetchOrder();
  };

  // Form submit
  const handleFormSubmit = async (ftype: string, title: string, data: Record<string, any>) => {
    setActionLoading("form");
    try {
      await fetch("/api/field/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: orderId, formType: ftype, title, data }),
      });
      setFormType(null);
      fetchOrder();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Signature save
  const handleSignatureSave = async (signatureSvg: string, signerName: string) => {
    setActionLoading("signature");
    try {
      await fetch("/api/field/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: orderId, signatureSvg, signerName }),
      });
      fetchOrder();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Quick add service
  const handleQuickAdd = async (serviceTypeId: string, description: string, price: number) => {
    setActionLoading("quickadd");
    try {
      await fetch("/api/field/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: orderId, serviceTypeId, description, unitPrice: price, quantity: 1 }),
      });
      setShowQuickAdd(false);
      fetchOrder();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    await fetch(`/api/field/items?id=${itemId}`, { method: "DELETE" });
    fetchOrder();
  };

  // Initialize checklist from template
  const initChecklist = async () => {
    if (!order?.serviceType.checklistTemplate) return;
    setActionLoading("checklist");
    try {
      const template = JSON.parse(order.serviceType.checklistTemplate);
      const items = template.map((label: string, idx: number) => ({ label, order: idx }));
      await fetch("/api/field/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: orderId, items }),
      });
      fetchOrder();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Parse saved signature from field notes
  const savedSignature = order?.fieldNotes?.find((n) => n.type === "SIGNATURE");
  let parsedSig = null;
  if (savedSignature?.content) {
    try {
      parsedSig = JSON.parse(savedSignature.content);
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center py-20">
        <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500">Order not found</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-brand-600 font-medium hover:underline">Go back</button>
      </div>
    );
  }

  const tabs: { key: Tab; icon: any; label: string; count?: number }[] = [
    { key: "overview", icon: FileText, label: "Overview" },
    { key: "photos", icon: Camera, label: "Photos", count: order.photos.length },
    { key: "checklist", icon: ClipboardList, label: "Checklist", count: order.checklistItems.filter((i) => i.completed).length },
    { key: "forms", icon: PenLine, label: "Forms", count: order.forms.length },
    { key: "signature", icon: PenLine, label: "Signature" },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "info", DISPATCHED: "info", EN_ROUTE: "warning",
    ON_SITE: "success", COMPLETED: "success", INVOICED: "success", CANCELLED: "danger",
  };

  const totalUpsell = order.items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4 pb-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex-shrink-0 rounded-lg p-2 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 truncate">{order.customer.companyName}</h1>
          <p className="text-sm text-slate-500 truncate">{order.property.address}</p>
        </div>
        <Badge variant={statusColors[order.status] as any || "info"}>
          {order.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Tab bar — horizontally scrollable */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
              activeTab === tab.key
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======== OVERVIEW TAB ======== */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Key info */}
          <Card>
            <CardContent className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Service</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <Wrench className="h-3.5 w-3.5" />
                    {order.serviceType.name}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Crew</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <User className="h-3.5 w-3.5" />
                    {order.crew?.name || "Unassigned"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Contact</span>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Phone className="h-3.5 w-3.5" />
                    {order.customer.phone || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Scheduled</span>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Clock className="h-3.5 w-3.5" />
                    {order.scheduledDate
                      ? new Date(order.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                      : "Not scheduled"}
                  </div>
                </div>
              </div>

              {/* Property access info */}
              {(order.property.accessNotes || order.property.gateCode) && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">Access Info</p>
                  {order.property.accessNotes && (
                    <p className="text-xs text-amber-700">{order.property.accessNotes}</p>
                  )}
                  {order.property.gateCode && (
                    <p className="text-xs text-amber-700 mt-0.5">
                      <span className="font-medium">Gate Code:</span> {order.property.gateCode}
                    </p>
                  )}
                </div>
              )}

              {order.notes && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line items + upsells */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Services & Items</h3>
                {order.status !== "COMPLETED" && (
                  <button
                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Quick Add
                    {showQuickAdd ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Primary service */}
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-700">{order.serviceType.name}</span>
                <span className="text-slate-500 font-medium">
                  ${(order.price || order.serviceType.basePrice || 0).toFixed(2)}
                </span>
              </div>

              {/* Upsell items */}
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium flex-shrink-0">ADD-ON</span>
                    <span className="text-slate-600 truncate">
                      {item.serviceType.name}
                      {item.description && ` — ${item.description}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-500">${item.total.toFixed(2)}</span>
                    {order.status !== "COMPLETED" && (
                      <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-red-500 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {order.items.length > 0 && (
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200">
                  <span className="text-slate-800">Total (est.)</span>
                  <span className="text-brand-700">
                    ${((order.price || order.serviceType.basePrice || 0) + totalUpsell).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Quick add form */}
              {showQuickAdd && (
                <QuickAddForm
                  onSubmit={handleQuickAdd}
                  loading={actionLoading === "quickadd"}
                  onCancel={() => setShowQuickAdd(false)}
                />
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
            <div className="flex flex-col gap-2">
              {!arrivalMarked && order.status !== "ON_SITE" && (
                <button
                  onClick={markArrival}
                  disabled={actionLoading === "arrival"}
                  className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {actionLoading === "arrival" ? "Marking..." : "Mark Arrival"}
                </button>
              )}
              <button
                onClick={completeJob}
                disabled={actionLoading === "complete"}
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {actionLoading === "complete" ? "Completing..." : "Complete Job"}
              </button>
            </div>
          )}

          {order.status === "COMPLETED" && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-700">
                Completed {order.completedAt ? new Date(order.completedAt).toLocaleString() : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======== PHOTOS TAB ======== */}
      {activeTab === "photos" && (
        <div className="space-y-4">
          {/* Photo type selector */}
          {showCamera ? (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Take Photo</span>
                  <button onClick={() => setShowCamera(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["ARRIVAL", "IN_PROGRESS", "COMPLETION", "DAMAGE", "EQUIPMENT", "GENERAL"].map((pt) => (
                    <button
                      key={pt}
                      onClick={() => setPhotoType(pt)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        photoType === pt
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {pt.replace("_", " ")}
                    </button>
                  ))}
                </div>
                <CameraCapture onCapture={handlePhotoCapture} label="Capture" />
              </CardContent>
            </Card>
          ) : (
            <PhotoGallery
              photos={order.photos}
              onCaptureClick={() => setShowCamera(true)}
            />
          )}
        </div>
      )}

      {/* ======== CHECKLIST TAB ======== */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          {order.checklistItems.length === 0 && order.serviceType.checklistTemplate ? (
            <Card>
              <CardContent className="flex flex-col items-center py-8">
                <ClipboardList className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 mb-3">No checklist loaded yet</p>
                <button
                  onClick={initChecklist}
                  disabled={actionLoading === "checklist"}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
                >
                  {actionLoading === "checklist" ? "Loading..." : "Load Checklist"}
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <ChecklistView
                  items={order.checklistItems}
                  onToggle={handleChecklistToggle}
                  onAddNote={handleChecklistNote}
                  loading={false}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ======== FORMS TAB ======== */}
      {activeTab === "forms" && (
        <div className="space-y-4">
          {/* New form selector */}
          {formType ? (
            <Card>
              <CardContent className="pt-4">
                <FormRenderer
                  formType={formType}
                  title={FORM_TEMPLATES[formType]?.title || formType}
                  fields={FORM_TEMPLATES[formType]?.fields || []}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setFormType(null)}
                  loading={actionLoading === "form"}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-2">Select a form to fill out:</p>
                {Object.entries(FORM_TEMPLATES).map(([key, tmpl]) => (
                  <button
                    key={key}
                    onClick={() => setFormType(key)}
                    className="w-full flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 transition"
                  >
                    <FileText className="h-5 w-5 text-brand-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{tmpl.title}</p>
                      <p className="text-xs text-slate-400">{tmpl.fields.length} fields</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Submitted forms */}
          {order.forms.length > 0 && (
            <div>
              <button
                onClick={() => setShowFullForms(!showFullForms)}
                className="flex items-center gap-1 text-sm text-brand-600 font-medium hover:underline mb-2"
              >
                {showFullForms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {order.forms.length} submitted form{order.forms.length > 1 ? "s" : ""}
              </button>

              {showFullForms && order.forms.map((form) => (
                <Card key={form.id} className="mb-2">
                  <CardContent className="pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{form.title}</span>
                      <span className="text-xs text-slate-400">
                        {form.submittedAt ? new Date(form.submittedAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <pre className="text-xs text-slate-500 bg-slate-50 rounded p-2 overflow-x-auto max-h-40">
                      {JSON.stringify(JSON.parse(form.data), null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======== SIGNATURE TAB ======== */}
      {activeTab === "signature" && (
        <Card>
          <CardContent className="pt-4">
            <SignatureSection
              onSave={handleSignatureSave}
              loading={actionLoading === "signature"}
              savedSignature={parsedSig}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Quick Add inline form component
function QuickAddForm({
  onSubmit,
  loading,
  onCancel,
}: {
  onSubmit: (serviceTypeId: string, description: string, price: number) => void;
  loading: boolean;
  onCancel: () => void;
}) {
  const [serviceTypes, setServiceTypes] = useState<Array<{ id: string; name: string; basePrice: number | null }>>([]);
  const [selectedId, setSelectedId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    fetch("/api/portal/service-types")
      .then((r) => r.json())
      .then(setServiceTypes)
      .catch(() => {});
  }, []);

  const handleSubmit = () => {
    if (!selectedId) return;
    const svc = serviceTypes.find((s) => s.id === selectedId);
    onSubmit(selectedId, description, parseFloat(price) || svc?.basePrice || 0);
  };

  return (
    <div className="border-t border-slate-100 pt-3 space-y-3">
      <p className="text-xs font-medium text-purple-700">Quick Add Service</p>
      <select
        value={selectedId}
        onChange={(e) => {
          setSelectedId(e.target.value);
          const svc = serviceTypes.find((s) => s.id === e.target.value);
          if (svc?.basePrice) setPrice(svc.basePrice.toString());
        }}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
      >
        <option value="">Select service...</option>
        {serviceTypes.map((st) => (
          <option key={st.id} value={st.id}>{st.name} {st.basePrice ? `($${st.basePrice.toFixed(2)})` : ""}</option>
        ))}
      </select>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        min="0"
        step="0.01"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedId}
          className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {loading ? "Adding..." : "Add Service"}
        </button>
      </div>
    </div>
  );
}
