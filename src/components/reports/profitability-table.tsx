"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";

export interface JobProfit {
  id: string;
  orderNumber: string;
  customerName: string;
  propertyAddress: string;
  serviceName: string;
  crewName: string;
  status: string;
  completedAt: string | null;
  revenue: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  otherCost: number;
  totalCost: number;
  profit: number;
  margin: number;
}

interface Props {
  data: JobProfit[];
  loading: boolean;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgMargin: number;
  jobCount: number;
}

type SortKey = "orderNumber" | "customerName" | "revenue" | "totalCost" | "profit" | "margin";
type SortDir = "asc" | "desc";

export function ProfitabilityTable({
  data,
  loading,
  totalRevenue,
  totalCost,
  totalProfit,
  avgMargin,
  jobCount,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("profit");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
    return arr;
  }, [data, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-brand-600" />
    ) : (
      <ChevronDown className="h-3 w-3 text-brand-600" />
    );
  };

  const columns: { key: SortKey; label: string; align: "left" | "right"; hideMobile?: boolean }[] = [
    { key: "orderNumber", label: "Order #", align: "left" },
    { key: "customerName", label: "Customer", align: "left", hideMobile: true },
    { key: "revenue", label: "Revenue", align: "right" },
    { key: "totalCost", label: "Cost", align: "right" },
    { key: "profit", label: "Profit", align: "right" },
    { key: "margin", label: "Margin", align: "right", hideMobile: true },
  ];

  const statusVariant = (s: string) => {
    const map: Record<string, "warning" | "info" | "success" | "danger"> = {
      PENDING: "warning", DISPATCHED: "info", EN_ROUTE: "info",
      ON_SITE: "info", COMPLETED: "success", INVOICED: "success", CANCELLED: "danger",
    };
    return map[s] ?? "default";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Job Profitability</h2>
          {!loading && jobCount > 0 && (
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Revenue</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Cost</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Profit</span>
                <span className={`font-semibold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(totalProfit)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Avg Margin</span>
                <span className={`font-semibold ${avgMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {avgMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100 ml-auto" />
                <div className="h-4 w-14 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No job profitability data for this period.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 text-left w-8" />
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`py-2 ${col.align === "right" ? "text-right" : "text-left"} font-medium text-slate-600`}
                      >
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center gap-1 hover:text-slate-900 transition"
                        >
                          {col.label}
                          <SortIcon col={col.key} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((job) => (
                    <>
                      <tr
                        key={job.id}
                        onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                        className="cursor-pointer hover:bg-slate-50 transition"
                      >
                        <td className="py-2.5">
                          {expandedId === job.id ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </td>
                        <td className="py-2.5">
                          <div>
                            <span className="font-mono text-xs font-medium text-slate-900">{job.orderNumber}</span>
                            <p className="text-xs text-slate-400">{job.serviceName}</p>
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-700">{job.customerName}</td>
                        <td className="py-2.5 text-right font-medium text-slate-900">{formatCurrency(job.revenue)}</td>
                        <td className="py-2.5 text-right text-slate-700">{formatCurrency(job.totalCost)}</td>
                        <td className={`py-2.5 text-right font-semibold ${job.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(job.profit)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${job.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {job.margin >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {job.margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                      {/* Expanded cost breakdown */}
                      {expandedId === job.id && (
                        <tr key={`${job.id}-detail`} className="bg-slate-50">
                          <td colSpan={7} className="px-8 py-3">
                            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                              <div>
                                <span className="text-xs text-slate-400">Revenue Breakdown</span>
                                <p className="font-medium text-slate-900">
                                  Base: {formatCurrency(job.revenue - job.laborCost - job.materialCost - job.equipmentCost - job.otherCost - job.profit)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  + Upsells: check items
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400">Labor</span>
                                <p className="font-medium text-slate-900">{formatCurrency(job.laborCost)}</p>
                                <p className="text-xs text-slate-400">{job.crewName}</p>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400">Materials</span>
                                <p className="font-medium text-slate-900">{formatCurrency(job.materialCost)}</p>
                              </div>
                              <div>
                                <span className="text-xs text-slate-400">Equipment</span>
                                <p className="font-medium text-slate-900">{formatCurrency(job.equipmentCost)}</p>
                              </div>
                              {job.otherCost > 0 && (
                                <div className="col-span-2">
                                  <span className="text-xs text-slate-400">Other Costs</span>
                                  <p className="font-medium text-slate-900">{formatCurrency(job.otherCost)}</p>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                              <Badge variant={statusVariant(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
                              <span className="text-slate-400">{job.propertyAddress}</span>
                              {job.completedAt && (
                                <span className="text-slate-400">
                                  · Completed {new Date(job.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-2 md:hidden">
              {sorted.map((job) => (
                <div key={job.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                    className="w-full rounded-lg border border-slate-200 p-3 text-left hover:border-brand-200 hover:bg-brand-50/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          <span className="font-mono text-xs text-slate-500 mr-1.5">{job.orderNumber}</span>
                          {job.customerName}
                        </p>
                        <p className="text-xs text-slate-400">{job.serviceName}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${job.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(job.profit)}
                        </p>
                        <p className="text-xs text-slate-400">{formatCurrency(job.revenue)} rev</p>
                      </div>
                    </div>

                    {expandedId === job.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Revenue</span>
                            <p className="font-medium text-slate-900">{formatCurrency(job.revenue)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Cost</span>
                            <p className="font-medium text-slate-900">{formatCurrency(job.totalCost)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Labor</span>
                            <p className="font-medium text-slate-900">{formatCurrency(job.laborCost)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Materials</span>
                            <p className="font-medium text-slate-900">{formatCurrency(job.materialCost)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Equipment</span>
                            <p className="font-medium text-slate-900">{formatCurrency(job.equipmentCost)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Margin</span>
                            <p className={`font-medium ${job.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {job.margin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge variant={statusVariant(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
