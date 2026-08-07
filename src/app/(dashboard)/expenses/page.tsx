"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Filter, Plus, X, Loader2, CheckCircle2 } from "lucide-react";

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

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  vendor: string | null;
  date: string;
  workOrder: { orderNumber: string } | null;
  createdBy: { name: string };
}

interface CatSummary {
  category: string;
  _sum: { amount: number | null };
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("MATERIALS");
  const [formAmt, setFormAmt] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) setExpenses(await res.json());
    } catch (e) {
      console.error("Failed to fetch expenses", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formDesc.trim() || !formAmt) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formDesc,
          category: formCat,
          amount: parseFloat(formAmt),
          vendor: formVendor || null,
          date: formDate,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormDesc(""); setFormAmt(""); setFormVendor("");
        showToast("Expense added!");
        await fetchExpenses();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed");
      }
    } catch (e) {
      showToast("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = filterCategory
    ? expenses.filter((e) => e.category === filterCategory)
    : expenses;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mtdExpenses = expenses.filter((e) => new Date(e.date) >= monthStart);
  const totalMtd = mtdExpenses.reduce((s, e) => s + e.amount, 0);
  const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0);

  // Category breakdown
  const catMap = new Map<string, number>();
  mtdExpenses.forEach((e) => catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount));
  const catBreakdown: CatSummary[] = Array.from(catMap.entries()).map(([category, amount]) => ({
    category,
    _sum: { amount },
  }));
  const totalCatAmount = catBreakdown.reduce((s, c) => s + (c._sum.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            {toast}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
              <p className="mt-1 text-sm text-slate-500">
                Track all business expenses — {expenses.length} total, {formatCurrency(totalMtd)} this month
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFilterCategory(filterCategory ? null : "MATERIALS")}>
                <Filter className="mr-2 h-4 w-4" />
                {filterCategory ? `Filter: ${filterCategory}` : "Filter"}
              </Button>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXPENSE_CATEGORIES.map((cat) => {
              const amt = catMap.get(cat) ?? 0;
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
            <Card><CardContent className="py-4"><p className="text-sm text-slate-500">This Month</p><p className="text-xl font-bold text-red-600">{formatCurrency(totalMtd)}</p></CardContent></Card>
            <Card><CardContent className="py-4"><p className="text-sm text-slate-500">All Time</p><p className="text-xl font-bold text-slate-900">{formatCurrency(totalAllTime)}</p></CardContent></Card>
            <Card><CardContent className="py-4"><p className="text-sm text-slate-500">Avg Per Expense</p><p className="text-xl font-bold text-slate-900">{expenses.length > 0 ? formatCurrency(totalAllTime / expenses.length) : "$0.00"}</p></CardContent></Card>
          </div>

          {/* Expense Table */}
          <Card>
            <CardHeader><h2 className="text-lg font-semibold text-slate-900">All Expenses</h2></CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <DollarSign className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-slate-500">No expenses recorded yet</p>
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
                        <th className="px-6 py-3 text-left font-medium text-slate-600">Amount</th>
                        <th className="px-6 py-3 text-left font-medium text-slate-600">Entered By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-slate-900 max-w-xs truncate">{exp.description}</td>
                          <td className="px-6 py-4"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[exp.category] ?? "bg-slate-100 text-slate-800"}`}>{exp.category}</span></td>
                          <td className="px-6 py-4 text-slate-500">{exp.vendor ?? "\u2014"}</td>
                          <td className="px-6 py-4 font-medium text-red-600">{formatCurrency(exp.amount)}</td>
                          <td className="px-6 py-4 text-slate-500">{exp.createdBy.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-md">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="pt-5">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                  <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="e.g., Carpet cleaning solution"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select value={formCat} onChange={(e) => setFormCat(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                  <input value={formAmt} onChange={(e) => setFormAmt(e.target.value)}
                    type="number" step="0.01" min="0" placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                  <input value={formVendor} onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
                <button type="submit" disabled={submitting || !formDesc || !formAmt}
                  className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50">
                  {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span> : "Save Expense"}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
