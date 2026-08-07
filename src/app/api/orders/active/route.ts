import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.workOrder.findMany({
    where: {
      status: { in: ["DISPATCHED", "EN_ROUTE", "ON_SITE"] },
    },
    include: {
      customer: { select: { companyName: true } },
      property: { select: { address: true, city: true, state: true } },
      crew: { select: { name: true, lead: { select: { name: true } } } },
      serviceType: { select: { name: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json(orders);
}
