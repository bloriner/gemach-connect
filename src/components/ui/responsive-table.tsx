"use client";

import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: (row: T) => string;
  emptyMessage?: string;
  mobileLabel?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyField,
  emptyMessage = "No data found.",
  mobileLabel,
  onRowClick,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-slate-100 p-4 mb-3">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyField(row)}
                className={cn(
                  "border-b border-slate-100 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-slate-50"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, i) => (
                  <td key={i} className={cn("px-4 py-3", col.className)}>
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row) => (
          <div
            key={keyField(row)}
            className={cn(
              "rounded-lg border border-slate-200 bg-white p-4 shadow-sm",
              onRowClick && "cursor-pointer active:bg-slate-50"
            )}
            onClick={() => onRowClick?.(row)}
          >
            {mobileLabel && (
              <div className="mb-2 text-sm font-semibold text-slate-900">
                {mobileLabel(row)}
              </div>
            )}
            <div className="space-y-1.5">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{col.header}</span>
                    <span className="font-medium text-slate-900 text-right">
                      {col.accessor(row)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
