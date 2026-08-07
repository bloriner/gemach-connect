"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Loader2 } from "lucide-react";

interface PriceItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  unitPrice: number;
  taxable: boolean;
  active: boolean;
}

interface Props {
  onSelect: (item: PriceItem) => void;
  onClose: () => void;
}

const UNIT_LABELS: Record<string, string> = {
  SQFT: "per sq ft",
  LNFT: "per linear ft",
  HOUR: "per hour",
  EACH: "each",
  JOB: "per job",
  GAL: "per gallon",
};

const CATEGORY_COLORS: Record<string, string> = {
  CARPET: "bg-blue-50 text-blue-700",
  PAD: "bg-purple-50 text-purple-700",
  LABOR: "bg-amber-50 text-amber-700",
  REMOVAL: "bg-red-50 text-red-700",
  REPAIR: "bg-green-50 text-green-700",
  TREATMENT: "bg-teal-50 text-teal-700",
  OTHER: "bg-slate-100 text-slate-600",
};

export default function PriceBookPicker({ onSelect, onClose }: Props) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    setLoading(true);
    fetch(`/api/price-book?${params}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category]);

  const categories = ["", "CARPET", "PAD", "LABOR", "REMOVAL", "REPAIR", "TREATMENT", "OTHER"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
          <h3 className="text-lg font-semibold text-slate-900">Price Book</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="px-5 py-3 space-y-2 shrink-0 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                  category === cat
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat || "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No items found</p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 transition group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          CATEGORY_COLORS[item.category] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.category}
                      </span>
                      {item.description && (
                        <span className="text-xs text-slate-400 truncate">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-slate-900">
                      ${item.unitPrice.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {UNIT_LABELS[item.unit] ?? item.unit}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-slate-300 ml-2 opacity-0 group-hover:opacity-100 group-hover:text-brand-500 transition shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
