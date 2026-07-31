"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch, Gift, ArrowRight, ExternalLink } from "lucide-react";
import { catOf } from "@/lib/utils";
import { PageSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";

export default function NeedsPage() {
  const [gemachs, setGemachs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gemachs")
      .then((r) => r.json())
      .then((d) => {
        const all = (d.gemachs || []).filter((g: any) => {
          try {
            const needs = JSON.parse(g.needs);
            return Array.isArray(needs) && needs.length > 0;
          } catch {
            return false;
          }
        });
        setGemachs(all);
        setLoading(false);
      });
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Needs Feed</h1>
        <p className="text-gray-500 mt-1">
          Gemachs currently requesting items — your donation can make a difference.
        </p>
      </div>

      {gemachs.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No needs right now"
          description="All gemachs are currently stocked. Check back soon or browse all gemachs."
          action={{ label: "Browse Gemachs", href: "/gemachs" }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {gemachs.map((g) => {
            const cat = catOf(g.category);
            const needs: string[] = (() => {
              try { return JSON.parse(g.needs); } catch { return []; }
            })();
            return (
              <Link key={g.id} href={`/gemachs/${g.id}`} className="card p-5 hover:shadow-md transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition">
                      {g.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`badge ${cat.chip}`}>{cat.icon} {cat.label}</span>
                      <span className="text-xs text-gray-400">{g.city}, {g.state}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-primary-500 flex-shrink-0 mt-1" />
                </div>

                <div className="mt-4 border-t pt-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Currently Needed</p>
                  <div className="flex flex-wrap gap-2">
                    {needs.map((n, i) => (
                      <span key={i} className="badge bg-primary-50 text-primary-700 border border-primary-200">
                        <Gift className="h-3 w-3 mr-1" />
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs text-primary-600 font-medium">
                  View gemach <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
