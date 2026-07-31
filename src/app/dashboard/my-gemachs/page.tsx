"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { GemachCard } from "@/components/GemachCard";

export default function MyGemachsPage() {
  const [gemachs, setGemachs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gemachs?mine=true")
      .then((r) => r.json())
      .then((d) => { setGemachs(d.gemachs || []); setLoading(false); });
  }, []);

  async function handleDelete(id: string) {
    const prev = [...gemachs];
    setGemachs((g) => g.filter((x) => x.id !== id));
    toast.success("Gemach deleted");

    const res = await fetch(`/api/gemachs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setGemachs(prev);
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Gemachs</h1>
          <p className="text-gray-500 mt-1">Manage your listings.</p>
        </div>
        <Link href="/dashboard/new" className="btn btn-primary">Add Gemach</Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : gemachs.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No gemachs yet"
          description="You haven't listed any gemachs. Create your first one to help your community."
          action={{ label: "Add Gemach", href: "/dashboard/new" }}
        />
      ) : (
        <div className="space-y-3">
          {gemachs.map((g) => (
            <div key={g.id} className="card p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <GemachCard gemach={g} />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/dashboard/edit/${g.id}`} className="btn btn-ghost">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="btn btn-ghost text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
