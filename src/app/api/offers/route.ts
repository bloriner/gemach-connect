import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const incoming = searchParams.get("incoming") === "true";

  const where: any = incoming
    ? { gemach: { ownerId: session.user.id } }
    : { userId: session.user.id };

  const offers = await prisma.offer.findMany({
    where,
    include: {
      gemach: { select: { id: true, name: true, category: true } },
      donor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ offers });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Look up gemach to verify it exists
  const gemach = await prisma.gemach.findUnique({ where: { id: body.gemachId } });
  if (!gemach) {
    return NextResponse.json({ error: "Gemach not found" }, { status: 404 });
  }

  const offer = await prisma.offer.create({
    data: {
      gemachId: body.gemachId,
      userId: session.user.id,
      items: body.items,
      qty: body.qty || 1,
      method: body.method || "dropoff",
      preferredDate: body.preferredDate || null,
      note: body.note || null,
    },
    include: {
      gemach: { select: { id: true, name: true } },
      donor: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ offer }, { status: 201 });
}
