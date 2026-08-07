import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — fetch checklist items for an order
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workOrderId = request.nextUrl.searchParams.get("workOrderId");
  if (!workOrderId) {
    return NextResponse.json({ error: "workOrderId is required" }, { status: 400 });
  }

  const items = await prisma.jobChecklistItem.findMany({
    where: { workOrderId },
    orderBy: { order: "asc" },
    include: {
      completedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(items);
}

// POST — create checklist items from template
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { workOrderId, items } = body;

  if (!workOrderId || !items || !Array.isArray(items)) {
    return NextResponse.json({ error: "workOrderId and items array are required" }, { status: 400 });
  }

  // Create all checklist items
  const created = await prisma.$transaction(
    items.map((item: { label: string; order: number }, idx: number) =>
      prisma.jobChecklistItem.create({
        data: {
          workOrderId,
          label: item.label,
          order: item.order ?? idx,
        },
      })
    )
  );

  return NextResponse.json(created, { status: 201 });
}

// PATCH — toggle a checklist item's completion
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { id, completed, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: any = { completed };
  if (completed) {
    data.completedById = userId;
    data.completedAt = new Date();
  } else {
    data.completedById = null;
    data.completedAt = null;
  }
  if (notes !== undefined) data.notes = notes;

  const item = await prisma.jobChecklistItem.update({
    where: { id },
    data,
    include: {
      completedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(item);
}
