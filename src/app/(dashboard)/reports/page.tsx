"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ReportsHeader } from "@/components/reports/reports-header";
import { DateRangePicker, type DateRange } from "@/components/reports/date-range-picker";
import { KpiCards, type KpiData } from "@/components/reports/kpi-cards";
import { RevenueChart, type MonthlyPoint } from "@/components/reports/revenue-chart";
import { TechnicianTable, type TechnicianStat } from "@/components/reports/technician-table";
import { ArAging, type AgingInvoice } from "@/components/reports/ar-aging";
import { ProfitabilityTable, type JobProfit } from "@/components/reports/profitability-table";
import { format } from "date-fns";

// ====================== Types ======================

interface SummaryResponse {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  orderCount: number;
  customerCount: number;
  avgTicket: number;
  monthlyTrend: MonthlyPoint[];
  agingInvoices: AgingInvoice[];
}

interface BreakdownResponse {
  revenueByCustomer: { customerId: string; customerName: string; revenue: number }[];
  expensesByCategory: { category: string; amount: number }[];
  orderStatuses: { status: string; count: number }[];
  serviceBreakdown: { serviceTypeId: string; name: string; count: number }[];
  crews: { name: string; lead: string; completed: number; revenue: number }[];
}

interface TechniciansResponse {
  technicians: TechnicianStat[];
}

// ====================== Page ======================

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
    preset: "MTD",
  });

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownResponse | null>(null);
  const [techs, setTechs] = useState<TechnicianStat[]>([]);
  const [profitJobs, setProfitJobs] = useState<JobProfit[]>([]);
  const [profitTotals, setProfitTotals] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0, avgMargin: 0, jobCount: 0 });

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [loadingProfit, setLoadingProfit] = useState(true);

  const fromStr = format(dateRange.from, "yyyy-MM-dd");
  const toStr = format(dateRange.to, "yyyy-MM-dd");

  const fetchData = useCallback(async () => {
    setLoadingSummary(true);
    setLoadingBreakdown(true);
    setLoadingTechs(true);
    setLoadingProfit(true);

    const [summaryRes, breakdownRes, techsRes, profitRes] = await Promise.all([
      fetch(`/api/reports/summary?from=${fromStr}&to=${toStr}`),
      fetch(`/api/reports/breakdown?from=${fromStr}&to=${toStr}`),
      fetch(`/api/reports/technicians?from=${fromStr}&to=${toStr}`),
      fetch(`/api/reports/profitability?from=${fromStr}&to=${toStr}`),
    ]);

    if (summaryRes.ok) {
      const data: SummaryResponse = await summaryRes.json();
      setSummary(data);
    }
    setLoadingSummary(false);

    if (breakdownRes.ok) {
      const data: BreakdownResponse = await breakdownRes.json();
      setBreakdown(data);
    }
    setLoadingBreakdown(false);

    if (techsRes.ok) {
      const data: TechniciansResponse = await techsRes.json();
      setTechs(data.technicians);
    }
    setLoadingTechs(false);

    if (profitRes.ok) {
      const data = await profitRes.json();
      setProfitJobs(data.jobs);
      setProfitTotals({
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        totalProfit: data.totalProfit,
        avgMargin: data.avgMargin,
        jobCount: data.jobCount,
      });
    }
    setLoadingProfit(false);
  }, [fromStr, toStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpiData: KpiData | null = summary
    ? {
        revenue: summary.revenue,
        expenses: summary.expenses,
        profit: summary.profit,
        margin: summary.margin,
        orderCount: summary.orderCount,
        customerCount: summary.customerCount,
        avgTicket: summary.avgTicket,
      }
    : null;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    DISPATCHED: "bg-blue-500",
    EN_ROUTE: "bg-indigo-500",
    ON_SITE: "bg-purple-500",
    COMPLETED: "bg-green-500",
    INVOICED: "bg-slate-500",
    CANCELLED: "bg-red-500",
  };

  const totalOrders = breakdown?.orderStatuses.reduce((s, sc) => s + sc.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <ReportsHeader dateRange={{ from: fromStr, to: toStr }} />

      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <DateRangePicker onChange={setDateRange} />
        <button
          onClick={fetchData}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <KpiCards data={kpiData} loading={loadingSummary} />

      {/* Revenue vs Expenses Chart */}
      <RevenueChart data={summary?.monthlyTrend ?? []} loading={loadingSummary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Customer */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Revenue by Customer</h2>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                    </div>
                    <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : !breakdown || breakdown.revenueByCustomer.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No invoiced revenue yet.</p>
            ) : (
              <div className="space-y-3">
                {breakdown.revenueByCustomer.slice(0, 8).map((r) => {
                  const maxRev = breakdown.revenueByCustomer[0].revenue || 1;
                  return (
                    <div key={r.customerId}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-900 truncate max-w-[180px]">{r.customerName}</span>
                        <span className="text-slate-600">{formatCurrency(r.revenue)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-brand-500"
                          style={{ width: `${Math.max((r.revenue / maxRev) * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AR Aging */}
        <ArAging invoices={summary?.agingInvoices ?? []} loading={loadingSummary} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Order Status</h2>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-8 animate-pulse rounded bg-slate-200" />
                    </div>
                    <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : totalOrders === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No orders yet.</p>
            ) : (
              <div className="space-y-2">
                {breakdown!.orderStatuses.map((sc) => {
                  const pct = (sc.count / totalOrders) * 100;
                  return (
                    <div key={sc.status}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-slate-600">{sc.status.replace(/_/g, " ")}</span>
                        <span className="font-medium text-slate-900">{sc.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${statusColors[sc.status] ?? "bg-slate-400"}`}
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Crew Performance */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Crew Performance</h2>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-10 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : !breakdown || breakdown.crews.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No crews yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 text-left font-medium text-slate-600">Crew</th>
                      <th className="py-2 text-right font-medium text-slate-600">Jobs</th>
                      <th className="py-2 text-right font-medium text-slate-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakdown.crews.map((crew) => (
                      <tr key={crew.name} className="hover:bg-slate-50">
                        <td className="py-2">
                          <span className="font-medium text-slate-900">{crew.name}</span>
                          <p className="text-xs text-slate-400">{crew.lead}</p>
                        </td>
                        <td className="py-2 text-right text-slate-900">{crew.completed}</td>
                        <td className="py-2 text-right font-medium text-green-600">
                          {formatCurrency(crew.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Expenses by Category</h2>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                    </div>
                    <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : !breakdown || breakdown.expensesByCategory.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No expenses this period.</p>
            ) : (
              <div className="space-y-2">
                {breakdown.expensesByCategory.map((ec) => {
                  const totalExp = breakdown.expensesByCategory.reduce((s, e) => s + e.amount, 0);
                  const pct = totalExp > 0 ? (ec.amount / totalExp) * 100 : 0;
                  return (
                    <div key={ec.category}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-slate-600 capitalize">{ec.category.toLowerCase()}</span>
                        <span className="font-medium text-slate-900">{formatCurrency(ec.amount)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-amber-500"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Technician Performance */}
      <TechnicianTable data={techs} loading={loadingTechs} />

      {/* Job Profitability */}
      <ProfitabilityTable
        data={profitJobs}
        loading={loadingProfit}
        totalRevenue={profitTotals.totalRevenue}
        totalCost={profitTotals.totalCost}
        totalProfit={profitTotals.totalProfit}
        avgMargin={profitTotals.avgMargin}
        jobCount={profitTotals.jobCount}
      />

      {/* Service Type Breakdown */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Orders by Service Type</h2>
        </CardHeader>
        <CardContent>
          {loadingBreakdown ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-4 animate-pulse">
                  <div className="h-8 w-12 rounded bg-slate-200 mx-auto mb-2" />
                  <div className="h-3 w-20 rounded bg-slate-100 mx-auto" />
                </div>
              ))}
            </div>
          ) : !breakdown || breakdown.serviceBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No orders yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {breakdown.serviceBreakdown.map((s) => {
                const totalSvcOrders = breakdown.serviceBreakdown.reduce((sum, svc) => sum + svc.count, 0);
                const pct = totalSvcOrders > 0 ? ((s.count / totalSvcOrders) * 100).toFixed(0) : "0";
                return (
                  <div
                    key={s.serviceTypeId}
                    className="rounded-lg border border-slate-200 p-4 text-center hover:border-brand-200 hover:bg-brand-50/50 transition"
                  >
                    <p className="text-2xl font-bold text-brand-700">{s.count}</p>
                    <p className="mt-1 text-xs text-slate-600 font-medium">{s.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pct}% of orders</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
