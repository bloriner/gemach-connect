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
  const { workOrderId, type, content, photoUrls } = body;

  if (!workOrderId || !type) {
    return NextResponse.json({ error: "workOrderId and type are required" }, { status: 400 });
  }

  const validTypes = ["NOTE", "PHOTO", "ISSUE", "SIGNATURE"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }

  // Verify work order exists
  const order = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const fieldNote = await prisma.fieldNote.create({
    data: {
      workOrderId,
      userId,
      type,
      content: content ?? null,
      photoUrls: photoUrls ?? null,
    },
  });

  return NextResponse.json(fieldNote, { status: 201 });
}
