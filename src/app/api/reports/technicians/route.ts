import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = toStr ? new Date(toStr) : new Date();

  // Get all users with CREW_MEMBER or CREW_LEAD roles
  const users = await prisma.user.findMany({
    where: { role: { in: ["CREW_MEMBER", "CREW_LEAD"] }, active: true },
    select: {
      id: true,
      name: true,
      role: true,
      crew: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // For each user, get their stats for the date range
  const technicians = await Promise.all(
    users.map(async (user) => {
      const [completedOrders, workOrderItems, timeEntries, photos] = await Promise.all([
        prisma.workOrder.count({
          where: {
            status: "COMPLETED",
            completedAt: { gte: from, lte: to },
            crew: { members: { some: { id: user.id } } },
          },
        }),
        prisma.workOrderItem.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: {
            addedById: user.id,
            createdAt: { gte: from, lte: to },
          },
        }),
        prisma.timeEntry.count({
          where: {
            userId: user.id,
            type: "ARRIVAL",
            timestamp: { gte: from, lte: to },
          },
        }),
        prisma.jobPhoto.count({
          where: {
            userId: user.id,
            takenAt: { gte: from, lte: to },
          },
        }),
      ]);

      // Revenue from completed orders in user's crew
      const revenueResult = await prisma.workOrder.aggregate({
        _sum: { price: true },
        where: {
          status: "COMPLETED",
          completedAt: { gte: from, lte: to },
          crew: { members: { some: { id: user.id } } },
        },
      });

      // Total hours (using time entries — arrival counts as half-day minimum)
      const hours = timeEntries * 4; // rough estimate: each site visit ≈ 4 hours

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        crewName: user.crew?.name ?? "—",
        completedJobs: completedOrders,
        revenue: revenueResult._sum.price ?? 0,
        upsells: workOrderItems._count.id,
        upsellRevenue: workOrderItems._sum.total ?? 0,
        siteVisits: timeEntries,
        hours,
        photos: photos,
      };
    })
  );

  return NextResponse.json({ from, to, technicians });
}
