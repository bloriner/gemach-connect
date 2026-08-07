import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: { id: true, name: true, type: true, serialNumber: true, status: true },
  });

  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const checkouts = await prisma.equipmentCheckout.findMany({
    where: { equipmentId: id },
    include: {
      workOrder: { select: { orderNumber: true, property: { select: { address: true } } } },
      checkedOutBy: { select: { name: true } },
      checkedInBy: { select: { name: true } },
    },
    orderBy: { checkedOutAt: "desc" },
  });

  // Build timeline entries
  const timeline = checkouts.map((co) => ({
    type: "CHECKOUT" as const,
    id: co.id,
    timestamp: co.checkedOutAt.toISOString(),
    workOrderNumber: co.workOrder.orderNumber,
    propertyAddress: co.workOrder.property.address,
    checkedOutBy: co.checkedOutBy.name,
    checkedInAt: co.checkedInAt?.toISOString() ?? null,
    checkedInBy: co.checkedInBy?.name ?? null,
    notes: co.notes,
    duration: co.checkedInAt
      ? `${Math.round((co.checkedInAt.getTime() - co.checkedOutAt.getTime()) / (1000 * 60 * 60))}h`
      : null,
  }));

  return NextResponse.json({ equipment, timeline });
}
