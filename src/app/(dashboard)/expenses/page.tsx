import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Filter } from "lucide-react";

const EXPENSE_CATEGORIES = [
  "MATERIALS", "LABOR", "FUEL", "EQUIPMENT", "SOFTWARE", "TRAVEL", "OTHER",
] as const;

const categoryColors: Record<string, string> = {
  MATERIALS: "bg-blue-100 text-blue-800",
  LABOR: "bg-green-100 text-green-800",
  FUEL: "bg-amber-100 text-amber-800",
  EQUIPMENT: "bg-purple-100 text-purple-800",
  SOFTWARE: "bg-cyan-100 text-cyan-800",
  TRAVEL: "bg-pink-100 text-pink-800",
  OTHER: "bg-slate-100 text-slate-800",
};

const categoryBarColors: Record<string, string> = {
  MATERIALS: "bg-blue-500",
  LABOR: "bg-green-500",
  FUEL: "bg-amber-500",
  EQUIPMENT: "bg-purple-500",
  SOFTWARE: "bg-cyan-500",
  TRAVEL: "bg-pink-500",
  OTHER: "bg-slate-500",
};

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [expenses, expensesByCategory, totalMtd, totalAllTime] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: { createdBy: true, workOrder: { select: { orderNumber: true } } },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      where: { date: { gte: monthStart } },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: monthStart } },
    }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  const totalCatAmount = expensesByCategory.reduce((s, c) => s + (c._sum.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track all business expenses — {expenses.length} total, {formatCurrency(totalMtd._sum.amount ?? 0)} this month
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <DollarSign className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EXPENSE_CATEGORIES.map((cat) => {
          const found = expensesByCategory.find((e) => e.category === cat);
          const amt = found?._sum.amount ?? 0;
          const pct = totalCatAmount > 0 ? (amt / totalCatAmount) * 100 : 0;
          return (
            <Card key={cat}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[cat]}`}>
                    {cat}
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(amt)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${categoryBarColors[cat]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{pct.toFixed(0)}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">This Month</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalMtd._sum.amount ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">All Time</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAllTime._sum.amount ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Avg Per Expense</p>
            <p className="text-xl font-bold text-slate-900">
              {expenses.length > 0
                ? formatCurrency((totalAllTime._sum.amount ?? 0) / expenses.length)
                : "$0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">All Expenses</h2>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <DollarSign className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-slate-500">No expenses recorded yet</p>
              <p className="mt-1 text-sm text-slate-400">Click "Add Expense" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Date</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Description</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Category</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Vendor</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Work Order</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Amount</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600">Entered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-900 max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[exp.category] ?? "bg-slate-100 text-slate-800"}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{exp.vendor ?? "—"}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {exp.workOrder?.orderNumber ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-red-600">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{exp.createdBy.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
