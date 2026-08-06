import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, Building2, Wrench } from "lucide-react";

export default async function ReportsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Revenue by customer
  const revenueByCustomer = await prisma.invoice.groupBy({
    by: ["customerId"],
    _sum: { total: true },
    where: { status: { notIn: ["CANCELLED", "DRAFT"] } },
    orderBy: { _sum: { total: "desc" } },
  });

  const customerIds = revenueByCustomer.map((r) => r.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c.companyName]));

  // Crew performance (completed orders)
  const crewPerformance = await prisma.crew.findMany({
    include: {
      workOrders: {
        where: {
          status: "COMPLETED",
          completedAt: { gte: yearStart },
        },
        select: { id: true, price: true },
      },
      lead: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const crewsWithStats = crewPerformance.map((crew) => ({
    name: crew.name,
    lead: crew.lead?.name ?? "Unassigned",
    completed: crew.workOrders.length,
    revenue: crew.workOrders.reduce((s, wo) => s + (wo.price ?? 0), 0),
  }));

  // Service type breakdown
  const serviceBreakdown = await prisma.workOrder.groupBy({
    by: ["serviceTypeId"],
    _count: { id: true },
    where: { status: { not: "CANCELLED" } },
    orderBy: { _count: { id: "desc" } },
  });

  const serviceIds = serviceBreakdown.map((s) => s.serviceTypeId);
  const serviceTypes = await prisma.serviceType.findMany({
    where: { id: { in: serviceIds } },
  });
  const serviceMap = new Map(serviceTypes.map((s) => [s.id, s.name]));

  // Monthly revenue trend (last 12 months)
  const monthlyTrend: { month: string; revenue: number; orders: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const [rev, count] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: d, lte: endD },
          status: { notIn: ["CANCELLED", "DRAFT"] },
        },
      }),
      prisma.workOrder.count({
        where: {
          createdAt: { gte: d, lte: endD },
          status: { not: "CANCELLED" },
        },
      }),
    ]);
    monthlyTrend.push({
      month: d.toLocaleString("default", { month: "short" }),
      revenue: rev._sum.total ?? 0,
      orders: count,
    });
  }

  // KPI: Total customers, orders MTD, revenue MTD, active crews
  const [totalCustomers, ordersMtd, revenueMtd, activeCrews] = await Promise.all([
    prisma.customer.count(),
    prisma.workOrder.count({ where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart }, status: { notIn: ["CANCELLED", "DRAFT"] } },
    }),
    prisma.crew.count({ where: { active: true } }),
  ]);

  const maxMonthlyRev = Math.max(...monthlyTrend.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Business analytics &amp; performance metrics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-brand-100 p-3">
              <TrendingUp className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Revenue (MTD)</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(revenueMtd._sum.total ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-blue-100 p-3">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Orders (MTD)</p>
              <p className="text-xl font-bold text-slate-900">{ordersMtd}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-emerald-100 p-3">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Customers</p>
              <p className="text-xl font-bold text-slate-900">{totalCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-purple-100 p-3">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Crews</p>
              <p className="text-xl font-bold text-slate-900">{activeCrews}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Monthly Revenue Trend</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1.5 h-40">
            {monthlyTrend.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-slate-500">
                  {m.revenue > 0 ? formatCurrency(m.revenue).replace(/\.00$/, "") : ""}
                </span>
                <div
                  className="w-full rounded-t bg-brand-500 hover:bg-brand-600 transition-colors"
                  style={{
                    height: `${Math.max((m.revenue / maxMonthlyRev) * 120, 2)}px`,
                  }}
                />
                <span className="text-[10px] text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>Orders: {monthlyTrend.reduce((s, m) => s + m.orders, 0)} last 12 months</span>
            <span>Total: {formatCurrency(monthlyTrend.reduce((s, m) => s + m.revenue, 0))}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Customer */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Revenue by Customer</h2>
          </CardHeader>
          <CardContent>
            {revenueByCustomer.length === 0 ? (
              <p className="text-sm text-slate-500">No invoiced revenue yet.</p>
            ) : (
              <div className="space-y-3">
                {revenueByCustomer.slice(0, 10).map((r) => {
                  const total = r._sum.total ?? 0;
                  const name = customerMap.get(r.customerId) ?? "Unknown";
                  const maxRev = revenueByCustomer[0]._sum.total ?? 1;
                  const pct = (total / maxRev) * 100;
                  return (
                    <div key={r.customerId}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-900 truncate max-w-[180px]">{name}</span>
                        <span className="text-slate-600">{formatCurrency(total)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-brand-500"
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

        {/* Crew Performance */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Crew Performance (YTD)</h2>
          </CardHeader>
          <CardContent>
            {crewsWithStats.length === 0 ? (
              <p className="text-sm text-slate-500">No crews yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 text-left font-medium text-slate-600">Crew</th>
                      <th className="py-2 text-left font-medium text-slate-600">Lead</th>
                      <th className="py-2 text-right font-medium text-slate-600">Jobs</th>
                      <th className="py-2 text-right font-medium text-slate-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {crewsWithStats.map((crew) => (
                      <tr key={crew.name} className="hover:bg-slate-50">
                        <td className="py-2 font-medium text-slate-900">{crew.name}</td>
                        <td className="py-2 text-slate-500">{crew.lead}</td>
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
      </div>

      {/* Service Type Breakdown */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Orders by Service Type</h2>
        </CardHeader>
        <CardContent>
          {serviceBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {serviceBreakdown.map((s) => {
                const name = serviceMap.get(s.serviceTypeId) ?? "Unknown";
                return (
                  <div
                    key={s.serviceTypeId}
                    className="rounded-lg border border-slate-200 p-4 text-center"
                  >
                    <p className="text-2xl font-bold text-slate-900">{s._count.id}</p>
                    <p className="mt-1 text-xs text-slate-500">{name}</p>
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
