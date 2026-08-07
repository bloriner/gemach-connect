import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();
  const { workOrderId, notes } = body;

  if (!workOrderId) {
    return NextResponse.json({ error: "workOrderId is required" }, { status: 400 });
  }

  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  if (equipment.status !== "AVAILABLE") {
    return NextResponse.json(
      { error: `Equipment is ${equipment.status.toLowerCase()}, cannot check out` },
      { status: 409 }
    );
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { id: true, propertyId: true },
  });
  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  // Use a transaction: create checkout + update equipment status
  const result = await prisma.$transaction([
    prisma.equipmentCheckout.create({
      data: {
        equipmentId: id,
        workOrderId,
        checkedOutById: (session.user as any).id,
        notes: notes ?? null,
      },
    }),
    prisma.equipment.update({
      where: { id },
      data: {
        status: "DEPLOYED",
        workOrderId,
        propertyId: workOrder.propertyId,
        deployedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ checkout: result[0], equipment: result[1] }, { status: 201 });
}
