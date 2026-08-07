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

  const [
    revenueByCustomer,
    expensesByCategory,
    orderStatuses,
    serviceBreakdown,
    crews,
  ] = await Promise.all([
    // Revenue by customer
    prisma.invoice.groupBy({
      by: ["customerId"],
      _sum: { total: true },
      where: { createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "DRAFT"] } },
      orderBy: { _sum: { total: "desc" } },
    }),
    // Expenses by category
    prisma.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      where: { date: { gte: from, lte: to } },
      orderBy: { _sum: { amount: "desc" } },
    }),
    // Order status distribution
    prisma.workOrder.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Service type breakdown
    prisma.workOrder.groupBy({
      by: ["serviceTypeId"],
      _count: { id: true },
      where: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
      orderBy: { _count: { id: "desc" } },
    }),
    // Crew performance
    prisma.crew.findMany({
      include: {
        workOrders: {
          where: { status: "COMPLETED", completedAt: { gte: from, lte: to } },
          select: { id: true, price: true },
        },
        lead: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Resolve customer names
  const custIds = revenueByCustomer.map((r) => r.customerId);
  const customers = await prisma.customer.findMany({ where: { id: { in: custIds } }, select: { id: true, companyName: true } });
  const custMap = new Map(customers.map((c) => [c.id, c.companyName]));

  // Resolve service type names
  const svcIds = serviceBreakdown.map((s) => s.serviceTypeId);
  const svcTypes = await prisma.serviceType.findMany({ where: { id: { in: svcIds } }, select: { id: true, name: true } });
  const svcMap = new Map(svcTypes.map((s) => [s.id, s.name]));

  return NextResponse.json({
    from,
    to,
    revenueByCustomer: revenueByCustomer.map((r) => ({
      customerId: r.customerId,
      customerName: custMap.get(r.customerId) ?? "Unknown",
      revenue: r._sum.total ?? 0,
    })),
    expensesByCategory: expensesByCategory.map((e) => ({
      category: e.category,
      amount: e._sum.amount ?? 0,
    })),
    orderStatuses: orderStatuses.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
    serviceBreakdown: serviceBreakdown.map((s) => ({
      serviceTypeId: s.serviceTypeId,
      name: svcMap.get(s.serviceTypeId) ?? "Unknown",
      count: s._count.id,
    })),
    crews: crews.map((c) => ({
      name: c.name,
      lead: c.lead?.name ?? "Unassigned",
      completed: c.workOrders.length,
      revenue: c.workOrders.reduce((s, wo) => s + (wo.price ?? 0), 0),
    })),
  });
}
