"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter } from "lucide-react";
import { GemachCard } from "@/components/GemachCard";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/Skeleton";
import { CATEGORIES, STATES } from "@/lib/utils";

export default function DiscoverPage() {
  const [gemachs, setGemachs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");

  const fetchGemachs = useCallback(async (search: string, cat: string, st: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (cat) params.set("category", cat);
    if (st) params.set("state", st);
    const res = await fetch(`/api/gemachs?${params.toString()}`);
    const data = await res.json();
    setGemachs(data.gemachs || []);
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchGemachs(q, category, state), 300);
    return () => clearTimeout(t);
  }, [q, category, state, fetchGemachs]);

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
      </div>

      {/* Results */}
      {loading ? (
        <PageSkeleton />
      ) : gemachs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No gemachs found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gemachs.map((g) => (
            <GemachCard key={g.id} gemach={g} />
          ))}
        </div>
      )}
    </div>
  );
}
