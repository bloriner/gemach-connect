import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await prisma.signatureDocument.findUnique({
    where: { id: params.id },
    include: {
      sender: { select: { name: true, email: true } },
      signature: true,
      auditEvents: { orderBy: { timestamp: "desc" } },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

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
  const { status, title, description, notes } = body;

  const existing = await prisma.signatureDocument.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (notes !== undefined) updateData.notes = notes;

  if (status !== undefined) {
    const valid = ["DRAFT", "SENT", "VIEWED", "SIGNED", "DECLINED", "EXPIRED", "CANCELLED"];
    if (!valid.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }
    updateData.status = status;

    if (status === "SIGNED") updateData.signedAt = new Date();
    if (status === "DECLINED") updateData.declinedAt = new Date();
  }

  const updated = await prisma.signatureDocument.update({
    where: { id },
    data: updateData,
    include: {
      sender: { select: { name: true, email: true } },
      signature: true,
      auditEvents: { orderBy: { timestamp: "desc" } },
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
  const existing = await prisma.signatureDocument.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft documents can be deleted" }, { status: 400 });
  }

  await prisma.signatureDocument.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
