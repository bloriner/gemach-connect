import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, createOrderActivity } from "@/lib/notifications";
import { sendEmail, jobCompletedTemplate } from "@/lib/email";

function generateInvoiceNumber(): string {
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${seq}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
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
      billingSplits: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  if (order.status === "COMPLETED" || order.status === "INVOICED") {
    return NextResponse.json({ error: "Order is already completed" }, { status: 400 });
  }

  // Update order status
  const price = order.price ?? order.serviceType.basePrice ?? 0;
  const taxRate = 6.0;

  // Use a transaction to update order AND create invoice(s) atomically
  const result = await prisma.$transaction(async (tx) => {
    // Mark order complete
    const updatedOrder = await tx.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        price,
      },
    });

    if (order.billingType === "SPLIT" && order.billingSplits.length > 0) {
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

        await tx.billingSplit.update({
          where: { id: split.id },
          data: { invoiceId: invoice.id },
        });

        invoices.push(invoice);
      }

      return { order: updatedOrder, invoices, billingType: "SPLIT" };
    } else {
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
        include: {
          items: true,
        },
      });

      return { order: updatedOrder, invoice, billingType: "SINGLE" };
    }
  });

  // Log departure time entry for the completing user
  await prisma.timeEntry.create({
    data: {
      workOrderId,
      userId,
      type: "DEPARTURE",
      notes: "Job completed",
    },
  });

  // Activity logging
  createOrderActivity({
    workOrderId,
    userId,
    action: "COMPLETED",
    detail: `Order ${order.orderNumber} completed`,
  });

  // Notify office staff
  createNotification({
    role: "OFFICE_STAFF",
    type: "ORDER_COMPLETED",
    title: "Order Completed",
    body: `${order.orderNumber} — ${order.customer.companyName}`,
    link: `/orders/${workOrderId}`,
  });

  // Notify customer via email
  if (order.customer.email) {
    sendEmail({
      to: order.customer.email,
      ...jobCompletedTemplate({
        customerName: order.customer.contactName || order.customer.companyName,
        technicianName: (session.user as any).name || "Your technician",
        propertyAddress: "your property",
        orderNumber: order.orderNumber,
        completedAt: new Date().toLocaleString("en-US"),
      }),
    }).catch((err) => console.error("[EMAIL] Job-completed failed:", err));
  }

  return NextResponse.json(result, { status: 200 });
}
