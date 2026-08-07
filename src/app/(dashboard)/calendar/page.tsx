"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, MapPin, Loader2 } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(lastDay);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

interface WorkOrder {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  customer: { companyName: string };
  property: { address: string };
  crew: { name: string; lead: { name: string } | null } | null;
  serviceType: { name: string };
}

export default function CalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [upcomingOrders, setUpcomingOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const monthLabel = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    try {
      const res = await fetch(`/api/orders?status=COMPLETED,INVOICED`);
      if (res.ok) {
        const allOrders = await res.json();
        // Filter locally for scheduled dates
        setWorkOrders(allOrders.filter((o: WorkOrder) => {
          if (!o.scheduledDate) return false;
          const d = new Date(o.scheduledDate);
          return d >= monthStart && d <= monthEnd && o.status !== "CANCELLED";
        }));

        const now = new Date();
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        setUpcomingOrders(allOrders.filter((o: WorkOrder) => {
          if (!o.scheduledDate) return false;
          const d = new Date(o.scheduledDate);
          return d >= now && d <= weekEnd && o.status !== "CANCELLED";
        }));
      }
    } catch (e) {
      console.error("Failed to fetch calendar data", e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const days = getDaysInMonth(year, month);
  const priorityBadge = (p: string) => {
    const map: Record<string, "danger" | "warning" | "info" | "default"> = {
      URGENT: "danger", HIGH: "warning", NORMAL: "info", LOW: "default",
    };
    return map[p] ?? "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            {workOrders.length} orders scheduled this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-900 min-w-[140px] text-center">
            {monthLabel}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-slate-200">
                {DAYS.map((day) => (
                  <div key={day} className="py-2 text-center text-xs font-semibold uppercase text-slate-500">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const dayOrders = workOrders.filter((wo) =>
                    wo.scheduledDate && isSameDay(new Date(wo.scheduledDate), day)
                  );
                  const inMonth = day.getMonth() === month;
                  const today = isToday(day);
                  return (
                    <div key={i} className={`min-h-[90px] border-b border-r border-slate-100 p-1.5 ${!inMonth ? "bg-slate-50/50" : ""} ${today ? "bg-brand-50/30" : ""}`}>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${today ? "bg-brand-600 font-bold text-white" : inMonth ? "text-slate-900" : "text-slate-400"}`}>
                        {day.getDate()}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayOrders.slice(0, 3).map((wo) => (
                          <div key={wo.id} className="truncate rounded bg-brand-100 px-1 py-0.5 text-[10px] font-medium text-brand-800"
                            title={`${wo.customer.companyName} \u2014 ${wo.serviceType.name}`}>
                            {wo.customer.companyName}
                          </div>
                        ))}
                        {dayOrders.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{dayOrders.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><h2 className="text-lg font-semibold text-slate-900">Next 7 Days</h2></CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {upcomingOrders.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming orders this week.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingOrders.map((order) => (
                    <div key={order.id} className="rounded-lg border border-slate-200 p-3 hover:border-brand-300 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{order.customer.companyName}</p>
                          <p className="text-xs text-slate-500">{order.serviceType.name}</p>
                        </div>
                        <Badge variant={priorityBadge(order.priority)}>{order.priority}</Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Unscheduled"}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{order.property.address}</span>
                        </div>
                      </div>
                      {order.crew && (
                        <div className="mt-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          Crew: {order.crew.name}
                          {order.crew.lead && ` (Lead: ${order.crew.lead.name})`}
                        </div>
                      )}
                      <div className="mt-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_COLORS[order.status as OrderStatus]}`}>
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
