"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import {
  Plus,
  X,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Pause,
  Play,
  XCircle,
  Calendar,
} from "lucide-react";

interface AgreementRow {
  id: string;
  customerName: string;
  propertyAddress: string;
  serviceName: string;
  frequency: string;
  price: number;
  status: string;
  nextServiceDate: string | null;
  autoInvoice: boolean;
  orderCount: number;
}

interface CustomerOption {
  id: string;
  companyName: string;
}

interface ServiceOption {
  id: string;
  name: string;
}

type TabKey = "ALL" | "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "PAUSED", label: "Paused" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "EXPIRED", label: "Expired" },
];

const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUALLY", label: "Annually" },
];

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Form
  const [formCustId, setFormCustId] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formFrequency, setFormFrequency] = useState("MONTHLY");
  const [formPrice, setFormPrice] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formAutoInvoice, setFormAutoInvoice] = useState(true);
  const [formNotes, setFormNotes] = useState("");

  const fetchAgreements = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = activeTab === "ALL" ? "" : `?status=${activeTab}`;
      const res = await fetch(`/api/agreements${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setAgreements(
          data.map((a: any) => ({
            id: a.id,
            customerName: a.customer?.companyName ?? "—",
            propertyAddress: a.property
              ? [a.property.address, a.property.city].filter(Boolean).join(", ")
              : "—",
            serviceName: a.serviceType?.name ?? "—",
            frequency: a.frequency,
            price: a.price,
            status: a.status,
            nextServiceDate: a.nextServiceDate,
            autoInvoice: a.autoInvoice,
            orderCount: a.generatedOrders?.length ?? 0,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  // Load customers + services for modal
  useEffect(() => {
    if (showModal) {
      fetch("/api/customers")
        .then((r) => r.json())
        .then((data: any[]) =>
          setCustomers(
            data.map((c) => ({ id: c.id, companyName: c.companyName }))
          )
        )
        .catch(() => {});
      fetch("/api/orders")
        .then((r) => r.json())
        .then((orders: any[]) => {
          const svcMap = new Map<string, string>();
          orders.forEach((o: any) => {
            if (o.serviceType) svcMap.set(o.serviceType.id, o.serviceType.name);
          });
          setServices(
            Array.from(svcMap.entries()).map(([id, name]) => ({ id, name }))
          );
        })
        .catch(() => {});
    }
  }, [showModal]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function resetForm() {
    setFormCustId("");
    setFormServiceId("");
    setFormFrequency("MONTHLY");
    setFormPrice("");
    setFormStartDate("");
    setFormEndDate("");
    setFormAutoInvoice(true);
    setFormNotes("");
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  async function openEdit(id: string) {
    try {
      const res = await fetch(`/api/agreements/${id}`);
      if (res.ok) {
        const a = await res.json();
        setEditingId(a.id);
        setFormCustId(a.customerId);
        setFormServiceId(a.serviceTypeId);
        setFormFrequency(a.frequency);
        setFormPrice(a.price.toString());
        setFormStartDate(a.startDate ? format(new Date(a.startDate), "yyyy-MM-dd") : "");
        setFormEndDate(a.endDate ? format(new Date(a.endDate), "yyyy-MM-dd") : "");
        setFormAutoInvoice(a.autoInvoice);
        setFormNotes(a.notes ?? "");
        setShowModal(true);
      }
    } catch {
      showToast("Failed to load agreement");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formCustId || !formServiceId || !formFrequency || !formPrice || !formStartDate)
      return;

    setSubmitting(true);
    try {
      const body = {
        customerId: formCustId,
        serviceTypeId: formServiceId,
        frequency: formFrequency,
        price: parseFloat(formPrice),
        startDate: new Date(formStartDate).toISOString(),
        endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
        autoInvoice: formAutoInvoice,
        notes: formNotes || null,
      };

      let res;
      if (editingId) {
        res = await fetch(`/api/agreements/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/agreements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        setShowModal(false);
        resetForm();
        showToast(editingId ? "Agreement updated!" : "Agreement created!");
        fetchAgreements();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to save");
      }
    } catch {
      showToast("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/agreements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Agreement ${newStatus.toLowerCase()}!`);
        fetchAgreements();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to update");
      }
    } catch {
      showToast("Network error");
    }
  }

  async function handleGenerateOrder(id: string) {
    setGeneratingId(id);
    try {
      const res = await fetch(`/api/agreements/${id}/generate-order`, {
        method: "POST",
      });
      if (res.ok) {
        const order = await res.json();
        showToast(`Order ${order.orderNumber} created!`);
        fetchAgreements();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to generate");
      }
    } catch {
      showToast("Network error");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this agreement? Past orders will be preserved.")) return;
    try {
      const res = await fetch(`/api/agreements/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Agreement deleted");
        fetchAgreements();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to delete");
      }
    } catch {
      showToast("Network error");
    }
  }

  const statusVariant = (s: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "default"> = {
      ACTIVE: "success",
      PAUSED: "warning",
      CANCELLED: "danger",
      EXPIRED: "default",
    };
    return map[s] ?? "default";
  };

  const freqBadge = (f: string) => {
    const map: Record<string, string> = {
      WEEKLY: "bg-purple-50 text-purple-700",
      BIWEEKLY: "bg-blue-50 text-blue-700",
      MONTHLY: "bg-brand-50 text-brand-700",
      QUARTERLY: "bg-amber-50 text-amber-700",
      ANNUALLY: "bg-green-50 text-green-700",
    };
    return map[f] ?? "bg-slate-50 text-slate-600";
  };

  const filtered =
    activeTab === "ALL"
      ? agreements
      : agreements.filter((a) => a.status === activeTab);

  const columns = [
    {
      header: "Customer",
      accessor: (a: AgreementRow) => (
        <span className="font-medium text-slate-900">{a.customerName}</span>
      ),
    },
    { header: "Property", accessor: (a: AgreementRow) => a.propertyAddress, hideOnMobile: true },
    {
      header: "Service",
      accessor: (a: AgreementRow) => a.serviceName,
    },
    {
      header: "Frequency",
      accessor: (a: AgreementRow) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${freqBadge(a.frequency)}`}
        >
          {a.frequency}
        </span>
      ),
    },
    {
      header: "Price",
      accessor: (a: AgreementRow) => (
        <span className="font-medium">${a.price.toFixed(2)}</span>
      ),
    },
    {
      header: "Next Service",
      accessor: (a: AgreementRow) =>
        a.nextServiceDate ? (
          <span className="text-xs text-slate-600">
            {format(new Date(a.nextServiceDate), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      header: "Status",
      accessor: (a: AgreementRow) => (
        <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
      ),
    },
    {
      header: "",
      accessor: (a: AgreementRow) => (
        <div className="flex items-center gap-0.5">
          {a.status === "ACTIVE" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateOrder(a.id);
              }}
              disabled={generatingId === a.id}
              className="rounded p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
              title="Generate next order now"
            >
              {generatingId === a.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          )}
          {a.status === "ACTIVE" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(a.id, "PAUSED");
              }}
              className="rounded p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
              title="Pause"
            >
              <Pause className="h-4 w-4" />
            </button>
          )}
          {a.status === "PAUSED" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(a.id, "ACTIVE");
              }}
              className="rounded p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 transition"
              title="Resume"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          {(a.status === "ACTIVE" || a.status === "PAUSED") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(a.id, "CANCELLED");
              }}
              className="rounded p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Cancel"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          {a.status !== "CANCELLED" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(a.id);
              }}
              className="rounded p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Edit"
            >
              <Calendar className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            {toast}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Recurring Agreements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {agreements.length} agreement{agreements.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="w-full sm:w-auto" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Agreement
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? agreements.length
              : agreements.filter((a) => a.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          <Card className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Agreement" : "New Recurring Agreement"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="pt-5">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Customer *
                    </label>
                    <select
                      value={formCustId}
                      onChange={(e) => setFormCustId(e.target.value)}
                      required
                      disabled={!!editingId}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
                    >
                      <option value="">Select...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Service *
                    </label>
                    <select
                      value={formServiceId}
                      onChange={(e) => setFormServiceId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                    >
                      <option value="">Select...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Frequency *
                    </label>
                    <select
                      value={formFrequency}
                      onChange={(e) => setFormFrequency(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoInvoice"
                    checked={formAutoInvoice}
                    onChange={(e) => setFormAutoInvoice(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="autoInvoice" className="text-sm text-slate-700">
                    Auto-generate invoices on completion
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Special instructions..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !formCustId ||
                      !formServiceId ||
                      !formPrice ||
                      !formStartDate
                    }
                    className="flex-[2] rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {editingId ? "Saving..." : "Creating..."}
                      </span>
                    ) : editingId ? (
                      "Save Changes"
                    ) : (
                      "Create Agreement"
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading agreements...
            </div>
          ) : (
            <ResponsiveTable
              data={filtered}
              columns={columns}
              keyField={(a) => a.id}
              emptyMessage={
                activeTab === "ALL"
                  ? "No recurring agreements yet. Create one to automate scheduling."
                  : `No ${activeTab.toLowerCase()} agreements.`
              }
              mobileLabel={(a) => (
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.customerName}</span>
                  <Badge variant={statusVariant(a.status)} className="text-[10px]">
                    {a.status}
                  </Badge>
                  <span className="text-xs text-slate-500 ml-auto">
                    ${a.price.toFixed(2)}/{a.frequency.toLowerCase()}
                  </span>
                </span>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
