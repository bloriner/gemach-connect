"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Search } from "lucide-react";
import { toast } from "sonner";
import { GemachCard } from "@/components/GemachCard";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/Skeleton";

export default function SavedPage() {
  const [gemachs, setGemachs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => { setGemachs(d.favorites || []); setLoading(false); });
  }, []);

  async function removeFavorite(gemachId: string) {
    const prev = [...gemachs];
    setGemachs((g) => g.filter((x) => x.id !== gemachId));
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gemachId }),
    });
    if (res.ok) {
      toast.success("Removed from saved");
    } else {
      setGemachs(prev);
      toast.error("Failed to remove");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Gemachs</h1>
        <p className="text-gray-500 mt-1">Your bookmarked gemachs for quick access.</p>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : gemachs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved gemachs"
          description="Browse gemachs and bookmark the ones you want to remember."
          action={{ label: "Browse Gemachs", href: "/gemachs" }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gemachs.map((g) => (
            <div key={g.id} className="relative group">
              <GemachCard gemach={g} />
              <button
                onClick={(e) => { e.preventDefault(); removeFavorite(g.id); }}
                className="absolute top-3 right-3 btn btn-ghost text-amber-500 hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition"
                title="Remove from saved"
              >
                <Bookmark className="h-4 w-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
