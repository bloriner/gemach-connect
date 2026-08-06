import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Plus, FileText, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function InvoicingPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      workOrder: { include: { serviceType: true } },
      payments: true,
    },
  });

  const completedOrders = await prisma.workOrder.findMany({
    where: { status: "COMPLETED", invoice: null },
    include: { customer: true },
  });

  // Aggregate stats
  const totalBilled = invoices
    .filter((i) => i.status !== "CANCELLED")
    .reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce(
    (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const totalOutstanding = totalBilled - totalPaid;
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
  const sentCount = invoices.filter((i) => i.status === "SENT").length;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoicing</h1>
          <p className="mt-1 text-sm text-slate-500">
            {invoices.length} invoices — {completedOrders.length} orders ready for invoicing
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-green-100 p-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Billed</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalBilled)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-blue-100 p-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Collected</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-amber-100 p-3">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Outstanding</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
              <p className="text-xs text-slate-400">{sentCount} sent &bull; {overdueCount} overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-purple-100 p-3">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ready to Invoice</p>
              <p className="text-xl font-bold text-purple-600">{completedOrders.length}</p>
              <p className="text-xs text-slate-400">Completed orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Ready for Invoicing */}
      {completedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Ready to Invoice ({completedOrders.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {order.customer.companyName}
                    </p>
                    <p className="text-xs text-slate-500">{order.orderNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">
                      ${order.price?.toFixed(2) ?? "—"}
                    </span>
                    <Button size="sm">
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      Generate Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">All Invoices</h2>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Invoice #</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Customer</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Amount</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-brand-700">
                        <Link href={`/invoicing/${invoice.id}`} className="hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        {invoice.customer.companyName}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariant(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
