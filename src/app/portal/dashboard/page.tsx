"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from "@/lib/utils";
import {
  ClipboardList,
  FileText,
  LogOut,
  PlusCircle,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────
interface CustomerInfo {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
}

interface ServiceType {
  id: string;
  name: string;
  basePrice: number | null;
}

interface WorkOrder {
  id: string;
  orderNumber: string;
  status: string;
  scheduledDate: string | null;
  price: number | null;
  createdAt: string;
  serviceType: ServiceType | null;
  property: { name: string; address: string } | null;
  crew: { name: string; lead: { name: string } | null } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  createdAt: string;
  workOrder: { serviceType: { name: string } | null; property: { name: string } | null } | null;
  payments: { amount: number }[];
}

// ── Helpers ────────────────────────────────────────────
function getPortalToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)portal-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function clearPortalToken() {
  document.cookie = "portal-token=; path=/; max-age=0; SameSite=Lax";
}

const statusVariant = (status: string) => {
  const map: Record<string, "default" | "success" | "warning" | "danger"> = {
    DRAFT: "default",
    SENT: "warning",
    PAID: "success",
    OVERDUE: "danger",
    CANCELLED: "danger",
  };
  return map[status] ?? "default";
};

// ── Page ───────────────────────────────────────────────
export default function PortalDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Place Order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [orderForm, setOrderForm] = useState({
    serviceTypeId: "",
    propertyAddress: "",
    scheduledDate: "",
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");

  // Read token from cookie on mount
  useEffect(() => {
    const t = getPortalToken();
    if (!t) {
      router.replace("/portal?error=no-token");
      return;
    }
    setToken(t);
  }, [router]);

  // Fetch data when token is ready
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const headers = { "x-portal-token": token };
      const [ordersRes, invoicesRes] = await Promise.all([
        fetch("/api/portal/orders", { headers }),
        fetch("/api/portal/invoices", { headers }),
      ]);

      if (ordersRes.status === 401 || invoicesRes.status === 401) {
        clearPortalToken();
        router.replace("/portal?error=invalid-token");
        return;
      }

      const [ordersData, invoicesData] = await Promise.all([
        ordersRes.json(),
        invoicesRes.json(),
      ]);

      if (!ordersRes.ok) throw new Error(ordersData.error || "Failed to load orders");
      if (!invoicesRes.ok) throw new Error(invoicesData.error || "Failed to load invoices");

      setOrders(ordersData);
      setInvoices(invoicesData);

      // Fetch customer info
      try {
        const custRes = await fetch("/api/portal/customer", { headers });
        if (custRes.ok) setCustomer(await custRes.json());
      } catch { /* non-critical */ }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  // Load service types for modal
  const openOrderModal = async () => {
    setOrderError("");
    setOrderSuccess("");
    setOrderForm({ serviceTypeId: "", propertyAddress: "", scheduledDate: "" });
    setShowOrderModal(true);

    try {
      const res = await fetch("/api/portal/service-types");
      if (res.ok) setServiceTypes(await res.json());
    } catch {
      // non-critical
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    setOrderSuccess("");
    setOrderSubmitting(true);

    try {
      const res = await fetch("/api/portal/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-portal-token": token || "",
        },
        body: JSON.stringify({
          serviceTypeId: orderForm.serviceTypeId || undefined,
          propertyAddress: orderForm.propertyAddress,
          scheduledDate: orderForm.scheduledDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      setOrderSuccess(`Order #${data.orderNumber} created successfully!`);
      setOrders((prev) => [data, ...prev]);

      // Close modal after a moment
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderSuccess("");
      }, 2000);
    } catch (err: any) {
      setOrderError(err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearPortalToken();
    router.push("/portal");
  };

  // ── Financial summary ──────────────────────────────
  const totalBilled = invoices
    .filter((inv) => inv.status !== "CANCELLED")
    .reduce((s, inv) => s + inv.total, 0);
  const totalPaid = invoices.reduce(
    (s, inv) => s + inv.payments.reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const outstanding = totalBilled - totalPaid;

  // ── Loading / Error states ─────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-4 text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <X className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-slate-500">{error}</p>
        <Button onClick={fetchData} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <button
          onClick={handleLogout}
          className="mt-4 text-sm text-brand-600 hover:text-brand-700"
        >
          &larr; Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">Welcome back</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {customer?.companyName || "Valued Customer"}
          </h1>
          {customer?.contactName && (
            <p className="text-sm text-slate-500">{customer.contactName}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openOrderModal} size="sm">
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Place Order
          </Button>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Financial Summary ───────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Total Billed</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalBilled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Total Paid</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Outstanding</p>
            <p
              className={`text-xl font-bold ${outstanding > 0 ? "text-amber-600" : "text-green-600"}`}
            >
              {formatCurrency(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Orders & Invoices Grid ──────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-slate-900">Your Orders</h2>
              </div>
              <Button onClick={openOrderModal} variant="ghost" size="sm">
                <PlusCircle className="mr-1 h-4 w-4" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="py-6 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No orders yet.</p>
                <Button onClick={openOrderModal} variant="outline" size="sm" className="mt-3">
                  Place your first order
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {order.serviceType?.name || "Service"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.property?.name || order.property?.address || "—"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_COLORS[order.status as OrderStatus]}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span className="font-mono">#{order.orderNumber}</span>
                      {order.scheduledDate && (
                        <span>Scheduled: {formatDate(order.scheduledDate)}</span>
                      )}
                      {order.crew && <span>Crew: {order.crew.name}</span>}
                      {order.price && (
                        <span className="font-medium text-slate-700">{formatCurrency(order.price)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="py-6 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No invoices yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
                  const balance = invoice.total - paid;
                  return (
                    <div
                      key={invoice.id}
                      className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium font-mono text-slate-900">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            {invoice.workOrder?.serviceType?.name || "Service"} &mdash;{" "}
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <Badge variant={statusVariant(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">
                          {formatCurrency(invoice.total)}
                        </span>
                        {balance > 0 && invoice.status !== "CANCELLED" && (
                          <span className="text-xs text-amber-600">
                            Balance: {formatCurrency(balance)}
                          </span>
                        )}
                        {balance <= 0 && invoice.status === "PAID" && (
                          <span className="text-xs text-green-600">Paid in full</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Place Order Modal ────────────────────── */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Place a New Order</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 p-6">
              {orderError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                  {orderError}
                </div>
              )}
              {orderSuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
                  {orderSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Service Type
                </label>
                <select
                  value={orderForm.serviceTypeId}
                  onChange={(e) =>
                    setOrderForm((f) => ({ ...f, serviceTypeId: e.target.value }))
                  }
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Select a service...</option>
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                      {st.basePrice ? ` - ${formatCurrency(st.basePrice)}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Property Address *
                </label>
                <Input
                  value={orderForm.propertyAddress}
                  onChange={(e) =>
                    setOrderForm((f) => ({ ...f, propertyAddress: e.target.value }))
                  }
                  placeholder="123 Main St, City, MI 48000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Preferred Date
                </label>
                <Input
                  type="date"
                  value={orderForm.scheduledDate}
                  onChange={(e) =>
                    setOrderForm((f) => ({ ...f, scheduledDate: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowOrderModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={orderSubmitting}>
                  {orderSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Order"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
