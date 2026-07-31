import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const state = searchParams.get("state") || "";
  const mine = searchParams.get("mine");
  const session = await getServerSession(authOptions);

  const where: any = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { city: { contains: q } },
    ];
  }
  if (category) where.category = category;
  if (state) where.state = state;
  if (mine === "true" && session?.user?.id) {
    where.ownerId = session.user.id;
  }

  const gemachs = await prisma.gemach.findMany({
    where,
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ gemachs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const gemach = await prisma.gemach.create({
    data: {
      ...body,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json({ gemach }, { status: 201 });
}
