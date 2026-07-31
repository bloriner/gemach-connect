import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await prisma.thread.findMany({
    where: {
      OR: [{ userId: session.user.id }, { ownerId: session.user.id }],
    },
    include: {
      gemach: { select: { id: true, name: true, category: true } },
      owner: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true } },
      reads: { where: { userId: session.user.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = threads.map((t) => {
    const lastMsg = t.messages[0];
    const other = t.ownerId === session.user.id ? t.user : t.owner;
    return {
      id: t.id,
      gemachId: t.gemachId,
      gemach: t.gemach,
      other,
      last: lastMsg ? { body: lastMsg.body, createdAt: lastMsg.createdAt, isMine: lastMsg.senderId === session.user.id } : null,
      unread: t.reads.length === 0 && lastMsg?.senderId !== session.user.id,
      createdAt: t.createdAt,
    };
  });

  return NextResponse.json({ threads: result });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gemachId } = await req.json();

  const gemach = await prisma.gemach.findUnique({ where: { id: gemachId } });
  if (!gemach) {
    return NextResponse.json({ error: "Gemach not found" }, { status: 404 });
  }

  let thread = await prisma.thread.findUnique({
    where: { gemachId_userId: { gemachId, userId: session.user.id } },
  });

  if (!thread) {
    thread = await prisma.thread.create({
      data: { gemachId, ownerId: gemach.ownerId, userId: session.user.id },
    });
  }

  return NextResponse.json({ thread });
}
