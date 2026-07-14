import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, FileText, Download, DollarSign, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusVariant = (status: string) => {
  const map: Record<string, "default" | "success" | "warning" | "danger"> = {
    DRAFT: "default", SENT: "warning", PAID: "success", OVERDUE: "danger", CANCELLED: "danger",
  };
  return map[status] ?? "default";
};

const paymentMethodLabel: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  ACH: "ACH Transfer",
  OTHER: "Other",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      workOrder: {
        include: {
          serviceType: true,
          property: true,
          crew: true,
        },
      },
      items: true,
      payments: { orderBy: { receivedAt: "desc" } },
    },
  });

  if (!invoice) notFound();

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoice.total - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/invoicing"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
              {balance > 0 && invoice.status !== "CANCELLED" && (
                <span className="text-sm text-amber-600 font-medium">
                  Balance: {formatCurrency(balance)}
                </span>
              )}
              {balance <= 0 && invoice.status === "PAID" && (
                <span className="text-sm text-green-600 font-medium">Paid in full</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/api/invoice/${invoice.id}/pdf`} target="_blank">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print PDF
            </Button>
          </Link>
          <Link href={`/api/invoice/${invoice.id}/pdf?download=1`}>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bill To</h2>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-slate-900">{invoice.customer.companyName}</p>
                {invoice.customer.contactName && (
                  <p className="text-sm text-slate-600">{invoice.customer.contactName}</p>
                )}
                {invoice.customer.billingAddress && (
                  <p className="mt-1 text-sm text-slate-500 whitespace-pre-wrap">
                    {invoice.customer.billingAddress}
                  </p>
                )}
                {invoice.customer.email && (
                  <p className="text-sm text-slate-500">{invoice.customer.email}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Order Details</h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order #</span>
                  <span className="font-medium text-slate-900">{invoice.workOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-900">{invoice.workOrder.serviceType.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Property</span>
                  <span className="font-medium text-slate-900 text-right">{invoice.workOrder.property.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address</span>
                  <span className="font-medium text-slate-900 text-right text-xs">{invoice.workOrder.property.address}</span>
                </div>
                {invoice.workOrder.crew && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Crew</span>
                    <span className="font-medium text-slate-900">{invoice.workOrder.crew.name}</span>
                  </div>
                )}
                {invoice.workOrder.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed</span>
                    <span className="font-medium text-slate-900">{formatDate(invoice.workOrder.completedAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Description</th>
                    <th className="px-6 py-3 text-right font-medium text-slate-600">Qty</th>
                    <th className="px-6 py-3 text-right font-medium text-slate-600">Unit Price</th>
                    <th className="px-6 py-3 text-right font-medium text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No line items
                      </td>
                    </tr>
                  ) : (
                    invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-3 text-slate-900">{item.description}</td>
                        <td className="px-6 py-3 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-6 py-3 text-right text-sm text-slate-600">Subtotal</td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-6 py-3 text-right text-sm text-slate-600">
                      Tax ({invoice.taxRate}%)
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900">{formatCurrency(invoice.taxAmount)}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Total</td>
                    <td className="px-6 py-3 text-right text-lg font-bold text-slate-900">{formatCurrency(invoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Payment Summary</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Invoice Total</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm">
                <span className="font-semibold text-slate-900">Balance</span>
                <span className={`font-bold ${balance > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-slate-500">Due Date</span>
                  <span className="font-medium text-slate-900">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recorded Payments */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <DollarSign className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">No payments recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-600">{formatCurrency(payment.amount)}</span>
                        <Badge variant="info">{paymentMethodLabel[payment.method] ?? payment.method}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDate(payment.receivedAt)}
                        {payment.reference && ` — Ref: ${payment.reference}`}
                      </div>
                      {payment.notes && (
                        <p className="mt-1 text-xs text-slate-500">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
