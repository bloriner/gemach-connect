import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import Link from "next/link";
import {
  ClipboardList, Users, CheckCircle2, DollarSign, Clock, AlertTriangle,
  TrendingUp, MapPin, Calendar, ArrowRight, Plus, FileText,
  Truck, Phone, Navigation, Hourglass, Ban, Send, Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ── Helpers ─────────────────────────────────────────────
const todayRange = () => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const yesterdayRange = () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end = new Date(d); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const statusBadge = (s: string) => {
  const m: Record<string, "warning" | "info" | "success" | "danger" | "default"> = {
    PENDING: "warning", DISPATCHED: "info", EN_ROUTE: "info",
    ON_SITE: "info", COMPLETED: "success", INVOICED: "success",
    CANCELLED: "danger",
  };
  return m[s] ?? "default";
};

const priorityBadge = (p: string) => {
  const m: Record<string, "danger" | "warning" | "default"> = {
    URGENT: "danger", HIGH: "warning",
  };
  return m[p] ?? "default";
};

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Page ────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as UserRole | undefined;
  const userId = (session?.user as any)?.id as string | undefined;
  const isField = role === "CREW_MEMBER" || role === "CREW_LEAD";
  const isAdmin = role === "ADMIN";
  const isOffice = role === "OFFICE_STAFF" || isAdmin;

  const { start: todayStart, end: todayEnd } = todayRange();
  const { start: yestStart, end: yestEnd } = yesterdayRange();

  // ── Parallel data fetch ───────────────────────────────
  const [
    ordersToday,
    completedToday,
    revenueToday,
    revenueYesterday,
    activeFieldOrders,
    pendingDispatch,
    overdueInvoices,
    todaySchedule,
    recentInvoices,
    unassignedOrders,
    techCount,
  ] = await Promise.all([
    // Orders today
    prisma.workOrder.count({
      where: { scheduledDate: { gte: todayStart, lte: todayEnd } },
    }),
    // Completed today
    prisma.workOrder.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Revenue today (invoiced)
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    // Revenue yesterday
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: yestStart, lte: yestEnd } },
    }),
    // Active field orders (in progress right now)
    prisma.workOrder.findMany({
      where: { status: { in: ["DISPATCHED", "EN_ROUTE", "ON_SITE"] } },
      include: {
        customer: { select: { companyName: true, phone: true } },
        property: { select: { address: true, city: true, state: true } },
        crew: {
          select: {
            name: true,
            lead: { select: { name: true, phone: true } },
            members: { select: { name: true } },
          },
        },
        serviceType: { select: { name: true } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 10,
    }),
    // Pending dispatch count
    prisma.workOrder.count({ where: { status: "PENDING" } }),
    // Overdue invoices
    prisma.invoice.findMany({
      where: {
        status: { in: ["SENT", "OVERDUE"] },
        dueDate: { lt: new Date() },
      },
      include: { customer: { select: { companyName: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // Today's schedule (all non-cancelled orders for today)
    prisma.workOrder.findMany({
      where: {
        status: { not: "CANCELLED" },
        scheduledDate: { gte: todayStart, lte: todayEnd },
      },
      include: {
        customer: { select: { companyName: true, phone: true } },
        property: { select: { address: true, city: true } },
        crew: { select: { name: true } },
        serviceType: { select: { name: true } },
      },
      orderBy: [{ scheduledDate: "asc" }, { priority: "asc" }],
      take: 20,
    }),
    // Recent invoices
    prisma.invoice.findMany({
      include: { customer: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Unassigned urgent orders
    prisma.workOrder.findMany({
      where: {
        crewId: null,
        status: { notIn: ["CANCELLED", "COMPLETED", "INVOICED"] },
        priority: { in: ["URGENT", "HIGH"] },
      },
      include: { customer: { select: { companyName: true } } },
      take: 5,
    }),
    // Technician count
    prisma.user.count({ where: { active: true, role: { in: ["CREW_MEMBER", "CREW_LEAD"] } } }),
  ]);

  const revToday = revenueToday._sum.total ?? 0;
  const revYesterday = revenueYesterday._sum.total ?? 0;
  const revChange = revYesterday > 0 ? ((revToday - revYesterday) / revYesterday) * 100 : null;

  // ── For field users, show their crew's orders only ───
  let displayActiveOrders = activeFieldOrders;
  let displaySchedule = todaySchedule;
  if (isField && userId) {
    // Find the user's crew
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { crewId: true },
    });
    if (user?.crewId) {
      displayActiveOrders = activeFieldOrders.filter((o) => o.crew && o.crew.members?.some((m: any) => m.name === session?.user?.name));
      displaySchedule = todaySchedule.filter((o) => o.crew?.name === (activeFieldOrders.find((a) => a.crew)?.crew?.name));
    }
  }

  // ── RENDER ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isField ? "My Work" : "Command Center"}
          </h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {role && <span className="ml-2 text-xs text-slate-400">• {ROLE_LABEL[role]}</span>}
          </p>
        </div>
        {isOffice && (
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Link>
        )}
      </div>

      {/* ── KPI Row ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Today's Orders", value: ordersToday, icon: ClipboardList, color: "bg-blue-100 text-blue-600" },
          { label: "Completed", value: completedToday, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
          { label: "Revenue Today", value: formatCurrency(revToday), icon: DollarSign, color: "bg-emerald-100 text-emerald-600" },
          { label: "Techs Active", value: activeFieldOrders.length, icon: Truck, color: "bg-purple-100 text-purple-600" },
          { label: "Pending Dispatch", value: pendingDispatch, icon: Hourglass, color: "bg-amber-100 text-amber-600" },
          { label: "Overdue Invoices", value: overdueInvoices.length, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
        ].map((stat) => (
          <Card key={stat.label} className="hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center gap-3 py-4 px-4">
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Revenue Comparison ──────────────────────── */}
      {isOffice && (
        <Card className="border-brand-100 bg-gradient-to-r from-brand-50 to-white">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-brand-100 p-3">
                <TrendingUp className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Revenue Today vs Yesterday</p>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(revToday)}</span>
                  {revChange !== null && (
                    <span className={`text-sm font-semibold ${revChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {revChange >= 0 ? "↑" : "↓"} {Math.abs(revChange).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/reports"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Full Reports <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Live Field Status (left 2/3) ──────────── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-600" />
                  Live Field Status
                </h2>
                <Link href="/tracking" className="text-xs text-brand-600 hover:underline font-medium">
                  View Map
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {displayActiveOrders.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Truck className="h-12 w-12 text-slate-200 mb-3" />
                  <p className="text-slate-500 font-medium">No crews in the field</p>
                  <p className="text-sm text-slate-400 mt-1">Active jobs will appear here when technicians are dispatched.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {displayActiveOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={isField ? `/field/${order.id}` : `/orders/${order.id}`}
                      className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                            order.status === "ON_SITE" ? "bg-green-500" :
                            order.status === "EN_ROUTE" ? "bg-amber-500" : "bg-blue-500"
                          }`} />
                          <Badge variant={statusBadge(order.status)} className="text-[10px]">
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400">
                          {order.scheduledDate ? new Date(order.scheduledDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                        {order.customer.companyName}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{order.property.address}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> {order.serviceType.name}
                        </span>
                      </div>
                      {order.crew && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Users className="h-3 w-3" /> {order.crew.lead?.name || order.crew.name}
                          </span>
                          {order.customer.phone && (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <Phone className="h-3 w-3" /> {order.customer.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Today's Schedule Timeline ───────────── */}
          {isOffice && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-600" />
                    Today's Schedule
                  </h2>
                  <Link href="/calendar" className="text-xs text-brand-600 hover:underline font-medium">
                    Full Calendar
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {displaySchedule.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Calendar className="h-10 w-10 text-slate-200 mb-2" />
                    <p className="text-slate-500">No jobs scheduled for today.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200" />
                    <div className="space-y-1">
                      {displaySchedule.map((order, idx) => (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="relative flex items-start gap-4 pl-12 py-2.5 rounded-lg hover:bg-slate-50 transition group"
                        >
                          {/* Timeline dot */}
                          <div className={`absolute left-[12px] top-[14px] h-4 w-4 rounded-full border-2 border-white ring-1 ${
                            order.status === "COMPLETED" ? "bg-green-500 ring-green-500" :
                            order.status === "ON_SITE" ? "bg-purple-500 ring-purple-500 animate-pulse" :
                            order.status === "EN_ROUTE" ? "bg-amber-500 ring-amber-500" :
                            order.status === "DISPATCHED" ? "bg-blue-500 ring-blue-500" :
                            order.status === "CANCELLED" ? "bg-red-500 ring-red-500" :
                            "bg-slate-300 ring-slate-300"
                          }`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors truncate">
                                {order.customer.companyName}
                              </p>
                              {order.priority !== "NORMAL" && (
                                <Badge variant={priorityBadge(order.priority)} className="text-[10px] px-1.5">
                                  {order.priority}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span>{order.property.address}, {order.property.city}</span>
                              <span>•</span>
                              <span>{order.serviceType.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">
                                {order.scheduledDate
                                  ? new Date(order.scheduledDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                                  : "—"}
                              </span>
                              {order.crew && (
                                <span className="text-xs text-slate-400">• {order.crew.name}</span>
                              )}
                            </div>
                          </div>

                          <Badge variant={statusBadge(order.status)} className="text-[10px] flex-shrink-0">
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Sidebar ─────────────────────────── */}
        <div className="space-y-4">
          {/* Alerts */}
          {isOffice && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Needs Attention
                </h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Unassigned urgent */}
                {unassignedOrders.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1.5">
                      {unassignedOrders.length} unassigned urgent order{unassignedOrders.length > 1 ? "s" : ""}
                    </p>
                    {unassignedOrders.slice(0, 3).map((o) => (
                      <Link
                        key={o.id}
                        href={`/orders/${o.id}`}
                        className="block rounded-md bg-white border border-amber-200 px-3 py-2 mb-1.5 hover:border-amber-300 transition text-sm"
                      >
                        <p className="font-medium text-slate-800">{o.customer.companyName}</p>
                        <p className="text-xs text-slate-500">No crew assigned</p>
                      </Link>
                    ))}
                    <Link href="/dispatch" className="text-xs text-brand-600 hover:underline font-medium">
                      Go to Dispatch →
                    </Link>
                  </div>
                )}

                {/* Overdue invoices */}
                {overdueInvoices.length > 0 && (
                  <div className="border-t border-amber-200 pt-3">
                    <p className="text-xs font-medium text-red-700 mb-1.5">
                      {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? "s" : ""}
                    </p>
                    {overdueInvoices.slice(0, 3).map((inv) => (
                      <Link
                        key={inv.id}
                        href={`/invoicing/${inv.id}`}
                        className="block rounded-md bg-white border border-red-100 px-3 py-2 mb-1.5 hover:border-red-200 transition"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800">{inv.customer.companyName}</p>
                          <span className="text-xs font-semibold text-red-600">{formatCurrency(inv.total)}</span>
                        </div>
                        <p className="text-xs text-red-500">
                          Due {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}

                {unassignedOrders.length === 0 && overdueInvoices.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Nothing needs attention — great job!
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Invoices */}
          {isOffice && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    Recent Invoices
                  </h2>
                  <Link href="/invoicing" className="text-xs text-brand-600 hover:underline font-medium">
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentInvoices.length === 0 ? (
                  <p className="text-sm text-slate-400 py-3 text-center">No invoices yet.</p>
                ) : (
                  recentInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoicing/${inv.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{inv.customer.companyName}</p>
                        <p className="text-xs text-slate-400">{inv.invoiceNumber}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(inv.total)}</p>
                        <Badge variant={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "danger" : "default"} className="text-[10px]">
                          {inv.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-semibold text-slate-700">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {isOffice && (
                <>
                  <Link
                    href="/orders/new"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition"
                  >
                    <Plus className="h-4 w-4" /> Create Order
                  </Link>
                  <Link
                    href="/dispatch"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition"
                  >
                    <Send className="h-4 w-4" /> Dispatch Board
                  </Link>
                  <Link
                    href="/quotes/new"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition"
                  >
                    <FileText className="h-4 w-4" /> New Quote
                  </Link>
                  <Link
                    href="/invoicing"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition"
                  >
                    <DollarSign className="h-4 w-4" /> Generate Invoice
                  </Link>
                </>
              )}
              {(isField || isAdmin) && (
                <Link
                  href="/field"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition"
                >
                  <ClipboardList className="h-4 w-4" /> My Field Orders
                </Link>
              )}
              {isOffice && (
                <Link
                  href="/tracking"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition"
                >
                  <Navigation className="h-4 w-4" /> Live Tracking
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Technician count card */}
          <Card className="border-slate-200">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-lg bg-indigo-100 p-2.5">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Technicians</p>
                <p className="text-xl font-bold text-slate-900">{techCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
