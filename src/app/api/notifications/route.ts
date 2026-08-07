import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const { searchParams } = new URL(request.url);
  const markAll = searchParams.get("markAll") === "true";
  const id = searchParams.get("id");

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } else if (id) {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return NextResponse.json({ unreadCount });
}
