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
  const { notes } = body;

  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  if (equipment.status !== "DEPLOYED") {
    return NextResponse.json(
      { error: `Equipment is ${equipment.status.toLowerCase()}, not currently deployed` },
      { status: 409 }
    );
  }

  // Find the active (unclosed) checkout
  const activeCheckout = await prisma.equipmentCheckout.findFirst({
    where: { equipmentId: id, checkedInAt: null },
    orderBy: { checkedOutAt: "desc" },
  });

  if (!activeCheckout) {
    return NextResponse.json({ error: "No active checkout found for this equipment" }, { status: 404 });
  }

  const result = await prisma.$transaction([
    prisma.equipmentCheckout.update({
      where: { id: activeCheckout.id },
      data: {
        checkedInAt: new Date(),
        checkedInById: (session.user as any).id,
        notes: notes ?? activeCheckout.notes,
      },
    }),
    prisma.equipment.update({
      where: { id },
      data: {
        status: "AVAILABLE",
        workOrderId: null,
        propertyId: null,
        deployedAt: null,
      },
    }),
  ]);

  return NextResponse.json({ checkout: result[0], equipment: result[1] });
}
