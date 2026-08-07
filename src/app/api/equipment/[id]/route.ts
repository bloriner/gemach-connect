import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();

  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const updated = await prisma.equipment.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      type: body.type ?? existing.type,
      serialNumber: body.serialNumber !== undefined ? body.serialNumber : existing.serialNumber,
      status: body.status ?? existing.status,
      location: body.location !== undefined ? body.location : existing.location,
      workOrderId: body.workOrderId !== undefined ? body.workOrderId : existing.workOrderId,
      propertyId: body.propertyId !== undefined ? body.propertyId : existing.propertyId,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      deployedAt: body.status === "DEPLOYED" && existing.status !== "DEPLOYED" ? new Date() : existing.deployedAt,
    },
    include: {
      workOrder: { select: { orderNumber: true } },
      property: { select: { name: true, address: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  await prisma.equipment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
