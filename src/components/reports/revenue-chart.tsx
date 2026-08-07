"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";

export interface MonthlyPoint {
  month: string;
  revenue: number;
  expenses: number;
  orders: number;
}

interface Props {
  data: MonthlyPoint[];
  loading: boolean;
}

export function RevenueChart({ data, loading }: Props) {
  const maxVal = useMemo(
    () => Math.max(...data.map((m) => Math.max(m.revenue, m.expenses)), 1),
    [data]
  );

  const totalOrders = useMemo(() => data.reduce((s, m) => s + m.orders, 0), [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Revenue vs Expenses</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-48">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="flex gap-0.5 w-full justify-center">
                  <div className="w-2.5 rounded-t bg-slate-200 animate-pulse" style={{ height: `${20 + Math.random() * 100}px` }} />
                  <div className="w-2.5 rounded-t bg-slate-100 animate-pulse" style={{ height: `${20 + Math.random() * 60}px` }} />
                </div>
                <div className="mt-1 h-3 w-8 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">Revenue vs Expenses</h2>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-48">
          {data.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div className="flex gap-0.5 w-full justify-center">
                <div
                  className="w-2.5 rounded-t bg-brand-500 transition-all duration-300"
                  style={{ height: `${Math.max((m.revenue / maxVal) * 144, 2)}px` }}
                  title={`Revenue: ${formatCurrency(m.revenue)}`}
                />
                <div
                  className="w-2.5 rounded-t bg-amber-400 transition-all duration-300"
                  style={{ height: `${Math.max((m.expenses / maxVal) * 144, 2)}px` }}
                  title={`Expenses: ${formatCurrency(m.expenses)}`}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1">{m.month}</span>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-lg z-10 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-brand-500" />
                  <span className="font-medium text-slate-700">{formatCurrency(m.revenue)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-amber-400" />
                  <span className="font-medium text-slate-700">{formatCurrency(m.expenses)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">{m.orders} orders</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Expenses
            </span>
          </div>
          <span>{totalOrders} orders</span>
        </div>
      </CardContent>
    </Card>
  );
}
