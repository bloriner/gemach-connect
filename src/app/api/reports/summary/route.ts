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

  const [revenue, expenses, orders, customers, invoices] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: from, lte: to },
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: from, lte: to } },
    }),
    prisma.workOrder.count({
      where: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
    }),
    prisma.customer.count(),
    prisma.invoice.count({
      where: { createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "DRAFT"] } },
    }),
  ]);

  const rev = revenue._sum.total ?? 0;
  const exp = expenses._sum.amount ?? 0;
  const profit = rev - exp;
  const margin = rev > 0 ? (profit / rev) * 100 : 0;
  const avgTicket = invoices > 0 ? rev / invoices : 0;

  // Monthly trend (last 12 months regardless of range)
  const monthlyTrend: { month: string; revenue: number; expenses: number; orders: number }[] = [];
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
    monthlyTrend.push({
      month: d.toLocaleString("default", { month: "short" }),
      revenue: mRev._sum.total ?? 0,
      expenses: mExp._sum.amount ?? 0,
      orders: mCount,
    });
  }

  // AR aging
  const agingInvoices = await prisma.invoice.findMany({
    where: { status: { in: ["SENT", "OVERDUE"] } },
    include: { customer: { select: { companyName: true } } },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({
    from,
    to,
    revenue: rev,
    expenses: exp,
    profit,
    margin,
    orderCount: orders,
    customerCount: customers,
    avgTicket,
    monthlyTrend,
    agingInvoices: agingInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      total: inv.total,
      dueDate: inv.dueDate?.toISOString() ?? null,
      status: inv.status,
      customer: { companyName: inv.customer.companyName },
    })),
  });
}
