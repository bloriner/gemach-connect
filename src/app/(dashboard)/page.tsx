import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  ClipboardList,
  Users,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Clock,
} from "lucide-react";

export default async function DashboardPage() {
  const [orderCount, crewCount, completedToday, revenueMonth, recentOrders, activeOrders] =
    await Promise.all([
      prisma.workOrder.count(),
      prisma.crew.count(),
      prisma.workOrder.count({
        where: { status: "COMPLETED" },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.workOrder.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true, crew: true, property: true },
      }),
      prisma.workOrder.findMany({
        where: { status: { in: ["DISPATCHED", "EN_ROUTE", "ON_SITE"] } },
        include: { crew: true, customer: true },
      }),
    ]);

  const stats = [
    {
      label: "Total Orders",
      value: orderCount,
      icon: ClipboardList,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Active Crews",
      value: crewCount,
      icon: Users,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Completed Today",
      value: completedToday,
      icon: CheckCircle2,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Revenue (MTD)",
      value: formatCurrency(revenueMonth._sum.total ?? 0),
      icon: DollarSign,
      color: "text-amber-600 bg-amber-100",
    },
  ];

  const statusBadgeVariant = (status: string) => {
    const map: Record<string, "warning" | "info" | "success" | "danger"> = {
      PENDING: "warning",
      DISPATCHED: "info",
      EN_ROUTE: "info",
      ON_SITE: "info",
      COMPLETED: "success",
      CANCELLED: "danger",
    };
    return map[status] ?? "default";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your field service operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Orders
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {order.customer.companyName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.property.address} — {order.orderNumber}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(order.status)}>
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Orders / Field Status */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Active Field Status
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Clock className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No crews in the field</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {order.customer.companyName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Crew: {order.crew?.name ?? "Unassigned"} —{" "}
                      {order.status.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Actions
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <a
              href="/orders/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <ClipboardList className="h-4 w-4" />
              New Work Order
            </a>
            <a
              href="/invoicing/new"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <DollarSign className="h-4 w-4" />
              Generate Invoice
            </a>
            <a
              href="/crews"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Users className="h-4 w-4" />
              Manage Crews
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
