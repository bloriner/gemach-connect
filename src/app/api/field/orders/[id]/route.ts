import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvoicesForOrder } from "@/lib/invoice-generator";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, companyName: true, contactName: true, phone: true, email: true } },
      property: { select: { id: true, name: true, address: true, city: true, state: true, zipCode: true, accessNotes: true, gateCode: true, lat: true, lng: true } },
      serviceType: { select: { id: true, name: true, description: true, checklistTemplate: true, basePrice: true } },
      crew: { select: { id: true, name: true, lead: { select: { id: true, name: true } } } },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: { serviceType: { select: { id: true, name: true } }, addedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      photos: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { takenAt: "desc" },
      },
      checklistItems: { orderBy: { order: "asc" } },
      forms: {
        include: { submittedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      timeEntries: { orderBy: { timestamp: "desc" } },
      fieldNotes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status, notes, crewId } = body;

  const data: any = {};
  if (status) data.status = status;
  if (notes !== undefined) data.notes = notes;
  if (crewId !== undefined) data.crewId = crewId;
  if (status === "COMPLETED") data.completedAt = new Date();

  const order = await prisma.workOrder.update({
    where: { id: params.id },
    data,
  });

  // ── Auto-generate invoice when completing ──
  if (status === "COMPLETED") {
    const orderWithBilling = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: {
        serviceType: { select: { name: true, basePrice: true } },
        billingSplits: true,
        invoice: true,
      },
    });

    if (orderWithBilling && !orderWithBilling.invoice) {
      const invoicePrice = order.price ?? orderWithBilling.serviceType?.basePrice ?? 0;
      createInvoicesForOrder({
        workOrderId: order.id,
        price: invoicePrice,
        serviceTypeName: orderWithBilling.serviceType?.name ?? "Service",
        customerId: order.customerId,
        billingType: (orderWithBilling as any).billingType ?? "SINGLE",
        billingSplits: orderWithBilling.billingSplits,
      })
        .then(() => console.log(`[AUTO-INVOICE] Generated for order ${order.id}`))
        .catch((err) => console.error(`[AUTO-INVOICE] Failed for order ${order.id}:`, err));
    }
  }

  return NextResponse.json(order);
}
