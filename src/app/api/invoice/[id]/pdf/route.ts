import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      workOrder: { include: { serviceType: true, property: true } },
      items: true,
      payments: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const dfmt = (d: Date | string) => new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const lineItemsHtml = invoice.items.length > 0
    ? invoice.items
        .map(
          (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${item.description}</td>
          <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
          <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">${fmt(item.unitPrice)}</td>
          <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">${fmt(item.total)}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="padding:8px 12px;text-align:center;color:#94a3b8;">No line items</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; color:#1e293b; padding:48px 56px; font-size:13px; line-height:1.5; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
    .header h1 { font-size:28px; font-weight:800; color:#0f172a; }
    .header .badge { display:inline-block; padding:4px 12px; border-radius:9999px; font-size:12px; font-weight:600; }
    .badge-paid { background:#dcfce7; color:#166534; }
    .badge-sent { background:#fef9c3; color:#854d0e; }
    .badge-overdue { background:#fee2e2; color:#991b1b; }
    .badge-draft { background:#f1f5f9; color:#475569; }
    .badge-cancelled { background:#fee2e2; color:#991b1b; }
    .info-grid { display:flex; gap:48px; margin-bottom:36px; }
    .info-box { flex:1; }
    .info-box h3 { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; margin-bottom:6px; }
    .info-box p { font-size:13px; color:#334155; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    th { font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
    .totals { width: 300px; margin-left:auto; }
    .totals td { padding:6px 12px; }
    .totals .total-row td { font-size:16px; font-weight:800; border-top:2px solid #1e293b; }
    .footer { margin-top:48px; padding-top:16px; border-top:1px solid #e2e8f0; text-align:center; font-size:11px; color:#94a3b8; }
    .payment-section { margin-top:24px; }
    .payment-section h3 { font-size:14px; font-weight:600; margin-bottom:8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>INVOICE</h1>
      <p style="font-size:18px;font-weight:600;margin-top:4px;">#${invoice.invoiceNumber}</p>
    </div>
    <div>
      <p style="font-weight:700;font-size:16px;">FieldService Pro</p>
      <p style="color:#64748b;">Michigan Real Estate Services</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Bill To</h3>
      <p style="font-weight:600;">${invoice.customer.companyName}</p>
      ${invoice.customer.contactName ? `<p>${invoice.customer.contactName}</p>` : ""}
      ${invoice.customer.billingAddress ? `<p style="white-space:pre-wrap;">${invoice.customer.billingAddress}</p>` : ""}
      ${invoice.customer.email ? `<p>${invoice.customer.email}</p>` : ""}
    </div>
    <div class="info-box">
      <h3>Invoice Details</h3>
      <p>Date: ${dfmt(invoice.createdAt)}</p>
      <p>Due: ${invoice.dueDate ? dfmt(invoice.dueDate) : "—"}</p>
      <p>Status: <span class="badge badge-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
    </div>
    <div class="info-box">
      <h3>Service</h3>
      <p>${invoice.workOrder.serviceType.name}</p>
      <p>${invoice.workOrder.property.name}</p>
      <p style="font-size:11px;color:#64748b;">${invoice.workOrder.property.address}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;">Description</th>
        <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #e2e8f0;">Qty</th>
        <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #e2e8f0;">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #e2e8f0;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td style="text-align:right;color:#64748b;">Subtotal</td>
      <td style="text-align:right;font-weight:600;">${fmt(invoice.subtotal)}</td>
    </tr>
    <tr>
      <td style="text-align:right;color:#64748b;">Tax (${invoice.taxRate}%)</td>
      <td style="text-align:right;">${fmt(invoice.taxAmount)}</td>
    </tr>
    <tr class="total-row">
      <td style="text-align:right;">Total</td>
      <td style="text-align:right;">${fmt(invoice.total)}</td>
    </tr>
    ${totalPaid > 0 ? `
    <tr>
      <td style="text-align:right;color:#64748b;">Paid</td>
      <td style="text-align:right;color:#16a34a;font-weight:600;">${fmt(totalPaid)}</td>
    </tr>
    <tr>
      <td style="text-align:right;font-weight:600;">Balance</td>
      <td style="text-align:right;font-weight:600;color:${invoice.total - totalPaid > 0 ? "#d97706" : "#16a34a"};">${fmt(invoice.total - totalPaid)}</td>
    </tr>
    ` : ""}
  </table>

  ${invoice.payments.length > 0 ? `
  <div class="payment-section">
    <h3>Payments Received</h3>
    <table>
      <thead>
        <tr>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;">Date</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;">Method</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;">Reference</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e2e8f0;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.payments.map((p) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${dfmt(p.receivedAt)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${p.method}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;">${p.reference ?? "—"}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #f1f5f9;">${fmt(p.amount)}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  ${invoice.notes ? `
  <div style="margin-top:32px;padding:12px;background:#f8fafc;border-radius:8px;">
    <p style="font-weight:600;margin-bottom:4px;">Notes</p>
    <p style="color:#475569;">${invoice.notes}</p>
  </div>
  ` : ""}

  <div class="footer">
    <p>FieldService Pro &bull; Michigan Real Estate Services</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>`;

  const isDownload = request.nextUrl.searchParams.get("download") === "1";
  const headers: Record<string, string> = {
    "Content-Type": "text/html; charset=utf-8",
  };
  if (isDownload) {
    headers["Content-Disposition"] = `attachment; filename="Invoice-${invoice.invoiceNumber}.html"`;
  }

  return new NextResponse(html, { headers });
}
