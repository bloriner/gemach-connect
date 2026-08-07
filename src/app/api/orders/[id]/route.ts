import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, onMyWayTemplate, jobCompletedTemplate } from "@/lib/email";

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
        subject: `Your technician is on the way — ${existing.orderNumber}`,
        html: onMyWayTemplate({
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
        subject: `Service completed — ${existing.orderNumber}`,
        html: jobCompletedTemplate({
          customerName: custName,
          technicianName: techName,
          propertyAddress: addr,
          orderNumber: existing.orderNumber,
          completedAt: new Date().toLocaleString("en-US"),
        }),
      }).catch((err) => console.error("[EMAIL] Job-completed email failed:", err));
    }
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
