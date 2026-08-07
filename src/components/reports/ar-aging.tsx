"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

export interface AgingInvoice {
  id: string;
  invoiceNumber: string;
  total: number;
  dueDate: string | null;
  status: string;
  customer: { companyName: string };
}

interface AgingBucket {
  label: string;
  color: string;
  bg: string;
  invoices: AgingInvoice[];
  total: number;
}

interface Props {
  invoices: AgingInvoice[];
  loading: boolean;
}

export function ArAging({ invoices, loading }: Props) {
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);

  const buckets: AgingBucket[] = useMemo(() => {
    const now = new Date();
    const current: AgingInvoice[] = [];
    const days30: AgingInvoice[] = [];
    const days60: AgingInvoice[] = [];
    const days90: AgingInvoice[] = [];

    invoices.forEach((inv) => {
      if (!inv.dueDate) {
        days30.push(inv);
        return;
      }
      const diff = (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0) current.push(inv);
      else if (diff <= 30) days30.push(inv);
      else if (diff <= 60) days60.push(inv);
      else days90.push(inv);
    });

    return [
      { label: "Current", color: "text-green-600", bg: "bg-green-50", invoices: current, total: current.reduce((s, i) => s + i.total, 0) },
      { label: "1–30 Days", color: "text-amber-600", bg: "bg-amber-50", invoices: days30, total: days30.reduce((s, i) => s + i.total, 0) },
      { label: "31–60 Days", color: "text-orange-600", bg: "bg-orange-50", invoices: days60, total: days60.reduce((s, i) => s + i.total, 0) },
      { label: "60+ Days", color: "text-red-600", bg: "bg-red-50", invoices: days90, total: days90.reduce((s, i) => s + i.total, 0) },
    ];
  }, [invoices]);

  const agingTotal = useMemo(() => buckets.reduce((s, b) => s + b.total, 0), [buckets]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Accounts Receivable Aging</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-slate-50 p-3 animate-pulse">
                <div className="h-6 w-16 rounded bg-slate-200 mb-2" />
                <div className="h-3 w-12 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (agingTotal === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Accounts Receivable Aging</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 py-8 text-center">No outstanding invoices.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">Accounts Receivable Aging</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bucket summary grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {buckets.map((b) => (
            <button
              key={b.label}
              onClick={() => setExpandedBucket(expandedBucket === b.label ? null : b.label)}
              className={`rounded-lg ${b.bg} p-3 text-left hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 transition`}
            >
              <p className={`text-lg font-bold ${b.color}`}>{formatCurrency(b.total)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{b.label}</p>
              <p className="text-[10px] text-slate-400">
                {b.invoices.length} invoice{b.invoices.length !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>

        {/* Expandable invoice lists */}
        {buckets.map(
          (b) =>
            expandedBucket === b.label &&
            b.invoices.length > 0 && (
              <div key={b.label} className="rounded-lg border border-slate-200 overflow-hidden">
                <div className={`px-3 py-2 ${b.bg} flex items-center justify-between`}>
                  <span className={`text-sm font-medium ${b.color}`}>{b.label}</span>
                  <button
                    onClick={() => setExpandedBucket(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {b.invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                      <div>
                        <span className="font-medium text-slate-900">{inv.customer.companyName}</span>
                        <p className="text-xs text-slate-400">
                          {inv.invoiceNumber}
                          {inv.dueDate && ` · Due ${new Date(inv.dueDate).toLocaleDateString()}`}
                        </p>
                      </div>
                      <span className={`font-semibold ${b.color}`}>{formatCurrency(inv.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}

        {/* 60+ days warning */}
        {buckets[3].invoices.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-red-700">
                {buckets[3].invoices.length} invoice{buckets[3].invoices.length !== 1 ? "s" : ""} over 60 days past due —{" "}
                {formatCurrency(buckets[3].total)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
