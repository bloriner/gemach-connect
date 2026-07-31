"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Filter, Clock, Truck, PackageCheck } from "lucide-react";
import { GemachCard } from "@/components/GemachCard";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/Skeleton";
import { CATEGORIES, STATES, isOpenNow } from "@/lib/utils";

export default function DiscoverPage() {
  const [gemachs, setGemachs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");

  // Advanced filters
  const [openNow, setOpenNow] = useState(false);
  const [dropoff, setDropoff] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [hasNeeds, setHasNeeds] = useState(false);

  const fetchGemachs = useCallback(async (search: string, cat: string, st: string, drop: boolean, del: boolean) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (cat) params.set("category", cat);
    if (st) params.set("state", st);
    if (drop) params.set("dropoff", "true");
    if (del) params.set("delivery", "true");
    const res = await fetch(`/api/gemachs?${params.toString()}`);
    const data = await res.json();
    setGemachs(data.gemachs || []);
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchGemachs(q, category, state, dropoff, delivery), 300);
    return () => clearTimeout(t);
  }, [q, category, state, dropoff, delivery, fetchGemachs]);

  // Client-side filters
  const filtered = useMemo(() => {
    let result = gemachs;
    if (openNow) {
      result = result.filter((g) => isOpenNow(g.hours));
    }
    if (hasNeeds) {
      result = result.filter((g) => {
        try {
          const needs = JSON.parse(g.needs);
          return Array.isArray(needs) && needs.length > 0;
        } catch { return false; }
      });
    }
    return result;
  }, [gemachs, openNow, hasNeeds]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Gemachs</h1>
        <p className="text-gray-500 mt-1">Find free lending organizations in your community.</p>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, description, or city..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
          <select className="input w-auto" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All States</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Advanced Toggles */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <button
            onClick={() => setOpenNow(!openNow)}
            className={`badge cursor-pointer transition flex items-center gap-1 ${
              openNow ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Clock className="h-3 w-3" /> Open Now
          </button>
          <button
            onClick={() => setDropoff(!dropoff)}
            className={`badge cursor-pointer transition flex items-center gap-1 ${
              dropoff ? "bg-blue-100 text-blue-700 border border-blue-300" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Truck className="h-3 w-3" /> Dropoffs
          </button>
          <button
            onClick={() => setDelivery(!delivery)}
            className={`badge cursor-pointer transition flex items-center gap-1 ${
              delivery ? "bg-purple-100 text-purple-700 border border-purple-300" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Truck className="h-3 w-3" /> Delivery
          </button>
          <button
            onClick={() => setHasNeeds(!hasNeeds)}
            className={`badge cursor-pointer transition flex items-center gap-1 ${
              hasNeeds ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-gray-100 text-gray-600"
            }`}
          >
            <PackageCheck className="h-3 w-3" /> Has Needs
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <PageSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No gemachs found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">{filtered.length} gemach{filtered.length !== 1 ? "s" : ""} found</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => (
              <GemachCard key={g.id} gemach={g} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
