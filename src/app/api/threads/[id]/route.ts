import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thread = await prisma.thread.findUnique({
    where: { id: params.id },
    include: {
      gemach: { select: { id: true, name: true, category: true } },
      owner: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Authorization: only participants
  if (thread.userId !== session.user.id && thread.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark as read
  await prisma.threadRead.upsert({
    where: { threadId_userId: { threadId: params.id, userId: session.user.id } },
    create: { threadId: params.id, userId: session.user.id },
    update: { at: new Date() },
  });

  return NextResponse.json({ thread });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thread = await prisma.thread.findUnique({ where: { id: params.id } });
  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (thread.userId !== session.user.id && thread.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Message body required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { threadId: params.id, senderId: session.user.id, body },
    include: { sender: { select: { id: true, name: true } } },
  });

  // Update read status for sender
  await prisma.threadRead.upsert({
    where: { threadId_userId: { threadId: params.id, userId: session.user.id } },
    create: { threadId: params.id, userId: session.user.id },
    update: { at: new Date() },
  });

  return NextResponse.json({ message }, { status: 201 });
}
