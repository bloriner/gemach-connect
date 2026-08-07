import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateInvoiceNumber(): string {
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `INV-${seq}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { workOrderId } = body;

  if (!workOrderId) {
    return NextResponse.json({ error: "workOrderId is required" }, { status: 400 });
  }

  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      serviceType: true,
      customer: true,
      invoice: true,
      billingSplits: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  if (order.status !== "COMPLETED") {
    return NextResponse.json({ error: "Order must be completed before invoicing" }, { status: 400 });
  }

  if (order.invoice) {
    return NextResponse.json({ error: "Invoice already exists for this order", invoiceId: order.invoice.id }, { status: 409 });
  }

  const price = order.price ?? order.serviceType.basePrice ?? 0;
  const taxRate = 6.0;

  const result = await prisma.$transaction(async (tx) => {
    if (order.billingType === "SPLIT" && order.billingSplits.length > 0) {
      // Create an invoice per billing split
      const invoices = [];
      for (const split of order.billingSplits) {
        const splitPrice = price * (split.splitPercent / 100);
        const taxAmount = splitPrice * (taxRate / 100);
        const total = splitPrice + taxAmount;

        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber: generateInvoiceNumber(),
            workOrderId,
            customerId: order.customerId,
            status: "DRAFT",
            subtotal: splitPrice,
            taxRate,
            taxAmount,
            total,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: {
              create: {
                description: `${order.serviceType.name} (${split.partyName} — ${split.splitPercent}%)`,
                quantity: 1,
                unitPrice: splitPrice,
                total: splitPrice,
              },
            },
          },
          include: { items: true },
        });

        // Link the billing split to its invoice
        await tx.billingSplit.update({
          where: { id: split.id },
          data: { invoiceId: invoice.id },
        });

        invoices.push(invoice);
      }

      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: "INVOICED" },
      });

      return { invoices, billingType: "SPLIT" };
    } else {
      // Single invoice
      const taxAmount = price * (taxRate / 100);
      const total = price + taxAmount;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          workOrderId,
          customerId: order.customerId,
          status: "DRAFT",
          subtotal: price,
          taxRate,
          taxAmount,
          total,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: {
            create: {
              description: order.serviceType.name,
              quantity: 1,
              unitPrice: price,
              total: price,
            },
          },
        },
        include: { items: true },
      });

      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: "INVOICED" },
      });

      return { invoice, billingType: "SINGLE" };
    }
  });

  return NextResponse.json(result, { status: 201 });
}
