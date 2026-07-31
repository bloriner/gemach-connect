import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    include: { gemach: true },
  });

  if (!offer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { status, items, note } = await req.json();

  // Authorization: status changes only by gemach owner
  if (status && offer.gemach.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Donor can edit items/note only while pending
  if ((items || note) && offer.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ((items || note) && offer.status !== "pending") {
    return NextResponse.json({ error: "Can only edit pending offers" }, { status: 400 });
  }

  const updated = await prisma.offer.update({
    where: { id: params.id },
    data: { status, items, note },
    include: {
      gemach: { select: { id: true, name: true } },
      donor: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ offer: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offer = await prisma.offer.findUnique({ where: { id: params.id } });

  if (!offer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only donor can withdraw, and not once completed
  if (offer.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (offer.status === "completed") {
    return NextResponse.json({ error: "Cannot withdraw completed offers" }, { status: 400 });
  }

  await prisma.offer.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
