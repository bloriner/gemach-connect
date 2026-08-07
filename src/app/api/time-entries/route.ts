import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { workOrderId, type, notes, lat, lng } = body;

  if (!workOrderId || !type) {
    return NextResponse.json({ error: "workOrderId and type are required" }, { status: 400 });
  }

  const validTypes = ["ARRIVAL", "DEPARTURE", "BREAK_START", "BREAK_END"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  // Verify work order exists
  const order = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      workOrderId,
      userId,
      type,
      notes: notes ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
    },
  });

  // Auto-update order status on arrival
  if (type === "ARRIVAL" && order.status !== "ON_SITE") {
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: "ON_SITE" },
    });
  }

  return NextResponse.json(timeEntry, { status: 201 });
}
