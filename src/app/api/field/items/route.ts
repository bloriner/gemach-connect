import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — add a line item to an existing order (upsell / quick add)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { workOrderId, serviceTypeId, description, quantity, unitPrice } = body;

  if (!workOrderId || !serviceTypeId) {
    return NextResponse.json(
      { error: "workOrderId and serviceTypeId are required" },
      { status: 400 }
    );
  }

  const qty = quantity || 1;
  const price = unitPrice || 0;
  const total = qty * price;

  const item = await prisma.workOrderItem.create({
    data: {
      workOrderId,
      serviceTypeId,
      description: description || null,
      quantity: qty,
      unitPrice: price,
      total,
      addedById: userId,
    },
    include: {
      serviceType: { select: { id: true, name: true } },
      addedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(item, { status: 201 });
}

// DELETE — remove a line item
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const itemId = request.nextUrl.searchParams.get("id");
  if (!itemId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.workOrderItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
