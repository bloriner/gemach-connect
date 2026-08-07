"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

export interface TechnicianStat {
  id: string;
  name: string;
  role: string;
  crewName: string;
  completedJobs: number;
  revenue: number;
  upsells: number;
  upsellRevenue: number;
  siteVisits: number;
  hours: number;
  photos: number;
}

interface Props {
  data: TechnicianStat[];
  loading: boolean;
}

type SortKey = keyof TechnicianStat;
type SortDir = "asc" | "desc";

export function TechnicianTable({ data, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
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
      const aN = Number(aVal);
      const bN = Number(bVal);
      return sortDir === "asc" ? aN - bN : bN - aN;
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
    { key: "name", label: "Technician", align: "left" },
    { key: "completedJobs", label: "Jobs", align: "right" },
    { key: "revenue", label: "Revenue", align: "right" },
    { key: "upsells", label: "Upsells", align: "right", hideMobile: true },
    { key: "upsellRevenue", label: "Upsell $", align: "right", hideMobile: true },
    { key: "photos", label: "Photos", align: "right", hideMobile: true },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Technician Performance</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-12 animate-pulse rounded bg-slate-100 ml-auto" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-10 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Technician Performance</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 py-8 text-center">No technician data for this period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">Technician Performance</h2>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {columns.map((col) => (
                  <th key={col.key} className={`py-2 ${col.align === "right" ? "text-right" : "text-left"} font-medium text-slate-600`}>
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
              {sorted.map((tech) => (
                <tr key={tech.id} className="group">
                  <td className="py-2.5">
                    <button
                      onClick={() => setExpandedId(expandedId === tech.id ? null : tech.id)}
                      className="text-left hover:text-brand-600 transition"
                    >
                      <span className="font-medium text-slate-900">{tech.name}</span>
                      <p className="text-xs text-slate-400">{tech.crewName}</p>
                    </button>
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-900">{tech.completedJobs}</td>
                  <td className="py-2.5 text-right font-medium text-green-600">{formatCurrency(tech.revenue)}</td>
                  <td className="py-2.5 text-right text-slate-700">{tech.upsells}</td>
                  <td className="py-2.5 text-right text-slate-700">{formatCurrency(tech.upsellRevenue)}</td>
                  <td className="py-2.5 text-right text-slate-700">{tech.photos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-2 md:hidden">
          {sorted.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setExpandedId(expandedId === tech.id ? null : tech.id)}
              className="w-full rounded-lg border border-slate-200 p-3 text-left hover:border-brand-200 hover:bg-brand-50/30 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{tech.name}</p>
                  <p className="text-xs text-slate-400">{tech.crewName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{formatCurrency(tech.revenue)}</p>
                  <p className="text-xs text-slate-400">{tech.completedJobs} jobs</p>
                </div>
              </div>

              {/* Drill-down expanded */}
              {expandedId === tech.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Site Visits</span>
                    <p className="font-medium text-slate-900">{tech.siteVisits}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Est. Hours</span>
                    <p className="font-medium text-slate-900">{tech.hours}h</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Upsells</span>
                    <p className="font-medium text-slate-900">{tech.upsells} ({formatCurrency(tech.upsellRevenue)})</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Photos</span>
                    <p className="font-medium text-slate-900">{tech.photos}</p>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
