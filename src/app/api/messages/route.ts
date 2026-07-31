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
      gemach: { select: { id: true, name: true } },
      owner: { select: { name: true, email: true } },
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      reads: { where: { userId: session.user.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  // For Phase 2 compatibility, return flat messages list
  const messages = threads.flatMap((t) =>
    t.messages.map((m) => ({
      id: m.id,
      content: m.body,
      type: "inquiry",
      read: t.reads.length > 0,
      createdAt: m.createdAt,
      gemachId: t.gemachId,
      senderId: m.senderId,
      receiverId: m.senderId === session.user.id ? t.ownerId : t.userId,
      gemach: t.gemach,
      sender: t.user,
      receiver: t.owner,
    }))
  );

  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gemachId, content, type } = await req.json();

  const gemach = await prisma.gemach.findUnique({ where: { id: gemachId } });
  if (!gemach) {
    return NextResponse.json({ error: "Gemach not found" }, { status: 404 });
  }

  // Find or create thread
  let thread = await prisma.thread.findUnique({
    where: { gemachId_userId: { gemachId, userId: session.user.id } },
  });

  if (!thread) {
    thread = await prisma.thread.create({
      data: {
        gemachId,
        ownerId: gemach.ownerId,
        userId: session.user.id,
      },
    });
  }

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      senderId: session.user.id,
      body: content,
    },
    include: {
      sender: { select: { name: true, email: true } },
      thread: {
        include: {
          gemach: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, email: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const isUserSender = gemach.ownerId !== session.user.id;
  return NextResponse.json(
    {
      message: {
        id: message.id,
        content: message.body,
        type: type || "inquiry",
        read: false,
        createdAt: message.createdAt,
        gemachId,
        senderId: message.senderId,
        receiverId: gemach.ownerId,
        gemach: message.thread.gemach,
        sender: message.sender,
        receiver: isUserSender ? message.thread.owner : message.thread.user,
      },
    },
    { status: 201 }
  );
}
