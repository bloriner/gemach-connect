import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gemach = await prisma.gemach.findUnique({
    where: { id: params.id },
    include: { owner: { select: { id: true, name: true, email: true, phone: true } } },
  });

  if (!gemach) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ gemach });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gemach = await prisma.gemach.findUnique({ where: { id: params.id } });
  if (!gemach) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (gemach.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.gemach.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json({ gemach: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gemach = await prisma.gemach.findUnique({ where: { id: params.id } });
  if (!gemach) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (gemach.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.gemach.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
