import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      gemach: {
        include: {
          owner: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { gemachId: "desc" },
  });

  return NextResponse.json({
    favorites: favorites.map((f) => f.gemach),
    favoriteIds: favorites.map((f) => f.gemachId),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gemachId } = await req.json();

  const existing = await prisma.favorite.findUnique({
    where: { userId_gemachId: { userId: session.user.id, gemachId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_gemachId: { userId: session.user.id, gemachId } },
    });
    return NextResponse.json({ favorited: false });
  } else {
    await prisma.favorite.create({
      data: { userId: session.user.id, gemachId },
    });
    return NextResponse.json({ favorited: true });
  }
}
