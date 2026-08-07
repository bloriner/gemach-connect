"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Plus, X, Loader2, CheckCircle2, Receipt } from "lucide-react";
import BillingSplitEditor from "@/components/orders/billing-split-editor";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  propertyAddress: string;
  serviceName: string;
  crewName: string;
  status: string;
  billingType: string;
  price: number | null;
}

interface CustomerOption {
  id: string;
  companyName: string;
}

interface ServiceOption {
  id: string;
  name: string;
  basePrice: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  // Form state
  const [formCustId, setFormCustId] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formScheduledDate, setFormScheduledDate] = useState("");
  const [billingModal, setBillingModal] = useState<{ id: string; price: number | null } | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(
          data.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customer?.companyName ?? "\u2014",
            propertyAddress: o.property?.address ?? "\u2014",
            serviceName: o.serviceType?.name ?? "\u2014",
            crewName: o.crew?.name ?? "\u2014",
            status: o.status,
            billingType: o.billingType ?? "SINGLE",
            price: o.price ?? null,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (showModal) {
      fetch("/api/orders").then((r) => r.json()).then((orders) => {
        const custMap = new Map<string, string>();
        orders.forEach((o: any) => {
          if (o.customer) custMap.set(o.customer.id, o.customer.companyName);
        });
        setCustomers(Array.from(custMap.entries()).map(([id, companyName]) => ({ id, companyName })));
      });
    }
  }, [showModal]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formCustId || !formServiceId || !formAddress) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formCustId,
          serviceTypeId: formServiceId,
          propertyAddress: formAddress,
          scheduledDate: formScheduledDate || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormCustId("");
        setFormServiceId("");
        setFormAddress("");
        setFormScheduledDate("");
        showToast("Order created successfully!");
        await fetchOrders();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to create order");
      }
    } catch (e) {
      showToast("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const statusVariant = (status: string) => {
    const map: Record<string, "warning" | "info" | "success" | "danger"> = {
      PENDING: "warning",
      DISPATCHED: "info",
      EN_ROUTE: "info",
      ON_SITE: "info",
      COMPLETED: "success",
      CANCELLED: "danger",
    };
    return map[status] ?? "default";
  };

  const columns = [
    {
      header: "Order #",
      accessor: (o: OrderRow) => (
        <span className="font-mono text-xs font-medium">{o.orderNumber}</span>
      ),
    },
    { header: "Customer", accessor: (o: OrderRow) => o.customerName },
    { header: "Property", accessor: (o: OrderRow) => o.propertyAddress, hideOnMobile: true },
    { header: "Service", accessor: (o: OrderRow) => o.serviceName },
    { header: "Tech", accessor: (o: OrderRow) => o.crewName, hideOnMobile: true },
    {
      header: "Billing",
      accessor: (o: OrderRow) => (
        <Badge variant={o.billingType === "SPLIT" ? "info" : "default"}>
          {o.billingType === "SPLIT" ? "Split" : "Single"}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      header: "Status",
      accessor: (o: OrderRow) => (
        <Badge variant={statusVariant(o.status)}>{o.status.replace("_", " ")}</Badge>
      ),
    },
    {
      header: "",
      accessor: (o: OrderRow) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setBillingModal({ id: o.id, price: o.price });
          }}
          className="rounded-lg p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
          title="Edit billing"
        >
          <Receipt className="h-4 w-4" />
        </button>
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
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            {orders.length} work order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="w-full sm:w-auto" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Billing Modal */}
      {billingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setBillingModal(null)}
          />
          <Card className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-xl">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Billing Setup</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure single or split billing for this order
                </p>
              </div>
              <button
                onClick={() => setBillingModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="pt-5">
              <BillingSplitEditor
                orderId={billingModal.id}
                orderPrice={billingModal.price}
                onSaved={() => {
                  fetchOrders();
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-md">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">New Work Order</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="pt-5">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                  <select
                    value={formCustId}
                    onChange={(e) => setFormCustId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Property Address *</label>
                  <input
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g., 123 Main St, Detroit, MI"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !formCustId || !formAddress}
                  className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                    </span>
                  ) : (
                    "Create Order"
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12 text-sm text-slate-500">Loading...</div>
          ) : (
            <ResponsiveTable
              data={orders}
              columns={columns}
              keyField={(o) => o.id}
              emptyMessage="No work orders yet. Create your first order to get started."
              mobileLabel={(o) => (
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{o.orderNumber}</span>
                  <Badge variant={statusVariant(o.status)} className="text-[10px]">
                    {o.status.replace("_", " ")}
                  </Badge>
                </span>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
