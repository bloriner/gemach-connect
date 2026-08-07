import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Fetch all active orders (not cancelled, not invoiced)
  const orders = await prisma.workOrder.findMany({
    where: {
      status: { notIn: ["CANCELLED", "INVOICED"] },
    },
    orderBy: [{ priority: "asc" }, { scheduledDate: "asc" }],
    include: {
      customer: { select: { id: true, companyName: true, contactName: true, phone: true } },
      property: { select: { id: true, name: true, address: true, city: true, state: true } },
      serviceType: { select: { id: true, name: true } },
      crew: { select: { id: true, name: true, lead: { select: { id: true, name: true } } } },
    },
  });

  // Also fetch today's completed orders
  const todayCompleted = await prisma.workOrder.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: todayStart, lte: todayEnd },
    },
    orderBy: { completedAt: "desc" },
    include: {
      customer: { select: { id: true, companyName: true, contactName: true, phone: true } },
      property: { select: { id: true, name: true, address: true, city: true, state: true } },
      serviceType: { select: { id: true, name: true } },
      crew: { select: { id: true, name: true, lead: { select: { id: true, name: true } } } },
    },
  });

  // Fetch all active crews for assignment dropdown
  const crews = await prisma.crew.findMany({
    where: { active: true },
    select: { id: true, name: true, lead: { select: { id: true, name: true } } },
  });

  const now = new Date();
  const ordersWithAge = orders.map((o) => ({
    ...o,
    ageHours: o.createdAt ? Math.round((now.getTime() - new Date(o.createdAt).getTime()) / 3600000) : null,
  }));

  return NextResponse.json({
    orders: ordersWithAge,
    todayCompleted,
    crews,
  });
}
