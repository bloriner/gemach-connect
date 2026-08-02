import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET — list all items for a gemach
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const items = await prisma.item.findMany({
    where: { gemachId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

// POST — create a new item with auto-generated QR code
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gemach = await prisma.gemach.findUnique({ where: { id: params.id } });
  if (!gemach) {
    return NextResponse.json({ error: "Gemach not found" }, { status: 404 });
  }
  if (gemach.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const qrCode = crypto.randomUUID();

  const item = await prisma.item.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      qrCode,
      gemachId: params.id,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
