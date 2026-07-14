import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { ClipboardList, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

const statusVariant = (status: string) => {
  const map: Record<string, "default" | "success" | "warning" | "danger"> = {
    DRAFT: "default", SENT: "warning", PAID: "success", OVERDUE: "danger", CANCELLED: "danger",
  };
  return map[status] ?? "default";
};

export default async function PortalDashboardPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const { token } = searchParams;

  if (!token) {
    return (
      <div className="flex flex-col items-center py-16">
        <AlertCircle className="mb-4 h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-semibold text-slate-900">Access Token Required</h2>
        <p className="mt-2 text-slate-500">Please enter your portal access token to continue.</p>
        <Link
          href="/portal"
          className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          &larr; Back to sign in
        </Link>
      </div>
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { serviceType: true, property: true, crew: { include: { lead: true } } },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        include: { workOrder: { include: { serviceType: true } }, payments: true },
      },
    },
  });

  if (!customer) {
    return (
      <div className="flex flex-col items-center py-16">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-slate-900">Invalid Token</h2>
        <p className="mt-2 text-slate-500">The access token you provided is not valid.</p>
        <Link
          href="/portal"
          className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          &larr; Try again
        </Link>
      </div>
    );
  }

  const totalBilled = customer.invoices
    .filter((inv) => inv.status !== "CANCELLED")
    .reduce((s, inv) => s + inv.total, 0);
  const totalPaid = customer.invoices.reduce(
    (s, inv) => s + inv.payments.reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const outstanding = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <p className="text-sm text-slate-500">Welcome back</p>
        <h1 className="text-2xl font-bold text-slate-900">{customer.companyName}</h1>
        {customer.contactName && (
          <p className="text-sm text-slate-500">{customer.contactName}</p>
        )}
      </div>

      {/* Financial Summary */}
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
            <p className={`text-xl font-bold ${outstanding > 0 ? "text-amber-600" : "text-green-600"}`}>
              {formatCurrency(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            </div>
          </CardHeader>
          <CardContent>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {customer.orders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {order.serviceType.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.property.name} &mdash; {order.property.address}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          ORDER_STATUS_COLORS[order.status as OrderStatus]
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span>#{order.orderNumber}</span>
                      {order.scheduledDate && (
                        <span>Scheduled: {formatDate(order.scheduledDate)}</span>
                      )}
                      {order.crew && <span>Crew: {order.crew.name}</span>}
                      {order.price && <span className="font-medium text-slate-700">{formatCurrency(order.price)}</span>}
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
            {customer.invoices.length === 0 ? (
              <p className="text-sm text-slate-500">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {customer.invoices.map((invoice) => {
                  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
                  const balance = invoice.total - paid;
                  return (
                    <div
                      key={invoice.id}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            {invoice.workOrder.serviceType.name} &mdash; {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">{formatCurrency(invoice.total)}</span>
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
    </div>
  );
}
