"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Globe,
  FileText, ClipboardList, DollarSign, Clock, Loader2,
  Copy, Check, ExternalLink
} from "lucide-react";
import Link from "next/link";

interface CustomerDetail {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  notes: string | null;
  portalToken: string | null;
  portalEnabled: boolean;
  totalSpend: number;
  createdAt: string;
  _count: { orders: number; invoices: number };
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    price: number | null;
    scheduledDate: string | null;
    createdAt: string;
    serviceType: { name: string } | null;
    crew: { name: string } | null;
    property: { address: string } | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    dueDate: string | null;
    createdAt: string;
    payments: Array<{ amount: number }>;
    workOrder: { orderNumber: string } | null;
  }>;
  properties: Array<{
    id: string;
    name: string;
    address: string;
    city: string | null;
    state: string | null;
  }>;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"orders" | "invoices" | "properties">("orders");

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) throw new Error("Not found");
      setCustomer(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const handleInvite = async () => {
    setInviting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/invite-portal`, {
        method: "POST",
      });
      const data = await res.json();
      setInviteLink(data.inviteLink);
    } catch (e) {
      console.error(e);
    } finally {
      setInviting(false);
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusVariant = (status: string): "default" | "success" | "warning" | "danger" => {
    const map: Record<string, "default" | "success" | "warning" | "danger"> = {
      DRAFT: "default", SENT: "warning", PAID: "success", OVERDUE: "danger", CANCELLED: "danger",
    };
    return map[status] ?? "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center py-16">
        <Building2 className="h-12 w-12 text-slate-300" />
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Customer not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/customers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/customers")}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{customer.companyName}</h1>
            {customer.portalEnabled ? (
              <Badge variant="success" className="gap-1">
                <Globe className="h-3 w-3" /> Portal Active
              </Badge>
            ) : (
              <Badge variant="default">No Portal</Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {customer.contactName && <span>{customer.contactName}</span>}
            {customer.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {customer.email}
              </span>
            )}
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {customer.phone}
              </span>
            )}
          </div>
        </div>

        {/* Portal Invite */}
        <div className="flex flex-col items-end gap-2">
          {!inviteLink ? (
            <Button onClick={handleInvite} disabled={inviting} variant="outline">
              {inviting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Globe className="mr-2 h-4 w-4" />
                {customer.portalEnabled ? "Resend Invitation" : "Invite to Portal"}
                </>
              )}
            </Button>
          ) : (
            <div className="w-full max-w-sm space-y-2">
              <p className="text-xs font-medium text-slate-700">Invitation Link (copy &amp; send to customer):</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {inviteLink}
                </code>
                <Button size="sm" variant="outline" onClick={copyLink}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <a href={inviteLink} target="_blank" rel="noopener">
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{customer._count.orders}</p>
            <p className="text-xs text-slate-500">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{customer._count.invoices}</p>
            <p className="text-xs text-slate-500">Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.totalSpend)}</p>
            <p className="text-xs text-slate-500">Total Spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{customer.properties.length}</p>
            <p className="text-xs text-slate-500">Properties</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["orders", "invoices", "properties"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "orders" && <><ClipboardList className="inline h-4 w-4 mr-1.5" /> Orders</>}
            {t === "invoices" && <><FileText className="inline h-4 w-4 mr-1.5" /> Invoices</>}
            {t === "properties" && <><MapPin className="inline h-4 w-4 mr-1.5" /> Properties</>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "orders" && (
        <Card>
          <CardContent className="p-0">
            {customer.orders.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No orders yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customer.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono font-medium text-brand-700">{o.orderNumber}</p>
                      <p className="text-xs text-slate-500">
                        {o.serviceType?.name} {o.property && `— ${o.property.address}`}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        {o.crew && <span>{o.crew.name}</span>}
                        <Clock className="h-3 w-3" />
                        <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {o.price && (
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(o.price)}</span>
                      )}
                      <span className={ORDER_STATUS_COLORS[o.status as OrderStatus] + " rounded-full px-2 py-0.5 text-[10px] font-medium"}>
                        {o.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "invoices" && (
        <Card>
          <CardContent className="p-0">
            {customer.invoices.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No invoices yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customer.invoices.map((inv) => {
                  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                  const balance = inv.total - paid;
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoicing/${inv.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono font-medium text-slate-900">{inv.invoiceNumber}</p>
                        <p className="text-xs text-slate-500">
                          {inv.workOrder?.orderNumber && `Order ${inv.workOrder.orderNumber}`} — {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{formatCurrency(inv.total)}</p>
                          {balance > 0 && <p className="text-xs text-amber-600">Balance: {formatCurrency(balance)}</p>}
                          {balance <= 0 && <p className="text-xs text-green-600">Paid</p>}
                        </div>
                        <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "properties" && (
        <Card>
          <CardContent className="p-0">
            {customer.properties.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No properties on file</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customer.properties.map((prop) => (
                  <div key={prop.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-slate-900">{prop.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {prop.address}
                      {prop.city && `, ${prop.city}`}
                      {prop.state && `, ${prop.state}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
