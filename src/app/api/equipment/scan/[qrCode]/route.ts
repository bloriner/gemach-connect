import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { qrCode: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { qrCode } = params;

  const equipment = await prisma.equipment.findUnique({
    where: { qrCode },
    include: {
      property: { select: { name: true, address: true } },
      workOrder: { select: { orderNumber: true } },
      checkouts: {
        where: { checkedInAt: null },
        include: {
          workOrder: { select: { orderNumber: true, property: { select: { address: true } } } },
          checkedOutBy: { select: { name: true } },
        },
        orderBy: { checkedOutAt: "desc" },
        take: 1,
      },
    },
  });

  if (!equipment) {
    return NextResponse.json(
      { error: "Equipment not found", invalidCode: true },
      { status: 404 }
    );
  }

  const activeCheckout = equipment.checkouts[0] ?? null;

  return NextResponse.json({
    id: equipment.id,
    name: equipment.name,
    type: equipment.type,
    serialNumber: equipment.serialNumber,
    status: equipment.status,
    qrCode: equipment.qrCode,
    location: equipment.location,
    notes: equipment.notes,
    property: equipment.property,
    activeCheckout: activeCheckout
      ? {
          id: activeCheckout.id,
          checkedOutAt: activeCheckout.checkedOutAt.toISOString(),
          checkedOutBy: activeCheckout.checkedOutBy.name,
          workOrderNumber: activeCheckout.workOrder.orderNumber,
          propertyAddress: activeCheckout.workOrder.property.address,
        }
      : null,
  });
}
