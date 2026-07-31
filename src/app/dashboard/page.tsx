"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Search, MessageSquare, Plus, Package, Bookmark, Gift } from "lucide-react";
import { CardSkeleton } from "@/components/Skeleton";
import { GemachCard } from "@/components/GemachCard";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [myRes, msgRes, allRes] = await Promise.all([
        fetch("/api/gemachs?mine=true"),
        fetch("/api/messages"),
        fetch("/api/gemachs"),
      ]);
      const myData = await myRes.json();
      const msgData = await msgRes.json();
      const allData = await allRes.json();
      setData({ myGemachs: myData.gemachs || [], messages: msgData.messages || [], allGemachs: allData.gemachs || [] });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5"><CardSkeleton /></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Heart, label: "My Gemachs", count: data.myGemachs.length, color: "bg-blue-100 text-blue-600", border: "border-l-blue-500" },
    { icon: MessageSquare, label: "Messages", count: data.messages.filter((m: any) => !m.read).length, color: "bg-amber-100 text-amber-600", border: "border-l-amber-500" },
    { icon: Search, label: "Total Gemachs", count: data.allGemachs.length, color: "bg-emerald-100 text-emerald-600", border: "border-l-emerald-500" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your gemach overview.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`card p-5 flex items-center gap-4 border-l-4 ${s.border}`}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/new" className="btn btn-primary"><Plus className="h-4 w-4" /> Add Gemach</Link>
          <Link href="/gemachs" className="btn btn-secondary"><Search className="h-4 w-4" /> Browse</Link>
          <Link href="/dashboard/messages" className="btn btn-secondary"><MessageSquare className="h-4 w-4" /> Messages</Link>
          <Link href="/dashboard/requests" className="btn btn-secondary"><Gift className="h-4 w-4" /> Requests</Link>
          <Link href="/dashboard/saved" className="btn btn-secondary"><Bookmark className="h-4 w-4" /> Saved</Link>
        </div>
      </div>

      {/* Recent Gemachs */}
      {data.myGemachs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">My Gemachs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.myGemachs.slice(0, 3).map((g: any) => (
              <GemachCard key={g.id} gemach={g} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
