import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface JobProfit {
  id: string;
  orderNumber: string;
  customerName: string;
  propertyAddress: string;
  serviceName: string;
  crewName: string;
  status: string;
  completedAt: string | null;
  revenue: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  otherCost: number;
  totalCost: number;
  profit: number;
  margin: number;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = toStr ? new Date(toStr) : new Date();

  // Get all work orders with expenses, time entries, upsells, crew info
  const workOrders = await prisma.workOrder.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      status: { not: "CANCELLED" },
    },
    include: {
      customer: { select: { companyName: true } },
      property: { select: { address: true } },
      serviceType: { select: { name: true } },
      crew: { select: { name: true, laborRate: true } },
      items: { select: { total: true, serviceType: { select: { name: true } } } },
      expenses: { select: { category: true, amount: true } },
      timeEntries: { select: { type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const jobs: JobProfit[] = workOrders.map((wo) => {
    // Revenue: base price + upsell items
    const basePrice = wo.price ?? 0;
    const upsellTotal = wo.items.reduce((s, item) => s + item.total, 0);
    const revenue = basePrice + upsellTotal;

    // Labor cost: crew laborRate × hours
    // Estimate 4 hours per ARRIVAL time entry
    const hourlyRate = wo.crew?.laborRate ?? 75;
    const arrivalCount = wo.timeEntries.filter((t) => t.type === "ARRIVAL").length;
    const estimatedHours = arrivalCount * 4;
    const laborCost = hourlyRate * estimatedHours;

    // Material cost
    const materialCost = wo.expenses
      .filter((e) => e.category === "MATERIALS")
      .reduce((s, e) => s + e.amount, 0);

    // Equipment cost
    const equipmentCost = wo.expenses
      .filter((e) => e.category === "EQUIPMENT")
      .reduce((s, e) => s + e.amount, 0);

    // Other costs
    const otherCost = wo.expenses
      .filter((e) => !["MATERIALS", "EQUIPMENT"].includes(e.category))
      .reduce((s, e) => s + e.amount, 0);

    const totalCost = laborCost + materialCost + equipmentCost + otherCost;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      id: wo.id,
      orderNumber: wo.orderNumber,
      customerName: wo.customer.companyName,
      propertyAddress: wo.property.address,
      serviceName: wo.serviceType.name,
      crewName: wo.crew?.name ?? "—",
      status: wo.status,
      completedAt: wo.completedAt?.toISOString() ?? null,
      revenue,
      laborCost,
      materialCost,
      equipmentCost,
      otherCost,
      totalCost,
      profit,
      margin,
    };
  });

  // Summary stats
  const totalRevenue = jobs.reduce((s, j) => s + j.revenue, 0);
  const totalCost = jobs.reduce((s, j) => s + j.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = jobs.length > 0 ? jobs.reduce((s, j) => s + j.margin, 0) / jobs.length : 0;

  return NextResponse.json({
    from,
    to,
    totalRevenue,
    totalCost,
    totalProfit,
    avgMargin,
    jobCount: jobs.length,
    jobs,
  });
}
