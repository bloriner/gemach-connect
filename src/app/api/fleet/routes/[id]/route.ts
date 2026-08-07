import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, onMyWayTemplate, jobCompletedTemplate } from "@/lib/email";

// PATCH — update route stop (mark complete, set ETA, trigger On-My-Way email)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { completed, estimatedArrival, actualArrival, notes, notifyCustomer } = body;

  const data: any = {};
  if (completed !== undefined) data.completed = completed;
  if (estimatedArrival !== undefined) data.estimatedArrival = estimatedArrival ? new Date(estimatedArrival) : null;
  if (actualArrival !== undefined) data.actualArrival = actualArrival ? new Date(actualArrival) : null;
  if (notes !== undefined) data.notes = notes;

  const stop = await prisma.routeStop.update({
    where: { id: params.id },
    data,
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          crew: { select: { lead: { select: { name: true } } } },
        },
      },
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          customer: { select: { id: true, companyName: true, email: true, phone: true } },
          property: { select: { address: true } },
        },
      },
    },
  });

  let notification: any = null;
  const technicianName = (session.user as any).name || stop.vehicle?.crew?.lead?.name || "Your technician";
  const customerEmail = stop.workOrder.customer.email;

  // On-My-Way email
  if (notifyCustomer && customerEmail) {
    const etaStr = estimatedArrival
      ? new Date(estimatedArrival).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "shortly";

    await sendEmail({
      to: customerEmail,
      subject: `🚐 ${technicianName} is on the way — ${stop.workOrder.orderNumber}`,
      html: onMyWayTemplate({
        customerName: stop.workOrder.customer.companyName,
        technicianName,
        vehicleName: stop.vehicle?.name || "service vehicle",
        propertyAddress: stop.workOrder.property.address,
        orderNumber: stop.workOrder.orderNumber,
        estimatedArrival: etaStr,
      }),
    });

    // Also log as field note for audit trail
    notification = await prisma.fieldNote.create({
      data: {
        workOrderId: stop.workOrderId,
        userId: (session.user as any).id,
        type: "NOTE",
        content: JSON.stringify({
          notification: "ON_MY_WAY_EMAIL",
          message: `On-My-Way email sent to ${customerEmail}`,
          sentAt: new Date().toISOString(),
        }),
      },
    });
  }

  // Job completion email
  if (completed && customerEmail) {
    await sendEmail({
      to: customerEmail,
      subject: `✅ Service completed — ${stop.workOrder.orderNumber}`,
      html: jobCompletedTemplate({
        customerName: stop.workOrder.customer.companyName,
        technicianName,
        propertyAddress: stop.workOrder.property.address,
        orderNumber: stop.workOrder.orderNumber,
        completedAt: new Date().toLocaleString("en-US", {
          month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
        }),
      }),
    });
  }

  return NextResponse.json({ stop, notification });
}
