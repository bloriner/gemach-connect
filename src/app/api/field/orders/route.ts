import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const statusFilter = request.nextUrl.searchParams.get("status");

  // Find the user's crew
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { crewId: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Build where clause — crew members see their crew's orders; admins/office see all
  const where: any = {};
  if (userRole === "CREW_MEMBER" || userRole === "CREW_LEAD") {
    if (user.crewId) {
      where.crewId = user.crewId;
    } else {
      return NextResponse.json([]);
    }
  }

  if (statusFilter) {
    where.status = statusFilter;
  } else {
    // Default: active orders (not cancelled, not invoiced)
    where.status = { notIn: ["CANCELLED", "INVOICED"] };
  }

  const orders = await prisma.workOrder.findMany({
    where,
    orderBy: [{ priority: "asc" }, { scheduledDate: "asc" }],
    include: {
      customer: { select: { id: true, companyName: true, phone: true } },
      property: { select: { id: true, address: true, city: true, state: true, accessNotes: true, gateCode: true } },
      serviceType: { select: { id: true, name: true, checklistTemplate: true } },
      crew: { select: { id: true, name: true } },
      items: {
        include: { serviceType: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      photos: {
        orderBy: { takenAt: "desc" },
        take: 3,
      },
      checklistItems: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          photos: true,
          checklistItems: true,
          forms: true,
        },
      },
    },
  });

  return NextResponse.json(orders);
}
