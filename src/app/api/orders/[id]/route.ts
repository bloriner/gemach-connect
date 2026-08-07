import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, onMyWayTemplate, jobCompletedTemplate } from "@/lib/email";
import { createInvoicesForOrder } from "@/lib/invoice-generator";
import { createNotification, createOrderActivity } from "@/lib/notifications";

// GET /api/orders/[id] — full order detail
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      property: true,
      serviceType: true,
      crew: { include: { lead: true, members: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      invoice: { include: { items: true, payments: true } },
      billingSplits: true,
      items: { include: { serviceType: true } },
      timeEntries: true,
      photos: true,
      activities: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Fetch all crews for assignment dropdown
  const allCrews = await prisma.crew.findMany({
    where: { active: true },
    include: { lead: true },
  });

  // Fetch price book items
  const priceItems = await prisma.priceItem.findMany({
    where: { active: true },
    orderBy: { category: "asc" },
  });

  return NextResponse.json({ order, allCrews, priceItems });
}

// PATCH /api/orders/[id] — update order (crew, status, price, schedule, notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { crewId, status, price, scheduledDate, notes, notifyCustomer } = body;

  const existing = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, companyName: true, contactName: true, email: true } },
      crew: { include: { lead: true } },
      property: { select: { address: true } },
      serviceType: { select: { name: true } },
      billingSplits: true,
      invoice: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (crewId !== undefined) data.crewId = crewId || null;
  if (status !== undefined) data.status = status;
  if (price !== undefined) data.price = price;
  if (scheduledDate !== undefined) data.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
  if (notes !== undefined) data.notes = notes;

  // If completing, set completedAt
  if (status === "COMPLETED") {
    data.completedAt = new Date();
  }

  const order = await prisma.workOrder.update({
    where: { id: params.id },
    data,
    include: {
      customer: true,
      property: true,
      serviceType: true,
      crew: { include: { lead: true } },
      invoice: true,
    },
  });

  // ── Activity Logging ──
  const updaterId = (body as any)._userId || undefined; // can be passed from client

  if (status !== undefined && status !== existing.status) {
    createOrderActivity({
      workOrderId: params.id,
      userId: updaterId,
      action: "STATUS_CHANGE",
      detail: `Status changed from ${existing.status.replace("_", " ")} to ${status.replace("_", " ")}`,
      fromValue: existing.status,
      toValue: status,
    });

    // Notify crew when dispatched
    if (status === "DISPATCHED" && order.crew?.id) {
      const crewMembers = await prisma.user.findMany({
        where: { crewId: order.crew.id, active: true },
        select: { id: true },
      });
      createNotification({
        userIds: crewMembers.map((m) => m.id),
        type: "ORDER_DISPATCHED",
        title: "Order Dispatched",
        body: `${order.orderNumber} — ${order.customer?.companyName || "Unknown"}`,
        link: `/orders/${order.id}`,
      });
    }

    // Notify office when completed
    if (status === "COMPLETED") {
      createNotification({
        role: "OFFICE_STAFF",
        type: "ORDER_COMPLETED",
        title: "Order Completed",
        body: `${order.orderNumber} completed by ${order.crew?.name || "crew"}`,
        link: `/orders/${order.id}`,
      });
    }
  }

  if (crewId !== undefined && crewId !== existing.crewId) {
    const oldCrewName = existing.crew?.name || "Unassigned";
    const newCrewName = order.crew?.name || "Unassigned";
    createOrderActivity({
      workOrderId: params.id,
      userId: updaterId,
      action: "CREW_ASSIGNED",
      detail: `Crew changed from ${oldCrewName} to ${newCrewName}`,
      fromValue: existing.crewId,
      toValue: crewId || null,
    });

    // Notify newly assigned crew
    if (crewId) {
      const crewMembers = await prisma.user.findMany({
        where: { crewId, active: true },
        select: { id: true },
      });
      createNotification({
        userIds: crewMembers.map((m) => m.id),
        type: "ORDER_DISPATCHED",
        title: "New Assignment",
        body: `${order.orderNumber} assigned to ${newCrewName}`,
        link: `/orders/${order.id}`,
      });
    }
  }

  if (price !== undefined && price !== null && price !== existing.price?.toString()) {
    createOrderActivity({
      workOrderId: params.id,
      userId: updaterId,
      action: "PRICE_UPDATED",
      detail: `Price changed from $${existing.price?.toFixed(2) || "0.00"} to $${parseFloat(price).toFixed(2)}`,
      fromValue: existing.price?.toString() || null,
      toValue: price,
    });
  }

  if (scheduledDate !== undefined) {
    const newDate = scheduledDate ? new Date(scheduledDate) : null;
    const oldDate = existing.scheduledDate;
    if (newDate?.getTime() !== oldDate?.getTime()) {
      createOrderActivity({
        workOrderId: params.id,
        userId: updaterId,
        action: "SCHEDULE_CHANGED",
        detail: `Schedule ${oldDate ? "rescheduled" : "set"}`,
        fromValue: oldDate?.toISOString() || null,
        toValue: newDate?.toISOString() || null,
      });
    }
  }

  if (notes !== undefined && notes !== (existing.notes || "")) {
    createOrderActivity({
      workOrderId: params.id,
      userId: updaterId,
      action: "NOTE_ADDED",
      detail: notes ? "Note updated" : "Note cleared",
    });
  }

  // ── Status change emails ──
  if (notifyCustomer && existing.customer?.email) {
    const custName = existing.customer.contactName || existing.customer.companyName;
    const addr = existing.property?.address || "your property";

    // Scheduled / Dispatched
    if (status === "DISPATCHED" || (status && crewId && existing.crewId !== crewId)) {
      const techName = order.crew?.lead?.name || order.crew?.name || "Your technician";
      const etaStr = scheduledDate
        ? new Date(scheduledDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "soon";

      sendEmail({
        to: existing.customer.email,
        ...onMyWayTemplate({
          customerName: custName,
          technicianName: techName,
          vehicleName: order.crew?.name || "Service Vehicle",
          propertyAddress: addr,
          orderNumber: existing.orderNumber,
          estimatedArrival: etaStr,
        }),
      }).catch((err) => console.error("[EMAIL] On-my-way failed:", err));
    }

    // Completed
    if (status === "COMPLETED") {
      const techName = order.crew?.lead?.name || order.crew?.name || "Your technician";
      sendEmail({
        to: existing.customer.email,
        ...jobCompletedTemplate({
          customerName: custName,
          technicianName: techName,
          propertyAddress: addr,
          orderNumber: existing.orderNumber,
          completedAt: new Date().toLocaleString("en-US"),
        }),
      }).catch((err) => console.error("[EMAIL] Job-completed email failed:", err));
    }
  }

  // ── Auto-generate invoice when completing ──
  if (status === "COMPLETED" && !existing.invoice) {
    const invoicePrice = order.price ?? order.serviceType?.basePrice ?? 0;
    createInvoicesForOrder({
      workOrderId: order.id,
      price: invoicePrice,
      serviceTypeName: existing.serviceType?.name ?? "Service",
      customerId: order.customerId,
      billingType: (existing as any).billingType ?? "SINGLE",
      billingSplits: existing.billingSplits,
    })
      .then(() => console.log(`[AUTO-INVOICE] Generated for order ${order.id}`))
      .catch((err) => console.error(`[AUTO-INVOICE] Failed for order ${order.id}:`, err));
  }

  return NextResponse.json(order);
}

// DELETE /api/orders/[id] — cancel an order
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await prisma.workOrder.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json(order);
}
