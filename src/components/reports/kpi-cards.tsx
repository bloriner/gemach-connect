"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, CheckCircle2, Wrench, Building2, Receipt } from "lucide-react";

export interface KpiData {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  orderCount: number;
  customerCount: number;
  avgTicket: number;
}

interface Props {
  data: KpiData | null;
  loading: boolean;
}

export function KpiCards({ data, loading }: Props) {
  const skeleton = loading || !data;

  const cards = [
    {
      label: "Revenue",
      value: data ? formatCurrency(data.revenue) : "—",
      sub: null,
      Icon: TrendingUp,
      iconBg: "bg-brand-100",
      iconColor: "text-brand-600",
    },
    {
      label: "Expenses",
      value: data ? formatCurrency(data.expenses) : "—",
      sub: null,
      Icon: DollarSign,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      label: "Profit",
      value: data ? formatCurrency(data.profit) : "—",
      sub: data ? `${data.margin.toFixed(1)}% margin` : null,
      Icon: CheckCircle2,
      iconBg: data && data.profit >= 0 ? "bg-green-100" : "bg-red-100",
      iconColor: data && data.profit >= 0 ? "text-green-600" : "text-red-600",
      valueColor: data && data.profit >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "Orders",
      value: data ? String(data.orderCount) : "—",
      sub: null,
      Icon: Wrench,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Avg Ticket",
      value: data ? formatCurrency(data.avgTicket) : "—",
      sub: null,
      Icon: Receipt,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Customers",
      value: data ? String(data.customerCount) : "—",
      sub: null,
      Icon: Building2,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className={`rounded-lg ${card.iconBg} p-2.5 shrink-0`}>
              <card.Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{card.label}</p>
              {skeleton ? (
                <div className="mt-1 h-5 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                <>
                  <p className={`text-base font-bold text-slate-900 ${(card as any).valueColor ?? ""}`}>
                    {card.value}
                  </p>
                  {card.sub && (
                    <p className="text-[10px] text-slate-400">{card.sub}</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
