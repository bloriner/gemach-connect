import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";

export default async function AccountingPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [revenueMTD, revenueYTD, expensesMTD, expensesYTD, recentInvoices, recentExpenses] =
    await Promise.all([
      // Revenue this month
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      }),
      // Revenue this year
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: yearStart }, status: { not: "CANCELLED" } },
      }),
      // Expenses this month
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: monthStart } },
      }),
      // Expenses this year
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: yearStart } },
      }),
      // Recent invoices
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true, payments: true },
      }),
      // Recent expenses
      prisma.expense.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { createdBy: true },
      }),
    ]);

  const revMtd = revenueMTD._sum.total ?? 0;
  const expMtd = expensesMTD._sum.amount ?? 0;
  const profitMtd = revMtd - expMtd;
  const revYtd = revenueYTD._sum.total ?? 0;
  const expYtd = expensesYTD._sum.amount ?? 0;
  const profitYtd = revYtd - expYtd;
  const marginMtd = revMtd > 0 ? ((profitMtd / revMtd) * 100) : 0;
  const marginYtd = revYtd > 0 ? ((profitYtd / revYtd) * 100) : 0;

  // Expenses by category
  const expensesByCategory = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
    where: { date: { gte: monthStart } },
  });

  // Outstanding invoices
  const outstanding = await prisma.invoice.aggregate({
    _sum: { total: true },
    where: { status: { in: ["SENT", "OVERDUE"] } },
  });

  // Paid this month
  const paidMtd = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { receivedAt: { gte: monthStart } },
  });

  const categoryColors: Record<string, string> = {
    MATERIALS: "bg-blue-500",
    LABOR: "bg-green-500",
    FUEL: "bg-amber-500",
    EQUIPMENT: "bg-purple-500",
    SOFTWARE: "bg-cyan-500",
    TRAVEL: "bg-pink-500",
    OTHER: "bg-slate-500",
  };

  const totalExpByCat = expensesByCategory.reduce((s, c) => s + (c._sum.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Accounting</h1>
        <p className="mt-1 text-sm text-slate-500">Financial overview and P&L</p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-green-100 p-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Revenue (MTD)</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(revMtd)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-red-100 p-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Expenses (MTD)</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(expMtd)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`rounded-lg p-3 ${profitMtd >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
              <DollarSign className={`h-5 w-5 ${profitMtd >= 0 ? "text-emerald-600" : "text-red-600"}`} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Net Profit (MTD)</p>
              <p className={`text-xl font-bold ${profitMtd >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {formatCurrency(profitMtd)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-amber-100 p-3">
              <Receipt className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Outstanding</p>
              <p className="text-xl font-bold text-amber-700">
                {formatCurrency(outstanding._sum.total ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Profit & Loss — This Month</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Revenue</span>
                <span className="font-medium text-green-600">{formatCurrency(revMtd)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Expenses</span>
                <span className="font-medium text-red-600">({formatCurrency(expMtd)})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-900">Net Profit</span>
                <span className={`font-bold ${profitMtd >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(profitMtd)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Profit Margin</span>
                <span className={`font-medium ${marginMtd >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {marginMtd.toFixed(1)}%
                </span>
              </div>
              {paidMtd._sum.amount != null && (
                <div className="flex justify-between border-t pt-2 text-sm">
                  <span className="text-slate-500">Payments Received</span>
                  <span className="font-medium text-green-600">{formatCurrency(paidMtd._sum.amount)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* YTD Summary */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Profit & Loss — Year to Date</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Revenue</span>
                <span className="font-medium text-green-600">{formatCurrency(revYtd)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Expenses</span>
                <span className="font-medium text-red-600">({formatCurrency(expYtd)})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-900">Net Profit</span>
                <span className={`font-bold ${profitYtd >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(profitYtd)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Profit Margin</span>
                <span className={`font-medium ${marginYtd >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {marginYtd.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Expenses by Category (MTD)</h2>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses this month.</p>
            ) : (
              <div className="space-y-3">
                {expensesByCategory.map((cat) => {
                  const amt = cat._sum.amount ?? 0;
                  const pct = totalExpByCat > 0 ? (amt / totalExpByCat) * 100 : 0;
                  return (
                    <div key={cat.category}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-slate-600">{cat.category}</span>
                        <span className="font-medium text-slate-900">{formatCurrency(amt)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${categoryColors[cat.category] ?? "bg-slate-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Recent Expenses</h2>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses recorded.</p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{exp.description}</p>
                      <p className="text-xs text-slate-500">
                        {exp.category} — {exp.vendor ?? "—"} — {new Date(exp.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
