import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(val: unknown): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = toStr ? new Date(toStr) : new Date();

  const dateLabel = `${from.toISOString().split("T")[0]}_to_${to.toISOString().split("T")[0]}`;

  // ---- SECTION 1: KPI Summary ----
  const [revenueAgg, expenseAgg, orderCount, invoiceCount] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "DRAFT"] } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: from, lte: to } },
    }),
    prisma.workOrder.count({
      where: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
    }),
    prisma.invoice.count({
      where: { createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "DRAFT"] } },
    }),
  ]);

  const rev = revenueAgg._sum.total ?? 0;
  const exp = expenseAgg._sum.amount ?? 0;
  const profit = rev - exp;
  const margin = rev > 0 ? (profit / rev) * 100 : 0;
  const avgTicket = invoiceCount > 0 ? rev / invoiceCount : 0;

  // ---- SECTION 2: Monthly Trend ----
  const monthlyRows: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const [mRev, mExp, mCount] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: d, lte: endD }, status: { notIn: ["CANCELLED", "DRAFT"] } },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: d, lte: endD } },
      }),
      prisma.workOrder.count({
        where: { createdAt: { gte: d, lte: endD }, status: { not: "CANCELLED" } },
      }),
    ]);
    const monthLabel = d.toLocaleString("default", { month: "short", year: "numeric" });
    monthlyRows.push(`${escapeCsv(monthLabel)},${mRev._sum.total ?? 0},${mExp._sum.amount ?? 0},${mCount}`);
  }

  // ---- SECTION 3: Revenue by Customer ----
  const revByCust = await prisma.invoice.groupBy({
    by: ["customerId"],
    _sum: { total: true },
    where: { status: { notIn: ["CANCELLED", "DRAFT"] } },
    orderBy: { _sum: { total: "desc" } },
  });
  const custIds = revByCust.map((r) => r.customerId);
  const custMap = new Map(
    (await prisma.customer.findMany({ where: { id: { in: custIds } }, select: { id: true, companyName: true } }))
      .map((c) => [c.id, c.companyName])
  );

  // ---- SECTION 4: AR Aging ----
  const agingInvoices = await prisma.invoice.findMany({
    where: { status: { in: ["SENT", "OVERDUE"] } },
    include: { customer: { select: { companyName: true } } },
    orderBy: { dueDate: "asc" },
  });

  // ---- SECTION 5: Crew Performance ----
  const crews = await prisma.crew.findMany({
    include: {
      workOrders: {
        where: { status: "COMPLETED", completedAt: { gte: from, lte: to } },
        select: { id: true, price: true },
      },
      lead: { select: { name: true } },
    },
  });

  // ---- SECTION 6: Expenses by Category ----
  const expByCat = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
    where: { date: { gte: from, lte: to } },
    orderBy: { _sum: { amount: "desc" } },
  });

  // ---- SECTION 7: Technician Detail ----
  const techs = await prisma.user.findMany({
    where: { role: { in: ["CREW_MEMBER", "CREW_LEAD"] }, active: true },
    select: { id: true, name: true, role: true, crew: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const techStats = await Promise.all(
    techs.map(async (u) => {
      const [done, upsellAgg] = await Promise.all([
        prisma.workOrder.count({
          where: { status: "COMPLETED", completedAt: { gte: from, lte: to }, crew: { members: { some: { id: u.id } } } },
        }),
        prisma.workOrderItem.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: { addedById: u.id, createdAt: { gte: from, lte: to } },
        }),
      ]);
      const revResult = await prisma.workOrder.aggregate({
        _sum: { price: true },
        where: { status: "COMPLETED", completedAt: { gte: from, lte: to }, crew: { members: { some: { id: u.id } } } },
      });
      return {
        name: u.name,
        crew: u.crew?.name ?? "—",
        completed: done,
        revenue: revResult._sum.price ?? 0,
        upsells: upsellAgg._count.id,
        upsellRevenue: upsellAgg._sum.total ?? 0,
      };
    })
  );

  // ---- BUILD CSV ----
  const lines: string[] = [];

  lines.push("PREMIER PRO SERVICES — REPORT");
  lines.push(`Period: ${from.toISOString().split("T")[0]} to ${to.toISOString().split("T")[0]}`);
  lines.push(`Generated: ${new Date().toISOString().split("T")[0]}`);
  lines.push("");

  lines.push("=== KPI SUMMARY ===");
  lines.push(`Revenue,${rev}`);
  lines.push(`Expenses,${exp}`);
  lines.push(`Profit,${profit}`);
  lines.push(`Margin %,${margin.toFixed(1)}`);
  lines.push(`Order Count,${orderCount}`);
  lines.push(`Avg Ticket,${avgTicket.toFixed(2)}`);
  lines.push("");

  lines.push("=== MONTHLY TREND ===");
  lines.push("Month,Revenue,Expenses,Orders");
  monthlyRows.forEach((r) => lines.push(r));
  lines.push("");

  lines.push("=== REVENUE BY CUSTOMER ===");
  lines.push("Customer,Revenue");
  revByCust.forEach((r) => lines.push(`${escapeCsv(custMap.get(r.customerId) ?? "Unknown")},${r._sum.total ?? 0}`));
  lines.push("");

  lines.push("=== ACCOUNTS RECEIVABLE ===");
  lines.push("Customer,Invoice #,Total,Due Date,Status");
  agingInvoices.forEach((inv) =>
    lines.push(
      `${escapeCsv(inv.customer.companyName)},${escapeCsv(inv.invoiceNumber)},${inv.total},${inv.dueDate?.toISOString().split("T")[0] ?? ""},${inv.status}`
    )
  );
  lines.push("");

  lines.push("=== CREW PERFORMANCE ===");
  lines.push("Crew,Lead,Completed Jobs,Revenue");
  crews.forEach((c) =>
    lines.push(
      `${escapeCsv(c.name)},${escapeCsv(c.lead?.name ?? "Unassigned")},${c.workOrders.length},${c.workOrders.reduce((s, wo) => s + (wo.price ?? 0), 0)}`
    )
  );
  lines.push("");

  lines.push("=== EXPENSES BY CATEGORY ===");
  lines.push("Category,Amount");
  expByCat.forEach((e) => lines.push(`${escapeCsv(e.category)},${e._sum.amount ?? 0}`));
  lines.push("");

  lines.push("=== TECHNICIAN PERFORMANCE ===");
  lines.push("Technician,Crew,Completed Jobs,Revenue,Upsells,Upsell Revenue");
  techStats.forEach((t) =>
    lines.push(`${escapeCsv(t.name)},${escapeCsv(t.crew)},${t.completed},${t.revenue},${t.upsells},${t.upsellRevenue}`)
  );

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="premier-pro-report-${dateLabel}.csv"`,
    },
  });
}
