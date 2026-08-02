import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list all items across user's gemachs
export async function GET(_req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.item.findMany({
    where: {
      gemach: { ownerId: session.user.id },
    },
    include: {
      gemach: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const available = items.filter((i) => i.status === "available").length;
  const lent = items.filter((i) => i.status === "lent").length;
  const returned = items.filter((i) => i.status === "returned").length;

  return NextResponse.json({ items, stats: { available, lent, returned, total: items.length } });
}
