"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import QuoteLineItems, { QuoteLineItem } from "@/components/quotes/quote-line-items";
import QuotePreview from "@/components/quotes/quote-preview";
import {
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Send,
  Check,
  XCircle,
  ArrowRightLeft,
  Eye,
  Trash2,
  FileText,
} from "lucide-react";

interface QuoteRow {
  id: string;
  quoteNumber: string;
  customerName: string;
  propertyAddress: string;
  status: string;
  total: number;
  itemCount: number;
  sentAt: string | null;
  validUntil: string | null;
}

interface CustomerOption {
  id: string;
  companyName: string;
  addresses: string[];
}

type TabKey = "ALL" | "DRAFT" | "SENT" | "APPROVED" | "DECLINED" | "CONVERTED";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "SENT", label: "Sent" },
  { key: "APPROVED", label: "Approved" },
  { key: "DECLINED", label: "Declined" },
  { key: "CONVERTED", label: "Converted" },
];

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [previewQuote, setPreviewQuote] = useState<any>(null);

  // Form
  const [formCustId, setFormCustId] = useState("");
  const [formPropAddress, setFormPropAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formValidDays, setFormValidDays] = useState("30");
  const [formItems, setFormItems] = useState<QuoteLineItem[]>([]);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = activeTab === "ALL" ? "" : `?status=${activeTab}`;
      const res = await fetch(`/api/quotes${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(
          data.map((q: any) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            customerName: q.customer?.companyName ?? "—",
            propertyAddress: q.property
              ? [q.property.address, q.property.city].filter(Boolean).join(", ")
              : "—",
            status: q.status,
            total: q.total,
            itemCount: q.items?.length ?? 0,
            sentAt: q.sentAt,
            validUntil: q.validUntil,
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
    fetchQuotes();
  }, [fetchQuotes]);

  // Load customers for create modal
  useEffect(() => {
    if (showModal) {
      fetch("/api/customers")
        .then((r) => r.json())
        .then((data) => {
          // Group properties by customer
          const custMap = new Map<string, { companyName: string; addresses: Set<string> }>();
          data.forEach((c: any) => {
            if (!custMap.has(c.id)) {
              custMap.set(c.id, { companyName: c.companyName, addresses: new Set() });
            }
            c.properties?.forEach((p: any) => {
              custMap.get(c.id)!.addresses.add(p.address);
            });
          });
          setCustomers(
            Array.from(custMap.entries()).map(([id, info]) => ({
              id,
              companyName: info.companyName,
              addresses: Array.from(info.addresses),
            }))
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
    setFormPropAddress("");
    setFormNotes("");
    setFormValidDays("30");
    setFormItems([
      { description: "", quantity: 1, unitPrice: 0, total: 0, optional: false, category: "LABOR" },
    ]);
    setEditingQuote(null);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  async function openEdit(quoteId: string) {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      if (res.ok) {
        const q = await res.json();
        setEditingQuote(q);
        setFormCustId(q.customerId);
        setFormPropAddress(q.property?.address ?? "");
        setFormNotes(q.notes ?? "");
        const days = q.validUntil
          ? Math.ceil(
              (new Date(q.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            ).toString()
          : "30";
        setFormValidDays(days);
        setFormItems(
          q.items.map((i: any) => ({
            id: i.id,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.total,
            optional: i.optional,
            category: i.category ?? "LABOR",
          }))
        );
        setShowModal(true);
      }
    } catch {
      showToast("Failed to load quote");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const validItems = formItems.filter((i) => i.description.trim());
    if (!formCustId || validItems.length === 0) return;

    setSubmitting(true);
    try {
      const validUntil = formValidDays
        ? new Date(Date.now() + parseInt(formValidDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const body: any = {
        customerId: formCustId,
        items: validItems,
        notes: formNotes || null,
        validUntil,
      };

      // Resolve property by address
      if (formPropAddress.trim()) {
        // Try to find existing property
        const propRes = await fetch(
          `/api/customers?q=${encodeURIComponent(formCustId)}`
        );
        // We'll just pass the address - the POST route can handle it, or we use PATCH for edits
        // For simplicity, use the address directly as a property search on the backend side
        body.propertyAddress = formPropAddress.trim();
      }

      let res;
      if (editingQuote) {
        res = await fetch(`/api/quotes/${editingQuote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: body.notes, validUntil: body.validUntil, items: body.items }),
        });
      } else {
        // For create, resolve property or create from address
        if (body.propertyAddress) {
          const propRes = await fetch(`/api/properties?customerId=${body.customerId}&address=${encodeURIComponent(body.propertyAddress)}`);
          if (propRes.ok) {
            const props = await propRes.json();
            if (props.length > 0) {
              body.propertyId = props[0].id;
            }
          }
        }
        delete body.propertyAddress;
        res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        setShowModal(false);
        resetForm();
        showToast(editingQuote ? "Quote updated!" : "Quote created!");
        fetchQuotes();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to save quote");
      }
    } catch {
      showToast("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend(quoteId: string) {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/send`, { method: "POST" });
      if (res.ok) {
        showToast("Quote sent!");
        fetchQuotes();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to send");
      }
    } catch {
      showToast("Network error");
    }
  }

  async function handleStatusChange(quoteId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Quote ${newStatus.toLowerCase()}!`);
        fetchQuotes();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to update");
      }
    } catch {
      showToast("Network error");
    }
  }

  async function handleConvert(quoteId: string) {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showToast(`Converted to ${data.workOrder.orderNumber}!`);
        fetchQuotes();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to convert");
      }
    } catch {
      showToast("Network error");
    }
  }

  async function handleDelete(quoteId: string) {
    if (!confirm("Delete this draft quote?")) return;
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Quote deleted");
        fetchQuotes();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to delete");
      }
    } catch {
      showToast("Network error");
    }
  }

  async function openPreview(quoteId: string) {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      if (res.ok) {
        setPreviewQuote(await res.json());
      }
    } catch {
      showToast("Failed to load preview");
    }
  }

  const statusVariant = (s: string) => {
    const map: Record<string, "default" | "info" | "success" | "danger" | "warning"> = {
      DRAFT: "default",
      SENT: "info",
      VIEWED: "info",
      APPROVED: "success",
      DECLINED: "danger",
      CONVERTED: "success",
      EXPIRED: "warning",
    };
    return map[s] ?? "default";
  };

  const filteredQuotes =
    activeTab === "ALL" ? quotes : quotes.filter((q) => q.status === activeTab);

  const columns = [
    {
      header: "Quote #",
      accessor: (q: QuoteRow) => (
        <span className="font-mono text-xs font-medium">{q.quoteNumber}</span>
      ),
    },
    { header: "Customer", accessor: (q: QuoteRow) => q.customerName },
    { header: "Property", accessor: (q: QuoteRow) => q.propertyAddress, hideOnMobile: true },
    {
      header: "Items",
      accessor: (q: QuoteRow) => `${q.itemCount} item${q.itemCount !== 1 ? "s" : ""}`,
      hideOnMobile: true,
    },
    {
      header: "Total",
      accessor: (q: QuoteRow) => (
        <span className="font-medium">${q.total.toFixed(2)}</span>
      ),
    },
    {
      header: "Status",
      accessor: (q: QuoteRow) => (
        <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
      ),
    },
    {
      header: "Sent / Valid",
      accessor: (q: QuoteRow) =>
        q.sentAt ? (
          <span className="text-xs text-slate-500">
            {format(new Date(q.sentAt), "MMM d")}
            {q.validUntil ? ` → ${format(new Date(q.validUntil), "MMM d")}` : ""}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
      hideOnMobile: true,
    },
    {
      header: "",
      accessor: (q: QuoteRow) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openPreview(q.id);
            }}
            className="rounded p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
          {q.status === "DRAFT" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(q.id);
                }}
                className="rounded p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Edit"
              >
                <FileText className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSend(q.id);
                }}
                className="rounded p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(q.id);
                }}
                className="rounded p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          {q.status === "SENT" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(q.id, "APPROVED");
                }}
                className="rounded p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 transition"
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(q.id, "DECLINED");
                }}
                className="rounded p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Decline"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          {q.status === "APPROVED" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConvert(q.id);
              }}
              className="rounded p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
              title="Convert to Work Order"
            >
              <ArrowRightLeft className="h-4 w-4" />
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

      {/* Preview modal */}
      {previewQuote && (
        <QuotePreview quote={previewQuote} onClose={() => setPreviewQuote(null)} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Quotes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {quotes.length} quote{quotes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="w-full sm:w-auto" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Quote
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? quotes.length
              : quotes.filter((q) => q.status === tab.key).length;
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

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingQuote ? "Edit Quote" : "New Quote"}
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
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Customer *
                    </label>
                    <select
                      value={formCustId}
                      onChange={(e) => setFormCustId(e.target.value)}
                      required
                      disabled={!!editingQuote}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
                    >
                      <option value="">Select customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Property Address
                    </label>
                    <input
                      value={formPropAddress}
                      onChange={(e) => setFormPropAddress(e.target.value)}
                      placeholder="e.g., 123 Main St, Detroit"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Line items */}
                <QuoteLineItems items={formItems} onChange={setFormItems} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Valid For (days)
                    </label>
                    <select
                      value={formValidDays}
                      onChange={(e) => setFormValidDays(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Internal notes or terms..."
                    rows={3}
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
                      formItems.filter((i) => i.description.trim()).length === 0
                    }
                    className="flex-[2] rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {editingQuote ? "Saving..." : "Creating..."}
                      </span>
                    ) : editingQuote ? (
                      "Save Changes"
                    ) : (
                      "Create Quote"
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading quotes...
            </div>
          ) : (
            <ResponsiveTable
              data={filteredQuotes}
              columns={columns}
              keyField={(q) => q.id}
              emptyMessage={
                activeTab === "ALL"
                  ? "No quotes yet. Create your first quote to get started."
                  : `No ${activeTab.toLowerCase()} quotes.`
              }
              mobileLabel={(q) => (
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{q.quoteNumber}</span>
                  <Badge variant={statusVariant(q.status)} className="text-[10px]">
                    {q.status}
                  </Badge>
                  <span className="text-xs font-medium text-slate-700 ml-auto">
                    ${q.total.toFixed(2)}
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
